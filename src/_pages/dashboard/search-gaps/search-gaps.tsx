"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/src/trpc/react";
import { Link, getPathname } from "@/src/i18n/routing";
import { useProgressRouter } from "@/src/hooks/use-progress-router";
import { CustomInput } from "@/src/components/customs/heroui/custom-input";
import { CustomSelect } from "@/src/components/customs/heroui/custom-select";
import { DashboardRangeFilter } from "../overview/dashboard-range-filter";
import { readDashboardRange } from "@/src/server/api/schemas/dashboard";
import { getDashboardWindow } from "@/src/server/dashboard-window";
import { readSearchGapFilters, searchGapReviewSchema, type SearchGapFilters } from "@/src/server/api/schemas/search-gaps";

import type { SearchGapsData as Data } from "./types";
import { SearchGapCoverage } from "./coverage";
import { SearchGapTrend } from "./trend";
type Item = Data["items"][number];
const controlClasses = { trigger: "h-10 min-h-10 rounded-md px-3", value: "text-sm" };
const inputClasses = { inputWrapper: "h-10 min-h-10 rounded-md px-3 shadow-none", input: "text-sm" };
const linkClass = "rounded-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";


function GapFilters({ filters, apply }: { filters: SearchGapFilters; apply(values: Partial<SearchGapFilters>): void }) {
  const t = useTranslations("Dashboard.searchGaps");
  const [q, setQ] = useState(filters.q);
  const [source, setSource] = useState(filters.source);
  const [kind, setKind] = useState(filters.kind);
  const [status, setStatus] = useState(filters.status);
  const [sort, setSort] = useState(filters.sort);
  return <form onSubmit={event => { event.preventDefault(); apply({ q, source, kind, status, sort, page: 1 }); }} className="grid min-w-0 grid-cols-1 items-end gap-4 rounded-xl border border-border/60 bg-background/40 p-4 sm:grid-cols-2 xl:grid-cols-3">
    <CustomInput label={t("filters.query")} labelPlacement="outside" value={q} onValueChange={setQ} maxLength={100} size="md" classNames={inputClasses} />
    {([
      ["source", source, setSource, { all: t("filters.allSources"), online: t("sources.online"), offline: t("sources.offline") }],
      ["kind", kind, setKind, { all: t("filters.allKinds"), word: t("kinds.word"), pattern: t("kinds.pattern") }],
      ["status", status, setStatus, Object.fromEntries(["all", "open", "reviewed", "dismissed", "linked"].map(value => [value, t(`statuses.${value}`)]))],
      ["sort", sort, setSort, { frequency: t("sort.frequency"), recent: t("sort.recent") }],
    ] as const).map(([key, value, setValue, options]) => <div key={key} className="min-w-0">
      <p id={`gap-filter-${key}`} className="mb-2 text-sm font-medium">{t(`filters.${key}`)}</p>
      <CustomSelect aria-labelledby={`gap-filter-${key}`} aria-label={t(`filters.${key}`)} options={options} selectedKeys={[value]} disallowEmptySelection size="md" radius="md" classNames={controlClasses}
        onSelectionChange={keys => { const next = Array.from(keys)[0]; if (next) (setValue as (value: string) => void)(String(next)); }} />
    </div>)}
    <Button type="submit" color="primary" radius="md" className="h-10 min-h-10 w-full">{t("filters.apply")}</Button>
  </form>;
}

function GapReview({ item }: { item: Item }) {
  const id = useId();
  const t = useTranslations("Dashboard.searchGaps");
  const utils = api.useUtils();
  const [status, setStatus] = useState<string>(item.status);
  const [targetType, setTargetType] = useState(item.targetType ?? (item.currentWord ? "word" : item.correction ? "correction" : "word"));
  const [targetId, setTargetId] = useState((item.targetId ?? item.currentWord?.id ?? item.correction?.id)?.toString() ?? "");
  const [validationError, setValidationError] = useState(false);
  const mutation = api.admin.searchGaps.review.useMutation({ onSuccess: () => {
    toast.success(t("review.saved"));
    void utils.admin.searchGaps.list.invalidate();
  } });
  function save(event: FormEvent) {
    event.preventDefault();
    const parsed = searchGapReviewSchema.safeParse({ query: item.query, status,
      ...(status === "linked" ? { targetType, targetId: Number(targetId) } : {}) });
    setValidationError(!parsed.success);
    if (parsed.success) mutation.mutate(parsed.data);
  }
  return <form onSubmit={save} className="space-y-3">
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="min-w-0">
        <p id={`gap-review-${id}`} className="mb-2 text-sm font-medium">{t("review.status")}</p>
        <CustomSelect aria-labelledby={`gap-review-${id}`} aria-label={t("review.status")}
          options={Object.fromEntries(["open", "reviewed", "dismissed", "linked"].map(value => [value, t(`statuses.${value}`)]))}
          selectedKeys={[status]} disallowEmptySelection size="md" radius="md" classNames={controlClasses}
          onSelectionChange={keys => { const value = Array.from(keys)[0]; if (value) setStatus(String(value)); }} />
      </div>
      {status === "linked" ? <>
        <div className="min-w-0">
          <p id={`gap-target-${id}`} className="mb-2 text-sm font-medium">{t("review.targetType")}</p>
          <CustomSelect aria-labelledby={`gap-target-${id}`} aria-label={t("review.targetType")}
            options={{ word: t("targets.word"), correction: t("targets.correction"), request: t("targets.request") }} selectedKeys={[targetType]} disallowEmptySelection size="md" radius="md" classNames={controlClasses}
            onSelectionChange={keys => {
              const value = Array.from(keys)[0] as typeof targetType | undefined;
              if (!value) return;
              setTargetType(value);
              setTargetId((value === item.targetType ? item.targetId : value === "word" ? item.currentWord?.id : value === "correction" ? item.correction?.id : undefined)?.toString() ?? "");
            }} />
        </div>
        <CustomInput type="number" min={1} max={2147483647} label={t("review.targetId")} labelPlacement="outside" size="md" value={targetId} onValueChange={setTargetId} classNames={inputClasses} />
      </> : null}
      <Button type="submit" color="primary" radius="md" isLoading={mutation.isPending} className="h-10 min-h-10">{t("review.save")}</Button>
    </div>
    <p className="text-xs text-muted-foreground">{t("review.retention")}</p>
    {validationError ? <p role="alert" className="text-sm text-danger">{t("errors.invalidTarget")}</p> : null}
    {mutation.isError ? <p role="alert" className="text-sm text-danger">{t(mutation.error.message === "gapExpired" ? "errors.gapExpired" : mutation.error.message === "targetMissing" ? "errors.targetMissing" : "errors.save")}</p> : null}
  </form>;
}

function GapItem({ item }: { item: Item }) {
  const id = useId();
  const t = useTranslations("Dashboard.searchGaps");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  const numbers = new Intl.NumberFormat(locale);
  return <li className="min-w-0 py-5" data-testid="search-gap-item">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 basis-56">
        <h3 className="break-words text-lg font-semibold [overflow-wrap:anywhere]">{item.query}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t(`statuses.${item.status}`)} · {t(item.query.includes("_") ? "kinds.pattern" : "kinds.word")}</p>
        <p className="mt-2 text-sm [overflow-wrap:anywhere]">{item.currentWord
          ? <>{t("current.word")} <Link href={{ pathname: "/search/[word]", params: { word: item.currentWord.name } }} className={linkClass}>{item.currentWord.name}</Link></>
          : item.correction ? <>{t("current.correction")} <Link href={{ pathname: "/dashboard/misspellings", query: { correctionId: item.correction.id } }} className={linkClass}>{item.correction.name}</Link></>
          : t("current.missing")}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">{t("columns.frequency")}</dt><dd className="mt-1 font-semibold tabular-nums">{numbers.format(item.frequency)}</dd></div>
        <div><dt className="text-muted-foreground">{t("columns.firstSeen")}</dt><dd className="mt-1 tabular-nums">{item.firstSeen ? dates.format(item.firstSeen) : "—"}</dd></div>
        <div><dt className="text-muted-foreground">{t("columns.lastSeen")}</dt><dd className="mt-1 tabular-nums">{item.lastSeen ? dates.format(item.lastSeen) : "—"}</dd></div>
      </dl>
      <Button variant="flat" radius="md" size="sm" aria-expanded={expanded} aria-controls={`gap-detail-${id}`} endContent={<ChevronDown size={16} aria-hidden="true" />} onPress={() => setExpanded(!expanded)}>{t(expanded ? "actions.close" : "actions.inspect")}</Button>
    </div>
    {expanded ? <div id={`gap-detail-${id}`} className="mt-5 min-w-0 space-y-6 border-t border-border/60 pt-5">
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        {!item.query.includes("_") && !item.currentWord && !item.correction ? <>
          <Link className={linkClass} href={{ pathname: "/dashboard/create-word", query: { name: item.query } }}>{t("actions.createWord")}</Link>
          <Link className={linkClass} href={{ pathname: "/dashboard/misspellings", query: { term: item.query } }}>{t("actions.correctSpelling")}</Link>
        </> : null}
        <Link className={linkClass} href={{ pathname: "/search/[word]", params: { word: item.query } }}>{t("actions.search")}</Link>
        {item.status === "linked" && item.targetId ? item.targetType === "request"
          ? <Link className={linkClass} href={{ pathname: "/dashboard/requests/[id]", params: { id: String(item.targetId) } }}>{t("actions.openLinked")}</Link>
          : item.targetType === "correction" ? <Link className={linkClass} href={{ pathname: "/dashboard/misspellings", query: { correctionId: item.targetId } }}>{t("actions.openLinked")}</Link>
          : item.linkedWordName ? <Link className={linkClass} href={{ pathname: "/search/[word]", params: { word: item.linkedWordName } }}>{t("actions.openLinked")}</Link>
          : <p className="text-muted-foreground">{t("current.linkUnavailable")}</p> : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("actions.manual")}</p>
      <GapReview item={item} />
      <details>
        <summary className="w-fit cursor-pointer rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">{t("trend.termTitle")}</summary>
        <div className="mt-3 max-h-60 overflow-y-auto">
          <table className="w-full text-left text-sm"><caption className="sr-only">{t("trend.termTitle")}</caption><thead><tr><th scope="col" className="py-2">{t("trend.day")}</th><th scope="col">{t("columns.frequency")}</th></tr></thead>
            <tbody>{item.daily.map(point => <tr key={point.date} className="border-t border-border/60"><td className="py-2">{point.date} UTC</td><td className="tabular-nums">{numbers.format(point.count)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div> : null}
  </li>;
}

export function SearchGaps({ referenceTime }: { referenceTime: Date }) {
  const t = useTranslations("Dashboard.searchGaps");
  const locale = useLocale();
  const params = useSearchParams();
  const router = useProgressRouter();
  const { selection, error: rangeError } = readDashboardRange(params, referenceTime);
  const { filters, error: filterError } = readSearchGapFilters(params);
  const query = api.admin.searchGaps.list.useQuery({ ...filters, selection }, { staleTime: 60_000, retry: false });
  const data = query.data;
  const numbers = new Intl.NumberFormat(locale);
  const percentages = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  function apply(values: Partial<SearchGapFilters>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) next.set(key, String(value));
    router.push(getPathname({ locale, href: { pathname: "/dashboard/search-gaps", query: Object.fromEntries(next) } }), { scroll: false });
  }
  return <div className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-serif text-3xl font-bold">{t("title")}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("description")}</p></div>
      <Button variant="flat" radius="md" isLoading={query.isFetching} startContent={<RefreshCw size={16} aria-hidden="true" />} onPress={() => { void query.refetch(); }}>{t("actions.refresh")}</Button>
    </div>
    <DashboardRangeFilter key={`range-${params}`} selection={selection} window={data?.window ?? getDashboardWindow(selection, referenceTime)} generatedAt={data?.generatedAt ?? referenceTime} initialError={rangeError} pathname="/dashboard/search-gaps" showComparison={false} />
    <GapFilters key={params.toString()} filters={filters} apply={apply} />
    {filterError ? <p role="alert" className="text-sm text-danger">{t("errors.invalidFilters")}</p> : null}
    {query.isError ? <div role={data ? "status" : "alert"} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
      <p className="text-sm">{t(data ? "errors.refresh" : "errors.load")}</p><Button size="sm" variant="flat" onPress={() => { void query.refetch(); }}>{t("actions.retry")}</Button>
    </div> : null}
    {!data && query.isPending ? <p role="status" className="rounded-xl bg-background/40 p-6 text-muted-foreground">{t("loading")}</p> : null}
    {data ? <>
      <section aria-label={t("summary.title")} className="space-y-4 rounded-xl border border-border/60 bg-background/40 p-4">
        <h2 className="text-lg font-semibold">{t("summary.title")}</h2>
        <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">{([
          ["completed", numbers.format(data.summary.completed)], ["noResult", numbers.format(data.summary.noResult)],
          ["rate", data.summary.noResultRate === null ? t("summary.notMeasured") : percentages.format(data.summary.noResultRate)],
          ["errors", numbers.format(data.summary.errors)],
        ] as const).map(([key, value]) => <div key={key}><dt className="text-sm text-muted-foreground">{t(`summary.${key}`)}</dt><dd className="mt-1 text-xl font-semibold tabular-nums" data-testid={`gap-summary-${key}`}>{value}</dd></div>)}</dl>
        <p className="text-xs text-muted-foreground">{t("summary.denominator")}</p>
        <SearchGapCoverage data={data} />
      </section>
      <section aria-labelledby="search-gap-results" className="min-w-0 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
        <h2 id="search-gap-results" className="text-lg font-semibold">{t("results", { count: data.total })}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("columns.scope")}</p>
        {data.items.length ? <ul className="mt-2 divide-y divide-border/60">{data.items.map(item => <GapItem key={`${item.query}-${item.status}-${item.reviewedAt}`} item={item} />)}</ul>
          : <p className="py-8 text-sm text-muted-foreground">{t(data.summary.reported === 0 ? "empty.noReports" : data.summary.completed === 0 ? "empty.noCompleted" : "empty.noMatches")}</p>}
        {data.total > 0 ? <nav aria-label={t("pagination.label")} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">{t("pagination.page", { page: data.page, total: Math.ceil(data.total / data.pageSize) })}</p>
          <div className="flex gap-2"><Button size="sm" variant="flat" isDisabled={data.page <= 1} onPress={() => apply({ page: data.page - 1 })}>{t("pagination.previous")}</Button><Button size="sm" variant="flat" isDisabled={data.page * data.pageSize >= data.total || data.page >= 1000} onPress={() => apply({ page: data.page + 1 })}>{t("pagination.next")}</Button></div>
        </nav> : filters.page > 1 ? <Button className="mt-4" size="sm" variant="flat" onPress={() => apply({ page: 1 })}>{t("pagination.first")}</Button> : null}
      </section>
      {data.summary.reported > 0 ? <section className="rounded-xl border border-border/60 bg-background/40 p-4">
        <h2 className="text-lg font-semibold">{t("trend.title")}</h2>
        <SearchGapTrend data={data.daily} />
        <details className="mt-3"><summary className="w-fit cursor-pointer rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">{t("trend.view")}</summary>
          <div className="mt-3 max-h-72 overflow-y-auto"><table className="w-full text-left text-sm"><caption className="sr-only">{t("trend.title")}</caption><thead><tr><th scope="col" className="py-2">{t("trend.day")}</th><th scope="col">{t("summary.noResult")}</th><th scope="col">{t("summary.errors")}</th></tr></thead><tbody>{data.daily.map(point => <tr className="border-t border-border/60" key={point.date}><td className="py-2">{point.date} UTC</td><td className="tabular-nums">{point.noResult === null ? "—" : numbers.format(point.noResult)}</td><td className="tabular-nums">{point.errors === null ? "—" : numbers.format(point.errors)}</td></tr>)}</tbody></table></div>
        </details>
      </section> : null}
    </> : null}
  </div>;
}
