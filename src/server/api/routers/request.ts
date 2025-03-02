import { requests } from "@/db/schema/requests";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { purifyObject } from "@/src/lib/utils";
import { wordAttributes } from "@/db/schema/word_attributes";

export const requestRouter = createTRPCRouter({
    // In src/server/api/routers/params.ts
    getWordAttributesWithRequested: protectedProcedure.query(async ({ ctx: { db, session: { user } } }) => {
        // Get approved attributes from the main table
        const approvedAttributes = await db.select({
            id: wordAttributes.id,
            attribute: wordAttributes.attribute
        }).from(wordAttributes);

        // Get user's pending attribute requests
        const pendingRequests = await db.select({
            id: requests.id,
            newData: requests.newData
        }).from(requests)
            .where(and(
                eq(requests.userId, user.id),
                eq(requests.entityType, "word_attributes"),
                eq(requests.action, "create"),
                eq(requests.status, "pending")
            ));
        console.log("pendingRequests", pendingRequests)
        // Combine and return both sets
        const pendingRequestsWithIds = pendingRequests.map(req => ({
            id: -req.id, // Use negative IDs for pending items to avoid conflicts
            attribute: (req.newData as { attribute: string }).attribute,
        }))
        return [...approvedAttributes, ...pendingRequestsWithIds];
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
        reason: z.string().min(1, "Reason is required"),
    })).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        const wordAttributes = input.attributes?.map((attribute) => ({ attribute: Number(attribute) }))
        const { word_id, ...restInput } = input;
        const wordData = {
            attributes: wordAttributes,
            ...restInput
        }
        const preparedData = Object.keys(wordData).reduce<Record<string, unknown>>((acc, key) => {
            if (wordData[key as keyof typeof wordData]) {
                acc[key] = wordData[key as keyof typeof wordData]
            }
            return acc
        }, {})
        const purifiedData = purifyObject(preparedData)
        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "words",
                action: "update",
                userId: user.id,
                requestableId: input.word_id,
                newData: JSON.stringify(purifiedData),
                reason: input.reason
            })
        })
    }),
    requestEditMeaning: protectedProcedure.input(z.object({
        meaning_id: z.number(),
        meaning: z.string().optional(),
        part_of_speech_id: z.number().optional(),
        sentence: z.string().optional(),
        attributes: z.array(z.number()).optional(),
        author_id: z.number().optional(),
        reason: z.string().min(1, "Reason is required"),
    })).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        const { meaning_id, reason, ...restInput } = input;
        const preparedData = Object.keys(restInput).reduce<Record<string, unknown>>((acc, key) => {
            if (restInput[key as keyof typeof restInput]) {
                acc[key] = restInput[key as keyof typeof restInput]
            }
            return acc
        }, {})
        const purifiedData = purifyObject(preparedData)
        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "meanings",
                action: "update",
                userId: user.id,
                requestableId: meaning_id,
                newData: JSON.stringify(purifiedData),
                reason
            })
        })
    }),
    requestDeleteMeaning: protectedProcedure.input(z.object({
        meaning_id: z.number(),
        reason: z.string().min(1, "Reason is required"),
    })).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "meanings",
                action: "delete",
                userId: user.id,
                requestableId: input.meaning_id,
                reason: input.reason
            })
        })
    }),
    newWordAttribute: protectedProcedure.input(z.string().min(2)).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "word_attributes",
                action: "create",
                userId: user.id,
                newData: JSON.stringify({ attribute: input }),
            })
        })
    })
})