"use client";
import { useLocale, useTranslations } from "next-intl";
import type { ContentQualityData } from "./types";

export function QualitySummary({ data, compact = false }: { data: ContentQualityData; compact?: boolean }) {
  const t = useTranslations("Dashboard.contentQuality");
  const numbers = new Intl.NumberFormat(useLocale());
  return <section aria-label={t("summary.title")} className={`rounded-xl border border-border/60 bg-background/40 ${compact ? "space-y-2 p-3 sm:space-y-3 sm:p-4" : "space-y-3 p-4"}`}>
    <h2 className={`${compact ? "hidden sm:block " : ""}text-lg font-semibold`}>{t("summary.title")}</h2>
    <p className="text-sm">{t("summary.distinct", { count: numbers.format(data.summary.needsWork), total: numbers.format(data.summary.words) })}</p>
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {(["meaning", "pronunciation", "examples", "source"] as const).map(gap => <div key={gap}>
        <dt className="text-sm text-muted-foreground">{t(`gaps.${gap}`)}</dt>
        <dd className="mt-1 font-semibold tabular-nums" data-testid={`quality-summary-${gap}`}>{numbers.format(data.summary[gap])}</dd>
      </div>)}
    </dl>
    <p className="text-xs text-muted-foreground">{t("summary.overlap")}</p>
    <p className="text-xs text-muted-foreground">{t("summary.enrichment", { count: numbers.format(data.summary.etymology) })}</p>
  </section>;
}

export function QualityCoverage() {
  const t = useTranslations("Dashboard.contentQuality");
  return <div className="space-y-1 text-xs text-muted-foreground"><p>{t("coverage.current")}</p><p>{t("coverage.demand")}</p><p>{t("coverage.audio")}</p><p>{t("coverage.summary")}</p></div>;
}
