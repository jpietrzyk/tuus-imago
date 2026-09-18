import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { APP_VERSION, fetchDeployedVersion } from "@/lib/app-version";
import {
  clearDiagnostics,
  getDiagnosticsLoadId,
  getDiagnosticsSessionId,
  readDiagnostics,
  subscribeDiagnostics,
  type DiagnosticEntry,
} from "@/lib/diagnostics-log";

/**
 * Read-only-ish overlay for the persistent diagnostics journal, enabled only
 * when the URL carries `?diag` (or `?debug`). Open the site on a phone with
 * `?diag` before reproducing the reload; the journal survives the reload, so
 * the timeline leading up to it — and the explicit reload reason — stays on
 * screen.
 */

function isDiagnosticsMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.has("diag") || params.has("debug");
}

function formatTime(at: number): string {
  const date = new Date(at);
  const pad = (value: number, width = 2) => String(value).padStart(width, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}.${pad(date.getMilliseconds(), 3)}`;
}

function findLastReload(entries: DiagnosticEntry[]): DiagnosticEntry | null {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index].kind === "reload") {
      return entries[index];
    }
  }
  return null;
}

export function DiagnosticsOverlay() {
  const [enabled] = useState(isDiagnosticsMode);
  const [entries, setEntries] = useState<DiagnosticEntry[]>(readDiagnostics);
  const [deployedVersion, setDeployedVersion] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    return subscribeDiagnostics(() => setEntries(readDiagnostics()));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    void fetchDeployedVersion().then((info) => {
      if (!cancelled) {
        setDeployedVersion(info?.version ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const lastReload = findLastReload(entries);
  const loadId = getDiagnosticsLoadId();
  const sessionId = getDiagnosticsSessionId();

  const handleCopy = () => {
    const payload = JSON.stringify(
      {
        runningVersion: APP_VERSION,
        deployedVersion,
        session: sessionId,
        load: loadId,
        exportedAt: new Date().toISOString(),
        entries,
      },
      null,
      2,
    );
    void (async () => {
      const writeText = navigator.clipboard?.writeText;
      if (!writeText) {
        // No Clipboard API (e.g. non-secure context): do not claim success.
        return;
      }
      try {
        await writeText.call(navigator.clipboard, payload);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        // Clipboard can be blocked; the journal stays readable on screen.
      }
    })();
  };

  const handleClear = () => {
    clearDiagnostics();
    setEntries([]);
  };

  return (
    <div
      data-testid="diagnostics-overlay"
      className="fixed bottom-2 left-2 z-[10000] flex max-h-[75vh] w-[min(94vw,30rem)] flex-col overflow-hidden rounded-md border border-white/15 bg-black/90 font-mono text-[11px] leading-snug text-white shadow-xl"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-white/15 px-2 py-1.5">
        <span className="font-semibold tracking-wide text-amber-300">
          DIAG
        </span>
        <span className="min-w-0 flex-1 truncate text-white/70">
          load {loadId} · sess {sessionId} · {entries.length} entries
        </span>
        <button
          type="button"
          data-testid="diagnostics-copy"
          onClick={handleCopy}
          className="rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
        >
          {copied ? "copied" : "copy"}
        </button>
        <button
          type="button"
          data-testid="diagnostics-clear"
          onClick={handleClear}
          className="rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
        >
          clear
        </button>
        <button
          type="button"
          data-testid="diagnostics-toggle"
          aria-label={collapsed ? "Expand diagnostics" : "Collapse diagnostics"}
          onClick={() => setCollapsed((value) => !value)}
          className="rounded bg-white/15 p-0.5 hover:bg-white/25"
        >
          {collapsed ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="shrink-0 space-y-0.5 border-b border-white/15 px-2 py-1.5 text-white/80">
            <div>running: {APP_VERSION}</div>
            <div>deployed: {deployedVersion ?? "checking…"}</div>
            <div data-testid="diagnostics-last-reload">
              last reload:{" "}
              {lastReload
                ? `${formatTime(lastReload.at)} ${lastReload.event}${
                    lastReload.detail ? ` — ${lastReload.detail}` : ""
                  }`
                : "none in journal"}
            </div>
          </div>

          <div
            data-testid="diagnostics-entries"
            className="min-h-0 flex-1 overflow-y-auto px-2 py-1"
          >
            {entries.length === 0 ? (
              <p className="text-white/60">journal is empty</p>
            ) : (
              entries.map((entry, index) => {
                const previous = entries[index - 1];
                const startsNewLoad =
                  index === 0 || previous.load !== entry.load;
                return (
                  <div key={`${entry.load}-${entry.at}-${index}`}>
                    {startsNewLoad && (
                      <div className="my-1 border-t border-white/20 pt-1 text-[10px] uppercase tracking-wider text-white/45">
                        load {entry.load}
                      </div>
                    )}
                    <div
                      data-testid="diagnostics-entry"
                      className="flex gap-1.5"
                    >
                      <span className="shrink-0 text-white/45">
                        {formatTime(entry.at)}
                      </span>
                      <span className="shrink-0 text-amber-300">
                        {entry.kind}
                      </span>
                      <span className="min-w-0 flex-1 break-words">
                        <span className="font-semibold">{entry.event}</span>
                        {entry.detail ? (
                          <span className="text-white/70"> {entry.detail}</span>
                        ) : null}
                        {entry.data ? (
                          <span className="text-white/50">
                            {" "}
                            {Object.entries(entry.data)
                              .map(([key, value]) => `${key}=${String(value)}`)
                              .join(" ")}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default DiagnosticsOverlay;
