import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../../trpc";
import { z } from "zod";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { announcements } from "@/db/schema/announcements";
import { announcementTranslations } from "@/db/schema/announcement_translations";

// Helper function to get current date
const now = () => new Date();

// Schema for individual language translations
const translationInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
});

// Schema for both English and Turkish translations
const announcementTranslationsInputSchema = z.object({
  en: translationInputSchema,
  tr: translationInputSchema,
});

// Base schema for announcement fields
const baseAnnouncementInputSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  imageUrl: z.string().url().optional().nullable(),
  actionUrl: z.string().url().optional().nullable(),
  actionTextKey: z.string().optional().nullable(),
  publishedAt: z.date().optional().nullable(),
});

export const adminAnnouncementsRouter = createTRPCRouter({
  createAnnouncement: adminProcedure
    .input(
      z.object({
        ...baseAnnouncementInputSchema.shape,
        translations: announcementTranslationsInputSchema,
      })
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const { translations, ...announcementData } = input;

      // Set publishedAt to now if status is published and publishedAt is not provided
      if (announcementData.status === "published" && !announcementData.publishedAt) {
        announcementData.publishedAt = now();
      }

      try {
        return await db.transaction(async (tx) => {
          // Insert the announcement
          const [announcement] = await tx
            .insert(announcements)
            .values({
              ...announcementData,
              authorId: session.user.id,
            })
            .returning();

          if (!announcement) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create announcement",
            });
          }

          // Insert English translation
          await tx.insert(announcementTranslations).values({
            announcementId: announcement.id,
            locale: "en",
            title: translations.en.title,
            content: translations.en.content || null,
            excerpt: translations.en.excerpt || null,
          });

          // Insert Turkish translation
          await tx.insert(announcementTranslations).values({
            announcementId: announcement.id,
            locale: "tr",
            title: translations.tr.title,
            content: translations.tr.content || null,
            excerpt: translations.tr.excerpt || null,
          });

          return announcement;
        });
      } catch (error) {
        console.error("Error creating announcement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create announcement",
        });
      }
    }),

  updateAnnouncement: adminProcedure
    .input(
      z.object({
        id: z.number(),
        ...baseAnnouncementInputSchema.partial().shape,
        translations: z.object({
          en: translationInputSchema.partial().optional(),
          tr: translationInputSchema.partial().optional(),
        }).partial(),
      })
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const { id, translations, ...announcementData } = input;

      // Handle publishedAt logic if status is changing to published
      if (announcementData.status === "published") {
        // Get the current announcement to check if status is changing
        const currentAnnouncement = await db
          .select({ status: announcements.status, publishedAt: announcements.publishedAt })
          .from(announcements)
          .where(eq(announcements.id, id))
          .limit(1);

        // If status is changing to published and publishedAt is not set, set it to now
        if (
          currentAnnouncement.length &&
          currentAnnouncement[0].status !== "published" &&
          !currentAnnouncement[0].publishedAt &&
          !announcementData.publishedAt
        ) {
          announcementData.publishedAt = now();
        }
      }

      try {
        return await db.transaction(async (tx) => {
          // Update the announcement
          if (Object.keys(announcementData).length > 0) {
            await tx
              .update(announcements)
              .set({
                ...announcementData,
                updatedAt: now(),
              })
              .where(eq(announcements.id, id));
          }

          // Update translations if provided
          if (translations) {
            // Update English translation if provided
            if (translations.en) {
              // Make sure title is not undefined
              const enTranslation = {
                title: translations.en.title ?? "", // Ensure title is not undefined
                content: translations.en.content ?? null,
                excerpt: translations.en.excerpt ?? null,
              };
              
              await tx
                .insert(announcementTranslations)
                .values({
                  announcementId: id,
                  locale: "en",
                  title: enTranslation.title,
                  content: enTranslation.content,
                  excerpt: enTranslation.excerpt,
                })
                .onConflictDoUpdate({
                  target: [announcementTranslations.announcementId, announcementTranslations.locale],
                  set: enTranslation,
                });
            }

            // Update Turkish translation if provided
            if (translations.tr) {
              // Make sure title is not undefined
              const trTranslation = {
                title: translations.tr.title ?? "", // Ensure title is not undefined
                content: translations.tr.content ?? null,
                excerpt: translations.tr.excerpt ?? null,
              };
              
              await tx
                .insert(announcementTranslations)
                .values({
                  announcementId: id,
                  locale: "tr",
                  title: trTranslation.title,
                  content: trTranslation.content,
                  excerpt: trTranslation.excerpt,
                })
                .onConflictDoUpdate({
                  target: [announcementTranslations.announcementId, announcementTranslations.locale],
                  set: trTranslation,
                });
            }
          }

          // Return the updated announcement
          const [updatedAnnouncement] = await tx
            .select()
            .from(announcements)
            .where(eq(announcements.id, id))
            .limit(1);

          return updatedAnnouncement;
        });
      } catch (error) {
        console.error("Error updating announcement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update announcement",
        });
      }
    }),

  deleteAnnouncement: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx: { db }, input }) => {
      try {
        // Delete the announcement (cascade will handle translations)
        const [deletedAnnouncement] = await db
          .delete(announcements)
          .where(eq(announcements.id, input.id))
          .returning();

        if (!deletedAnnouncement) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Announcement not found",
          });
        }

        return deletedAnnouncement;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error deleting announcement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete announcement",
        });
      }
    }),

  listAnnouncementsAdmin: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        status: z.enum(["all", "draft", "published", "archived"]).default("all"),
        search: z.string().optional(),
        orderBy: z.enum(["createdAt", "updatedAt", "publishedAt"]).default("createdAt"),
        orderDirection: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx: { db }, input }) => {
      const { page, limit, status, search, orderBy, orderDirection } = input;
      const offset = (page - 1) * limit;

      try {
        // Build the where clause based on filters
        let whereClause = undefined;
        
        if (status !== "all") {
          whereClause = eq(announcements.status, status);
        }

        // Add search filter if provided
        if (search && search.trim() !== "") {
          const searchFilter = ilike(announcements.slug, `%${search}%`);
          whereClause = whereClause ? and(whereClause, searchFilter) : searchFilter;
        }

        // Get announcements with pagination
        const items = await db
          .select({
            id: announcements.id,
            slug: announcements.slug,
            status: announcements.status,
            publishedAt: announcements.publishedAt,
            createdAt: announcements.createdAt,
            updatedAt: announcements.updatedAt,
          })
          .from(announcements)
          .where(whereClause)
          .orderBy(
            orderDirection === "asc" 
              ? asc(announcements[orderBy]) 
              : desc(announcements[orderBy])
          )
          .limit(limit)
          .offset(offset);

        // Count total for pagination
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(announcements)
          .where(whereClause);

        const totalCount = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        return {
          items,
          meta: {
            currentPage: page,
            totalPages,
            totalCount,
          },
        };
      } catch (error) {
        console.error("Error listing announcements:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list announcements",
        });
      }
    }),

  getAnnouncementForEdit: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx: { db }, input }) => {
      try {
        // Get the announcement
        const [announcement] = await db
          .select()
          .from(announcements)
          .where(eq(announcements.id, input.id))
          .limit(1);

        if (!announcement) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Announcement not found",
          });
        }

        // Get the translations
        const translations = await db
          .select()
          .from(announcementTranslations)
          .where(eq(announcementTranslations.announcementId, input.id));

        // Organize translations by locale
        const translationsByLocale = translations.reduce(
          (acc, translation) => {
            acc[translation.locale as "en" | "tr"] = {
              title: translation.title,
              content: translation.content,
              excerpt: translation.excerpt,
            };
            return acc;
          },
          {} as Record<"en" | "tr", { title: string; content: string | null; excerpt: string | null }>
        );

        return {
          ...announcement,
          translations: {
            en: translationsByLocale.en || null,
            tr: translationsByLocale.tr || null,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error fetching announcement for edit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch announcement",
        });
      }
    }),
});
