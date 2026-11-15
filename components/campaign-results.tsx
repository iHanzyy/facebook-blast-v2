"use client";

import { useState } from "react";

import type {
  CampaignGroupPhase,
  CampaignGroupStatus,
} from "@/lib/facebook/campaign";

type ResultFilter = "all" | "success" | "issues";

const timestampFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Jakarta",
  timeZoneName: "short",
});

const statusDetails: Record<
  CampaignGroupPhase,
  { label: string; className: string }
> = {
  pending: { label: "Menunggu", className: "bg-slate-100 text-slate-600" },
  processing: { label: "Mengirim", className: "bg-blue-50 text-blue-700" },
  success: { label: "Terkirim", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Gagal", className: "bg-rose-50 text-rose-700" },
  manual_action_required: {
    label: "Perlu tindakan",
    className: "bg-amber-50 text-amber-800",
  },
};

export function formatCampaignTimestamp(value?: string) {
  if (!value) return "Belum diproses";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waktu tidak tersedia"
    : timestampFormatter.format(date);
}

function isIssue(group: CampaignGroupStatus) {
  return group.status === "failed" || group.status === "manual_action_required";
}

function ResultRow({ group }: { group: CampaignGroupStatus }) {
  const details = statusDetails[group.status];
  const timestamp = group.finishedAt ?? group.startedAt;

  return (
    <li className="grid gap-2 border-b border-line px-3 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink" title={group.name}>
            {group.name}
          </p>
          <p className="mt-1 text-xs tabular-nums text-muted">
            {formatCampaignTimestamp(timestamp)}
          </p>
        </div>
        <span
          className={`shrink-0 px-2 py-1 text-[11px] font-semibold ${details.className}`}
        >
          {details.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="border border-line bg-slate-50 px-2 py-0.5 font-medium uppercase tracking-wide text-muted">
          {group.category === "iphone" ? "iPhone & HP" : "Laptop"}
        </span>
        {group.message ? (
          <span className={isIssue(group) ? "text-rose-700" : "text-muted"}>
            {group.errorCode ? `${group.errorCode}: ` : ""}
            {group.message}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function CampaignResults({ groups }: { groups: CampaignGroupStatus[] }) {
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const issues = groups.filter(isIssue);
  const attemptedGroups = groups.filter(({ status }) => status !== "pending");
  const filteredResults = attemptedGroups.filter((group) => {
    if (resultFilter === "success") return group.status === "success";
    if (resultFilter === "issues") return isIssue(group);
    return true;
  });

  return (
    <>
      {issues.length > 0 ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-5" role="status">
          <p className="text-xs font-semibold text-amber-900">
            {issues.length} pengiriman perlu diperiksa
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Buka filter Masalah untuk melihat waktu, kode, dan penyebab setiap kegagalan.
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-1 border-b border-line px-3 py-2" aria-label="Filter hasil">
        {([
          ["all", "Semua"],
          ["success", "Sukses"],
          ["issues", "Masalah"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={resultFilter === value}
            onClick={() => setResultFilter(value)}
            className={`min-h-9 px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              resultFilter === value
                ? "bg-ink text-white"
                : "text-muted hover:bg-slate-100 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredResults.length > 0 ? (
        <ul className="max-h-80 overflow-y-auto" aria-label="Hasil per grup">
          {filteredResults.map((group) => (
            <ResultRow key={group.id} group={group} />
          ))}
        </ul>
      ) : (
        <p className="px-4 py-8 text-center text-xs text-muted">
          {attemptedGroups.length === 0
            ? "Belum ada grup yang diproses."
            : "Tidak ada hasil pada filter ini."}
        </p>
      )}
    </>
  );
}
