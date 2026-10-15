"use client";

import type { ReactNode } from "react";
import { Card, CardBody, Chip } from "@heroui/react";
import {
  BarChart3,
  FileClock,
  MessageSquareWarning,
  Users,
  WholeWord,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Link } from "@/src/i18n/routing";
import { api } from "@/src/trpc/react";
import { WordQueryLatencyChart } from "./word-query-latency-chart";
import { NeedsAttention } from "./needs-attention";
import { DashboardRangeFilter } from "./dashboard-range-filter";
import { MetricChange } from "./metric-change";
import { SearchGapPreview } from "../search-gaps/search-gap-preview";
import { ContentQualityPreview } from "../content-quality/content-quality-preview";
import { readDashboardRange } from "@/src/server/api/schemas/dashboard";

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
};

function getNumberAxisWidth(values: number[], formatter: Intl.NumberFormat) {
  const maxValue = Math.max(0, ...values);
  const roundedValue = Math.ceil(maxValue * 1.1);
  const labelLength = formatter.format(roundedValue).length;

  return Math.min(96, Math.max(44, labelLength * 8 + 18));
}

function MetricCard({ label, value, description, icon }: MetricCardProps) {
  const locale = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale);

  return (
    <Card isBlurred className="bg-background/40">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="rounded-md bg-primary/10 p-2 text-primary">{icon}</span>
        </div>
        <div>
          <p className="font-mono text-3xl font-semibold text-foreground">{numberFormatter.format(value)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export function DashboardOverview({ referenceTime = new Date() }: { referenceTime?: Date }) {
  const locale = useLocale();
  const t = useTranslations("Dashboard.overview");
  const searchParams = useSearchParams();
  const { selection, error } = readDashboardRange(searchParams, referenceTime);
  const [data] = api.admin.overview.getDashboardOverview.useSuspenseQuery(selection, { staleTime: 60_000, refetchInterval: 60_000, retry: false });
  const numberFormatter = new Intl.NumberFormat(locale);
  const dates = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const timestamps = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

  const dailySearchData = data.searchAnalytics.dailySearches.map((item) => ({
    ...item,
    label: dates.format(new Date(`${item.date}T00:00:00Z`)),
  }));

  const topSearchData = data.searchAnalytics.topSearchedWords.map((item) => ({
    ...item,
    label: item.wordName.length > 16 ? `${item.wordName.slice(0, 15)}...` : item.wordName,
  }));
  const searchTrendYAxisWidth = getNumberAxisWidth(
    dailySearchData.map((item) => item.count),
    numberFormatter,
  );

  const actorSplit = data.searchAnalytics.actorSplit;
  const authenticatedPercent = actorSplit.total > 0
    ? Math.round((actorSplit.authenticated / actorSplit.total) * 100)
    : 0;
  const anonymousPercent = actorSplit.total > 0
    ? 100 - authenticatedPercent
    : 0;

  const metricCards = [
    {
      label: t("metrics.totalWords"),
      value: data.metrics.totalWords,
      description: t("metrics.totalWordsDescription"),
      icon: <WholeWord className="h-4 w-4" />,
    },
    {
      label: t("metrics.totalUsers"),
      value: data.metrics.totalUsers,
      description: t("metrics.totalUsersDescription"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: t("metrics.pendingRequests"),
      value: data.metrics.pendingRequests,
      description: t("metrics.pendingRequestsDescription"),
      icon: <FileClock className="h-4 w-4" />,
    },
    {
      label: t("metrics.openFeedback"),
      value: data.metrics.openFeedback,
      description: t("metrics.openFeedbackDescription"),
      icon: <MessageSquareWarning className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Chip radius="md" variant="flat" className="w-fit">
          {t("generatedAt", {
            date: `${timestamps.format(data.generatedAt)} UTC`,
          })}
        </Chip>
      </div>

      <DashboardRangeFilter key={searchParams.toString()} selection={selection} window={data.window} generatedAt={data.generatedAt} initialError={error} />

      <section aria-labelledby="dashboard-period-metrics" className="min-w-0 rounded-xl border border-border/60 bg-background/40 p-4">
        <h2 id="dashboard-period-metrics" className="text-lg font-semibold">{t("period.title")}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {([
            ["searches", data.periodMetrics.searches],
            ["newUsers", data.periodMetrics.newUsers],
            ["submittedRequests", data.periodMetrics.submittedRequests],
            ["resolvedRequests", data.periodMetrics.resolvedRequests],
          ] as const).map(([key, comparison]) => (
            <div key={key} data-testid={`period-${key}`}>
              <dt className="text-sm text-muted-foreground">{t(`period.${key}`)}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{numberFormatter.format(comparison.current ?? 0)}</dd>
              <MetricChange comparison={comparison} />
              <p className="mt-1 text-xs text-muted-foreground">{t("comparison.previousValue", { value: numberFormatter.format(comparison.previous ?? 0) })}</p>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">{t("period.coverage")}</p>
      </section>

      <h2 className="text-lg font-semibold">{t("currentSnapshot")}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <NeedsAttention />
      <SearchGapPreview selection={selection} asOf={data.generatedAt} />
      <ContentQualityPreview selection={selection} asOf={data.generatedAt} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card isBlurred className="bg-background/40 xl:col-span-2">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t("searchTrend.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("searchTrend.description")}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <ChartContainer
              config={{ count: { label: t("searchTrend.series"), color: "hsl(var(--primary))" } }}
              className="h-72 w-full"
            >
              <AreaChart responsive style={{ width: "100%", height: "100%", minWidth: 0 }} data={dailySearchData} margin={{ left: 4, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="searchTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  width={searchTrendYAxisWidth}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  tickFormatter={(value) => numberFormatter.format(Number(value))}
                />
                <Tooltip content={<ChartTooltipContent valueFormatter={(value) => numberFormatter.format(Number(value))} />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  fill="url(#searchTrendFill)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardBody>
        </Card>

        <Card isBlurred className="bg-background/40">
          <CardBody className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("actorSplit.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("actorSplit.description")}</p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{t("actorSplit.authenticated")}</span>
                  <span className="font-mono">{authenticatedPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-primary/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${authenticatedPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{t("actorSplit.anonymous")}</span>
                  <span className="font-mono">{anonymousPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-primary/10">
                  <div className="h-full rounded-full bg-muted-foreground" style={{ width: `${anonymousPercent}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-md border border-border/60 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">{t("actorSplit.authenticated")}</p>
                  <p className="font-mono text-xl font-semibold">{numberFormatter.format(actorSplit.authenticated)}</p>
                </div>
                <div className="rounded-md border border-border/60 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">{t("actorSplit.anonymous")}</p>
                  <p className="font-mono text-xl font-semibold">{numberFormatter.format(actorSplit.anonymous)}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <WordQueryLatencyChart selection={selection} asOf={data.generatedAt} />

      <Card isBlurred className="bg-background/40">
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("topSearches.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("topSearches.description")}</p>
            </div>
            <Link href="/dashboard/search-history" className="text-sm font-medium text-primary hover:underline">
              {t("topSearches.viewHistory")}
            </Link>
          </div>
          {topSearchData.length > 0 ? (
            <ChartContainer
              config={{ count: { label: t("topSearches.series"), color: "hsl(var(--primary))" } }}
              className="h-80 w-full"
            >
              <BarChart responsive style={{ width: "100%", height: "100%", minWidth: 0 }} data={topSearchData} layout="vertical" margin={{ left: 12, right: 16, top: 8, bottom: 24 }}>
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  tickCount={5}
                  tickFormatter={(value) => numberFormatter.format(Number(value))}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <Tooltip content={<ChartTooltipContent valueFormatter={(value) => numberFormatter.format(Number(value))} />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="rounded-md border border-dashed border-border/80 bg-background/30 p-8 text-center text-sm text-muted-foreground">
              {t("topSearches.empty")}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
