import { requests } from "@/db/schema/requests";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { and, eq, SQL, sql } from "drizzle-orm";
import { z } from "zod";
import { purifyObject } from "@/src/lib/utils";
import { wordAttributes } from "@/db/schema/word_attributes";
import { users } from "@/db/schema/users";
import { words } from "@/db/schema/words";
import { meanings } from "@/db/schema/meanings";

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
    }),

    // Admin endpoints for request management
    getAllPendingRequests: adminProcedure
        .input(z.object({
            page: z.number().default(1),
            limit: z.number().default(10),
            entityType: z.enum([
                "words", "meanings", "roots", "related_words",
                "part_of_speechs", "examples", "authors",
                "word_attributes", "meaning_attributes"
            ]).optional(),
            action: z.enum(["create", "update", "delete"]).optional()
        }))
        .query(async ({ input, ctx: { db } }) => {
            const { page, limit, entityType, action } = input;
            const offset = (page - 1) * limit;

            // Build the where clause based on filters
            let whereClause: SQL<unknown> | undefined = eq(requests.status, "pending");
            if (entityType) {
                whereClause = and(whereClause, eq(requests.entityType, entityType));
            }
            if (action) {
                whereClause = and(whereClause, eq(requests.action, action));
            }

            // Get the requests with user info
            const pendingRequests = await db.select({
                id: requests.id,
                userId: requests.userId,
                userName: users.name,
                userImage: users.image,
                entityType: requests.entityType,
                requestableId: requests.requestableId,
                action: requests.action,
                newData: requests.newData,
                requestDate: requests.requestDate,
                status: requests.status,
                reason: requests.reason
            })
                .from(requests)
                .leftJoin(users, eq(requests.userId, users.id))
                .where(whereClause)
                .limit(limit)
                .offset(offset)
                .orderBy(sql`${requests.requestDate} DESC`);

            // Get total count for pagination
            const countResult = await db.select({
                count: sql<number>`count(*)`
            })
                .from(requests)
                .where(whereClause);

            const totalCount = countResult[0]?.count || 0;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                requests: pendingRequests,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };
        }),

    // Get request details with related entity data
    getRequestDetails: adminProcedure
        .input(z.object({
            requestId: z.number()
        }))
        .query(async ({ input, ctx: { db } }) => {
            const { requestId } = input;

            // Get the request
            const requestData = await db.select()
                .from(requests)
                .where(eq(requests.id, requestId))
                .leftJoin(users, eq(requests.userId, users.id));

            if (!requestData.length) {
                throw new Error("Request not found");
            }

            const request = requestData[0].requests;
            const user = requestData[0].users;

            // Get related entity data based on entityType
            let entityData = null;
            if (request.requestableId) {
                switch (request.entityType) {
                    case "words":
                        entityData = await db.select().from(words).where(eq(words.id, request.requestableId));
                        break;
                    case "meanings":
                        entityData = await db.select().from(meanings).where(eq(meanings.id, request.requestableId));
                        break;
                    // Add other entity types as needed
                }
            }

            return {
                request,
                user,
                entityData: entityData?.[0] || null
            };
        }),

    // Approve a request
    approveRequest: adminProcedure
        .input(z.object({
            requestId: z.number()
        }))
        .mutation(async ({ input, ctx: { db } }) => {
            const { requestId } = input;

            return await db.transaction(async (tx) => {
                // Get the request
                const requestData = await tx.select().from(requests).where(eq(requests.id, requestId));

                if (!requestData.length) {
                    throw new Error("Request not found");
                }

                const request = requestData[0];

                // Process the request based on entityType and action
                switch (request.entityType) {
                    case "word_attributes":
                        if (request.action === "create" && request.newData) {
                            // Extract attribute from newData
                            const attributeData = request.newData as { attribute: string };

                            // Insert the new attribute into the word_attributes table
                            await tx.insert(wordAttributes).values({
                                attribute: attributeData.attribute
                            });
                        }
                        break;
                    case "words":
                        if (request.action === "update" && request.newData && request.requestableId) {
                            // Update the word
                            await tx.update(words)
                                .set(request.newData as any)
                                .where(eq(words.id, request.requestableId));
                        } else if (request.action === "delete" && request.requestableId) {
                            // Delete the word
                            await tx.delete(words).where(eq(words.id, request.requestableId));
                        }
                        break;
                    case "meanings":
                        if (request.action === "update" && request.newData && request.requestableId) {
                            // Update the meaning
                            await tx.update(meanings)
                                .set(request.newData as any)
                                .where(eq(meanings.id, request.requestableId));
                        } else if (request.action === "delete" && request.requestableId) {
                            // Delete the meaning
                            await tx.delete(meanings).where(eq(meanings.id, request.requestableId));
                        }
                        break;
                    // Add other entity types as needed
                }

                // Update the request status to approved
                await tx.update(requests)
                    .set({ status: "approved" })
                    .where(eq(requests.id, requestId));

                return { success: true };
            });
        }),

    // Reject a request
    rejectRequest: adminProcedure
        .input(z.object({
            requestId: z.number(),
            reason: z.string().optional()
        }))
        .mutation(async ({ input, ctx: { db } }) => {
            const { requestId, reason } = input;

            // Update the request status to rejected
            await db.update(requests)
                .set({
                    status: "rejected",
                    reason: reason ? `Rejected: ${reason}` : undefined
                })
                .where(eq(requests.id, requestId));

            return { success: true };
        })
})