"use client";

import { Button, Card, CardBody, Skeleton } from "@heroui/react";
import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { api } from "@/src/trpc/react";

const linkClassName = "rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export function NeedsAttention() {
  const locale = useLocale();
  const t = useTranslations("Dashboard.overview.attention");
  const requestCopy = useTranslations("Requests");
  const feedbackCopy = useTranslations("Dashboard.feedback.types");
  const query = api.admin.overview.getNeedsAttention.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnMount: "always",
    retry: false,
  });
  const data = query.data;
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

  return (
    <Card as="section" aria-labelledby="dashboard-attention-title" isBlurred className="min-w-0 bg-background/40">
      <CardBody className="min-w-0 gap-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="dashboard-attention-title" className="text-lg font-semibold text-foreground">{t("title")}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("description")}</p>
          </div>
          {data ? <p className="shrink-0 text-xs text-muted-foreground">{t("updatedAt", { date: dates.format(data.generatedAt) })}</p> : null}
        </div>

        {!data && query.isPending ? (
          <div role="status" aria-label={t("loading")} className="grid gap-6 md:grid-cols-2">
            {[0, 1].map(column => (
              <div key={column} className="space-y-3" aria-hidden="true">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            ))}
            <span className="sr-only">{t("loading")}</span>
          </div>
        ) : !data && query.isError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">{t("error")}</p>
            <Button size="sm" variant="flat" isLoading={query.isFetching} onPress={() => { void query.refetch(); }}>{t("retry")}</Button>
          </div>
        ) : data ? (
          <>
            {query.isError ? (
              <div role="status" className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">{t("refreshError")}</p>
                <Button size="sm" variant="flat" isLoading={query.isFetching} onPress={() => { void query.refetch(); }}>{t("retry")}</Button>
              </div>
            ) : null}
            <div className="grid min-w-0 gap-6 md:grid-cols-2 md:gap-8">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">{t("requestsTitle", { count: data.requests.total })}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t("aging", { count: data.requests.aging, days: data.agingDays })}</p>
                {data.requests.items.length ? (
                  <ul className="mt-3 divide-y divide-border/60">
                    {data.requests.items.map(item => (
                      <li key={item.id}>
                        <Link
                          href={{ pathname: "/dashboard/requests/[id]", params: { id: String(item.id) } }}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-md py-3 underline-offset-4 hover:bg-background/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <div className="min-w-0 [overflow-wrap:anywhere]">
                            <p className="text-sm font-medium text-primary">{t("requestLabel", { id: item.id })}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{requestCopy(`actions.${item.action}`)} · {requestCopy(`entityTypes.${item.entityType}`)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{t("waiting", { days: item.waitingDays })}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <p className="py-5 text-sm text-muted-foreground">{t("requestsEmpty")}</p>}
                <Link href="/dashboard/requests" className={`mt-3 inline-block ${linkClassName}`}>{t("viewRequests")}</Link>
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">{t("feedbackTitle", { count: data.feedback.total })}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t("aging", { count: data.feedback.aging, days: data.agingDays })}</p>
                {data.feedback.items.length ? (
                  <ul className="mt-3 divide-y divide-border/60">
                    {data.feedback.items.map(item => (
                      <li key={item.id}>
                        <Link
                          href={{ pathname: "/dashboard/feedback", query: { feedbackId: item.id } }}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-md py-3 underline-offset-4 hover:bg-background/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <div className="min-w-0 [overflow-wrap:anywhere]">
                            <p className="text-sm font-medium text-primary">{item.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{feedbackCopy(item.type)} · {t("waiting", { days: item.waitingDays })}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <p className="py-5 text-sm text-muted-foreground">{t("feedbackEmpty")}</p>}
                <Link href="/dashboard/feedback" className={`mt-3 inline-block ${linkClassName}`}>{t("viewFeedback")}</Link>
              </div>
            </div>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
