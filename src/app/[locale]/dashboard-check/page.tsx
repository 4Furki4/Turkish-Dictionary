"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { api, type RouterInputs, type RouterOutputs } from "@/src/trpc/react";
import Dashboard from "@/src/_pages/dashboard/dashboard";
import UserList from "@/src/_pages/dashboard/user-list/user-list";
import { DashboardOverview } from "@/src/_pages/dashboard/overview/dashboard-overview";
import { DASHBOARD_DAY_MS, type DashboardRange } from "@/src/server/api/schemas/dashboard";
import { compareDashboardMetric, getDashboardWindow } from "@/src/server/dashboard-window";
import type { SelectUser } from "@/db/schema/users";

type OverviewOutputs = RouterOutputs["admin"]["overview"];
const users = Array.from({ length: 53 }, (_, i) => ({
  id: String(i + 1), name: `Test User ${i + 1}`, email: `user${i + 1}@example.test`,
  username: i === 0 ? "a_very_long_username_to_check_mobile_table_containment" : `user${i + 1}`,
  role: "user", image: null,
})) as SelectUser[];

function previewOverview(selection?: DashboardRange): OverviewOutputs["getDashboardOverview"] {
  const generatedAt = new Date();
  const window = getDashboardWindow(selection, generatedAt);
  const dailySearches = Array.from({ length: window.days }, (_, i) => ({
    date: new Date(window.start.getTime() + i * DASHBOARD_DAY_MS).toISOString().slice(0, 10),
    count: 1200 + i * 150,
  }));
  const total = dailySearches.reduce((sum, day) => sum + day.count, 0);
  const authenticated = Math.round(total / 10);
  return {
    generatedAt, window,
    metrics: { totalWords: 123456, totalUsers: 2345, pendingRequests: 0, openFeedback: 0 },
    periodMetrics: {
      searches: compareDashboardMetric(total, Math.round(total * 0.8)),
      newUsers: compareDashboardMetric(window.days * 3, window.days * 2),
      submittedRequests: compareDashboardMetric(window.days * 2, window.days),
      resolvedRequests: compareDashboardMetric(window.days, window.days * 2),
    },
    searchAnalytics: {
      dailySearches,
      topSearchedWords: [{ wordId: 1, wordName: "merhaba", count: 3456 }, { wordId: 2, wordName: "cumhuriyet", count: 2345 }],
      actorSplit: { total, authenticated, anonymous: total - authenticated },
    },
  };
}

function previewLatency(input: RouterInputs["admin"]["overview"]["getWordQueryLatency"]): OverviewOutputs["getWordQueryLatency"] {
  const generatedAt = input?.asOf ?? new Date();
  const window = getDashboardWindow(input?.selection, generatedAt);
  const summary = { sampleCount: window.days * 20, averageMs: 240, p95Ms: 480 };
  const previous = { sampleCount: window.days * 18, averageMs: 300, p95Ms: 560 };
  return {
    generatedAt, window, summary, previous,
    comparison: {
      averageMs: compareDashboardMetric(summary.averageMs, previous.averageMs),
      p95Ms: compareDashboardMetric(summary.p95Ms, previous.p95Ms),
    },
    daily: Array.from({ length: window.days }, (_, i) => ({
      date: new Date(window.start.getTime() + i * DASHBOARD_DAY_MS).toISOString().slice(0, 10),
      sampleCount: 20, averageMs: 240, p95Ms: 480,
    })),
  };
}

function previewAttention(): OverviewOutputs["getNeedsAttention"] {
  return {
    generatedAt: new Date(), agingDays: 7,
    requests: { total: 0, aging: 0, items: [] },
    feedback: { total: 0, aging: 0, items: [] },
  };
}

function previewSearchGaps(input: RouterInputs["admin"]["searchGaps"]["list"]): RouterOutputs["admin"]["searchGaps"]["list"] {
  const generatedAt = input.asOf ?? new Date();
  const window = getDashboardWindow(input.selection, generatedAt);
  return {
    generatedAt, checkedAt: generatedAt, window,
    coverage: { firstRecordedDay: null, retainedFrom: new Date(generatedAt.getTime() - 90 * DASHBOARD_DAY_MS), effectiveStart: window.start, truncated: false },
    summary: { reported: 0, resolved: 0, noResult: 0, errors: 0, completed: 0, noResultRate: null },
    items: [], daily: [], total: 0, page: 1, pageSize: 5,
  };
}

export default function Check() {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30000 } } }));
  const [client] = useState(() => api.createClient({
    links: [() => ({ op }) => observable(observer => {
      const timer = setTimeout(() => {
        let data: unknown;
        switch (op.path) {
          case "user.getUsers": {
            const input = op.input as RouterInputs["user"]["getUsers"];
            const { skip = 0, take = 10 } = input;
            data = users.slice(skip, skip + take);
            break;
          }
          case "user.getUserCount": data = users.length; break;
          case "admin.overview.getDashboardOverview":
            data = previewOverview(op.input as DashboardRange | undefined); break;
          case "admin.overview.getWordQueryLatency":
            data = previewLatency(op.input as RouterInputs["admin"]["overview"]["getWordQueryLatency"]); break;
          case "admin.overview.getNeedsAttention": data = previewAttention(); break;
          case "admin.searchGaps.list": data = previewSearchGaps(op.input as RouterInputs["admin"]["searchGaps"]["list"]); break;
          default:
            observer.error(new TRPCClientError("This operation is unavailable in the dashboard preview."));
            return;
        }
        observer.next({ result: { data } });
        observer.complete();
      }, 100);
      return () => clearTimeout(timer);
    })],
  }));
  const [showOverview, setShowOverview] = useState(false);
  return (
    <api.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Dashboard locale={locale} showAdminTools>
          <Button className="mb-4" variant="flat" aria-pressed={showOverview} onPress={() => setShowOverview(!showOverview)}>
            {t("previewToggle")}
          </Button>
          {showOverview ? <DashboardOverview /> : <UserList users={users.slice(0, 10)} userCount={users.length} />}
        </Dashboard>
      </QueryClientProvider>
    </api.Provider>
  );
}
