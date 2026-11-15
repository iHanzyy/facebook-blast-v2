"use client";

import { useEffect, useState, type FormEvent } from "react";

import { CampaignSidebar } from "@/components/campaign-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { GroupSelector } from "@/components/group-selector";
import { ImagePicker } from "@/components/image-picker";
import { PostingDelay } from "@/components/posting-delay";
import type { CampaignResponse, CampaignStatus } from "@/lib/facebook/campaign";
import type { FacebookGroup } from "@/lib/groups";

const idleCampaign: CampaignStatus = {
  phase: "idle",
  groups: [],
  processed: 0,
  success: 0,
  failed: 0,
};

async function requestCampaign(
  method: "GET" | "POST" | "DELETE",
  body?: FormData,
) {
  const response = await fetch("/api/facebook/campaign", {
    cache: "no-store",
    method,
    body,
  });
  const result = (await response.json()) as CampaignResponse;
  if (!response.ok || !result.ok) {
    throw new Error(
      result.ok ? "Status campaign tidak dapat dimuat." : result.error.message,
    );
  }
  return result.campaign;
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
  const delayIsValid =
    Number.isInteger(Number(delayMin)) &&
    Number.isInteger(Number(delayMax)) &&
    Number(delayMin) >= 1 &&
    Number(delayMax) >= Number(delayMin) &&
    Number(delayMax) <= 3_600;
  const canStart =
    caption.trim().length > 0 &&
    images.length > 0 &&
    selectedIds.length > 0 &&
    delayIsValid &&
    !isActive;

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
      requestCampaign("GET")
        .then((status) => {
          setCampaign(status);
          setRequestError("");
        })
        .catch(() => {
          setRequestError("Status campaign terputus. Proses mungkin masih berjalan.");
        });
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [isActive]);

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
        error instanceof Error
          ? error.message
          : "Campaign tidak dapat dihentikan.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <DashboardHeader />

        <form
          onSubmit={startPosting}
          className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]"
        >
          <section className="space-y-4" aria-label="Pengaturan posting">
            <section className="border border-line bg-panel px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-semibold text-ink" htmlFor="caption">
                  Caption
                </label>
                <span className="text-xs tabular-nums text-muted">
                  {caption.length} / 5.000
                </span>
              </div>
              <p id="caption-help" className="mt-1 text-xs text-muted">
                Sertakan nama produk, kondisi, harga, lokasi COD, dan kontak yang jelas.
              </p>
              <textarea
                id="caption"
                value={caption}
                maxLength={5_000}
                rows={6}
                disabled={isActive}
                aria-describedby="caption-help"
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Contoh: iPhone 13 128 GB, kondisi mulus, fullset..."
                className="mt-3 w-full resize-y border border-line bg-white px-3 py-3 text-sm leading-6 text-ink outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </section>

            <ImagePicker disabled={isActive} onFilesChange={setImages} />

            <GroupSelector
              groups={groups}
              selectedIds={selectedIds}
              disabled={isActive}
              onChange={setSelectedIds}
            />

            <PostingDelay
              delayMin={delayMin}
              delayMax={delayMax}
              disabled={isActive}
              isValid={delayIsValid}
              onMinChange={setDelayMin}
              onMaxChange={setDelayMax}
            />
          </section>

          <CampaignSidebar
            campaign={campaign}
            selectedCount={selectedIds.length}
            requestError={requestError}
            canStart={canStart}
            isActive={isActive}
            onStop={stopPosting}
          />
        </form>
      </div>
    </main>
  );
}
