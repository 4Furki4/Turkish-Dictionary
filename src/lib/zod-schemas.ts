import { z } from "zod";
export const createWordSchema = z.object({
  word: z.object({
    name: z.string(),
    root: z.string().optional(),
    attributes: z.array(z.string()).optional(),
    audio: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    relatedWords: z.array(z.string()).optional(),
    relatedPhrases: z.array(z.string()).optional(),
    phonetics: z.string().optional(),
    meanings: z.array(
      z.object({
        definition: z.object({
          definition: z.string(),
          image: z.string().optional(),
          example: z
            .object({
              sentence: z.string(),
              author: z.string().optional(),
            })
            .optional(),
        }),
        partOfSpeech: z.enum([
          "noun",
          "verb",
          "adjective",
          "adverb",
          "preposition",
          "conjunction",
          "interjection",
        ]),
        attributes: z.array(z.string()).optional(),
      })
    ),
  }),
});

export type CreateWordInput = z.infer<typeof createWordSchema>;
