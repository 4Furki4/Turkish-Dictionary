import { createTRPCRouter, protectedProcedure } from "@/src/server/api/trpc";
import { z } from "zod";
import { request_votes } from "@/db/schema/request_votes";
import { and, eq } from "drizzle-orm";

export const voteRouter = createTRPCRouter({
  toggleVote: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existingVote = await ctx.db.query.request_votes.findFirst({
        where: and(
          eq(request_votes.request_id, input.requestId),
          eq(request_votes.user_id, ctx.session.user.id)
        ),
      });

      if (existingVote) {
        await ctx.db
          .delete(request_votes)
          .where(
            and(
              eq(request_votes.request_id, input.requestId),
              eq(request_votes.user_id, ctx.session.user.id)
            )
          );
        return { voted: false };
      } else {
        await ctx.db.insert(request_votes).values({
          request_id: input.requestId,
          user_id: ctx.session.user.id,
        });
        return { voted: true };
      }
    }),
});
