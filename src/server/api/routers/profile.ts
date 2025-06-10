import { z } from "zod";
import { eq, and, not } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { users } from "@/db/schema/users";
import { TRPCError } from "@trpc/server";

export const profileRouter = createTRPCRouter({
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters long.").optional(),
        username: z.string().min(3, "Username must be at least 3 characters long.").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, username } = input;
      const userId = ctx.session.user.id;

      if (!name && !username) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least one field (name or username) must be provided to update.",
        });
      }

      // If username is being updated, check for uniqueness
      if (username) {
        const existingUser = await ctx.db.query.users.findFirst({
          where: and(
            eq(users.username, username),
            not(eq(users.id, userId)) // Exclude the current user
          ),
        });

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This username is already taken. Please choose another one.",
          });
        }
      }

      // Prepare the data for update
      const updateData: { name?: string; username?: string, updatedAt: Date } = {
        updatedAt: new Date(),
      };
      if (name) {
        updateData.name = name;
      }
      if (username) {
        updateData.username = username;
      }

      // Perform the update
      await ctx.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      return {
        success: true,
        message: "Profile updated successfully.",
      };
    }),
});
