import { adminProcedure, createTRPCRouter } from "../../trpc";
import { searchGapReviewSchema, searchGapsInputSchema } from "../../schemas/search-gaps";
import { getSearchGaps, reviewSearchGap } from "@/src/server/search-gaps";

export const searchGapsAdminRouter = createTRPCRouter({
  list: adminProcedure.input(searchGapsInputSchema).query(({ ctx, input }) => getSearchGaps(ctx.db, input)),
  review: adminProcedure.input(searchGapReviewSchema)
    .mutation(({ ctx, input }) => reviewSearchGap(ctx.db, input, ctx.session.user.id)),
});
