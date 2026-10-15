"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api } from "@/src/trpc/react";
import { Link, getPathname } from "@/src/i18n/routing";
import { useProgressRouter } from "@/src/hooks/use-progress-router";
import { CustomInput } from "@/src/components/customs/heroui/custom-input";
import { CustomSelect } from "@/src/components/customs/heroui/custom-select";
import { DashboardRangeFilter } from "../overview/dashboard-range-filter";
import { readDashboardRange } from "@/src/server/api/schemas/dashboard";
import { getDashboardWindow } from "@/src/server/dashboard-window";
import { AUDIT_ACTIONS, AUDIT_TARGETS, readAdminHistoryFilters, type AdminHistoryFilters } from "@/src/server/api/schemas/admin-history";
import type { AuditValue } from "@/db/schema/admin_audit";
import type { RouterOutputs } from "@/src/trpc/react";

function valueText(value: AuditValue) {
  return value === null ? "—" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}

export function EventChanges({ id, open }: { id: number; open: boolean }) {
  const t = useTranslations("Dashboard.adminHistory");
  const query = api.admin.history.detail.useQuery({ id }, { enabled: open, retry: false, staleTime: 0 });
  if (!open) return null;
  if (query.isError) return <div role="alert" className="flex flex-wrap items-center gap-3 py-4"><p className="text-sm">{t("errors.detail")}</p><Button size="sm" variant="flat" onPress={() => { void query.refetch(); }}>{t("actions.retry")}</Button></div>;
  if (query.isPending) return <p role="status" className="py-4 text-sm text-muted-foreground">{t("details.loading")}</p>;
  if (!query.data) return <p className="py-4 text-sm text-muted-foreground">{t("details.unavailable")}</p>;
  const event = query.data;
  return <div className="space-y-4 py-4" data-testid="audit-detail">
    {event.truncated ? <p className="text-sm text-muted-foreground">{t("details.truncated")}</p> : null}
    {!event.changes.length ? <p className="text-sm text-muted-foreground">{t("details.noChanges")}</p> : <dl className="divide-y divide-border/60">
      {event.changes.map(change => <div key={change.field} className="grid min-w-0 gap-3 py-4 sm:grid-cols-[minmax(7rem,1fr)_minmax(0,2fr)_minmax(0,2fr)]">
        <dt className="break-words text-sm font-medium">{t.has(`fields.${change.field}`) ? t(`fields.${change.field}`) : change.field}</dt>
        {(["before", "after"] as const).map(side => <dd key={side} className="min-w-0"><p className="mb-1 text-xs text-muted-foreground">{t(`details.${side}`)}</p><pre className="max-w-full whitespace-pre-wrap break-words font-sans text-sm [overflow-wrap:anywhere]">{valueText(change[side])}</pre></dd>)}
      </div>)}
    </dl>}
    {event.requestId ? <Link className="inline-block rounded-sm text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary" href={{ pathname: "/dashboard/requests/[id]", params: { id: String(event.requestId) } }}>{t("actions.request")}</Link> : null}
    {event.targetType === "word" ? <Link className="inline-block rounded-sm text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary" href={{ pathname: "/dashboard/word-list", query: { search: event.targetLabel } }}>{t("actions.word")}</Link> : null}
  </div>;
}

function HistoryFilters({ filters, apply }: { filters: AdminHistoryFilters; apply(values: Partial<AdminHistoryFilters>): void }) {
  const t = useTranslations("Dashboard.adminHistory");
  const [actorId, setActorId] = useState(filters.actorId);
  const [targetId, setTargetId] = useState(filters.targetId);
  const [targetType, setTargetType] = useState(filters.targetType);
  const [action, setAction] = useState(filters.action);
  const [pageSize, setPageSize] = useState(String(filters.pageSize));
  const inputClasses = { inputWrapper: "h-10 min-h-10 rounded-md px-3 shadow-none", input: "text-sm" };
  return <form onSubmit={event => { event.preventDefault(); apply({ actorId, targetId, targetType, action, pageSize: Number(pageSize), page: 1 }); }} className="grid min-w-0 grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <div className="min-w-0"><label htmlFor="history-actor" className="mb-2 block text-sm font-medium">{t("filters.actorId")}</label><CustomInput id="history-actor" aria-label={t("filters.actorId")} value={actorId} onValueChange={setActorId} maxLength={128} size="md" classNames={inputClasses} /></div>
    <div className="min-w-0"><label htmlFor="history-target" className="mb-2 block text-sm font-medium">{t("filters.targetId")}</label><CustomInput id="history-target" aria-label={t("filters.targetId")} value={targetId} onValueChange={setTargetId} maxLength={160} size="md" classNames={inputClasses} /></div>
    {([
      ["targetType", targetType, setTargetType, { all: t("all"), ...Object.fromEntries(AUDIT_TARGETS.map(value => [value, t(`entities.${value}`)])) }],
      ["action", action, setAction, { all: t("all"), ...Object.fromEntries(AUDIT_ACTIONS.map(value => [value, t(`verbs.${value}`)])) }],
      ["pageSize", pageSize, setPageSize, { "5": "5", "10": "10", "25": "25" }],
    ] as const).map(([key, value, setValue, options]) => <div key={key} className="min-w-0"><p id={`history-filter-${key}`} className="mb-2 text-sm font-medium">{t(`filters.${key}`)}</p><CustomSelect aria-label={t(`filters.${key}`)} aria-labelledby={`history-filter-${key}`} options={options} selectedKeys={[value]} disallowEmptySelection size="md" radius="md" classNames={{ trigger: "h-10 min-h-10 rounded-md px-3", value: "text-sm" }} onSelectionChange={keys => { const value = Array.from(keys)[0]; if (value) (setValue as (value: string) => void)(String(value)); }} /></div>)}
    <Button type="submit" color="primary" radius="md" className="h-10 min-h-10 w-full">{t("filters.apply")}</Button>
  </form>;
}

function HistoryEvent({ item, filterActor }: { item: RouterOutputs["admin"]["history"]["list"]["items"][number]; filterActor(id: string): void }) {
  const t = useTranslations("Dashboard.adminHistory");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  return <li data-testid="audit-event" className="min-w-0 space-y-3 py-5 first:pt-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h3 className="min-w-0 break-words text-base font-semibold [overflow-wrap:anywhere]">{t(`verbs.${item.action}`)} · {t(`entities.${item.targetType}`)} · {item.targetLabel}</h3>
      <time dateTime={item.occurredAt.toISOString()} className="text-xs tabular-nums text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" }).format(item.occurredAt)} UTC</time>
    </div>
    <div className="min-w-0 text-sm"><button type="button" onClick={() => filterActor(item.actorId)} className="rounded-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary [overflow-wrap:anywhere]" aria-label={t("actions.actor", { actor: item.actorLabel })}>{item.actorLabel}</button><p className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">{t("identifiers", { actor: item.actorId, target: item.targetId })}</p></div>
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)}><summary className="w-fit cursor-pointer rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">{t("actions.inspect")}</summary><EventChanges id={item.id} open={open} /></details>
  </li>;
}

export function AdminHistory({ referenceTime }: { referenceTime: Date }) {
  const t = useTranslations("Dashboard.adminHistory");
  const locale = useLocale();
  const params = useSearchParams();
  const router = useProgressRouter();
  const { selection, error: rangeError } = readDashboardRange(params, referenceTime);
  const { filters, error: filterError } = readAdminHistoryFilters(params);
  const query = api.admin.history.list.useQuery({ ...filters, asOf: filters.asOf ? new Date(filters.asOf) : undefined, selection }, { retry: false, staleTime: 30_000, refetchOnMount: "always" });
  const data = query.data;
  function apply(values: Partial<AdminHistoryFilters>, refresh = false) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) { if (value === undefined || value === "") next.delete(key); else next.set(key, String(value)); }
    if (refresh) next.delete("asOf");
    else if (data && values.page !== undefined) next.set("asOf", data.generatedAt.toISOString());
    router.push(getPathname({ locale, href: { pathname: "/dashboard/history", query: Object.fromEntries(next) } }), { scroll: false });
  }
  const window = data?.window ?? getDashboardWindow(selection, referenceTime);
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><h1 className="font-serif text-2xl font-bold sm:text-3xl">{t("title")}</h1><Button variant="flat" radius="md" isLoading={query.isFetching} startContent={<RefreshCw size={16} aria-hidden="true" />} onPress={() => { if (filters.asOf) apply({ page: 1 }, true); else void query.refetch(); }}>{t("actions.refresh")}</Button></div>
    <p className="max-w-3xl text-sm text-muted-foreground">{data ? data.collectionStartedAt ? t("recording", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(data.collectionStartedAt) }) : t("notStarted") : t("description")} {t("retention")}</p>
    <details className="rounded-xl border border-border/60 bg-background/40 p-4" open={Boolean(rangeError || filterError)}><summary className="cursor-pointer rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">{t("filters.title")}<span className="ml-3 text-xs font-normal text-muted-foreground">{window.startDate} – {window.endDate} UTC</span></summary><div className="mt-4 space-y-5">
      <DashboardRangeFilter key={`range-${params}`} selection={selection} window={window} generatedAt={data?.generatedAt ?? referenceTime} initialError={rangeError} pathname="/dashboard/history" showComparison={false} title={t("filters.datesTitle")} embedded />
      <HistoryFilters key={params.toString()} filters={filters} apply={apply} />
      <p className="max-w-3xl text-sm text-muted-foreground">{t("coverage")}</p><p className="max-w-3xl text-sm text-muted-foreground">{t("coverageLimits")}</p>
    </div></details>
    {filterError ? <p role="alert" className="text-sm text-danger">{t("errors.filters")}</p> : null}
    {query.isError ? <div role={data ? "status" : "alert"} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4"><p className="text-sm">{t(data ? "errors.refresh" : "errors.load")}</p><Button size="sm" variant="flat" onPress={() => { void query.refetch(); }}>{t("actions.retry")}</Button></div> : null}
    {!data && query.isPending ? <p role="status" className="p-4 text-sm text-muted-foreground">{t("loading")}</p> : null}
    {data ? <section aria-labelledby="admin-history-results" className="min-w-0 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6"><h2 id="admin-history-results" className="text-lg font-semibold">{t("results", { count: new Intl.NumberFormat(locale).format(data.total) })}</h2>
      {data.items.length ? <ol className="min-w-0 divide-y divide-border/60">{data.items.map(item => <HistoryEvent key={item.id} item={item} filterActor={actorId => apply({ actorId, page: 1 })} />)}</ol> : <p className="py-6 text-sm text-muted-foreground">{t(data.collectionStartedAt ? "empty" : "noHistory")}</p>}
      {data.total > 0 ? <nav aria-label={t("pagination.label")} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4"><p className="text-sm text-muted-foreground">{t("pagination.page", { page: data.page, total: Math.ceil(data.total / data.pageSize) })}</p><div className="flex gap-2"><Button size="sm" variant="flat" isDisabled={data.page <= 1} onPress={() => apply({ page: data.page - 1 })}>{t("pagination.previous")}</Button><Button size="sm" variant="flat" isDisabled={data.page * data.pageSize >= data.total || data.page >= 1000} onPress={() => apply({ page: data.page + 1 })}>{t("pagination.next")}</Button></div></nav> : null}
    </section> : null}
  </div>;
}
