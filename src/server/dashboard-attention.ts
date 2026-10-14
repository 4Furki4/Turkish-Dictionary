import type { db } from "@/db";
import { feedbacks } from "@/db/schema/feedbacks";
import { requests } from "@/db/schema/requests";
import { asc, count, eq, sql } from "drizzle-orm";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const AGING_DAYS = 7;
const PREVIEW_LIMIT = 5;

export async function getDashboardAttention(database: Pick<typeof db, "select">, now = new Date()) {
  const cutoff = new Date(now.getTime() - AGING_DAYS * DAY_IN_MS).toISOString();
  const [requestCounts, feedbackCounts, pendingRequests, openFeedback] = await Promise.all([
    database.select({
      total: count(),
      aging: sql<number>`count(*) filter (where ${requests.requestDate} <= ${cutoff})`.mapWith(Number),
    }).from(requests).where(eq(requests.status, "pending")),
    database.select({
      total: count(),
      aging: sql<number>`count(*) filter (where ${feedbacks.createdAt} <= ${cutoff})`.mapWith(Number),
    }).from(feedbacks).where(eq(feedbacks.status, "open")),
    database.select({
      id: requests.id,
      entityType: requests.entityType,
      action: requests.action,
      createdAt: requests.requestDate,
    }).from(requests).where(eq(requests.status, "pending"))
      .orderBy(asc(requests.requestDate), asc(requests.id)).limit(PREVIEW_LIMIT),
    database.select({
      id: feedbacks.id,
      title: feedbacks.title,
      type: feedbacks.type,
      createdAt: feedbacks.createdAt,
    }).from(feedbacks).where(eq(feedbacks.status, "open"))
      .orderBy(asc(feedbacks.createdAt), asc(feedbacks.id)).limit(PREVIEW_LIMIT),
  ]);
  const waitingDays = (createdAt: Date) => Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / DAY_IN_MS));

  return {
    generatedAt: now,
    agingDays: AGING_DAYS,
    requests: {
      total: requestCounts[0]?.total ?? 0,
      aging: requestCounts[0]?.aging ?? 0,
      items: pendingRequests.map(item => ({ ...item, waitingDays: waitingDays(item.createdAt) })),
    },
    feedback: {
      total: feedbackCounts[0]?.total ?? 0,
      aging: feedbackCounts[0]?.aging ?? 0,
      items: openFeedback.map(item => ({ ...item, waitingDays: waitingDays(item.createdAt) })),
    },
  };
}
