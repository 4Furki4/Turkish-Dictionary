type SerwistClient = NonNullable<Window["serwist"]>;

export type PwaUpdateState = {
  available: boolean;
  updating: boolean;
  error: boolean;
  online: boolean;
};

export const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
export const UPDATE_CHECK_THROTTLE_MS = 60 * 1000;
export const UPDATE_ACTIVATION_TIMEOUT_MS = 30 * 1000;

type UpdateEnvironment = {
  container: ServiceWorkerContainer;
  window: Window;
  document: Document;
  isOnline: () => boolean;
  reload: () => void;
};

// The injected Serwist instance survives component remounts. Register it once,
// and remember which worker belongs to the JavaScript currently on this page.
const sessions = new WeakMap<SerwistClient, {
  registration: Promise<ServiceWorkerRegistration | undefined> | null;
  lastRegistrationAttempt: number;
  pageController: ServiceWorker | null;
}>();

export function createPwaUpdateManager(
  client: SerwistClient,
  onState: (state: PwaUpdateState) => void,
  environment: UpdateEnvironment,
) {
  const { container, window: browserWindow, document, isOnline, reload } = environment;
  let disposed = false;
  let registration: ServiceWorkerRegistration | undefined;
  let candidate: ServiceWorker | null = null;
  let dismissed: ServiceWorker | null = null;
  let acceptedWorker: ServiceWorker | null = null;
  let skipWaitingWorker: ServiceWorker | null = null;
  let reloadRequested = false;
  let reloaded = false;
  let error = false;
  let lastCheck = -Infinity;
  let checkInFlight = false;
  let activationTimer: number | undefined;
  let removeWorkerListener: (() => void) | undefined;
  const installingListeners = new Map<ServiceWorker, () => void>();
  let session = sessions.get(client);
  const hadSession = Boolean(session);

  const publish = () => {
    if (disposed) return;
    onState({
      available: Boolean(candidate && candidate !== dismissed) || error || reloadRequested,
      updating: reloadRequested,
      error,
      online: isOnline(),
    });
  };

  const stopActivationTimer = () => {
    browserWindow.clearTimeout(activationTimer);
    activationTimer = undefined;
  };

  const fail = () => {
    reloadRequested = false;
    acceptedWorker = null;
    error = true;
    stopActivationTimer();
    publish();
  };

  const reloadOnce = () => {
    if (disposed || reloaded) return;
    reloaded = true;
    stopActivationTimer();
    reload();
  };

  const setCandidate = (worker: ServiceWorker | null) => {
    if (worker === candidate) return;
    removeWorkerListener?.();
    removeWorkerListener = undefined;
    candidate = worker;
    if (!worker) return;
    const onStateChange = () => {
      if (worker.state !== "redundant" || candidate !== worker) return;
      setCandidate(null);
      // A failed or superseded download is retryable. An old controller
      // becoming redundant is never watched as the candidate here.
      fail();
    };
    worker.addEventListener("statechange", onStateChange);
    removeWorkerListener = () => worker.removeEventListener("statechange", onStateChange);
  };

  const detectController = () => {
    if (disposed || !session || !container.controller) return;
    if (!session.pageController) {
      // First installation may claim the current page. It is not an update.
      session.pageController = container.controller;
      return;
    }
    if (container.controller !== session.pageController) {
      setCandidate(registration?.waiting ?? container.controller);
      error = false;
      if (reloadRequested && (!acceptedWorker || container.controller === acceptedWorker)) reloadOnce();
      else publish();
    }
  };

  const activateWaitingWorker = () => {
    const worker = registration?.waiting ?? acceptedWorker;
    if (worker && worker === skipWaitingWorker) return;
    try {
      client.messageSkipWaiting();
      skipWaitingWorker = worker;
    } catch {
      fail();
    }
  };

  const onWaiting = (event: { sw?: ServiceWorker }) => {
    if (disposed || !event.sw || event.sw.state !== "installed") return;
    // Already-waiting events can omit isUpdate, and later updates can be
    // marked external by Serwist. The existing controller is the evidence.
    if (!session?.pageController && !container.controller) return;
    setCandidate(event.sw);
    error = false;
    publish();
    if (reloadRequested) {
      acceptedWorker = event.sw;
      activateWaitingWorker();
    }
  };

  // Serwist can stop forwarding updatefound after an external update. Own the
  // native observation as well so retries and later releases remain visible.
  const observeInstallingWorker = () => {
    const worker = registration?.installing;
    if (disposed || !worker || installingListeners.has(worker)) return;
    const stopObserving = () => {
      worker.removeEventListener("statechange", onInstallingStateChange);
      installingListeners.delete(worker);
    };
    const onInstallingStateChange = () => {
      if (disposed) return;
      if (worker.state === "installed") {
        // Check the waiting slot after the browser finishes this transition.
        void Promise.resolve().then(() => {
          if (disposed) return;
          if (registration?.waiting === worker) {
            onWaiting({ sw: worker });
            stopObserving();
          }
        });
      } else if (worker.state === "redundant" || worker.state === "activated") {
        stopObserving();
        if (worker.state === "redundant" && reloadRequested &&
          (!acceptedWorker || acceptedWorker === worker)) fail();
      }
    };
    installingListeners.set(worker, stopObserving);
    worker.addEventListener("statechange", onInstallingStateChange);
    onInstallingStateChange();
  };

  const checkForUpdate = async (force = false) => {
    if (disposed || !registration || !isOnline() || document.visibilityState !== "visible") return;
    detectController();
    if (registration.waiting) onWaiting({ sw: registration.waiting });
    if (checkInFlight || (!force && Date.now() - lastCheck < UPDATE_CHECK_THROTTLE_MS)) return;
    checkInFlight = true;
    lastCheck = Date.now();
    try {
      await registration.update();
      if (!disposed && registration.waiting) onWaiting({ sw: registration.waiting });
    } catch {
      // Background connectivity failures do not interrupt dictionary use.
      if (reloadRequested) fail();
    } finally {
      checkInFlight = false;
    }
  };

  const onResume = () => {
    if (disposed) return;
    detectController();
    publish();
    if (registration) void checkForUpdate();
    else void ensureRegistration();
  };

  // Attach listeners before registration so no waiting event can be lost.
  client.addEventListener("waiting", onWaiting);
  client.addEventListener("controlling", detectController);
  browserWindow.addEventListener("focus", onResume);
  browserWindow.addEventListener("pageshow", onResume);
  browserWindow.addEventListener("online", onResume);
  browserWindow.addEventListener("offline", onResume);
  document.addEventListener("visibilitychange", onResume);
  const checkTimer = browserWindow.setInterval(onResume, UPDATE_CHECK_INTERVAL_MS);

  if (!session) {
    session = {
      pageController: container.controller,
      registration: null,
      lastRegistrationAttempt: -Infinity,
    };
    sessions.set(client, session);
  }
  const ensureRegistration = async (initial = false) => {
    if (disposed || registration || !session) return;
    const currentSession = session;
    if (!currentSession.registration) {
      if (!initial && (!isOnline() || document.visibilityState !== "visible" ||
        Date.now() - currentSession.lastRegistrationAttempt < UPDATE_CHECK_THROTTLE_MS)) return;
      currentSession.lastRegistrationAttempt = Date.now();
      const attempt = Promise.resolve().then(() => client.register());
      currentSession.registration = attempt;
      void attempt.catch((registrationError: unknown) => {
        if (currentSession.registration === attempt) currentSession.registration = null;
        console.error("[PWA] Service worker registration failed:", registrationError);
      });
    }
    try {
      const result = await currentSession.registration;
      if (!result) currentSession.registration = null;
      if (disposed || !result || registration) return;
      registration = result;
      registration.addEventListener("updatefound", observeInstallingWorker);
      observeInstallingWorker();
      detectController();
      if (registration.waiting) onWaiting({ sw: registration.waiting });
      void checkForUpdate();
    } catch {
      // A later visible online resume can retry the shared registration.
    }
  };
  void ensureRegistration(!hadSession);
  publish();

  return {
    applyUpdate() {
      if (disposed || reloaded || reloadRequested || !isOnline()) return;
      dismissed = null;
      error = false;
      reloadRequested = true;
      acceptedWorker = registration?.waiting ?? null;
      skipWaitingWorker = null;
      publish();
      if (!registration?.waiting && container.controller && container.controller !== session?.pageController) {
        reloadOnce();
        return;
      }
      activationTimer = browserWindow.setTimeout(fail, UPDATE_ACTIVATION_TIMEOUT_MS);
      if (registration?.waiting) activateWaitingWorker();
      else void checkForUpdate(true);
    },
    dismiss() {
      if (disposed || reloadRequested) return;
      dismissed = candidate;
      error = false;
      publish();
    },
    dispose() {
      disposed = true;
      stopActivationTimer();
      browserWindow.clearInterval(checkTimer);
      removeWorkerListener?.();
      registration?.removeEventListener("updatefound", observeInstallingWorker);
      installingListeners.forEach((stopObserving) => stopObserving());
      client.removeEventListener("waiting", onWaiting);
      client.removeEventListener("controlling", detectController);
      browserWindow.removeEventListener("focus", onResume);
      browserWindow.removeEventListener("pageshow", onResume);
      browserWindow.removeEventListener("online", onResume);
      browserWindow.removeEventListener("offline", onResume);
      document.removeEventListener("visibilitychange", onResume);
    },
  };
}
