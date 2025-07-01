import { createTRPCRouter, protectedProcedure } from "@/src/server/api/trpc";
import { z } from "zod";
import { request_votes } from "@/db/schema/request_votes";
import { and, eq } from "drizzle-orm";

export const voteRouter = createTRPCRouter({
  toggleVote: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      voteType: z.enum(['up', 'down']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { requestId, voteType } = input;
      const userId = ctx.session.user.id;
      const voteValue = voteType === 'up' ? 1 : -1;

      const existingVote = await ctx.db.query.request_votes.findFirst({
        where: and(
          eq(request_votes.request_id, requestId),
          eq(request_votes.user_id, userId)
        ),
      });

      if (existingVote) {
        if (existingVote.vote_type === voteValue) {
          // User is toggling off their existing vote
          await ctx.db.delete(request_votes).where(eq(request_votes.id, existingVote.id));
          return { newVoteState: null };
        } else {
          // User is changing their vote
          await ctx.db.update(request_votes).set({ vote_type: voteValue }).where(eq(request_votes.id, existingVote.id));
          return { newVoteState: voteValue };
        }
      } else {
        // New vote
        await ctx.db.insert(request_votes).values({
          request_id: requestId,
          user_id: userId,
          vote_type: voteValue,
        });
        return { newVoteState: voteValue };
      }
    }),
});
