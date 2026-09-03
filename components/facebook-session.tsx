"use client";

import { useEffect, useState } from "react";

import type {
  FacebookSessionResponse,
  FacebookSessionStatus,
} from "@/lib/facebook/session";

async function fetchSessionStatus(method: "GET" | "POST") {
  const response = await fetch("/api/facebook/session", {
    cache: "no-store",
    method,
  });
  const payload = (await response.json()) as FacebookSessionResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.ok ? "Session status is unavailable." : payload.error.message,
    );
  }

  return payload.status;
}

function sessionLabel(status: FacebookSessionStatus | null) {
  if (!status) return "Checking local profile...";
  if (status.isBrowserOpen) return "Login window open";
  if (status.hasSavedProfile) return "Profile saved locally";
  return "Not connected";
}

export function FacebookSession() {
  const [status, setStatus] = useState<FacebookSessionStatus | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchSessionStatus("GET")
      .then((nextStatus) => {
        if (!cancelled) setStatus(nextStatus);
      })
      .catch(() => {
        if (!cancelled) setError("Status session tidak dapat dimuat.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!status?.isBrowserOpen) return;

    const interval = window.setInterval(() => {
      fetchSessionStatus("GET").then(setStatus).catch(() => undefined);
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [status?.isBrowserOpen]);

  async function handleOpenLogin() {
    setError("");
    setIsOpening(true);

    try {
      setStatus(await fetchSessionStatus("POST"));
    } catch {
      setError("Chrome login tidak dapat dibuka. Coba jalankan lagi.");
    } finally {
      setIsOpening(false);
    }
  }

  const isOpen = status?.isBrowserOpen === true;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Facebook Session</h2>
          <p
            className="mt-1 flex items-center gap-2 text-xs text-slate-400"
            role="status"
          >
            <span
              className={`size-2 shrink-0 rounded-full ${
                isOpen ? "bg-emerald-400" : "bg-slate-600"
              }`}
              aria-hidden="true"
            />
            {sessionLabel(status)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenLogin}
          disabled={!status || isOpening || isOpen}
          className="min-h-11 shrink-0 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:border-slate-700 disabled:hover:bg-transparent"
        >
          {isOpening ? "Opening..." : isOpen ? "Window Open" : "Open Login"}
        </button>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Login manual di Google Chrome terpisah. Aplikasi tidak membaca password;
        status profil tersimpan bukan verifikasi bahwa Facebook masih login.
      </p>
      {error ? (
        <p className="mt-3 text-xs leading-5 text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
