"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { CustomInput } from "@/src/components/customs/heroui/custom-input";
import { CustomSelect } from "@/src/components/customs/heroui/custom-select";
import { useProgressRouter } from "@/src/hooks/use-progress-router";
import { getPathname } from "@/src/i18n/routing";
import { readDashboardRange, type DashboardRange } from "@/src/server/api/schemas/dashboard";
import type { DashboardWindow } from "@/src/server/dashboard-window";

export function DashboardRangeFilter({ selection, window, generatedAt, initialError, pathname = "/dashboard", showComparison = true, title, embedded = false }: {
  selection: DashboardRange;
  window: DashboardWindow;
  generatedAt: Date;
  initialError: string | null;
  pathname?: "/dashboard" | "/dashboard/search-gaps" | "/dashboard/content-quality" | "/dashboard/history";
  showComparison?: boolean;
  title?: string;
  embedded?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Dashboard.overview.range");
  const router = useProgressRouter();
  const searchParams = useSearchParams();
  const [range, setRange] = useState<string>(selection.range);
  const [start, setStart] = useState(window.startDate);
  const [end, setEnd] = useState(window.endDate);
  const [error, setError] = useState<string | null>(initialError);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const timestamp = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  const options = { "7d": t("last7Days"), "30d": t("last30Days"), "90d": t("last90Days"), custom: t("custom") };

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (pathname !== "/dashboard") params.delete("page");
    if (pathname === "/dashboard/history") params.delete("asOf");
    params.set("range", range);
    if (range === "custom") { params.set("start", start); params.set("end", end); }
    else { params.delete("start"); params.delete("end"); }
    const validation = readDashboardRange(params, generatedAt);
    if (validation.error) { setError(validation.error); return; }
    setError(null);
    router.push(getPathname({ locale, href: { pathname, query: Object.fromEntries(params) } }), { scroll: false });
  }

  return (
    <section aria-labelledby="dashboard-range-title" className={embedded ? "min-w-0" : "min-w-0 rounded-xl border border-border/60 bg-background/40 p-4"}>
      <h2 id="dashboard-range-title" className="text-lg font-semibold">{title ?? t("title")}</h2>
      <form onSubmit={apply} noValidate className="mt-4 grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:flex">
        <div className="min-w-0 xl:w-56">
          <p id="dashboard-range-label" className="mb-2 text-sm font-medium">{t("period")}</p>
          <CustomSelect
            aria-labelledby="dashboard-range-label" aria-label={t("period")}
            options={options} selectedKeys={[range]} disallowEmptySelection radius="md" size="md"
            onSelectionChange={keys => {
              const key = Array.from(keys)[0];
              if (!key) return;
              if (key === "custom" && selection.range !== "custom") { setStart(window.startDate); setEnd(window.endDate); }
              setRange(String(key));
            }}
            classNames={{ trigger: "h-10 min-h-10 rounded-md px-3", value: "text-sm" }}
          />
        </div>
        {range === "custom" ? <>
          <div className="min-w-0 xl:w-48">
            <label htmlFor="dashboard-range-start" className="mb-2 block text-sm font-medium">{t("start")}</label>
            <CustomInput id="dashboard-range-start" aria-label={t("start")} type="date" size="md" value={start} onValueChange={setStart}
              min="1970-01-01" max={generatedAt.toISOString().slice(0, 10)}
              classNames={{ inputWrapper: "h-10 min-h-10 rounded-md px-3 shadow-none", input: "min-w-0 text-sm" }} />
          </div>
          <div className="min-w-0 xl:w-48">
            <label htmlFor="dashboard-range-end" className="mb-2 block text-sm font-medium">{t("end")}</label>
            <CustomInput id="dashboard-range-end" aria-label={t("end")} type="date" size="md" value={end} onValueChange={setEnd}
              min="1970-01-01" max={generatedAt.toISOString().slice(0, 10)}
              classNames={{ inputWrapper: "h-10 min-h-10 rounded-md px-3 shadow-none", input: "min-w-0 text-sm" }} />
          </div>
        </> : null}
        <Button type="submit" color="primary" radius="md" className="h-10 min-h-10 w-full px-4 sm:w-fit">{t("apply")}</Button>
      </form>
      {error ? <p role="alert" className="mt-3 text-sm text-danger">{t(`errors.${error}`)}{initialError ? ` ${t("defaultRangeUsed")}` : ""}</p> : null}
      <div className="mt-4 space-y-1 text-xs text-muted-foreground" data-testid="dashboard-window"
        data-window-start={window.start.toISOString()} data-window-end={window.end.toISOString()}>
        <p>{t("selected", { start: date.format(window.start), end: date.format(new Date(`${window.endDate}T00:00:00Z`)) })}</p>
        {showComparison ? <p>{t("previous", { start: timestamp.format(window.previousStart), end: timestamp.format(window.previousEnd) })}</p> : null}
        {window.partial ? <p>{t(showComparison ? "partial" : "partialOnly", { date: timestamp.format(window.end) })}</p> : showComparison ? <p>{t("complete")}</p> : null}
        <p>{t("limit")}</p>
      </div>
    </section>
  );
}
