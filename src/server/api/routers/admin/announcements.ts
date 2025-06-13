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
  // Accept any type for publishedAt and transform it to a Date object if needed
  publishedAt: z.any()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      // If it's already a Date, return it
      if (val instanceof Date) return val;
      // If it has a toDate method (DateValue objects), use it
      if (typeof val === 'object' && val !== null && typeof (val as any).toDate === 'function') {
        return new Date((val as any).toDate());
      }
      // Try to parse it as a date string
      try {
        return new Date(val);
      } catch (e) {
        return null;
      }
    }),
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
      const { translations, slug, ...announcementData } = input;

      // ✨ Proactively check if a slug already exists.
      const existingAnnouncement = await db.query.announcements.findFirst({
        where: eq(announcements.slug, slug),
        columns: {
          id: true,
        },
      });

      // If a record is found, throw a conflict error immediately.
      if (existingAnnouncement) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'ExistingSlugError',
        });
      }

      // Auto-set publication date if status is 'published' and no date is provided.
      if (announcementData.status === "published" && !announcementData.publishedAt) {
        announcementData.publishedAt = now();
      }

      try {
        // Use a database transaction to ensure all or nothing is inserted.
        return await db.transaction(async (tx) => {
          if (!session?.user?.id) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "UnauthorizedUser",
            });
          }

          // Insert the main announcement record.
          const [announcement] = await tx
            .insert(announcements)
            .values({
              ...announcementData,
              slug, // Add the slug back here
              authorId: session.user.id,
            })
            .returning();

          if (!announcement) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "FailedCreatingAnnouncement",
            });
          }

          // Prepare and insert translations.
          const enTranslationData = {
            announcementId: announcement.id,
            locale: "en" as const,
            title: translations.en.title,
            content: translations.en.content ?? null,
            excerpt: translations.en.excerpt ?? null,
          };

          const trTranslationData = {
            announcementId: announcement.id,
            locale: "tr" as const,
            title: translations.tr.title,
            content: translations.tr.content ?? null,
            excerpt: translations.tr.excerpt ?? null,
          };

          await tx.insert(announcementTranslations).values([enTranslationData, trTranslationData]);

          return announcement;
        });
      } catch (error) {
        // For all other errors, log the technical details on the server.
        console.error("Failed to create announcement:", error);

        // And provide a clean, generic error message to the client.
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "UnexpectedError",
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

        // Ensure publishedAt is a proper Date object if it exists
        if (announcementData.publishedAt && !(announcementData.publishedAt instanceof Date)) {
          try {
            announcementData.publishedAt = new Date(announcementData.publishedAt);
          } catch (e) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "InvalidDate",
            });
          }
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
          message: "FailedUpdatingAnnouncement",
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
            message: "AnnouncementNotFound",
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
          message: "FailedDeletingAnnouncement",
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
