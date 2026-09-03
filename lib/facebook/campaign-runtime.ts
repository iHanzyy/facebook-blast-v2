import {
  type CampaignStatus,
  randomDelaySeconds,
  runCampaignQueue,
} from "./campaign.ts";
import {
  FacebookPostingError,
  postToFacebookGroup,
} from "./browser.ts";
import type { FacebookGroup } from "../groups.ts";

type CampaignImage = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

type CampaignRuntime = {
  status: CampaignStatus;
  stopRequested: boolean;
  delayAbort: AbortController | null;
};

const idleStatus: CampaignStatus = {
  phase: "idle",
  groups: [],
  processed: 0,
  success: 0,
  failed: 0,
};

const globalRuntime = globalThis as typeof globalThis & {
  __facebookCampaignRuntime?: CampaignRuntime;
};

// ponytail: one in-memory campaign is enough for this local single-user app.
const runtime = (globalRuntime.__facebookCampaignRuntime ??= {
  status: idleStatus,
  stopRequested: false,
  delayAbort: null,
});

function isActive() {
  return runtime.status.phase === "running" || runtime.status.phase === "stopping";
}

export function getCampaignStatus(): CampaignStatus {
  return {
    ...runtime.status,
    groups: runtime.status.groups.map((group) => ({ ...group })),
  };
}

export function isCampaignActive() {
  return isActive();
}

function updateCounts() {
  runtime.status.processed = runtime.status.groups.filter(({ status }) =>
    ["success", "failed", "manual_action_required"].includes(status),
  ).length;
  runtime.status.success = runtime.status.groups.filter(
    ({ status }) => status === "success",
  ).length;
  runtime.status.failed = runtime.status.groups.filter(({ status }) =>
    ["failed", "manual_action_required"].includes(status),
  ).length;
}

function waitForDelay(seconds: number) {
  const controller = new AbortController();
  runtime.delayAbort = controller;

  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => resolve(true), seconds * 1_000);
    controller.signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve(false);
      },
      { once: true },
    );
  }).finally(() => {
    if (runtime.delayAbort === controller) runtime.delayAbort = null;
  });
}

export function startCampaign(input: {
  caption: string;
  groups: FacebookGroup[];
  images: CampaignImage[];
  delayMin: number;
  delayMax: number;
}) {
  if (isActive()) return false;

  runtime.stopRequested = false;
  runtime.delayAbort = null;
  runtime.status = {
    phase: "running",
    groups: input.groups.map(({ id, name }) => ({
      id,
      name,
      status: "pending",
    })),
    processed: 0,
    success: 0,
    failed: 0,
    message: "Campaign dimulai.",
  };

  void runCampaign(input);
  return true;
}

async function runCampaign(input: {
  caption: string;
  groups: FacebookGroup[];
  images: CampaignImage[];
  delayMin: number;
  delayMax: number;
}) {
  try {
    const result = await runCampaignQueue({
      items: input.groups,
      shouldStop: () => runtime.stopRequested,
      process: async (group, index) => {
        const groupStatus = runtime.status.groups[index];
        groupStatus.status = "processing";
        runtime.status.currentGroupId = group.id;
        runtime.status.delaySeconds = undefined;
        runtime.status.message = `Posting ke ${group.name}...`;

        try {
          await postToFacebookGroup({
            caption: input.caption,
            group,
            images: input.images,
          });
          groupStatus.status = "success";
          groupStatus.message = "Berhasil diposting.";
        } catch (error) {
          const postingError =
            error instanceof FacebookPostingError
              ? error
              : new FacebookPostingError(
                  "POST_FAILED",
                  "Posting gagal. Periksa window Facebook lalu coba lagi.",
                );
          const requiresManualAction =
            postingError.code === "MANUAL_ACTION_REQUIRED";
          groupStatus.status = requiresManualAction
            ? "manual_action_required"
            : "failed";
          groupStatus.message = postingError.message;
          updateCounts();
          throw postingError;
        }

        updateCounts();
      },
      onError: (error) => {
        if (
          error instanceof FacebookPostingError &&
          ["MANUAL_ACTION_REQUIRED", "BROWSER_NOT_OPEN"].includes(error.code)
        ) {
          runtime.status.phase =
            error.code === "MANUAL_ACTION_REQUIRED"
              ? "manual_action_required"
              : "stopped";
          runtime.status.message = error.message;
          return "stop";
        }
        return "continue";
      },
      wait: async (index) => {
        const seconds = randomDelaySeconds(input.delayMin, input.delayMax);
        const nextGroup = input.groups[index + 1];
        runtime.status.currentGroupId = undefined;
        runtime.status.delaySeconds = seconds;
        runtime.status.message = `Menunggu ${seconds} detik sebelum ${nextGroup.name}.`;
        return waitForDelay(seconds);
      },
    });

    runtime.status.currentGroupId = undefined;
    runtime.status.delaySeconds = undefined;
    if (runtime.status.phase === "manual_action_required") return;

    if (result === "stopped") {
      runtime.status.phase = "stopped";
      runtime.status.message = "Campaign dihentikan. Group pending tidak diproses.";
    } else {
      runtime.status.phase = "completed";
      runtime.status.message = `Campaign selesai: ${runtime.status.success} berhasil, ${runtime.status.failed} gagal.`;
    }
  } catch {
    runtime.status.phase = "stopped";
    runtime.status.currentGroupId = undefined;
    runtime.status.delaySeconds = undefined;
    runtime.status.message = "Campaign berhenti karena masalah internal.";
  } finally {
    runtime.stopRequested = false;
    runtime.delayAbort = null;
    input.images.length = 0;
  }
}

export function stopCampaign() {
  if (!isActive()) return getCampaignStatus();

  runtime.stopRequested = true;
  runtime.status.phase = "stopping";
  runtime.status.message = runtime.status.currentGroupId
    ? "Stop diminta. Menunggu posting yang sedang berjalan selesai."
    : "Stop diminta. Campaign sedang dihentikan.";
  runtime.delayAbort?.abort();
  return getCampaignStatus();
}
