"use client";
import { useLocale, useTranslations } from "next-intl";
import type { SearchGapsData as Data } from "./types";

export function SearchGapCoverage({ data }: { data: Data }) {
  const t = useTranslations("Dashboard.searchGaps");
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const timestamp = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  return <div className="space-y-1 text-xs text-muted-foreground">
    <p>{data.coverage.firstRecordedDay ? t("coverage.since", { date: date.format(new Date(`${data.coverage.firstRecordedDay}T00:00:00Z`)) }) : t("coverage.notStarted")}</p>
    <p>{t("coverage.limitations")}</p>
    {data.coverage.truncated ? <p role="status">{t("coverage.retention", { date: timestamp.format(data.coverage.retainedFrom) })}</p> : null}
  </div>;
}
