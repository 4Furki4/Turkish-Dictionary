import { z } from "zod";
export const EditMeaningSchema = z.object({
    id: z.string().or(z.number()).optional().nullable(),
    meaning: z.string().min(1, "Meaning input cannot be empty!"),
    attributes: z.array(z.number()).optional().nullable(),
    partOfSpeechId: z.number({ required_error: "Part of Speech is required!" }),
    exampleSentence: z.string().min(5).optional().nullable(),
    authorId: z.number().optional().nullable()
})

export const EditWordSchema = z.object({
    id: z.number(),
    name: z.string().min(1, "Word must have a name."),
    attributes: z.array(z.number()).optional().nullable(),
    language: z.string().optional().nullable(),
    root: z.string().optional().nullable(),
    phonetic: z.string().optional().nullable(),
    suffix: z.string().optional().nullable(),
    prefix: z.string().optional().nullable(),
    meanings: z.array(EditMeaningSchema).min(1)
})