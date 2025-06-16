import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/src/server/api/trpc";
import { and, desc, eq, sql } from "drizzle-orm";
import { feedbacks, feedbackTypeEnum } from "@/db/schema/feedbacks";
import { feedbackVotes } from "@/db/schema/feedback_votes";
import { users } from "@/db/schema/users"; // Import the users schema
import { verifyRecaptcha } from "@/src/lib/recaptcha";
import { TRPCError } from "@trpc/server";

export const feedbackRouter = createTRPCRouter({
    /**
     * Creates a new feedback submission. Only authenticated users can perform this action.
     */
    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(5, "Error.titleMinLength"),
                description: z.string().min(10, "Error.descriptionMinLength"),
                type: z.enum(feedbackTypeEnum.enumValues),
                captchaToken: z.string(),
            })
        )
        .mutation(async ({ ctx: { db, session }, input }) => {
            const { captchaToken, ...feedbackData } = input;

            // ✨ Verify the token before proceeding
            const { success, score } = await verifyRecaptcha(captchaToken);
            console.log(success, score);
            if (!success) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Error.captchaFailed',
                });
            }

            // If verification is successful, create the feedback
            await db.insert(feedbacks).values({
                ...feedbackData,
                userId: session.user.id,
            });
        }),

    /**
     * Toggles a vote on a feedback item for the logged-in user.
     */
    vote: protectedProcedure
        .input(z.object({ feedbackId: z.number() }))
        .mutation(async ({ ctx: { db, session }, input }) => {
            const { feedbackId } = input;
            const { id: userId } = session.user;

            const existingVote = await db.query.feedbackVotes.findFirst({
                where: and(
                    eq(feedbackVotes.userId, userId),
                    eq(feedbackVotes.feedbackId, feedbackId)
                ),
            });

            if (existingVote) {
                await db
                    .delete(feedbackVotes)
                    .where(eq(feedbackVotes.id, existingVote.id));
                return { voted: false };
            } else {
                await db.insert(feedbackVotes).values({ feedbackId, userId });
                return { voted: true };
            }
        }),

    /**
     * Lists all feedback submissions, ordered by the most recent.
     * Includes vote counts and indicates if the current user has voted.
     */
    list: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.number().nullish(),
            })
        )
        .query(async ({ ctx: { db, session }, input }) => {
            const limit = input.limit ?? 10;
            const { cursor } = input;
            const userId = session?.user?.id;

            const voteCounts = db
                .select({
                    feedbackId: feedbackVotes.feedbackId,
                    count: sql<number>`count(*)`.as("count"),
                })
                .from(feedbackVotes)
                .groupBy(feedbackVotes.feedbackId)
                .as("vote_counts");

            const items = await db
                .select({
                    feedback: feedbacks,
                    // ✨ Correctly select from the joined 'users' table
                    user: {
                        id: users.id,
                        name: users.name,
                        image: users.image,
                    },
                    voteCount: sql<number>`COALESCE(${voteCounts.count}, 0)`,
                    hasVoted: userId
                        ? sql<boolean>`EXISTS (SELECT 1 FROM feedback_votes WHERE feedback_votes.feedback_id = feedbacks.id AND feedback_votes.user_id = ${userId})`
                        : sql<boolean>`false`,
                })
                .from(feedbacks)
                .leftJoin(voteCounts, eq(feedbacks.id, voteCounts.feedbackId))
                // ✨ Correctly join the 'users' table on the user ID
                .leftJoin(users, eq(feedbacks.userId, users.id))
                .orderBy(desc(feedbacks.createdAt))
                .where(cursor ? sql`feedbacks.id < ${cursor}` : undefined)
                .limit(limit + 1); // Fetch one extra item to determine if there's a next page

            let nextCursor: typeof cursor | undefined = undefined;
            if (items.length > limit) {
                const lastItem = items.pop();
                nextCursor = lastItem!.feedback.id;
            }

            return {
                items,
                nextCursor,
            };
        }),
});
