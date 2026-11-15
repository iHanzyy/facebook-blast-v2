"use client";

import {
  CampaignResults,
  formatCampaignTimestamp,
} from "@/components/campaign-results";
import { FacebookSession } from "@/components/facebook-session";
import type { CampaignStatus } from "@/lib/facebook/campaign";

export function CampaignSidebar({
  campaign,
  selectedCount,
  requestError,
  canStart,
  isActive,
  onStop,
}: {
  campaign: CampaignStatus;
  selectedCount: number;
  requestError: string;
  canStart: boolean;
  isActive: boolean;
  onStop: () => void;
}) {
  const total = campaign.groups.length || selectedCount;
  const pending = campaign.groups.length
    ? campaign.groups.filter(({ status }) => status === "pending").length
    : selectedCount;
  const processing = campaign.groups.filter(
    ({ status }) => status === "processing",
  ).length;
  const hasCampaign = campaign.phase !== "idle";

  return (
    <aside className="space-y-4 lg:sticky lg:top-5 lg:h-fit" aria-label="Kontrol campaign">
      <FacebookSession />

      <section className="border border-line bg-panel" aria-labelledby="campaign-progress-title">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="campaign-progress-title" className="text-sm font-semibold text-ink">
                Status pengiriman
              </h2>
              <p className="mt-1 text-xs text-muted">
                {hasCampaign ? "Hasil campaign terakhir" : "Ringkasan tujuan saat ini"}
              </p>
            </div>
            <span className="text-xs font-semibold tabular-nums text-muted">
              {campaign.processed} / {total}
            </span>
          </div>

          <progress
            className="mt-4 h-1.5 w-full accent-accent"
            max={Math.max(total, 1)}
            value={campaign.processed}
            aria-label={`${campaign.processed} dari ${total} grup diproses`}
          />

          <dl className="mt-4 grid grid-cols-4 divide-x divide-line border border-line bg-slate-50">
            {[
              ["Antre", pending],
              ["Proses", processing],
              ["Sukses", campaign.success],
              ["Gagal", campaign.failed],
            ].map(([label, value]) => (
              <div key={label} className="px-2 py-3 text-center">
                <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  {label}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {hasCampaign ? (
          <CampaignResults groups={campaign.groups} />
        ) : (
          <p className="px-4 py-5 text-xs leading-5 text-muted sm:px-5">
            Pilih grup di sebelah kiri. Hasil pengiriman akan menampilkan waktu WIB dan alasan kegagalan per grup.
          </p>
        )}
      </section>

      <section className="border border-line bg-panel px-4 py-4 sm:px-5" aria-labelledby="campaign-action-title">
        <h2 id="campaign-action-title" className="text-sm font-semibold text-ink">
          Jalankan campaign
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Posting dikirim satu per satu. Biarkan Chrome tetap terbuka selama proses berjalan.
        </p>

        {campaign.startedAt ? (
          <dl className="mt-3 space-y-1 border-l-2 border-line pl-3 text-xs text-muted">
            <div className="flex justify-between gap-3">
              <dt>Mulai</dt>
              <dd className="text-right tabular-nums">
                {formatCampaignTimestamp(campaign.startedAt)}
              </dd>
            </div>
            {campaign.finishedAt ? (
              <div className="flex justify-between gap-3">
                <dt>Selesai</dt>
                <dd className="text-right tabular-nums">
                  {formatCampaignTimestamp(campaign.finishedAt)}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {campaign.message || requestError ? (
          <p
            role={requestError || campaign.phase === "manual_action_required" ? "alert" : "status"}
            className={`mt-3 text-xs leading-5 ${
              requestError || campaign.phase === "manual_action_required"
                ? "text-rose-700"
                : "text-muted"
            }`}
          >
            {requestError || campaign.message}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2">
          <button
            type="submit"
            disabled={!canStart}
            className="min-h-11 bg-accent px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isActive
              ? "Campaign berjalan..."
              : selectedCount > 0
                ? `Kirim ke ${selectedCount} grup`
                : "Pilih grup untuk mulai"}
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!isActive || campaign.phase === "stopping"}
            className="min-h-11 border border-line px-4 text-sm font-semibold text-ink hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-line disabled:hover:bg-transparent"
          >
            {campaign.phase === "stopping" ? "Menghentikan..." : "Hentikan campaign"}
          </button>
        </div>
      </section>
    </aside>
  );
}
