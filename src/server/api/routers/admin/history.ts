import { adminProcedure, createTRPCRouter } from "../../trpc";
import { adminHistoryDetailSchema, adminHistoryInputSchema } from "../../schemas/admin-history";
import { getAdminHistory, getAdminHistoryDetail } from "@/src/server/admin-history";

export const adminHistoryRouter = createTRPCRouter({
  list: adminProcedure.input(adminHistoryInputSchema).query(({ ctx, input }) => getAdminHistory(ctx.db, input)),
  detail: adminProcedure.input(adminHistoryDetailSchema).query(({ ctx, input }) => getAdminHistoryDetail(ctx.db, input.id)),
});
