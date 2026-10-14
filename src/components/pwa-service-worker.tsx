"use client";

import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { createPwaUpdateManager, type PwaUpdateState } from "@/src/lib/pwa-updates";

const isServiceWorkerEnabled = process.env.NODE_ENV === "production";

export default function PWAServiceWorker() {
  const t = useTranslations("PwaUpdate");
  const titleId = useId();
  const manager = useRef<ReturnType<typeof createPwaUpdateManager> | null>(null);
  const [state, setState] = useState<PwaUpdateState>({
    available: false,
    updating: false,
    error: false,
    online: true,
  });

  useEffect(() => {
    if (
      !isServiceWorkerEnabled ||
      !("serviceWorker" in navigator) ||
      window.serwist === undefined
    ) {
      return;
    }

    const updates = createPwaUpdateManager(window.serwist, setState, {
      container: navigator.serviceWorker,
      window,
      document,
      isOnline: () => navigator.onLine,
      reload: () => window.location.reload(),
    });
    manager.current = updates;
    return () => {
      updates.dispose();
      manager.current = null;
    };
  }, []);

  if (!state.available) return null;

  return (
    <aside
      aria-labelledby={titleId}
      className="fixed z-[60] inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] mx-auto w-auto max-w-md rounded-2xl border border-divider bg-background/40 p-4 shadow-xl backdrop-blur-xl md:inset-x-auto md:right-6 md:bottom-6 md:w-[min(28rem,calc(100vw-3rem))]"
    >
      <div role="status" aria-live="polite" aria-atomic="true">
        <div className="flex items-center gap-2 text-foreground">
          <RefreshCw className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p id={titleId} className="font-semibold">{t("title")}</p>
        </div>
        <p className="mt-2 text-sm text-foreground/80">{t("description")}</p>
        {!state.online && <p className="mt-2 text-sm text-foreground/80">{t("offline")}</p>}
        {state.error && <p className="mt-2 text-sm text-danger">{t("error")}</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          color="primary"
          size="sm"
          className="min-h-10 flex-1 px-4 font-medium"
          isDisabled={!state.online || state.updating}
          isLoading={state.updating}
          disableAnimation
          disableRipple
          spinner={<RefreshCw className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
          onPress={() => manager.current?.applyUpdate()}
        >
          {t(state.updating ? "updating" : state.error ? "retry" : "update")}
        </Button>
        <Button
          variant="bordered"
          size="sm"
          className="min-h-10 flex-1 px-4 font-medium"
          isDisabled={state.updating}
          disableAnimation
          disableRipple
          onPress={() => manager.current?.dismiss()}
        >
          {t("later")}
        </Button>
      </div>
    </aside>
  );
}
