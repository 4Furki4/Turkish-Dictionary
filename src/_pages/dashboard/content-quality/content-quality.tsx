"use client";
import { useState } from "react";
import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api } from "@/src/trpc/react";
import { getPathname } from "@/src/i18n/routing";
import { useProgressRouter } from "@/src/hooks/use-progress-router";
import { CustomInput } from "@/src/components/customs/heroui/custom-input";
import { CustomSelect } from "@/src/components/customs/heroui/custom-select";
import { DashboardRangeFilter } from "../overview/dashboard-range-filter";
import { readDashboardRange } from "@/src/server/api/schemas/dashboard";
import { getDashboardWindow } from "@/src/server/dashboard-window";
import { QUALITY_GAPS, readContentQualityFilters, type ContentQualityFilters } from "@/src/server/api/schemas/content-quality";
import { QualityRows } from "./quality-rows";
import { QualityCoverage, QualitySummary } from "./quality-summary";

function QualityFilters({ filters, apply }: { filters: ContentQualityFilters; apply(values: Partial<ContentQualityFilters>): void }) {
  const t = useTranslations("Dashboard.contentQuality");
  const [q, setQ] = useState(filters.q);
  const [gap, setGap] = useState(filters.gap);
  const [demand, setDemand] = useState(filters.demand);
  const [sort, setSort] = useState(filters.sort);
  const [pageSize, setPageSize] = useState(String(filters.pageSize));
  return <form onSubmit={event => { event.preventDefault(); apply({ q, gap, demand, sort, pageSize: Number(pageSize), page: 1 }); }} className="grid min-w-0 grid-cols-1 items-end gap-4 rounded-xl border border-border/60 bg-background/40 p-4 sm:grid-cols-2 xl:grid-cols-3">
    <CustomInput label={t("filters.query")} labelPlacement="outside" value={q} onValueChange={setQ} maxLength={100} size="md" classNames={{ inputWrapper: "h-10 min-h-10 rounded-md px-3 shadow-none", input: "text-sm" }} />
    {([
      ["gap", gap, setGap, Object.fromEntries(QUALITY_GAPS.map(value => [value, t(`gaps.${value}`)]))],
      ["demand", demand, setDemand, Object.fromEntries(["all", "searched", "unsearched"].map(value => [value, t(`demand.${value}`)]))],
      ["sort", sort, setSort, Object.fromEntries(["demand_desc", "demand_asc", "name"].map(value => [value, t(`sort.${value}`)]))],
      ["pageSize", pageSize, setPageSize, { "5": "5", "10": "10", "25": "25" }],
    ] as const).map(([key, value, setValue, options]) => <div key={key} className="min-w-0">
      <p id={`quality-filter-${key}`} className="mb-2 text-sm font-medium">{t(`filters.${key}`)}</p>
      <CustomSelect aria-label={t(`filters.${key}`)} aria-labelledby={`quality-filter-${key}`} options={options} selectedKeys={[value]} disallowEmptySelection size="md" radius="md" classNames={{ trigger: "h-10 min-h-10 rounded-md px-3", value: "text-sm" }}
        onSelectionChange={keys => { const value = Array.from(keys)[0]; if (value) (setValue as (value: string) => void)(String(value)); }} />
    </div>)}
    <Button type="submit" color="primary" radius="md" className="h-10 min-h-10 w-full">{t("filters.apply")}</Button>
  </form>;
}

export function ContentQuality({ referenceTime }: { referenceTime: Date }) {
  const t = useTranslations("Dashboard.contentQuality");
  const locale = useLocale();
  const params = useSearchParams();
  const router = useProgressRouter();
  const { selection, error: rangeError } = readDashboardRange(params, referenceTime);
  const { filters, error: filterError } = readContentQualityFilters(params);
  const query = api.admin.contentQuality.list.useQuery({ ...filters, selection }, { staleTime: 60_000, retry: false, refetchOnMount: "always" });
  const data = query.data;
  const numbers = new Intl.NumberFormat(locale);
  function apply(values: Partial<ContentQualityFilters>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) next.set(key, String(value));
    router.push(getPathname({ locale, href: { pathname: "/dashboard/content-quality", query: Object.fromEntries(next) } }), { scroll: false });
  }
  return <div className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <Button variant="flat" radius="md" isLoading={query.isFetching} startContent={<RefreshCw size={16} aria-hidden="true" />} onPress={() => { void query.refetch(); }}>{t("actions.refresh")}</Button>
    </div>
    {data ? <QualitySummary data={data} compact /> : null}
    <details className="rounded-xl border border-border/60 bg-background/40 p-4" open={Boolean(rangeError || filterError)}>
      <summary className="cursor-pointer rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">
        <span>{t("filters.title")}</span>
        <span className="ml-3 text-xs font-normal text-muted-foreground">{data?.window.startDate ?? getDashboardWindow(selection, referenceTime).startDate} – {data?.window.endDate ?? getDashboardWindow(selection, referenceTime).endDate} UTC</span>
      </summary>
      <div className="mt-4 space-y-4">
        <p className="max-w-3xl text-sm text-muted-foreground">{t("description")}</p>
        <DashboardRangeFilter key={`range-${params}`} selection={selection} window={data?.window ?? getDashboardWindow(selection, referenceTime)} generatedAt={data?.generatedAt ?? referenceTime} initialError={rangeError} pathname="/dashboard/content-quality" showComparison={false} />
        <QualityFilters key={params.toString()} filters={filters} apply={apply} />
        <QualityCoverage />
      </div>
    </details>
    {filterError ? <p role="alert" className="text-sm text-danger">{t("errors.invalidFilters")}</p> : null}
    {query.isError ? <div role={data ? "status" : "alert"} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4"><p className="text-sm">{t(data ? "errors.refresh" : "errors.load")}</p><Button size="sm" variant="flat" onPress={() => { void query.refetch(); }}>{t("actions.retry")}</Button></div> : null}
    {!data && query.isPending ? <p role="status" className="rounded-xl bg-background/40 p-6 text-muted-foreground">{t("loading")}</p> : null}
    {data ? <>
      <section aria-labelledby="content-quality-results" className="min-w-0 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
        <h2 id="content-quality-results" className="text-lg font-semibold">{t("results", { count: numbers.format(data.total) })}</h2>
        {data.items.length ? <QualityRows items={data.items} /> : <p className="py-8 text-sm text-muted-foreground">{t("empty")}</p>}
        {data.total > 0 ? <nav aria-label={t("pagination.label")} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">{t("pagination.page", { page: data.page, total: Math.ceil(data.total / data.pageSize) })}</p>
          <div className="flex gap-2"><Button size="sm" variant="flat" isDisabled={data.page <= 1} onPress={() => apply({ page: data.page - 1 })}>{t("pagination.previous")}</Button><Button size="sm" variant="flat" isDisabled={data.page * data.pageSize >= data.total || data.page >= 1000} onPress={() => apply({ page: data.page + 1 })}>{t("pagination.next")}</Button></div>
        </nav> : null}
      </section>
      <p className="text-xs text-muted-foreground">{t("checkedAt", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(data.checkedAt) })}</p>
    </> : null}
  </div>;
}
