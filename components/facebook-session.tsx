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
  if (!status) return "Memeriksa profil lokal...";
  if (status.isBrowserOpen) return "Chrome siap digunakan";
  if (status.hasSavedProfile) return "Profil tersimpan, Chrome belum dibuka";
  return "Belum terhubung";
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
    <section className="border border-line bg-panel px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">Koneksi Facebook</h2>
          <p
            className="mt-1 flex items-center gap-2 text-xs text-muted"
            role="status"
          >
            <span
              className={`size-2 shrink-0 rounded-full ${
                isOpen ? "bg-emerald-500" : "bg-slate-300"
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
          className="min-h-10 shrink-0 border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-line disabled:hover:bg-transparent"
        >
          {isOpening ? "Membuka..." : isOpen ? "Chrome terbuka" : "Buka Chrome"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        Login dilakukan manual di Chrome. Aplikasi tidak membaca atau menyimpan password.
      </p>
      {error ? (
        <p className="mt-3 text-xs leading-5 text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
