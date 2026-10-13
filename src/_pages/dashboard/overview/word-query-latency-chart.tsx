"use client";

import { Button, Card, CardBody } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { api } from "@/src/trpc/react";

export function WordQueryLatencyChart() {
  const locale = useLocale();
  const t = useTranslations("Dashboard.overview.queryLatency");
  const query = api.admin.overview.getWordQueryLatency.useQuery(undefined, {
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: false,
  });
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const dates = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const duration = (value: number | null) => value === null ? "—" : t("duration", { value: numbers.format(value) });
  const data = query.data?.daily.map(day => ({
    ...day,
    label: dates.format(new Date(`${day.date}T00:00:00Z`)),
  })) ?? [];
  const summary = query.data?.summary;

  return (
    <Card isBlurred className="min-w-0 bg-background/40">
      <CardBody className="min-w-0 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">{t("description")}</p>
          </div>
          {query.data ? <p className="shrink-0 text-xs text-muted-foreground">{t("updatedAt", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(query.data.generatedAt) })}</p> : null}
        </div>
        {query.data && query.isError ? (
          <div role="status" className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">{t("refreshError")}</p>
            <Button size="sm" variant="flat" onPress={() => { void query.refetch(); }}>{t("retry")}</Button>
          </div>
        ) : null}
        {!query.data && query.isPending ? (
          <div role="status" className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">{t("loading")}</div>
        ) : !query.data && query.isError ? (
          <div role="alert" className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">{t("error")}</p>
            <Button size="sm" variant="flat" onPress={() => { void query.refetch(); }}>{t("retry")}</Button>
          </div>
        ) : !summary?.sampleCount ? (
          <div className="flex min-h-60 items-center justify-center rounded-md border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">{t("empty")}</div>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              {[
                { label: t("average"), value: duration(summary.averageMs) },
                { label: t("p95"), value: duration(summary.p95Ms) },
                { label: t("samples"), value: numbers.format(summary.sampleCount) },
              ].map(item => (
                <div key={item.label}>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-hidden="true">
              <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-primary" />{t("average")}</span>
              <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-foreground" />{t("p95")}</span>
            </div>
            <ChartContainer
              config={{
                averageMs: { label: t("average"), color: "hsl(var(--primary))" },
                p95Ms: { label: t("p95"), color: "hsl(var(--foreground))" },
              }}
              className="h-72 w-full min-w-0"
              role="img"
              aria-label={t("chartLabel")}
            >
              <LineChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} tickMargin={8} />
                <YAxis width={76} tickLine={false} axisLine={false} tickMargin={8} domain={[0, "auto"]} tickFormatter={value => duration(Number(value))} />
                <Tooltip content={<ChartTooltipContent valueFormatter={value => duration(Number(value))} />} />
                <Line dataKey="averageMs" stroke="var(--color-averageMs)" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} isAnimationActive={false} />
                <Line dataKey="p95Ms" stroke="var(--color-p95Ms)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} connectNulls={false} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
            <p className="text-xs text-muted-foreground">{t("p95Description")}</p>
            <details className="rounded-md border border-border/60">
              <summary className="cursor-pointer rounded-md px-3 py-3 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("viewData")}</summary>
              <div className="overflow-x-auto px-3 pb-3">
                <table className="w-full text-right text-xs tabular-nums">
                  <caption className="sr-only">{t("chartLabel")}</caption>
                  <thead><tr className="border-b border-border/60">
                    <th scope="col" className="py-2 text-left font-medium">{t("date")}</th>
                    <th scope="col" className="px-2 py-2 font-medium">{t("average")}</th>
                    <th scope="col" className="px-2 py-2 font-medium">{t("p95")}</th>
                    <th scope="col" className="py-2 font-medium">{t("samples")}</th>
                  </tr></thead>
                  <tbody>{data.map(day => (
                    <tr key={day.date} className="border-b border-border/30 last:border-0">
                      <th scope="row" className="whitespace-nowrap py-2 text-left font-normal">{day.label}</th>
                      <td className="whitespace-nowrap px-2 py-2">{duration(day.averageMs)}</td>
                      <td className="whitespace-nowrap px-2 py-2">{duration(day.p95Ms)}</td>
                      <td className="py-2">{numbers.format(day.sampleCount)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </details>
          </>
        )}
        <p className="max-w-3xl text-xs text-muted-foreground">{t("coverage")}</p>
      </CardBody>
    </Card>
  );
}
