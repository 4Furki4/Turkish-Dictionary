"use client";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { api } from "@/src/trpc/react";
import { Link } from "@/src/i18n/routing";
import type { DashboardRange } from "@/src/server/api/schemas/dashboard";
import { SearchGapCoverage } from "./coverage";

const linkClass = "rounded-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export function SearchGapPreview({ selection, asOf }: { selection: DashboardRange; asOf: Date }) {
  const t = useTranslations("Dashboard.searchGaps");
  const locale = useLocale();
  const numbers = new Intl.NumberFormat(locale);
  const query = api.admin.searchGaps.list.useQuery({ selection, asOf, pageSize: 5 }, { staleTime: 60_000, retry: false });
  const data = query.data;
  const selectionQuery = { ...selection, ...(selection.range === "custom" ? { start: selection.start, end: selection.end } : {}) };
  return <section aria-labelledby="search-gap-preview" className="min-w-0 space-y-4 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="search-gap-preview" className="text-lg font-semibold">{t("preview.title")}</h2><Link className={`text-sm ${linkClass}`} href={{ pathname: "/dashboard/search-gaps", query: selectionQuery }}>{t("preview.viewAll")}</Link></div>
    <p className="text-sm text-muted-foreground">{t("preview.description")}</p>
    {query.isError ? <div role={data ? "status" : "alert"} className="flex flex-wrap items-center gap-3"><p className="text-sm text-muted-foreground">{t(data ? "errors.refresh" : "errors.load")}</p><Button size="sm" variant="flat" onPress={() => { void query.refetch(); }}>{t("actions.retry")}</Button></div> : null}
    {!data && query.isPending ? <p role="status">{t("loading")}</p> : data ? <>
      {data.items.length ? <ul className="divide-y divide-border/60">{data.items.map(item => <li key={item.query} className="flex min-w-0 items-start justify-between gap-4 py-3">
        <div className="min-w-0"><Link className={`break-words text-sm [overflow-wrap:anywhere] ${linkClass}`} href={{ pathname: "/dashboard/search-gaps", query: { ...selectionQuery, q: item.query } }}>{item.query}</Link><p className="mt-1 text-xs text-muted-foreground">{t(item.currentWord ? "current.available" : item.correction ? "current.hasCorrection" : "current.missing")}</p></div>
        <p className="shrink-0 text-sm tabular-nums">{t("preview.misses", { count: numbers.format(item.frequency) })}</p>
      </li>)}</ul> : <p className="text-sm text-muted-foreground">{t(data.summary.reported === 0 ? "empty.noReports" : "empty.noMatches")}</p>}
      <SearchGapCoverage data={data} />
    </> : null}
  </section>;
}
