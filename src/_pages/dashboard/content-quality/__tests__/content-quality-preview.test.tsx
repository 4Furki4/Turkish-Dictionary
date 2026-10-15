import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContentQualityPreview } from "../content-quality-preview";
import type { ContentQualityData } from "../types";
import { getDashboardWindow } from "@/src/server/dashboard-window";

const refetch = jest.fn();
let mockQuery: { data?: ContentQualityData; isPending: boolean; isError: boolean; refetch: typeof refetch };
jest.mock("@/src/trpc/react", () => ({ api: { admin: { contentQuality: { list: { useQuery: () => mockQuery } } } } }));
jest.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
jest.mock("@heroui/react", () => ({ Button: ({ children, onPress }: { children: ReactNode; onPress(): void }) => <button onClick={onPress}>{children}</button> }));
jest.mock("@/src/i18n/routing", () => ({ Link: ({ children, href }: { children: ReactNode; href: { pathname: string; query?: Record<string, string> } }) => <a href={`${href.pathname}?${new URLSearchParams(href.query)}`}>{children}</a> }));
const asOf = new Date("2026-10-15T00:00:00Z");
const selection = { range: "custom" as const, start: "2026-10-12", end: "2026-10-13" };
const empty: ContentQualityData = {
  generatedAt: asOf, checkedAt: asOf, window: getDashboardWindow(selection, asOf),
  summary: { words: 0, needsWork: 0, matching: 0, searches: 0, meaning: 0, pronunciation: 0, examples: 0, source: 0, etymology: 0 },
  total: 0, items: [], page: 1, pageSize: 5,
};
beforeEach(() => { jest.clearAllMocks(); mockQuery = { isPending: false, isError: false, refetch }; });

test("loading does not pretend the queue is empty", () => {
  mockQuery.isPending = true;
  render(<ContentQualityPreview selection={selection} asOf={asOf} />);
  expect(screen.getByRole("status")).toHaveTextContent("loading");
  expect(screen.queryByText("empty")).not.toBeInTheDocument();
});
test("initial failures offer independent retry and preserve the overview date range", () => {
  mockQuery.isError = true;
  render(<ContentQualityPreview selection={selection} asOf={asOf} />);
  expect(screen.getByRole("alert")).toHaveTextContent("errors.load");
  fireEvent.click(screen.getByRole("button", { name: "actions.retry" }));
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("link", { name: "preview.viewAll" })).toHaveAttribute("href", "/dashboard/content-quality?range=custom&start=2026-10-12&end=2026-10-13");
});
test("a completed empty check displays the empty queue and measurement limits", () => {
  mockQuery.data = empty;
  render(<ContentQualityPreview selection={selection} asOf={asOf} />);
  expect(screen.getByText("empty")).toBeVisible();
  expect(screen.getByText("coverage.audio")).toBeVisible();
});
test("failed refresh keeps the last rows and existing editor links", () => {
  mockQuery = { ...mockQuery, isError: true, data: { ...empty, total: 1, items: [{ id: 42, name: "kitap", variant: 0, searches: 3, meaningCount: 0, withoutExamples: 0, meaning: true, pronunciation: true, examples: false, source: true, etymology: true }] } };
  render(<ContentQualityPreview selection={selection} asOf={asOf} />);
  expect(screen.getByRole("status")).toHaveTextContent("errors.refresh");
  expect(screen.getByRole("heading", { name: "kitap" })).toBeVisible();
  expect(screen.getByRole("link", { name: "actions.manage" })).toHaveAttribute("href", "/dashboard/word-list?search=kitap");
});
