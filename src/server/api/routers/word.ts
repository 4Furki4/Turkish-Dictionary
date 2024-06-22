import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";
import { eq, sql } from "drizzle-orm";
import { SelectWordWithMeanings, words } from "@/db/schema/words";
import { meanings } from "@/db/schema/meanings";
import { WordSearchResult } from "@/types";
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
      })
    )
    .query(async ({ input, ctx: { db } }) => {
      const purifiedInput = purifyObject(input)
      const wordsWithMeanings = await db.select().from(words).fullJoin(meanings, eq(words.id, meanings.wordId)).limit(purifiedInput.take).offset(purifiedInput.skip)
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
                  'attributes', ma.attributes,
                  'sentence', ex.sentence,
                  'author', a.name
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
});
