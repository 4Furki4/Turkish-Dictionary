"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { getPathname } from "@/src/i18n/routing";
import { useProgressRouter } from "@/src/hooks/use-progress-router";
import {
  canReturnThroughHistory,
  resolveTaskReturn,
} from "@/src/lib/task-navigation";
import { authClient } from "@/src/lib/auth-client";
import { api } from "@/src/trpc/react";

interface TaskActions {
  complete: () => void;
  cancel: () => void;
  navigateTo: (target: string) => void;
  setDirty: (dirty: boolean) => void;
  registerClear: (clear: () => void) => () => void;
}
const Context = createContext<TaskActions>({
  complete() {},
  cancel() {},
  navigateTo() {},
  setDirty() {},
  registerClear: () => () => {},
});
export const useTaskActions = () => useContext(Context);
export type TaskHref = Parameters<typeof getPathname>[0]["href"];
export function useTaskHref(href: TaskHref) {
  const locale = useLocale() as "en" | "tr";
  return getPathname({ locale, href });
}

export function TaskPage({
  title,
  parent,
  parentLabel,
  children,
  capability = "signed-in",
  media = false,
}: {
  title: string;
  parent: TaskHref;
  parentLabel: string;
  children: ReactNode;
  capability?: "public" | "signed-in" | "admin";
  media?: boolean;
}) {
  const t = useTranslations("TaskPage");
  const locale = useLocale() as "en" | "tr";
  const fallback = useTaskHref(parent);
  const dashboard = useTaskHref("/dashboard");
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useProgressRouter();
  const utils = api.useUtils();
  const session = authClient.useSession();
  const [dirty, setDirty] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const leavePanel = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const clears = useRef(new Set<() => void>());
  const startUrl = useRef("");
  const returnTo = resolveTaskReturn(
    search.get("returnTo"),
    fallback,
    typeof window === "undefined"
      ? "https://task.invalid"
      : window.location.origin,
  );
  const sameParent = returnTo.split(/[?#]/)[0] === fallback.split(/[?#]/)[0];
  const sourceLabel = sameParent
    ? parentLabel
    : /\/(saved-words|kaydedilen-kelimeler)(?:[?#]|$)/.test(returnTo)
      ? t("savedWords")
      : /\/(search|arama)(?:\/|[?#]|$)/.test(returnTo)
        ? t("search")
        : t("source");
  useEffect(() => {
    mounted.current = true;
    startUrl.current = window.location.pathname + window.location.search;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      mounted.current = false;
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [pathname, search]);
  useEffect(() => {
    document.title = title;
  }, [title]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const navigate = useCallback(
    (target: string) => {
      const current =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      if (canReturnThroughHistory(current, target)) router.back();
      else router.replace(target);
    },
    [router],
  );
  const leave = useCallback(
    (target: string) => {
      if (dirty) setPendingTarget(target);
      else navigate(target);
    },
    [dirty, navigate],
  );
  useEffect(() => {
    if (pendingTarget) {
      leavePanel.current?.scrollIntoView({ block: "center" });
      leavePanel.current?.focus();
    }
  }, [pendingTarget]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element)?.closest?.("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const target = new URL(anchor.href, window.location.href);
      if (
        target.origin !== window.location.origin ||
        !mounted.current ||
        window.location.pathname + window.location.search !== startUrl.current
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setPendingTarget(target.pathname + target.search + target.hash);
    };
    document.addEventListener("click", guard, true);
    return () => document.removeEventListener("click", guard, true);
  }, [dirty]);
  const complete = useCallback(async () => {
    clears.current.forEach((clear) => clear());
    setDirty(false);
    setFinishing(true);
    try {
      await utils.invalidate();
    } finally {
      setFinishing(false);
      // A late response must not pull someone away from a different page.
      if (
        mounted.current &&
        window.location.pathname + window.location.search === startUrl.current
      ) {
        setGeneration((value) => value + 1);
        navigate(returnTo);
      }
    }
  }, [utils, returnTo, navigate]);
  const registerClear = useCallback((clear: () => void) => {
    clears.current.add(clear);
    return () => {
      clears.current.delete(clear);
    };
  }, []);
  const taskUrl = `${pathname}${search.size ? `?${search}` : ""}`;
  const signin = getPathname({
    locale,
    href: { pathname: "/signin", query: { backTo: taskUrl } },
  });
  const denied =
    capability !== "public" &&
    !session.isPending &&
    (!session.data ||
      (capability === "admin" && session.data.user.role !== "admin"));
  return (
    <Context.Provider
      value={{
        complete,
        cancel: () => leave(returnTo),
        navigateTo: leave,
        setDirty,
        registerClear,
      }}
    >
      <section
        className="mx-auto w-full max-w-5xl space-y-6 p-3 sm:p-6"
        onChangeCapture={() => setDirty(true)}
      >
        <header className="space-y-3 min-w-0">
          <NextLink
            href={returnTo}
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.button !== 0
              )
                return;
              event.preventDefault();
              leave(returnTo);
            }}
            className="inline-flex min-h-11 items-center gap-2 text-primary focus-visible:outline focus-visible:outline-2 rounded-md"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            {t("back", { destination: sourceLabel })}
          </NextLink>
          <nav aria-label={t("breadcrumbs")}>
            <ol className="flex flex-wrap items-center gap-2 text-sm break-words">
              {fallback.startsWith(dashboard + "/") && (
                <li className="hidden sm:flex items-center gap-2">
                  <NextLink href={dashboard}>{t("dashboard")}</NextLink>
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </li>
              )}
              <li className="flex min-w-0 items-center gap-2">
                <NextLink href={fallback}>{parentLabel}</NextLink>
                <ChevronRight aria-hidden className="h-4 w-4 shrink-0" />
              </li>
              <li aria-current="page" className="min-w-0 break-words">
                {title}
              </li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold break-words">{title}</h1>
        </header>
        {pendingTarget && (
          <div
            ref={leavePanel}
            tabIndex={-1}
            role="alert"
            className="rounded-md border border-warning p-4 space-y-3 bg-background/40"
          >
            <p>{t("leave")}</p>
            <div className="flex flex-wrap gap-2">
              <Button onPress={() => setPendingTarget(null)}>
                {t("keepEditing")}
              </Button>
              <Button
                color="danger"
                onPress={() => {
                  clears.current.forEach((clear) => clear());
                  setDirty(false);
                  setGeneration((value) => value + 1);
                  navigate(pendingTarget);
                }}
              >
                {t("discard")}
              </Button>
            </div>
          </div>
        )}
        {offline && <p role="status">{t("offline")}</p>}
        {media && <p className="text-sm text-default-600">{t("media")}</p>}
        <div
          key={`${session.data?.user.id ?? "guest"}:${generation}`}
          aria-busy={finishing}
          className="rounded-md border border-divider bg-background/40 p-3 sm:p-6 space-y-4 min-w-0"
        >
          <fieldset disabled={finishing} className="min-w-0 space-y-4">
            {capability !== "public" && session.isPending ? (
              <Spinner label={t("loading")} />
            ) : denied ? (
              <div role="alert" className="space-y-3">
                <p>{session.data ? t("forbidden") : t("signInRequired")}</p>
                {!session.data && (
                  <NextLink className="text-primary underline" href={signin}>
                    {t("signIn")}
                  </NextLink>
                )}
              </div>
            ) : (
              children
            )}
          </fieldset>
        </div>
      </section>
    </Context.Provider>
  );
}

export function TaskState({
  loading,
  error,
  missing,
  retry,
}: {
  loading?: boolean;
  error?: { message: string } | null;
  missing?: boolean;
  retry?: () => void;
}) {
  const t = useTranslations("TaskPage");
  if (loading) return <Spinner label={t("loading")} />;
  return (
    <div role="alert" className="space-y-3">
      <p>{missing ? t("missing") : t("loadError")}</p>
      {retry && <Button onPress={retry}>{t("retry")}</Button>}
    </div>
  );
}

export function TaskCancel() {
  const t = useTranslations("TaskPage");
  const { cancel } = useTaskActions();
  return (
    <Button variant="light" onPress={cancel}>
      {t("cancel")}
    </Button>
  );
}
