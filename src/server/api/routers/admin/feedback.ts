import { adminProcedure, createTRPCRouter, protectedProcedure } from "@/src/server/api/trpc";
import { db } from "@/db";
import { feedbacks, feedbackStatusEnum, feedbackTypeEnum } from "@/db/schema/feedbacks";
import { users } from "@/db/schema/users";
import { and, eq, ilike, or, sql, desc, asc, notInArray, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { feedbackVotes } from "@/db/schema/feedback_votes";

export const feedbackAdminRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            page: z.number().min(1).default(1),
            limit: z.number().min(1).max(100).default(20),
            status: z.array(z.enum(feedbackStatusEnum.enumValues)).optional(),
            type: z.array(z.enum(feedbackTypeEnum.enumValues)).optional(),
            searchTerm: z.string().optional(),
            sortBy: z.enum(["votes", "createdAt"]).default("votes"),
            sortOrder: z.enum(["asc", "desc"]).default("desc"),
            excludeStatuses: z.array(z.enum(feedbackStatusEnum.enumValues)).default([
                "closed", "rejected", "duplicate", "fixed", "wont_implement"
            ]),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
        }))
        .query(async ({ ctx, input }) => {
            if (ctx.session.user.role !== 'admin') {
                throw new Error("Unauthorized");
            }

            const { page, limit, status, type, searchTerm, sortBy, sortOrder, excludeStatuses, startDate, endDate } = input;
            const offset = (page - 1) * limit;

            const whereConditions = and(
                // Apply status filters
                status && status.length > 0 
                    ? or(...status.map(s => eq(feedbacks.status, s)))
                    : excludeStatuses.length > 0 
                        ? notInArray(feedbacks.status, excludeStatuses)
                        : undefined,
                // Apply type filters
                type && type.length > 0 
                    ? or(...type.map(t => eq(feedbacks.type, t)))
                    : undefined,
                // Apply search term
                searchTerm
                    ? or(
                        ilike(feedbacks.title, `%${searchTerm}%`),
                        ilike(feedbacks.description, `%${searchTerm}%`)
                    )
                    : undefined,
                // Apply date range filters
                startDate ? gte(feedbacks.createdAt, startDate) : undefined,
                endDate ? lte(feedbacks.createdAt, endDate) : undefined,
            );

            // Determine sort order
            const orderByClause = sortBy === "votes" 
                ? (sortOrder === "desc" ? desc(sql<number>`count(${feedbackVotes.id})`) : asc(sql<number>`count(${feedbackVotes.id})`))
                : (sortOrder === "desc" ? desc(feedbacks.createdAt) : asc(feedbacks.createdAt));

            const feedbackEntries = await db
                .select({
                    id: feedbacks.id,
                    title: feedbacks.title,
                    description: feedbacks.description,
                    type: feedbacks.type,
                    status: feedbacks.status,
                    createdAt: feedbacks.createdAt,
                    user: {
                        id: users.id,
                        name: users.name,
                        image: users.image,
                    },
                    voteCount: sql<number>`count(${feedbackVotes.id})`.mapWith(Number),
                })
                .from(feedbacks)
                .leftJoin(users, eq(feedbacks.userId, users.id))
                .leftJoin(feedbackVotes, eq(feedbacks.id, feedbackVotes.feedbackId))
                .where(whereConditions)
                .groupBy(feedbacks.id, users.id)
                .orderBy(orderByClause)
                .limit(limit)
                .offset(offset);

            const totalFeedbacksResult = await db.select({
                count: sql<number>`count(*)`.mapWith(Number),
            }).from(feedbacks).where(whereConditions);

            const totalFeedbacks = totalFeedbacksResult[0]?.count ?? 0;

            return {
                feedbacks: feedbackEntries,
                totalPages: Math.ceil(totalFeedbacks / limit),
                totalCount: totalFeedbacks,
            };
        }),
    updateStatus: adminProcedure
        .input(z.object({
            id: z.number(),
            status: z.enum(feedbackStatusEnum.enumValues),
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.session.user.role !== 'admin') {
                throw new Error("Unauthorized");
            }

            await db.update(feedbacks)
                .set({ status: input.status, updatedAt: new Date() })
                .where(eq(feedbacks.id, input.id));

            return { success: true };
        }),
    updateType: protectedProcedure
        .input(z.object({
            id: z.number(),
            type: z.enum(feedbackTypeEnum.enumValues),
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.session.user.role !== 'admin') {
                throw new Error("Unauthorized");
            }
            await db
                .update(feedbacks)
                .set({ type: input.type, updatedAt: new Date() })
                .where(eq(feedbacks.id, input.id));
            return { success: true };
        }),
    delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.session.user.role !== "admin") {
                throw new Error("Unauthorized");
            }

            await db.delete(feedbacks).where(eq(feedbacks.id, input.id));

            return { success: true };
        }),
});