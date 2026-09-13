import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupServiceWorkerUpdates } from "@/lib/service-worker-updates";

function createServiceWorker(controller: unknown = {}) {
  const listeners = new Map<string, (event: Event) => void>();

  return {
    controller,
    listeners,
    addEventListener: vi.fn((type: string, listener: (event: Event) => void) => {
      listeners.set(type, listener);
    }),
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type);
    }),
    emit(type: string) {
      listeners.get(type)?.(new Event(type));
    },
  };
}

function createRegistration() {
  return { update: vi.fn().mockResolvedValue(undefined) };
}

describe("setupServiceWorkerUpdates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("checks for an update when the app becomes visible", () => {
    const registration = createRegistration();
    const serviceWorker = createServiceWorker();
    const cleanup = setupServiceWorkerUpdates(registration, {
      serviceWorker,
      reload: vi.fn(),
    });

    document.dispatchEvent(new Event("visibilitychange"));

    expect(registration.update).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("checks on focus, online and on the poll interval", () => {
    const registration = createRegistration();
    const cleanup = setupServiceWorkerUpdates(registration, {
      serviceWorker: createServiceWorker(),
      reload: vi.fn(),
      intervalMs: 60_000,
    });

    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
    vi.advanceTimersByTime(60_000);

    expect(registration.update).toHaveBeenCalledTimes(3);
    cleanup();
  });

  it("reloads once when a new worker takes control of an existing page", () => {
    const reload = vi.fn();
    const serviceWorker = createServiceWorker({});

    setupServiceWorkerUpdates(createRegistration(), { serviceWorker, reload });
    serviceWorker.emit("controllerchange");

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload on the first install when no worker was in control", () => {
    const reload = vi.fn();
    const serviceWorker = createServiceWorker(null);

    setupServiceWorkerUpdates(createRegistration(), { serviceWorker, reload });
    serviceWorker.emit("controllerchange");

    expect(reload).not.toHaveBeenCalled();
  });

  it("reloads on a later update after a first install claimed the page", () => {
    const reload = vi.fn();
    const serviceWorker = createServiceWorker(null);

    setupServiceWorkerUpdates(createRegistration(), { serviceWorker, reload });
    serviceWorker.emit("controllerchange");
    expect(reload).not.toHaveBeenCalled();

    serviceWorker.emit("controllerchange");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reports when the deployed version differs from the running build", async () => {
    const onOutdated = vi.fn();
    const cleanup = setupServiceWorkerUpdates(createRegistration(), {
      serviceWorker: createServiceWorker(),
      reload: vi.fn(),
      currentVersion: "1.0.0+aaa",
      getDeployedVersion: vi.fn().mockResolvedValue("1.0.0+bbb"),
      onOutdated,
    });

    document.dispatchEvent(new Event("visibilitychange"));

    await Promise.resolve();
    await Promise.resolve();

    expect(onOutdated).toHaveBeenCalledWith("1.0.0+bbb", "1.0.0+aaa");
    cleanup();
  });

  it("does not report when the deployed version matches", async () => {
    const onOutdated = vi.fn();
    const cleanup = setupServiceWorkerUpdates(createRegistration(), {
      serviceWorker: createServiceWorker(),
      reload: vi.fn(),
      currentVersion: "1.0.0+aaa",
      getDeployedVersion: vi.fn().mockResolvedValue("1.0.0+aaa"),
      onOutdated,
    });

    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    await Promise.resolve();

    expect(onOutdated).not.toHaveBeenCalled();
    cleanup();
  });

  it("stops checking and removes listeners after cleanup", () => {
    const registration = createRegistration();
    const serviceWorker = createServiceWorker();
    const cleanup = setupServiceWorkerUpdates(registration, {
      serviceWorker,
      reload: vi.fn(),
    });

    cleanup();
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(registration.update).not.toHaveBeenCalled();
    expect(serviceWorker.removeEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
    );
  });
});
