import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminHistory, EventChanges } from "../admin-history";
import { getDashboardWindow } from "@/src/server/dashboard-window";
import type { RouterOutputs } from "@/src/trpc/react";

const refetch = jest.fn();
type Data = RouterOutputs["admin"]["history"]["list"];
type Detail = RouterOutputs["admin"]["history"]["detail"];
let mockQuery: { data?: Data; isPending: boolean; isError: boolean; isFetching: boolean; refetch: typeof refetch };
let mockDetail: { data?: Detail; isPending: boolean; isError: boolean; refetch: typeof refetch };
jest.mock("@/src/trpc/react", () => ({ api: { admin: { history: { list: { useQuery: () => mockQuery }, detail: { useQuery: () => mockDetail } } } } }));
jest.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => Object.assign((key: string) => key, { has: () => false }) }));
jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
jest.mock("@/src/hooks/use-progress-router", () => ({ useProgressRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/src/i18n/routing", () => ({ getPathname: () => "/dashboard/history", Link: ({ children, href }: { children: ReactNode; href: { pathname: string } }) => <a href={href.pathname}>{children}</a> }));
jest.mock("@heroui/react", () => ({ Button: ({ children, onPress, isDisabled }: { children: ReactNode; onPress(): void; isDisabled?: boolean }) => <button onClick={onPress} disabled={isDisabled}>{children}</button> }));
jest.mock("@/src/components/customs/heroui/custom-input", () => ({ CustomInput: () => <input /> }));
jest.mock("@/src/components/customs/heroui/custom-select", () => ({ CustomSelect: () => <select /> }));
jest.mock("../../overview/dashboard-range-filter", () => ({ DashboardRangeFilter: () => <div>range</div> }));

const at = new Date("2026-10-15T12:00:00Z");
const empty: Data = { generatedAt: at, window: getDashboardWindow({ range: "30d" }, at), retainedFrom: new Date("2025-10-15"), collectionStartedAt: at,
  coveredProcedures: [], excludedProcedures: [], items: [], total: 0, page: 1, pageSize: 10 };
beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = { isPending: false, isError: false, isFetching: false, refetch };
  mockDetail = { isPending: false, isError: false, refetch };
});
test("loading makes no claim that history is empty or recording has not started", () => {
  mockQuery.isPending = true;
  render(<AdminHistory referenceTime={at} />);
  expect(screen.getByRole("status")).toHaveTextContent("loading");
  expect(screen.queryByText("noHistory")).not.toBeInTheDocument();
  expect(screen.queryByText("notStarted")).not.toBeInTheDocument();
});
test("initial failure offers retry without inventing a zero result", () => {
  mockQuery.isError = true;
  render(<AdminHistory referenceTime={at} />);
  expect(screen.getByRole("alert")).toHaveTextContent("errors.load");
  fireEvent.click(screen.getByRole("button", { name: "actions.retry" }));
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("empty")).not.toBeInTheDocument();
});
test("no first event is distinct from an empty filtered history", () => {
  mockQuery.data = { ...empty, collectionStartedAt: null };
  const view = render(<AdminHistory referenceTime={at} />);
  expect(screen.getByText("noHistory")).toBeVisible();
  view.unmount();
  mockQuery.data = empty;
  render(<AdminHistory referenceTime={at} />);
  expect(screen.getByText("empty")).toBeVisible();
});
test("refresh failure preserves the last recorded event", () => {
  mockQuery = { ...mockQuery, isError: true, data: { ...empty, total: 1, items: [{ id: 42, actorId: "actor", actorLabel: "Reviewer", occurredAt: at, action: "update", targetType: "word", targetId: "12", targetLabel: "kept target", requestId: null, truncated: 0 }] } };
  render(<AdminHistory referenceTime={at} />);
  expect(screen.getByRole("status")).toHaveTextContent("errors.refresh");
  expect(screen.getByRole("heading", { name: /kept target/ })).toBeVisible();
});
test("detail failure has an independent retry", () => {
  mockDetail.isError = true;
  render(<EventChanges id={42} open />);
  expect(screen.getByRole("alert")).toHaveTextContent("errors.detail");
  fireEvent.click(screen.getByRole("button", { name: "actions.retry" }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
test("a pruned event is unavailable rather than a fabricated empty diff", () => {
  mockDetail.data = null;
  render(<EventChanges id={42} open />);
  expect(screen.getByText("details.unavailable")).toBeVisible();
  expect(screen.queryByText("details.noChanges")).not.toBeInTheDocument();
});
test("bounded diff values remain plain text and truncation is visible", () => {
  mockDetail.data = { id: 42, occurredAt: at, actorId: "actor", actorLabel: "Reviewer", action: "update", procedure: "admin.editWord", targetType: "word", targetId: "12", targetLabel: "entry", requestId: null, truncated: 1, changes: [{ field: "name", before: "old", after: "<script>not executable</script>" }] };
  render(<EventChanges id={42} open />);
  expect(screen.getByText("details.truncated")).toBeVisible();
  expect(screen.getByText("<script>not executable</script>")).toBeVisible();
});
