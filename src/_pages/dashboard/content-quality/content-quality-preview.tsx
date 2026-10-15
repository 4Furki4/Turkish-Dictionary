"use client";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { api } from "@/src/trpc/react";
import { Link } from "@/src/i18n/routing";
import type { DashboardRange } from "@/src/server/api/schemas/dashboard";
import { QualityRows } from "./quality-rows";
import { QualityCoverage, QualitySummary } from "./quality-summary";

export function ContentQualityPreview({ selection, asOf }: { selection: DashboardRange; asOf: Date }) {
  const t = useTranslations("Dashboard.contentQuality");
  const query = api.admin.contentQuality.list.useQuery({ selection, asOf, pageSize: 5 }, { staleTime: 60_000, retry: false, refetchOnMount: "always" });
  const data = query.data;
  return <section aria-labelledby="content-quality-preview" className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="content-quality-preview" className="text-lg font-semibold">{t("preview.title")}</h2>
      <Link className="rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary" href={{ pathname: "/dashboard/content-quality", query: { ...selection } }}>{t("preview.viewAll")}</Link></div>
    {query.isError ? <div role={data ? "status" : "alert"} className="flex flex-wrap items-center gap-3"><p className="text-sm">{t(data ? "errors.refresh" : "errors.load")}</p><Button size="sm" variant="flat" onPress={() => { void query.refetch(); }}>{t("actions.retry")}</Button></div> : null}
    {!data && query.isPending ? <p role="status">{t("loading")}</p> : data ? <>
      <QualitySummary data={data} />
      <div className="rounded-xl border border-border/60 bg-background/40 px-4 sm:px-6">{data.items.length ? <QualityRows items={data.items} /> : <p className="py-6 text-sm text-muted-foreground">{t("empty")}</p>}</div>
      <QualityCoverage />
    </> : null}
  </section>;
}
