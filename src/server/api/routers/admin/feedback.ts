import { adminProcedure, createTRPCRouter, protectedProcedure } from "@/src/server/api/trpc";
import { db } from "@/db";
import { feedbacks, feedbackStatusEnum, feedbackTypeEnum } from "@/db/schema/feedbacks";
import { users } from "@/db/schema/users";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { feedbackVotes } from "@/db/schema/feedback_votes";

export const feedbackAdminRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            page: z.number().min(1).default(1),
            limit: z.number().min(1).max(100).default(20),
            status: z.enum(feedbackStatusEnum.enumValues).optional(),
            type: z.enum(feedbackTypeEnum.enumValues).optional(),
            searchTerm: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            if (ctx.session.user.role !== 'admin') {
                throw new Error("Unauthorized");
            }

            const { page, limit, status, type, searchTerm } = input;
            const offset = (page - 1) * limit;

            const whereConditions = and(
                status ? eq(feedbacks.status, status) : undefined,
                type ? eq(feedbacks.type, type) : undefined,
                searchTerm
                    ? or(
                        ilike(feedbacks.title, `%${searchTerm}%`),
                        ilike(feedbacks.description, `%${searchTerm}%`)
                    )
                    : undefined
            );

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
                .orderBy(feedbacks.createdAt)
                .limit(limit)
                .offset(offset);

            const totalFeedbacksResult = await db.select({
                count: sql<number>`count(*)`.mapWith(Number),
            }).from(feedbacks).where(whereConditions);

            const totalFeedbacks = totalFeedbacksResult[0]?.count ?? 0;

            return {
                feedbacks: feedbackEntries,
                totalPages: Math.ceil(totalFeedbacks / limit),
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