import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "../trpc";
import { sql } from "drizzle-orm";
import type { WordSearchResult, DashboardWordList } from "@/types";
import DOMPurify from "isomorphic-dompurify";
import { purifyObject } from "@/src/lib/utils";


export const wordRouter = createTRPCRouter({
  /**
   * Get all words from database with pagination
   */
  getWords: publicProcedure
    .input(
      z.object({
        take: z.number().optional().default(5),
        skip: z.number().optional().default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx: { db } }) => {
      const purifiedInput = purifyObject(input)
      const searchCondition = purifiedInput.search
        ? sql`AND w.name ILIKE ${`%${purifiedInput.search}%`}`
        : sql``;

      const wordsWithMeanings = await db.execute(
        sql
          `
        SELECT
            w.id AS word_id,
            w.name AS name,
            m.meaning AS meaning
        FROM
            words w
            JOIN (
                SELECT DISTINCT ON (word_id)
                    id,
                    word_id,
                    meaning
                FROM
                    meanings
                ORDER BY
                    word_id,
                    id
            ) m ON w.id = m.word_id
        WHERE 1=1 ${searchCondition}
        ORDER BY
            w.id
        LIMIT ${purifiedInput.take} OFFSET ${purifiedInput.skip};
        `
      ) as DashboardWordList[]
      return wordsWithMeanings
    }),
  /**
   * Get a word by name quering the database
   */
  getWord: publicProcedure
    .input(
      z.string({
        invalid_type_error: "Word must be a string",
        required_error: "Word is required to get a word",
      })
    )
    .query(async ({ input: name, ctx: { db } }) => {
      const purifiedName = DOMPurify.sanitize(name);
      console.log('formattedWord', purifiedName);

      // Optimized query with direct JSON aggregation - matches WordSearchResult type exactly
      const result = await db.execute(sql`
        WITH base_word AS (
          SELECT w.id, w.name, w.phonetic, w.prefix, w.suffix
          FROM words w
          WHERE w.name = ${purifiedName}
        )
        SELECT json_build_object(
              'word_id', w.id,
              'word_name', w.name,
              'phonetic', w.phonetic,
              'prefix', w.prefix,
              'suffix', w.suffix,
              'attributes', COALESCE(
                (SELECT json_agg(json_build_object(
                  'attribute_id', wa.id, 
                  'attribute', wa.attribute
                ))
                FROM words_attributes wattr
                JOIN word_attributes wa ON wattr.attribute_id = wa.id
                WHERE wattr.word_id = w.id), '[]'::json
              ),
              'root', COALESCE(
                (SELECT json_build_object(
                  'root', r.root,
                  'language_en', l.language_en,
                  'language_tr', l.language_tr,
                  'language_code', l.language_code
                )
                FROM roots r
                JOIN languages l ON r.language_id = l.id
                WHERE r.word_id = w.id
                LIMIT 1), 
                json_build_object(
                  'root', null,
                  'language_en', null,
                  'language_tr', null,
                  'language_code', null
                )
              ),
              'meanings', COALESCE(
                (SELECT json_agg(json_build_object(
                  'meaning_id', m.id,
                  'meaning', m.meaning,
                  'imageUrl', m."imageUrl",
                  'part_of_speech', p.part_of_speech,
                  'part_of_speech_id', p.id,
                  'attributes', COALESCE(
                    (SELECT json_agg(json_build_object(
                      'attribute_id', ma.id, 
                      'attribute', ma.attribute
                    ))
                    FROM meanings_attributes mattr
                    JOIN meaning_attributes ma ON mattr.attribute_id = ma.id
                    WHERE mattr.meaning_id = m.id), '[]'::json
                  ),
                  'sentence', e.sentence,
                  'author', a.name,
                  'author_id', a.id
                ) ORDER BY m."order" ASC)
                FROM meanings m
                LEFT JOIN part_of_speechs p ON m.part_of_speech_id = p.id
                LEFT JOIN examples e ON e.meaning_id = m.id
                LEFT JOIN authors a ON e.author_id = a.id
                WHERE m.word_id = w.id), '[]'::json
              ),
              'relatedWords', COALESCE(
                (SELECT json_agg(json_build_object(
                  'related_word_id', rw.id,
                  'related_word_name', rw.name,
                  'relation_type', rel.relation_type
                ))
                FROM related_words rel
                JOIN words rw ON rel.related_word_id = rw.id
                WHERE rel.word_id = w.id), '[]'::json
              ),
              'relatedPhrases', COALESCE(
                (SELECT json_agg(json_build_object(
                  'related_phrase_id', rp.id,
                  'related_phrase', rp.name
                ))
                FROM related_phrases rel
                JOIN words rp ON rel.related_phrase_id = rp.id
                WHERE rel.phrase_id = w.id), '[]'::json
              )
          ) AS word_data
        FROM base_word w
      `);
      
      // Filter any null or undefined results
      const filteredResult = result.filter(Boolean) as any[];
      
      // Add detailed debugging
      console.log('Raw database response:', JSON.stringify(filteredResult, null, 2));
      
      if (filteredResult.length > 0) {
        // Fix the double-nesting issue
        const formattedResult = filteredResult.map(item => {
          // If we have a nested word_data structure, flatten it
          if (item.word_data) {
            return { word_data: item.word_data } as WordSearchResult;
          }
          return { word_data: item } as WordSearchResult;
        });
        
        console.log('Formatted result:', JSON.stringify(formattedResult, null, 2));
        return formattedResult;
      }
      
      return [];
    }),
  getRecommendations: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().optional().default(5),
      })
    )
    .query(async ({ input, ctx: { db } }) => {
      const purifiedInput = purifyObject(input);
      const recommendations = await db.execute(
        sql`
        WITH RankedWords AS (
          SELECT
            w.id AS word_id,
            w.name AS name,
            CASE 
              WHEN w.name ILIKE ${purifiedInput.query} THEN 1
              WHEN w.name ILIKE ${`${purifiedInput.query}%`} THEN 2
              ELSE 3
            END AS match_rank,
            LENGTH(w.name) AS name_length
          FROM words w
          WHERE w.name ILIKE ${`%${purifiedInput.query}%`}
        )
        SELECT DISTINCT
          word_id,
          name,
          match_rank,
          name_length
        FROM RankedWords
        ORDER BY
          match_rank,
          name_length
        LIMIT ${purifiedInput.limit};
        `
      ) as { word_id: number; name: string; match_rank: number; name_length: number }[];

      return recommendations.map(({ word_id, name }) => ({ word_id, name }));
    }),
  getWordCount: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx: { db } }) => {
      const purifiedInput = purifyObject(input)
      const searchCondition = purifiedInput.search
        ? sql`WHERE name ILIKE ${`%${purifiedInput.search}%`}`
        : sql``;

      const result = await db.execute(
        sql`
        SELECT COUNT(*) as count
        FROM words
        ${searchCondition}
        `
      ) as { count: number }[];
      return Number(result[0].count);
    }),
});
