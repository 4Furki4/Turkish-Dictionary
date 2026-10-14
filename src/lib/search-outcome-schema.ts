import { z } from "zod";

export const SEARCH_OUTCOME_RETENTION_DAYS = 90;
export const MAX_SEARCH_OUTCOME_QUERY_LENGTH = 100;
export const searchOutcomeNames = ["resolved", "no_result", "error", "cancelled", "superseded"] as const;
export const searchOutcomeSources = ["online", "offline"] as const;
export const searchOutcomeEntryPoints = ["search", "navbar"] as const;

export const normalizeOutcomeQuery = (query: string) => query.normalize("NFC")
  .trim().replace(/\p{Zs}+/gu, " ").replace(/’/g, "'").toLocaleLowerCase("tr");

// Accept dictionary terms/patterns, not unrestricted text. Reject, rather than
// redact, contact details, URLs, digits, markup, control and format characters.
export const outcomeQuerySchema = z.string().min(1).max(MAX_SEARCH_OUTCOME_QUERY_LENGTH)
  .regex(/^[\p{L}\p{M}\p{Zs}'’_\-]+$/u)
  .transform(normalizeOutcomeQuery)
  .refine(query => /\p{L}/u.test(query), "A dictionary term is required");

export const searchOutcomeInputSchema = z.object({
  eventId: z.string().uuid(),
  query: outcomeQuerySchema,
  locale: z.enum(["tr", "en"]),
  entryPoint: z.enum(searchOutcomeEntryPoints),
  source: z.enum(searchOutcomeSources),
  outcome: z.enum(searchOutcomeNames),
  resultCount: z.number().int().min(0).max(1000),
}).strict().superRefine((input, ctx) => {
  if ((input.outcome === "resolved") !== (input.resultCount > 0)) {
    ctx.addIssue({ code: "custom", path: ["resultCount"], message: "Only resolved attempts have results" });
  }
});

export type SearchOutcomeInput = z.infer<typeof searchOutcomeInputSchema>;
