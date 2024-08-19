import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { createWordSchema } from "@/src/lib/zod-schemas";
import { eq, sql } from "drizzle-orm";
import { InsertWord, words } from "@/db/schema/words";
import { InsertMeaning, meanings } from "@/db/schema/meanings";
import { roots } from "@/db/schema/roots";
import { meaningAttributes, meaningsAttributes } from "@/db/schema/meaning_attributes";
import { authors } from "@/db/schema/authors";
import { Meaning, MeaningInputs, WordForm, WordSearchResult } from "@/types";
import { PartOfSpeech, partOfSpeechs } from "@/db/schema/part_of_speechs";
import { examples } from "@/db/schema/examples";
import { languages } from "@/db/schema/languages";
import { wordAttributes, wordsAttributes } from "@/db/schema/word_attributes";
const CreateWordSchema = z.ZodType<WordForm>
export const adminRouter = createTRPCRouter({
  deleteWord: adminProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input: { id }, ctx: { db, session } }) => {
      try {
        await db.delete(words).where(eq(words.id, id));
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  addWord: adminProcedure.input(z.object({
    name: z.string(),
    language: z.string().optional(),
    phonetic: z.string().optional(),
    root: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    requestType: z.string().optional(),
    attributes: z.number().array().optional(),
    meanings: z.array(z.object({
      meaning: z.string(),
      partOfSpeechId: z.number(),
      attributes: z.union([z.string(), z.number()]).optional(),
      example: z.object({
        sentence: z.string(),
        author: z.union([z.string(), z.number()])
      }).optional(),
      imageUrl: z.string().optional()
    }
    ))
  })).mutation(async ({ ctx: { db }, input: { meanings: meaningData, ...word } }) => {
    const [addedWord] = await db.insert(words).values(word).returning()
    const [languageQueryResult] = word.language && word.root ? await db.select({ id: languages.id }).from(languages).where(eq(languages.language_code, word.language)) : [{ id: null }]
    if (languageQueryResult.id) {
      await db.insert(roots).values({
        root: word.root,
        languageId: languageQueryResult.id,
        wordId: addedWord.id,
      })
    }
    if (word.attributes && word.attributes.length > 0)
      try {
        await db.insert(wordsAttributes).values(word.attributes.map((attributeId) => (
          {
            attributeId,
            wordId: addedWord.id
          }
        )))
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong while adding new word attributes to the database.",
        })
      }
    const addedMeanings = meaningData.map(async (meaning) => {
      let addedMeaning: InsertMeaning | undefined;
      try {
        const [returnedMeaning] = await db.insert(meanings).values({
          meaning: meaning.meaning,
          partOfSpeechId: meaning.partOfSpeechId,
          wordId: addedWord.id,
          imageUrl: meaning.imageUrl,
        }).returning()
        addedMeaning = returnedMeaning
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong while adding meaning.",
        })
      }
      // when the author is an id, it means the author is already in the database
      const isAuthorAlreadyInDB = Boolean(meaning.example?.author && typeof meaning.example.author === "number")
      if (meaning.example?.author && typeof meaning.example.author === "number" && addedMeaning.id) {
        try {
          await db.insert(examples).values({
            meaningId: addedMeaning.id,
            sentence: meaning.example.sentence,
            authorId: meaning.example.author,
          })
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong while adding example sentence and setting already existing author.",
          })
        }

      }
      // when the author is a string, it means the author is not in the database
      else if (meaning.example && typeof meaning.example.author === "string" && addedMeaning.id) {
        try {
          const [author] = await db.insert(authors).values({
            name: meaning.example.author
          }).returning()
          await db.insert(examples).values({
            meaningId: addedMeaning.id,
            sentence: meaning.example.sentence,
            authorId: author.id,
          })
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong while adding example sentence and setting new author.",
          })
        }
      }
      else if (meaning.example && typeof meaning.example.author === "undefined" && addedMeaning.id) {
        try {
          await db.insert(examples).values({
            meaningId: addedMeaning.id,
            sentence: meaning.example.sentence,
          })
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong while adding example sentence.",
          })
        }
      }
      if (typeof meaning.attributes === 'number' && meaning.attributes !== undefined) {
        try {
          await db.insert(meaningsAttributes).values({
            attributeId: meaning.attributes,
            meaningId: addedMeaning.id
          })
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong while setting meaning attributes.",
          })
        }
      }

      else if (typeof meaning.attributes === 'string') {
        try {
          const [attribute] = await db.insert(meaningAttributes).values({
            attribute: meaning.attributes
          }).returning()
          await db.insert(meaningsAttributes).values({
            attributeId: attribute.id,
            meaningId: addedMeaning.id
          })
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong while adding new meaning attributes to the database.",
          })
        }
      }
      return addedMeaning
    })

    return {
      word: addedWord,
      meanings: addedMeanings
    };
  }),
  checkWord: adminProcedure
    .input(z.string())
    .query(async ({ ctx: { db }, input: wordInput }) => {
      const word = await db
        .select({ id: words.id })
        .from(words)
        .where(eq(words.name, wordInput));
      return {
        wordAlreadyExists: word.length > 0,
      };
    }),
  getMeaningAttributes: adminProcedure.query(async ({ ctx: { db } }) => {
    const attributes = await db.select().from(meaningAttributes)
    return attributes
  }),
  getExampleSentenceAuthors: adminProcedure.query(async ({ ctx: { db } }) => {
    const authorsData = await db.select({
      id: authors.id,
      name: authors.name
    }).from(authors)
    return authorsData
  }),
  getPartOfSpeeches: adminProcedure.query(async ({ ctx: { db } }) => {
    const partOfSpeechData = await db.select({ id: partOfSpeechs.id, partOfSpeech: partOfSpeechs.partOfSpeech }).from(partOfSpeechs)
    return partOfSpeechData
  }),
  getLanguages: adminProcedure.query(async ({ ctx: { db } }) => {
    const languageData = await db.select().from(languages)
    return languageData
  }),
  getWordAttributes: adminProcedure.query(async ({ ctx: { db } }) => {
    const attributesData = await db.select({
      id: wordAttributes.id,
      attribute: wordAttributes.attribute
    }).from(wordAttributes)
    return attributesData
  }),
  getWordToEdit: adminProcedure.input(z.string()).query(async ({ ctx: { db }, input: queriedWord }) => {
    const result = await db.execute(sql
      `
        -- word attributes
        WITH word_attributes_agg AS
        (
          SELECT
            ws_a.word_id,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'attribute_id', w_a.id,
                'attribute', w_a.attribute
              )
            ) AS attributes
          FROM words_attributes ws_a
          JOIN word_attributes w_a ON ws_a.attribute_id = w_a.id
          GROUP BY ws_a.word_id
        ),
        -- meaning attributes
        meaning_attributes_agg AS
        (
          SELECT
          ms_a.meaning_id,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'attribute_id', m_a.id,
              'attribute', m_a.attribute
            )
          ) AS attributes
          FROM meanings_attributes ms_a
          JOIN meaning_attributes m_a ON ms_a.attribute_id = m_a.id
          GROUP BY ms_a.meaning_id
        ),
        -- meanings
        meanings_agg AS
        (
          SELECT
            m.word_id,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'meaning_id', m.id,
                'meaning', m.meaning,
                'part_of_speech', pos.part_of_speech,
                'part_of_speech_id', pos.id,
                'sentence', ex.sentence,
                'sentence_id', ex.id,
                'author', aut.name,
                'author_id', aut.id,
                'attributes', ma_agg.attributes
              ) ORDER BY m.id
            ) AS meanings
          FROM meanings m
          LEFT JOIN part_of_speechs pos ON m.part_of_speech_id = pos.id
          LEFT JOIN examples ex ON ex.meaning_id = m.id
          LEFT JOIN authors aut ON ex.author_id = aut.id
          LEFT JOIN meaning_attributes_agg ma_agg ON ma_agg.meaning_id = m.id
          GROUP BY m.word_id
        ),
        -- word with meanings and root
        words_with_meanings AS
        (
          SELECT
            w.id AS word_id,
            w.name AS word_name,
            w.phonetic AS phonetic,
            w.suffix AS suffix,
            w.prefix AS prefix,
            COALESCE(wa_agg.attributes, '[]'::json) AS word_attributes,
            JSON_BUILD_OBJECT(
            'root', r.root,
            'language_en', langs.language_en,
            'language_tr', langs.language_tr,
            'language_code', langs.language_code
            ) AS root,
            COALESCE(m_agg.meanings, '[]'::json) AS meanings
          FROM words w
          LEFT JOIN word_attributes_agg wa_agg ON w.id = wa_agg.word_id
          LEFT JOIN roots r ON r.word_id = w.id
          LEFT JOIN languages langs ON r.language_id = langs.id
          LEFT JOIN meanings_agg m_agg ON m_agg.word_id = w.id
          WHERE w.name = ${queriedWord}
        )
          -- combine all data as a single json object
          SELECT
            JSON_BUILD_OBJECT(
            'word_id', word_id,
            'word_name', word_name,
            'attributes', word_attributes,
            'phonetic', phonetic,
            'prefix', prefix,
            'suffix', suffix,
            'root', root,
            'meanings', meanings
          ) AS word_data
          FROM words_with_meanings;
      `
    ) as WordSearchResult[]
    return result
  }),
  addNewWordAttribute: adminProcedure.input(z.string().min(2)).mutation(async ({ input: newWordAttribute, ctx: { db } }) => {
    try {
      const result = await db.insert(wordAttributes).values({
        attribute: newWordAttribute
      }).returning()
      return result
    } catch (error) {
      console.log(error)
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: "Unexpected Error."
      })
    }
  })
});
