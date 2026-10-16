import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { NeedsAttention } from "../needs-attention";

const mockRefetch = jest.fn();
let mockQuery: { data?: unknown; isPending: boolean; isError: boolean; isFetching: boolean; refetch: typeof mockRefetch };
jest.mock("@/src/trpc/react", () => ({ api: { admin: { overview: { getNeedsAttention: { useQuery: () => mockQuery } } } } }));
jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}:${Object.values(values).join(",")}` : key,
}));
jest.mock("@heroui/react", () => ({
  Card: ({ children, "aria-labelledby": labelledBy }: { children: ReactNode; "aria-labelledby": string }) => <section aria-labelledby={labelledBy}>{children}</section>,
  CardBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Skeleton: () => <div />,
  Button: ({ children, onPress }: { children: ReactNode; onPress: () => void }) => <button onClick={onPress}>{children}</button>,
}));
jest.mock("@/src/i18n/routing", () => ({ Link: ({ children }: { children: ReactNode }) => <a href="#fixture">{children}</a> }));

const emptyData = {
  generatedAt: new Date("2026-10-15T10:00:00Z"),
  agingDays: 7,
  requests: { total: 0, aging: 0, items: [] },
  feedback: { total: 0, aging: 0, items: [] },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = { isPending: false, isError: false, isFetching: false, refetch: mockRefetch };
});

it("distinguishes loading from empty queues and failed requests", () => {
  mockQuery.isPending = true;
  const { rerender } = render(<NeedsAttention />);
  expect(screen.getByRole("status", { name: "loading" })).toBeVisible();
  expect(screen.queryByText("requestsEmpty")).not.toBeInTheDocument();
  mockQuery = { ...mockQuery, isPending: false, isError: true };
  rerender(<NeedsAttention />);
  expect(screen.getByRole("alert")).toHaveTextContent("error");
  fireEvent.click(screen.getByRole("button", { name: "retry" }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});

it("shows empty queues and links to their management screens", () => {
  mockQuery.data = emptyData;
  render(<NeedsAttention />);
  expect(screen.getByRole("region", { name: "title" })).toBeVisible();
  expect(screen.getByText("requestsEmpty")).toBeVisible();
  expect(screen.getByText("feedbackEmpty")).toBeVisible();
  expect(screen.getByRole("link", { name: "viewRequests" })).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("keeps the loaded queue when refresh fails and renders age against the response snapshot", () => {
  mockQuery = { ...mockQuery, isError: true, data: {
    ...emptyData,
    requests: { total: 1, aging: 1, items: [{ id: 31, entityType: "words", action: "create", waitingDays: 9 }] },
    feedback: { total: 1, aging: 0, items: [{ id: 42, title: "A missing pronunciation", type: "bug", waitingDays: 0 }] },
  } };
  render(<NeedsAttention />);
  expect(screen.getByRole("status")).toHaveTextContent("refreshError");
  expect(screen.getByRole("link", { name: /requestLabel:31/ })).toHaveTextContent("actions.create · entityTypes.words");
  expect(screen.getByText("waiting:9")).toBeVisible();
  expect(screen.getByRole("link", { name: /A missing pronunciation/ })).toHaveTextContent("waiting:0");
  expect(screen.getByText(/updatedAt:.*10:00/)).toBeVisible();
});
