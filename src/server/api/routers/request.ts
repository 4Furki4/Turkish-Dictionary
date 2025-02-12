import { requests } from "@/db/schema/requests";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const requestRouter = createTRPCRouter({
    getWordAttributesMergedRequests: protectedProcedure.query(async ({ ctx: { db, session: { user } } }) => {
        const result = await db.select().from(requests).where(and(eq(requests.entityType, "word_attributes"), eq(requests.action, "create"), eq(requests.userId, user.id)))
        console.log("new data", result[0].newData)
        return result
    }),
    requestEditWord: protectedProcedure.input(z.object({
        word_id: z.number(),
        wordName: z.string().optional(),
        language: z.string().optional(),
        phonetic: z.string().optional(),
        root: z.string().optional(),
        prefix: z.string().optional(),
        suffix: z.string().optional(),
        attributes: z.array(z.string()).optional(),
    })).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        const wordAttributes = input.attributes?.map((attribute) => ({ attribute: Number(attribute) }))
        const wordData = {
            ...input,
            attribute_ids: wordAttributes
        }
        const preparedData = Object.keys(wordData).reduce<Record<string, unknown>>((acc, key) => {
            if (wordData[key as keyof typeof wordData]) {
                acc[key] = wordData[key as keyof typeof wordData]
            }
            return acc
        }, {})
        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "words",
                action: "create",
                userId: user.id,
                requestableId: input.word_id,
                newData: JSON.stringify(preparedData),
            })
        })
    })
})