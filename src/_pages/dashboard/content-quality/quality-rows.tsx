"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import type { ContentQualityData } from "./types";

const linkClass = "rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export function QualityRows({ items }: { items: ContentQualityData["items"] }) {
  const t = useTranslations("Dashboard.contentQuality");
  const numbers = new Intl.NumberFormat(useLocale());
  return <ul className="min-w-0 divide-y divide-border/60">{items.map(item => <li key={item.id} className="min-w-0 py-5" data-testid="quality-item">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 basis-56">
        <h3 className="break-words text-lg font-semibold [overflow-wrap:anywhere]"><Link className="rounded-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary" href={{ pathname: "/dashboard/word-list", query: { search: item.name } }}>{item.name}</Link></h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("row.identity", { id: item.id, variant: item.variant ?? 0 })}</p>
      </div>
      <p className="text-sm tabular-nums" data-testid="quality-demand">{t("row.searches", { count: numbers.format(item.searches) })}</p>
    </div>
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label={t("row.missing")}>
      {(["meaning", "pronunciation", "examples", "source"] as const).filter(gap => item[gap]).map(gap => <li key={gap}>{gap === "examples" ? t("row.examples", { count: item.withoutExamples }) : t(`gaps.${gap}`)}</li>)}
      {item.etymology ? <li className="text-muted-foreground">{t("gaps.etymology")}</li> : null}
    </ul>
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
      <Link className={linkClass} href={{ pathname: "/dashboard/word-list", query: { search: item.name } }}>{t("actions.manage")}</Link>
      <Link className={linkClass} href={{ pathname: "/search/[word]", params: { word: item.name } }}>{t("actions.entry")}</Link>
    </div>
  </li>)}</ul>;
}
