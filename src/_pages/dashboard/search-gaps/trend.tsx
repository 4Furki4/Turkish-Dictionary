"use client";

import { useLocale, useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { SearchGapsData } from "./types";

export function SearchGapTrend({ data }: { data: SearchGapsData["daily"] }) {
  const t = useTranslations("Dashboard.searchGaps");
  const locale = useLocale();
  const dates = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  const numbers = new Intl.NumberFormat(locale);
  const points = data.map(point => ({ ...point, label: dates.format(new Date(`${point.date}T00:00:00Z`)) }));
  return <>
    <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-primary" aria-hidden="true" />{t("summary.noResult")}</span>
      <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-foreground" aria-hidden="true" />{t("summary.errors")}</span>
    </div>
    <ChartContainer className="mt-3 h-60 w-full" role="img" aria-label={t("trend.title")} config={{
      noResult: { label: t("summary.noResult"), color: "hsl(var(--primary))" },
      errors: { label: t("summary.errors"), color: "hsl(var(--foreground))" },
    }}>
      <LineChart responsive style={{ width: "100%", height: "100%", minWidth: 0 }} data={points} margin={{ left: 4, right: 12, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} tickMargin={8} />
        <YAxis allowDecimals={false} width={64} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => numbers.format(Number(value))} />
        <Tooltip content={<ChartTooltipContent valueFormatter={value => numbers.format(Number(value))} />} />
        <Line type="linear" dataKey="noResult" stroke="var(--color-noResult)" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
        <Line type="linear" dataKey="errors" stroke="var(--color-errors)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} connectNulls={false} />
      </LineChart>
    </ChartContainer>
  </>;
}
