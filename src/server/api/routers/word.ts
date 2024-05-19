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
      const wordsWithMeanings = await db.select().from(words).fullJoin(meanings, eq(words.id, meanings.wordId)).limit(input.take).offset(input.skip)
      return wordsWithMeanings
      // console.log(wordsWithMeanings)
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
      const wordsWithMeanings =
        await db.execute(sql`
        SELECT
        JSON_BUILD_OBJECT(
          'word_id',
          w.id,
          'word_name',
          w.name,
          'attributes',
          (
            SELECT
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'attribute_id',
                  w_a.id,
                  'attribute',
                  w_a.attribute
                )
              )
            FROM
              words_attributes ws_a
              JOIN word_attributes w_a ON ws_a.attribute_id = w_a.id
            WHERE
              ws_a.word_id = w.id
          ),
          'root',
          JSON_BUILD_OBJECT('root', r.root, 'language', l.language_en),
          'meanings',
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'meaning_id',
              m.id,
              'meaning',
              m.meaning,
              'part_of_speech',
              pos.part_of_speech,
              'sentence',
              ex.sentence,
              'author',
              a.name
            )
          )
        ) AS word_data
      FROM
        words w
        LEFT JOIN meanings m ON w.id = m.word_id
        LEFT JOIN part_of_speechs pos ON m.part_of_speech_id = pos.id
        LEFT JOIN roots r ON r.word_id = w.id
        LEFT JOIN languages l ON r.language_id::integer = l.id
        LEFT JOIN examples ex ON ex.meaning_id = m.id
        LEFT JOIN authors a ON ex.author_id = a.id
      WHERE
        w.name = ${name}
      GROUP BY
        w.id,
        w.name,
        r.root,
		l.language_en;`
        ) as WordSearchResult[]
      return wordsWithMeanings
    }),
});
