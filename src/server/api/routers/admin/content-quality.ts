import { adminProcedure, createTRPCRouter } from "../../trpc";
import { contentQualityInputSchema } from "../../schemas/content-quality";
import { getContentQuality } from "@/src/server/content-quality";

export const contentQualityAdminRouter = createTRPCRouter({
  list: adminProcedure.input(contentQualityInputSchema).query(({ ctx, input }) => getContentQuality(ctx.db, input)),
});
