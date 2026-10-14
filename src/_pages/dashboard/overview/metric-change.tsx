"use client";

import { useLocale, useTranslations } from "next-intl";
import type { DashboardComparison } from "@/src/server/dashboard-window";

export function MetricChange({ comparison, duration = false }: { comparison: DashboardComparison; duration?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("Dashboard.overview.comparison");
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 0, signDisplay: "always" });
  const percentages = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" });
  if (comparison.current === null) return <p className="mt-1 text-xs text-muted-foreground">{t("noMeasurements")}</p>;
  if (comparison.previous === null) return <p className="mt-1 text-xs text-muted-foreground">{t("noBaseline")}</p>;
  const difference = numbers.format(comparison.difference ?? 0);
  const change = duration ? t("durationDifference", { value: difference }) : difference;
  const baseline = comparison.percentChange !== null
    ? percentages.format(comparison.percentChange / 100)
    : comparison.current === 0 ? t("noActivity") : t(duration ? "zeroBaseline" : "newActivity");
  return <p className="mt-1 text-xs text-muted-foreground">{t("change", { difference: change, baseline })}</p>;
}
