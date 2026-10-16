import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SearchGapPreview } from "../search-gap-preview";
import type { SearchGapsData } from "../types";
import { getDashboardWindow } from "@/src/server/dashboard-window";

const refetch = jest.fn();
let mockQuery: { data?: SearchGapsData; isPending: boolean; isError: boolean; refetch: typeof refetch };
jest.mock("@/src/trpc/react", () => ({ api: { admin: { searchGaps: { list: { useQuery: () => mockQuery } } } } }));
jest.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
jest.mock("@heroui/react", () => ({ Button: ({ children, onPress }: { children: ReactNode; onPress(): void }) => <button onClick={onPress}>{children}</button> }));
jest.mock("@/src/i18n/routing", () => ({ Link: ({ children, href }: { children: ReactNode; href: { pathname: string; query: Record<string, string> } }) => <a href={`${href.pathname}?${new URLSearchParams(href.query)}`}>{children}</a> }));
const asOf = new Date("2026-10-15T00:00:00Z");
const selection = { range: "custom" as const, start: "2026-10-12", end: "2026-10-13" };
const empty: SearchGapsData = {
  generatedAt: asOf, checkedAt: asOf, window: getDashboardWindow(selection, asOf),
  summary: { reported: 0, resolved: 0, noResult: 0, completed: 0, errors: 0, noResultRate: null },
  coverage: { firstRecordedDay: null, retainedFrom: new Date("2026-07-17T00:00:00Z"), effectiveStart: new Date("2026-10-12T00:00:00Z"), truncated: false },
  total: 0, items: [], daily: [], page: 1, pageSize: 5,
};
beforeEach(() => { jest.clearAllMocks(); mockQuery = { isPending: false, isError: false, refetch }; });

test("pending collection is distinct from empty data", () => {
  mockQuery.isPending = true;
  render(<SearchGapPreview selection={selection} asOf={asOf} />);
  expect(screen.getByRole("status")).toHaveTextContent("loading");
  expect(screen.queryByText("empty.noReports")).not.toBeInTheDocument();
});

test("initial failures have independent retry and preserve the overview link's date range", () => {
  mockQuery.isError = true;
  render(<SearchGapPreview selection={selection} asOf={asOf} />);
  expect(screen.getByRole("alert")).toHaveTextContent("errors.load");
  fireEvent.click(screen.getByRole("button", { name: "actions.retry" }));
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("link", { name: "preview.viewAll" })).toHaveAttribute("href", "/dashboard/search-gaps?range=custom&start=2026-10-12&end=2026-10-13");
});

test("a fresh installation reports absent coverage rather than inventing a zero rate", () => {
  mockQuery.data = empty;
  render(<SearchGapPreview selection={selection} asOf={asOf} />);
  expect(screen.getByText("empty.noReports")).toBeVisible();
  expect(screen.getByText("coverage.notStarted")).toBeVisible();
  expect(screen.queryByText("0%")).not.toBeInTheDocument();
});

test("a failed refresh retains the last gaps and states that rechecks failed", () => {
  mockQuery = { ...mockQuery, isError: true, data: { ...empty, total: 1,
    summary: { ...empty.summary, reported: 1, noResult: 1, completed: 1, noResultRate: 1 },
    items: [{ query: "kitap", frequency: 1, firstSeen: asOf, lastSeen: asOf, status: "open", reviewedAt: null, targetType: null, targetId: null, currentWord: null, correction: null, linkedWordName: null, daily: [] }],
  } };
  render(<SearchGapPreview selection={selection} asOf={asOf} />);
  expect(screen.getByRole("status")).toHaveTextContent("errors.refresh");
  expect(screen.getByRole("link", { name: "kitap" })).toBeVisible();
});
