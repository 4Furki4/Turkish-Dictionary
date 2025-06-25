import { meaningAttributes } from "@/db/schema/meaning_attributes"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { authors } from "@/db/schema/authors"
import { partOfSpeechs } from "@/db/schema/part_of_speechs"
import { languages } from "@/db/schema/languages"
import { wordAttributes } from "@/db/schema/word_attributes"

export const paramsRouter = createTRPCRouter({
    getMeaningAttributes: protectedProcedure.query(async ({ ctx: { db } }) => {
        const attributes = await db.select().from(meaningAttributes)
        return attributes
    }),
    getExampleSentenceAuthors: protectedProcedure.query(async ({ ctx: { db } }) => {
        const authorsData = await db.select({
            id: authors.id,
            name: authors.name
        }).from(authors)
        const filteredAuthors = authorsData.map((author) => ({
            ...author,
            id: author.id.toString()
        }))
        return filteredAuthors
    }),
    getPartOfSpeeches: protectedProcedure.query(async ({ ctx: { db } }) => {
        const partOfSpeechData = await db.select({ id: partOfSpeechs.id, partOfSpeech: partOfSpeechs.partOfSpeech }).from(partOfSpeechs)
        return partOfSpeechData
    }),
    getLanguages: protectedProcedure.query(async ({ ctx: { db } }) => {
        const languageData = await db.select().from(languages).orderBy(languages.language_tr)
        return languageData
    }),
    getWordAttributes: protectedProcedure.query(async ({ ctx: { db } }) => {
        const attributesData = await db.select({
            id: wordAttributes.id,
            attribute: wordAttributes.attribute
        }).from(wordAttributes)
        return attributesData
    }),
    getAuthors: protectedProcedure.query(async ({ ctx: { db } }) => {
        const authorsData = await db.select({
            id: authors.id,
            name: authors.name
        }).from(authors)
        const filteredAuthors = authorsData.map((author) => ({
            ...author,
            id: author.id.toString()
        }))
        return filteredAuthors
    })
})