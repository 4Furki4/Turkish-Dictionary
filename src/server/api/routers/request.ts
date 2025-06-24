import { requests } from "@/db/schema/requests";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { and, eq, SQL, sql } from "drizzle-orm";
import { z } from "zod";
import { purifyObject } from "@/src/lib/utils";
import { users } from "@/db/schema/users";
import { words } from "@/db/schema/words";
import { meanings } from "@/db/schema/meanings";
import { relatedWords } from "@/db/schema/related_words";
import { getHandler } from "../handlers/request-handlers/registry";
import { TRPCError } from "@trpc/server";
import { relatedPhrases } from "@/db/schema/related_phrases";
import { verifyRecaptcha } from "@/src/lib/recaptcha";
import { wordAttributes } from "@/db/schema/word_attributes";

export const requestRouter = createTRPCRouter({
    // User request management endpoints
    getUserRequests: protectedProcedure
        .input(z.object({
            page: z.number().default(1),
            limit: z.number().default(10),
            entityType: z.enum([
                "words", "meanings", "roots", "related_words",
                "related_phrases",
                "part_of_speechs", "examples", "authors",
                "word_attributes", "meaning_attributes"
            ]).optional(),
            action: z.enum(["create", "update", "delete"]).optional(),
            status: z.enum(["pending", "approved", "rejected"]).optional(),
        }))
        .query(async ({ input, ctx: { db, session: { user } } }) => {
            const { page, limit, entityType, action, status } = input;
            const offset = (page - 1) * limit;

            // Build the where clause based on filters
            let whereClause: SQL<unknown> | undefined = eq(requests.userId, user.id);

            if (entityType) {
                whereClause = and(whereClause, eq(requests.entityType, entityType));
            }
            if (action) {
                whereClause = and(whereClause, eq(requests.action, action));
            }
            if (status) {
                whereClause = and(whereClause, eq(requests.status, status));
            }

            // Get the user's requests
            const userRequests = await db.select({
                id: requests.id,
                entityType: requests.entityType,
                entityId: requests.entityId,
                action: requests.action,
                newData: requests.newData,
                requestDate: requests.requestDate,
                status: requests.status,
                reason: requests.reason
            })
                .from(requests)
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
                requests: userRequests,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };
        }),

    getUserRequest: protectedProcedure
        .input(z.object({
            requestId: z.number()
        }))
        .query(async ({ input, ctx: { db, session: { user } } }) => {
            const { requestId } = input;

            // Get the request ensuring it belongs to the current user
            const requestData = await db.select()
                .from(requests)
                .where(and(
                    eq(requests.id, requestId),
                    eq(requests.userId, user.id)
                ));

            if (!requestData.length) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Request not found"
                });
            }

            const request = requestData[0];

            // Get related entity data based on entityType
            let entityData = null;
            if (request.entityId) {
                switch (request.entityType) {
                    case "words":
                        entityData = await db.select().from(words).where(eq(words.id, request.entityId));
                        break;
                    case "meanings":
                        entityData = await db.select().from(meanings).where(eq(meanings.id, request.entityId));
                        break;
                    // Add other entity types as needed
                }
            }

            return {
                request,
                entityData: entityData?.[0] || null
            };
        }),

    cancelRequest: protectedProcedure
        .input(z.object({
            requestId: z.number(),
            captchaToken: z.string(),
        }))
        .mutation(async ({ input, ctx: { db, session: { user } } }) => {
            const { requestId, captchaToken } = input;
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Error.captchaFailed',
                });
            }
            // Check if the request exists and belongs to the user
            const requestData = await db.select()
                .from(requests)
                .where(and(
                    eq(requests.id, requestId),
                    eq(requests.userId, user.id),
                    eq(requests.status, "pending") // Can only cancel pending requests
                ));

            if (!requestData.length) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Request not found or cannot be canceled"
                });
            }

            // Delete the request
            await db.delete(requests)
                .where(eq(requests.id, requestId));

            return { success: true };
        }),

    updateRequest: protectedProcedure
        .input(z.object({
            requestId: z.number(),
            newData: z.record(z.unknown()),
            reason: z.string().optional(),
            captchaToken: z.string(),
        }))
        .mutation(async ({ input, ctx: { db, session: { user } } }) => {
            const { requestId, newData, reason, captchaToken } = input;
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Error.captchaFailed',
                });
            }
            // Check if the request exists and belongs to the user
            const requestData = await db.select()
                .from(requests)
                .where(and(
                    eq(requests.id, requestId),
                    eq(requests.userId, user.id),
                    eq(requests.status, "pending") // Can only update pending requests
                ));

            if (!requestData.length) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Request not found or cannot be updated"
                });
            }

            // Update the request
            await db.update(requests)
                .set({
                    newData: JSON.stringify(newData),
                    reason: reason || requestData[0].reason
                })
                .where(eq(requests.id, requestId));

            return { success: true };
        }),

    requestEditRelatedWord: protectedProcedure
        .input(z.object({
            wordId: z.number(), // The ID of the main word
            relatedWordId: z.number(), // The ID of the word it's related to
            originalRelationType: z.string().min(1),
            newRelationType: z.string().min(1),
            reason: z.string().optional(),
            captchaToken: z.string(),
        }))
        .mutation(async ({ input, ctx: { db, session: { user } } }) => {
            const { wordId, relatedWordId, originalRelationType, newRelationType, reason, captchaToken } = input;
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Error.captchaFailed',
                });
            }
            // Check if the original related word entry exists
            const existingRelation = await db.query.relatedWords.findFirst({
                where: and(
                    eq(relatedWords.wordId, wordId),
                    eq(relatedWords.relatedWordId, relatedWordId)
                ),
                columns: { // Ensure relationType is available for checking
                    relationType: true
                }
            });

            if (!existingRelation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Original related word entry not found."
                });
            }

            // Verify the original relation type matches what the user saw
            if (existingRelation.relationType !== originalRelationType) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "The relation type of this word has changed. Please refresh the page and try again."
                });
            }

            await db.insert(requests).values({
                userId: user.id,
                entityType: "related_words",
                entityId: wordId, // Storing the main wordId as the entityId
                action: "update",
                newData: {
                    relatedWordId: relatedWordId,
                    originalRelationType: originalRelationType,
                    newRelationType: newRelationType
                },
                status: "pending",
                reason: reason,
                requestDate: new Date(),
            });

            return { success: true, message: "Related word edit request submitted." };
        }),

    requestDeleteRelatedWord: protectedProcedure
        .input(z.object({
            wordId: z.number(),
            relatedWordId: z.number(),
            reason: z.string().optional(),
            captchaToken: z.string(),
        }))
        .mutation(async ({ input, ctx: { db, session: { user } } }) => {
            const { wordId, relatedWordId, reason, captchaToken } = input;
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Error.captchaFailed',
                });
            }
            const existingRelation = await db.query.relatedWords.findFirst({
                where: and(
                    eq(relatedWords.wordId, wordId),
                    eq(relatedWords.relatedWordId, relatedWordId)
                )
            });

            if (!existingRelation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Related word entry not found, cannot request deletion."
                });
            }

            await db.insert(requests).values({
                userId: user.id,
                entityType: "related_words",
                entityId: wordId, // Storing the main wordId as the entityId
                action: "delete",
                newData: {
                    relatedWordId: relatedWordId,
                    originalRelationType: existingRelation.relationType // Store original details for admin context
                },
                status: "pending",
                reason: reason,
                requestDate: new Date(),
            });

            return { success: true, message: "Related word deletion request submitted." };
        }),

    requestCreateRelatedWord: protectedProcedure
        .input(z.object({
            wordId: z.number(),
            relatedWordId: z.number(),
            relationType: z.string(),
            reason: z.string().optional(),
            captchaToken: z.string(),
        }))
        .mutation(async ({ input, ctx: { db, session: { user } } }) => {
            const { wordId, relatedWordId, relationType, reason, captchaToken } = input;
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Error.captchaFailed',
                });
            }
            const existingRelation = await db.query.relatedWords.findFirst({
                where: and(
                    eq(relatedWords.wordId, wordId),
                    eq(relatedWords.relatedWordId, relatedWordId)
                )
            });

            if (existingRelation) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This related word entry already exists."
                });
            }

            await db.insert(requests).values({
                userId: user.id,
                entityType: "related_words",
                entityId: wordId,
                action: "create",
                newData: {
                    relatedWordId: relatedWordId,
                    newRelationType: relationType
                },
                status: "pending",
                reason: reason,
                requestDate: new Date(),
            });

            return { success: true, message: "Related word creation request submitted." };
        }),

    requestEditRelatedPhrase: protectedProcedure
        .input(z.object({
            wordId: z.number(), // ID of the main word
            oldRelatedPhraseId: z.number(), // ID of the word that IS the phrase being replaced
            newRelatedPhraseId: z.number(), // ID of the new word to become the phrase
            reason: z.string().optional(),
            captchaToken: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { wordId, oldRelatedPhraseId, newRelatedPhraseId, reason, captchaToken } = input;
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Error.captchaFailed',
                });
            }
            await ctx.db.insert(requests).values({
                userId: ctx.session.user.id,
                entityType: "related_phrases",
                entityId: wordId, // The request is for the main word
                action: "update",
                newData: {
                    oldRelatedPhraseId: oldRelatedPhraseId, // The ID of the phrase word being replaced
                    newRelatedPhraseId: newRelatedPhraseId, // The ID of the new phrase word
                },
                status: "pending",
                reason: reason,
                requestDate: new Date(),
            });

            return { success: true, message: "Related phrase edit request submitted." };
        }),

    requestCreateRelatedPhrase: protectedProcedure
        .input(z.object({
            wordId: z.number(),
            phraseId: z.number(),
            description: z.string().optional(),
            reason: z.string().optional(),
            captchaToken: z.string(),
        }))
        .mutation(async ({ input: { wordId, phraseId, description, reason, captchaToken }, ctx: { db, session: { user } } }) => {
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Error.captchaFailed',
                });
            }
            const existingPhrase = await db.query.relatedPhrases.findFirst({
                where: and(
                    eq(relatedPhrases.wordId, wordId),
                    eq(relatedPhrases.relatedPhraseId, phraseId)
                )
            });

            if (existingPhrase) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This related phrase already exists for this word."
                });
            }

            const existingRequest = await db.query.requests.findFirst({
                where: and(
                    eq(requests.entityType, "related_phrases"),
                    eq(requests.action, "create"),
                    eq(requests.status, "pending"),
                    eq(requests.entityId, wordId),
                    sql`"new_data"->>'phraseId' = ${String(phraseId)}`
                )
            });

            if (existingRequest) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "A request for this related phrase already exists and is pending."
                });
            }

            const dataToStore: { phraseId: number; description?: string } = {
                phraseId: phraseId,
            };
            if (description) {
                dataToStore.description = description;
            }

            await db.insert(requests).values({
                userId: user.id,
                entityType: "related_phrases",
                entityId: wordId,
                action: "create",
                newData: dataToStore,
                status: "pending",
                reason: reason,
                requestDate: new Date(),
            });

            return { success: true, message: "Related phrase creation request submitted." };
        }),

    requestDeleteRelatedPhrase: protectedProcedure
        .input(z.object({
            wordId: z.number(),
            relatedPhraseId: z.number(),
            reason: z.string().optional(),
        }))
        .mutation(async ({ input, ctx: { db, session: { user } } }) => {
            const { wordId, relatedPhraseId, reason } = input;

            const existingRelation = await db.query.relatedPhrases.findFirst({
                where: and(
                    eq(relatedPhrases.wordId, wordId),
                    eq(relatedPhrases.relatedPhraseId, relatedPhraseId)
                )
            });

            if (!existingRelation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Related phrase entry not found, cannot request deletion."
                });
            }

            await db.insert(requests).values({
                userId: user.id,
                entityType: "related_phrases",
                entityId: wordId,
                action: "delete",
                newData: { relatedPhraseId },
                status: "pending",
                reason: reason,
                requestDate: new Date(),
            });

            return { success: true, message: "Related phrase deletion request submitted." };
        }),

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

        // Combine and return both sets
        const pendingRequestsWithIds = pendingRequests.map(req => ({
            id: -req.id, // Use negative IDs for pending items to avoid conflicts
            attribute: (req.newData as { attribute: string }).attribute,
        }))
        return [...approvedAttributes, ...pendingRequestsWithIds];
    }),

    // Simple word request for Tier-1 contribution flow
    createSimpleWordRequest: protectedProcedure
        .input(z.object({
            wordName: z.string().min(1, "Word name is required").max(100),
            captchaToken: z.string(),
        }))
        .mutation(async ({ input, ctx: { db, session: { user } } }) => {
            const { wordName, captchaToken } = input;

            // Verify reCAPTCHA
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'captchaFailed',
                });
            }

            // Check if user already requested this word
            const existingRequest = await db.select()
                .from(requests)
                .where(and(
                    eq(requests.userId, user.id),
                    eq(requests.entityType, "words"),
                    eq(requests.action, "create"),
                    eq(requests.status, "pending")
                ));

            // Check if any existing request has the same word name
            const duplicateRequest = existingRequest.find(req => {
                try {
                    if (!req.newData || typeof req.newData !== 'string') return false;
                    const newData = JSON.parse(req.newData) as Record<string, any>;
                    return newData.name === wordName.trim();
                } catch {
                    return false;
                }
            });

            if (duplicateRequest) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'wordAlreadyRequested',
                });
            }

            // Create the simple word request
            const requestData = {
                name: wordName.trim(),
                requestType: 'simple' // Flag to identify simple requests
            };

            await db.insert(requests).values({
                entityType: "words",
                action: "create",
                userId: user.id,
                entityId: null, // No entity ID for new word requests
                newData: JSON.stringify(requestData),
                reason: `Simple word request for: ${wordName.trim()}`
            });

            return { success: true };
        }),

    createFullWordRequest: protectedProcedure
        .input(z.object({
            name: z.string().min(1, "Word name is required"),
            language: z.string().optional(),
            phonetic: z.string().optional(),
            root: z.string().optional(),
            prefix: z.string().optional(),
            suffix: z.string().optional(),
            attributes: z.number().array().optional(),
            meanings: z.array(z.object({
                meaning: z.string().min(1, "Meaning is required"),
                partOfSpeechId: z.number().optional().nullable(),
                attributes: z.array(z.number()),
                example: z.object({
                    sentence: z.string(),
                    author: z.number().optional().nullable()
                }).optional(),
                imageUrl: z.string().optional()
            })).min(1, "At least one meaning is required"),
            captchaToken: z.string(),
        }))
        .mutation(async ({ input, ctx: { db, session: { user } } }) => {
            const { captchaToken, ...wordData } = input;

            // Verify reCAPTCHA
            const { success } = await verifyRecaptcha(captchaToken);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'captchaFailed',
                });
            }

            // Check if user already requested this word
            const existingRequest = await db.select()
                .from(requests)
                .where(and(
                    eq(requests.userId, user.id),
                    eq(requests.entityType, "words"),
                    eq(requests.action, "create"),
                    eq(requests.status, "pending")
                ));

            // Check if any existing request has the same word name
            const duplicateRequest = existingRequest.find(req => {
                try {
                    if (!req.newData || typeof req.newData !== 'string') return false;
                    const newData = JSON.parse(req.newData) as Record<string, any>;
                    return newData.name === wordData.name.trim();
                } catch {
                    return false;
                }
            });

            if (duplicateRequest) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'wordAlreadyRequested',
                });
            }

            // Create the full word request
            const requestData = {
                ...wordData,
                name: wordData.name.trim(),
                requestType: 'full' // Flag to identify full word requests
            };

            await db.insert(requests).values({
                entityType: "words",
                action: "create",
                userId: user.id,
                entityId: null, // No entity ID for new word requests
                newData: JSON.stringify(requestData),
                reason: `Full word contribution for: ${wordData.name.trim()}`
            });

            return { success: true };
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
        captchaToken: z.string(),
    })).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        const wordAttributes = input.attributes?.map((attribute) => ({ attribute: Number(attribute) }))
        const { word_id, captchaToken, ...restInput } = input;
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
        try {
            const { success } = await verifyRecaptcha(captchaToken);
            console.log('success', success)
        } catch (error) {
            console.log('captcha failed')
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Error.captchaFailed',
            });
        }
        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "words",
                action: "update",
                userId: user.id,
                entityId: input.word_id,
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
        captchaToken: z.string(),
    })).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        const { meaning_id, reason, captchaToken, ...restInput } = input;
        const preparedData = Object.keys(restInput).reduce<Record<string, unknown>>((acc, key) => {
            if (restInput[key as keyof typeof restInput]) {
                acc[key] = restInput[key as keyof typeof restInput]
            }
            return acc
        }, {})
        const purifiedData = purifyObject(preparedData)
        try {
            const { success } = await verifyRecaptcha(captchaToken);
            console.log('success', success)
        } catch (error) {
            console.log('captcha failed')
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Error.captchaFailed',
            });
        }
        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "meanings",
                action: "update",
                userId: user.id,
                entityId: meaning_id,
                newData: JSON.stringify(purifiedData),
                reason
            })
        })
    }),
    requestDeleteMeaning: protectedProcedure.input(z.object({
        meaning_id: z.number(),
        reason: z.string().min(1, "Reason is required"),
        captchaToken: z.string(),
    })).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        const { meaning_id, reason, captchaToken } = input;
        try {
            const { success } = await verifyRecaptcha(captchaToken);
            console.log('success', success)
        } catch (error) {
            console.log('captcha failed')
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Error.captchaFailed',
            });
        }
        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "meanings",
                action: "delete",
                userId: user.id,
                entityId: input.meaning_id,
                reason: input.reason
            })
        })
    }),
    newWordAttribute: protectedProcedure.input(z.object({
        attribute: z.string().min(2),
        captchaToken: z.string(),
    })).mutation(async ({ input, ctx: { db, session: { user } } }) => {
        const { attribute, captchaToken } = input;
        try {
            const { success } = await verifyRecaptcha(captchaToken);
            console.log('success', success)
        } catch (error) {
            console.log('captcha failed')
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Error.captchaFailed',
            });
        }

        await db.transaction(async (tx) => {
            await tx.insert(requests).values({
                entityType: "word_attributes",
                action: "create",
                userId: user.id,
                newData: JSON.stringify({ attribute }),
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
                "related_phrases",
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
                requestableId: requests.entityId,
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
            if (!request.entityId) {
                return {
                    request,
                    user,
                    entityData: null
                }
            }

            switch (request.entityType) {
                case "words":
                    entityData = await db.select().from(words).where(eq(words.id, request.entityId));
                    break;
                case "meanings":
                    entityData = await db.select().from(meanings).where(eq(meanings.id, request.entityId));
                    break;
                // Add other entity types as needed
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
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Request not found"
                    });
                }

                const request = requestData[0];

                // Process the request based on entityType and action
                const handler = getHandler(request.entityType, request.action)
                if (!handler) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Unsupported request type"
                    });
                }

                // Process the request with the handler
                await handler.handle({ tx, request });

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
        }),
})