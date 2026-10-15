import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { DashboardOverview } from "../dashboard-overview";
import type { RouterOutputs } from "@/src/trpc/react";
import { compareDashboardMetric, getDashboardWindow } from "@/src/server/dashboard-window";

let mockLocale = "tr";
const mockOverview: RouterOutputs["admin"]["overview"]["getDashboardOverview"] = {
  generatedAt: new Date("2026-10-13T10:00:00Z"),
  window: getDashboardWindow({ range: "30d" }, new Date("2026-10-13T10:00:00Z")),
  metrics: { totalWords: 123456, totalUsers: 1234, pendingRequests: 7, openFeedback: 8 },
  periodMetrics: {
    searches: compareDashboardMetric(1, 0),
    newUsers: compareDashboardMetric(2, 1),
    submittedRequests: compareDashboardMetric(3, 2),
    resolvedRequests: compareDashboardMetric(4, 3),
  },
  searchAnalytics: {
    dailySearches: [{ date: "2026-10-13", count: 1 }],
    topSearchedWords: [],
    actorSplit: { total: 1, authenticated: 1, anonymous: 0 },
  },
};

jest.mock("@/src/trpc/react", () => ({ api: { admin: { overview: { getDashboardOverview: { useSuspenseQuery: () => [mockOverview] } } } } }));
jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
jest.mock("next-intl", () => ({
  useLocale: () => mockLocale,
  useTranslations: () => (key: string, values?: { date: string }) => values?.date ?? key,
}));
jest.mock("@heroui/react", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Chip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/ui/chart", () => ({ ChartContainer: () => null, ChartTooltipContent: () => null }));
jest.mock("@/src/i18n/routing", () => ({ Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("../word-query-latency-chart", () => ({ WordQueryLatencyChart: () => null }));
jest.mock("../dashboard-range-filter", () => ({ DashboardRangeFilter: () => null }));
jest.mock("../needs-attention", () => ({ NeedsAttention: () => null }));
jest.mock("../../search-gaps/search-gap-preview", () => ({ SearchGapPreview: () => null }));

it.each([
  ["tr", "123.456", "1.234", "10:00 UTC"],
  ["en", "123,456", "1,234", "10:00 AM UTC"],
])("formats %s metrics and the UTC timestamp independently of host defaults", (locale, words, users, time) => {
  mockLocale = locale;
  render(<DashboardOverview />);
  expect(screen.getByText(words)).toBeVisible();
  expect(screen.getByText(users)).toBeVisible();
  expect(screen.getByText(new RegExp(time))).toBeVisible();
});
