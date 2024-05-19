import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { createWordSchema } from "@/src/lib/zod-schemas";
import { eq } from "drizzle-orm";
import { InsertWord, words } from "@/db/schema/words";
import { InsertMeaning, meanings } from "@/db/schema/meanings";
import { roots } from "@/db/schema/roots";
import { meaningAttributes, meaningsAttributes } from "@/db/schema/meaning_attributes";
import { authors } from "@/db/schema/authors";
import { Meaning, MeaningInputs, WordForm } from "@/types";
import { PartOfSpeech, partOfSpeechs } from "@/db/schema/part_of_speechs";
import { examples } from "@/db/schema/examples";
import { languages } from "@/db/schema/languages";
const CreateWordSchema = z.ZodType<WordForm>
export const adminRouter = createTRPCRouter({
  // deleteWord: adminProcedure
  //   .input(
  //     z.object({
  //       id: z.number(),
  //     })
  //   )
  //   .mutation(async ({ input: { id }, ctx: { db, session } }) => {
  //     try {
  //       await db.delete(words).where(eq(words.id, id));
  //     } catch (error) {
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "Something went wrong",
  //       });
  //     }
  //   }),
  // createWord: adminProcedure
  //   .input(createWordSchema)
  //   .mutation(async ({ ctx: { db }, input: { word } }) => {
  //     // todo
  //   }),

  addWord: adminProcedure.input(z.object({
    name: z.string(),
    language: z.string().optional(),
    phonetic: z.string().optional(),
    root: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    requestType: z.string().optional(),
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
  })
});
