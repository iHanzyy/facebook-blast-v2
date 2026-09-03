"use client";

import { useEffect, useState, type FormEvent } from "react";

import { FacebookSession } from "@/components/facebook-session";
import { ImagePicker } from "@/components/image-picker";
import type {
  CampaignGroupStatus,
  CampaignGroupPhase,
  CampaignResponse,
  CampaignStatus,
} from "@/lib/facebook/campaign";
import type { FacebookGroup } from "@/lib/groups";

const idleCampaign: CampaignStatus = {
  phase: "idle",
  groups: [],
  processed: 0,
  success: 0,
  failed: 0,
};

async function requestCampaign(method: "GET" | "POST" | "DELETE", body?: FormData) {
  const response = await fetch("/api/facebook/campaign", {
    cache: "no-store",
    method,
    body,
  });
  const result = (await response.json()) as CampaignResponse;
  if (!response.ok || !result.ok) {
    throw new Error(result.ok ? "Campaign tidak dapat dimuat." : result.error.message);
  }
  return result.campaign;
}

function statusLabel(status: CampaignGroupPhase) {
  if (status === "processing") return "Processing";
  if (status === "success") return "Success";
  if (status === "failed") return "Failed";
  if (status === "manual_action_required") return "Manual Action Required";
  return "Pending";
}

function statusColor(status: CampaignGroupPhase) {
  if (status === "processing") return "text-blue-400";
  if (status === "success") return "text-emerald-400";
  if (status === "failed" || status === "manual_action_required") {
    return "text-rose-400";
  }
  return "text-slate-600";
}

export function PosterDashboard({ groups }: { groups: FacebookGroup[] }) {
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [delayMin, setDelayMin] = useState("60");
  const [delayMax, setDelayMax] = useState("120");
  const [campaign, setCampaign] = useState<CampaignStatus>(idleCampaign);
  const [requestError, setRequestError] = useState("");

  const isActive = campaign.phase === "running" || campaign.phase === "stopping";
  const hasResult = campaign.phase !== "idle";
  const delayIsValid =
    Number.isInteger(Number(delayMin)) &&
    Number.isInteger(Number(delayMax)) &&
    Number(delayMin) >= 1 &&
    Number(delayMax) >= Number(delayMin) &&
    Number(delayMax) <= 3600;
  const canStart =
    caption.trim().length > 0 &&
    images.length > 0 &&
    selectedIds.length > 0 &&
    delayIsValid &&
    !hasResult;

  const selectedGroups = groups.filter((group) => selectedIds.includes(group.id));
  const visibleGroups: CampaignGroupStatus[] = hasResult
    ? campaign.groups
    : selectedGroups.map(({ id, name }) => ({
        id,
        name,
        status: "pending" as const,
      }));
  const total = hasResult ? campaign.groups.length : selectedIds.length;

  useEffect(() => {
    let cancelled = false;
    requestCampaign("GET")
      .then((status) => {
        if (!cancelled) setCampaign(status);
      })
      .catch(() => {
        if (!cancelled) setRequestError("Status campaign tidak dapat dimuat.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const interval = window.setInterval(() => {
      requestCampaign("GET").then(setCampaign).catch(() => undefined);
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [isActive]);

  function resetResult() {
    if (isActive) return;
    setCampaign(idleCampaign);
    setRequestError("");
  }

  function toggleGroup(id: string) {
    if (isActive) return;
    resetResult();
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  async function startPosting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canStart) return;

    const formData = new FormData();
    formData.set("caption", caption);
    formData.set("delayMin", delayMin);
    formData.set("delayMax", delayMax);
    selectedIds.forEach((id) => formData.append("groupIds", id));
    images.forEach((image) => formData.append("images", image));
    setRequestError("");

    try {
      setCampaign(await requestCampaign("POST", formData));
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Campaign tidak dapat dimulai.",
      );
    }
  }

  async function stopPosting() {
    setRequestError("");
    try {
      setCampaign(await requestCampaign("DELETE"));
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Campaign tidak dapat dihentikan.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Local posting workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Facebook Group Poster
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Siapkan satu listing, pilih tujuan, lalu pantau setiap posting dari satu tempat.
            </p>
          </div>
          <span className="w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
            Local only
          </span>
        </header>

        <form onSubmit={startPosting} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-6" aria-label="Posting setup">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <label className="text-sm font-medium" htmlFor="caption">Caption</label>
                <span className="text-xs tabular-nums text-slate-500">{caption.length} / 5,000</span>
              </div>
              <textarea
                id="caption"
                value={caption}
                maxLength={5000}
                rows={7}
                disabled={isActive}
                onChange={(event) => {
                  resetResult();
                  setCaption(event.target.value);
                }}
                placeholder="Tulis detail produk, kondisi, harga, dan lokasi..."
                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <ImagePicker
              disabled={isActive}
              onFilesChange={(files) => {
                resetResult();
                setImages(files);
              }}
            />

            <fieldset disabled={isActive} className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5 disabled:opacity-60 sm:p-6">
              <legend className="text-sm font-medium">Facebook Groups</legend>
              <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500" aria-live="polite">
                  {selectedIds.length} dari {groups.length} dipilih
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetResult();
                      setSelectedIds(groups.map(({ id }) => id));
                    }}
                    className="rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetResult();
                      setSelectedIds([]);
                    }}
                    className="rounded-md px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="max-h-96 divide-y divide-slate-800 overflow-y-auto rounded-lg border border-slate-800">
                {groups.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">
                    Tidak ada group aktif di data/groups.json.
                  </p>
                ) : groups.map((group) => {
                  const status = campaign.groups.find(({ id }) => id === group.id)?.status ?? "pending";
                  return (
                    <label key={group.id} className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-slate-800/60">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        className="size-4 rounded border-slate-600 bg-slate-950 accent-blue-500"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{group.name}</span>
                      <span className={`text-xs ${statusColor(status)}`}>{statusLabel(status)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset disabled={isActive} className="rounded-xl border border-slate-800 bg-slate-900 p-5 disabled:opacity-60 sm:p-6">
              <legend className="text-sm font-medium">Posting Delay</legend>
              <p className="mt-1 text-xs text-slate-500">Delay acak diterapkan di antara posting, maksimal 3.600 detik.</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="text-xs text-slate-400" htmlFor="delay-min">
                  Minimum
                  <span className="relative mt-2 block">
                    <input id="delay-min" type="number" min="1" max="3600" step="1" value={delayMin} onChange={(event) => { resetResult(); setDelayMin(event.target.value); }} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-12 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-slate-500">sec</span>
                  </span>
                </label>
                <label className="text-xs text-slate-400" htmlFor="delay-max">
                  Maximum
                  <span className="relative mt-2 block">
                    <input id="delay-max" type="number" min="1" max="3600" step="1" value={delayMax} onChange={(event) => { resetResult(); setDelayMax(event.target.value); }} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-12 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-slate-500">sec</span>
                  </span>
                </label>
              </div>
              {!delayIsValid && <p role="alert" className="mt-3 text-xs text-rose-400">Minimum harus 1-3.600 detik dan tidak boleh lebih besar dari maximum.</p>}
            </fieldset>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit" aria-label="Campaign controls">
            <FacebookSession />

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-sm font-medium">Progress</h2>
                <span className="text-xs tabular-nums text-slate-500">{campaign.processed} / {total} processed</span>
              </div>
              <progress className="mt-4 h-1.5 w-full accent-blue-500" max={Math.max(total, 1)} value={campaign.processed} aria-label={`${campaign.processed} dari ${total} group diproses`} />
              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950 p-3">
                  <dt className="text-slate-500">Success</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-200">{campaign.success}</dd>
                </div>
                <div className="rounded-lg bg-slate-950 p-3">
                  <dt className="text-slate-500">Failed</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-200">{campaign.failed}</dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="text-xs font-medium text-slate-400">Group status</p>
                {visibleGroups.length === 0 ? (
                  <p className="mt-3 text-xs leading-5 text-slate-600">Pilih minimal satu group untuk melihat status campaign.</p>
                ) : (
                  <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                    {visibleGroups.map((group) => (
                      <li key={group.id} className="flex items-start justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate text-slate-400" title={group.message}>{group.name}</span>
                        <span className={`shrink-0 ${statusColor(group.status)}`}>{statusLabel(group.status)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <h2 className="text-sm font-medium">Campaign</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Posting berjalan satu per satu. Biarkan window Chrome tetap terbuka.
              </p>
              {(campaign.message || requestError) && (
                <p role={campaign.phase === "completed" ? "status" : "alert"} className={`mt-4 text-xs leading-5 ${campaign.phase === "completed" ? "text-emerald-400" : requestError || campaign.phase === "manual_action_required" ? "text-rose-400" : "text-blue-300"}`}>
                  {requestError || campaign.message}
                </p>
              )}
              <div className="mt-5 space-y-3">
                <button type="submit" disabled={!canStart} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50">
                  {isActive ? "Campaign Running..." : hasResult ? "Edit setup to start again" : "Start Posting"}
                </button>
                <button type="button" onClick={stopPosting} disabled={!isActive || campaign.phase === "stopping"} className="w-full rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:border-slate-700 disabled:hover:bg-transparent">
                  {campaign.phase === "stopping" ? "Stopping..." : "Stop"}
                </button>
              </div>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}
