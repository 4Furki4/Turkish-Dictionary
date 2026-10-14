import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { WordQueryLatencyChart } from "../word-query-latency-chart";

const mockRefetch = jest.fn();
let mockQuery: { data?: unknown; isPending: boolean; isError: boolean; refetch: typeof mockRefetch };
jest.mock("@/src/trpc/react", () => ({ api: { admin: { overview: { getWordQueryLatency: { useQuery: () => mockQuery } } } } }));
jest.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
jest.mock("@heroui/react", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Button: ({ children, onPress }: { children: ReactNode; onPress: () => void }) => <button onClick={onPress}>{children}</button>,
}));
jest.mock("@/components/ui/chart", () => ({
  ChartContainer: (props: { "aria-label": string }) => <div role="img" aria-label={props["aria-label"]} />,
  ChartTooltipContent: () => null,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = { isPending: false, isError: false, refetch: mockRefetch };
});

it("distinguishes loading from the empty collection state", () => {
  mockQuery.isPending = true;
  const { rerender } = render(<WordQueryLatencyChart />);
  expect(screen.getByRole("status")).toHaveTextContent("loading");
  mockQuery = { ...mockQuery, isPending: false, data: { daily: [], generatedAt: new Date("2026-10-15T10:00:00Z"), summary: { sampleCount: 0, averageMs: null, p95Ms: null }, previous: { sampleCount: 0 }, comparison: { averageMs: { current: null, previous: null }, p95Ms: { current: null, previous: null } } } };
  rerender(<WordQueryLatencyChart />);
  expect(screen.getByText("empty")).toBeVisible();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

it("an initial error offers recovery without showing empty data", () => {
  mockQuery.isError = true;
  render(<WordQueryLatencyChart />);
  expect(screen.getByRole("alert")).toHaveTextContent("error");
  fireEvent.click(screen.getByRole("button", { name: "retry" }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("empty")).not.toBeInTheDocument();
});

it("keeps the last chart and daily table visible when a refresh fails", () => {
  mockQuery = { ...mockQuery, isError: true, data: {
    generatedAt: new Date("2026-10-13T10:00:00Z"),
    summary: { sampleCount: 2, averageMs: 150, p95Ms: 195 },
    previous: { sampleCount: 0, averageMs: null, p95Ms: null },
    comparison: {
      averageMs: { current: 150, previous: null, difference: null, percentChange: null },
      p95Ms: { current: 195, previous: null, difference: null, percentChange: null },
    },
    daily: [
      { date: "2026-10-12", sampleCount: 0, averageMs: null, p95Ms: null },
      { date: "2026-10-13", sampleCount: 2, averageMs: 150, p95Ms: 195 },
    ],
  } };
  render(<WordQueryLatencyChart />);
  expect(screen.getByRole("status")).toHaveTextContent("refreshError");
  expect(screen.getByRole("img", { name: "chartLabel" })).toBeVisible();
  fireEvent.click(screen.getByText("viewData"));
  expect(screen.getByRole("table")).toBeVisible();
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getAllByText("—")).toHaveLength(2);
});
