import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "../trpc";
import { sql, count } from "drizzle-orm";
import { words } from "@/db/schema/words";
import { DashboardWordList, WordSearchResult } from "@/types";
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
      // TODO: join word and meaning attributes...
      const purifiedName = DOMPurify.sanitize(name)
      const wordsWithMeanings =
        await db.execute(sql`
          -- word attributes
          WITH word_attributes_agg AS (
            SELECT
              ws_a.word_id,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'attribute_id', w_a.id,
                  'attribute', w_a.attribute
                )
              ) AS attributes
            FROM
              words_attributes ws_a
              JOIN word_attributes w_a ON ws_a.attribute_id = w_a.id
            GROUP BY ws_a.word_id
          ),
          -- meaning attributes
          meanings_attributes_agg AS (
            SELECT
              ma.meaning_id,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'attribute_id', m_a.id,
                  'attribute', m_a.attribute
                )
              ) AS attributes
            FROM
              meanings_attributes ma
              JOIN meaning_attributes m_a ON ma.attribute_id = m_a.id
            GROUP BY ma.meaning_id
          ),
          -- meanings
          meanings_agg AS (
            SELECT
              m.word_id,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'meaning_id', m.id,
                  'meaning', m.meaning,
                  'part_of_speech', pos.part_of_speech,
                  'part_of_speech_id', pos.id,
                  'attributes', ma.attributes,
                  'sentence', ex.sentence,
                  'author', a.name,
                  'author_id', a.id
                ) ORDER BY m.id
              ) AS meanings
            FROM
              meanings m
              LEFT JOIN part_of_speechs pos ON m.part_of_speech_id = pos.id
              LEFT JOIN examples ex ON ex.meaning_id = m.id
              LEFT JOIN authors a ON ex.author_id = a.id
              LEFT JOIN meanings_attributes_agg ma ON ma.meaning_id = m.id
            GROUP BY m.word_id
          ),
          -- words with meanings and root
          words_with_meanings AS (
            SELECT
              w.id AS word_id,
              w.name AS word_name,
              w.phonetic AS phonetic,
              w.prefix AS prefix,
              w.suffix AS suffix,
              COALESCE(wa.attributes, '[]'::json) AS word_attributes,
              JSON_BUILD_OBJECT(
                'root', r.root,
                'language_en', l.language_en,
                'language_tr', l.language_tr,
                'language_code', l.language_code
              ) AS root,
              COALESCE(ma.meanings, '[]'::json) AS meanings
            FROM
              words w
              LEFT JOIN word_attributes_agg wa ON w.id = wa.word_id
              LEFT JOIN roots r ON r.word_id = w.id
              LEFT JOIN languages l ON r.language_id = l.id
              LEFT JOIN meanings_agg ma ON w.id = ma.word_id
            WHERE
              w.name = ${purifiedName}
          )
          -- finally combine all data as a single json object
          SELECT
            JSON_BUILD_OBJECT(
              'word_id', word_id,
              'word_name', word_name,
              'phonetic', phonetic,
              'prefix', prefix,
              'suffix', suffix,
              'attributes', word_attributes,
              'root', root,
              'meanings', meanings
            ) AS word_data
          FROM
            words_with_meanings;
          `,
        ) as WordSearchResult[]
      return wordsWithMeanings
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
