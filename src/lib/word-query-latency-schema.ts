import { z } from "zod";

export const MAX_WORD_QUERY_LATENCY_MS = 120_000;

// No word, account, device or client timestamp is accepted by this boundary.
export const wordQueryLatencyInputSchema = z.object({
  eventId: z.string().uuid(),
  durationMs: z.number().int().min(0).max(MAX_WORD_QUERY_LATENCY_MS),
  source: z.enum(["online", "offline"]),
}).strict();

export type WordQueryLatencyInput = z.infer<typeof wordQueryLatencyInputSchema>;
