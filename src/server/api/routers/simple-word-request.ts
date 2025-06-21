import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { simpleWordRequests } from "@/db/schema/simple_word_requests";
import { verifyRecaptcha } from "@/src/lib/recaptcha";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";

export const simpleWordRequestRouter = createTRPCRouter({
  // Create a simple word request (can be anonymous)
  createSimpleWordRequest: publicProcedure
    .input(z.object({
      wordName: z.string().min(1).max(100),
      locale: z.string().default("tr"),
      captchaToken: z.string(),
    }))
    .mutation(async ({ input, ctx: { db, session } }) => {
      const { wordName, locale, captchaToken } = input;
      
      // Verify reCAPTCHA
      const { success } = await verifyRecaptcha(captchaToken);
      if (!success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "captchaFailed",
        });
      }

      // Check if the word already exists in simple requests (prevent duplicates)
      const existingRequest = await db.select()
        .from(simpleWordRequests)
        .where(eq(simpleWordRequests.wordName, wordName.toLowerCase().trim()))
        .limit(1);

      if (existingRequest.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "wordAlreadyRequested",
        });
      }

      // Create the simple word request
      const [newRequest] = await db.insert(simpleWordRequests).values({
        wordName: wordName.toLowerCase().trim(),
        locale,
        userId: session?.user?.id || null,
      }).returning();

      return newRequest;
    }),

  // Get user's simple word requests (protected)
  getUserSimpleWordRequests: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx: { db, session: { user } } }) => {
      const { page, limit } = input;
      const offset = (page - 1) * limit;

      const userRequests = await db.select()
        .from(simpleWordRequests)
        .where(eq(simpleWordRequests.userId, user.id))
        .orderBy(desc(simpleWordRequests.createdAt))
        .limit(limit)
        .offset(offset);

      return userRequests;
    }),
});
