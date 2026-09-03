import {
  type FacebookPostError,
  type ImageMetadata,
  validateSinglePostInput,
} from "./post.ts";

export type CampaignPhase =
  | "idle"
  | "running"
  | "stopping"
  | "stopped"
  | "completed"
  | "manual_action_required";

export type CampaignGroupPhase =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "manual_action_required";

export type CampaignGroupStatus = {
  id: string;
  name: string;
  status: CampaignGroupPhase;
  message?: string;
};

export type CampaignStatus = {
  phase: CampaignPhase;
  groups: CampaignGroupStatus[];
  processed: number;
  success: number;
  failed: number;
  currentGroupId?: string;
  delaySeconds?: number;
  message?: string;
};

export type CampaignResponse =
  | { ok: true; campaign: CampaignStatus }
  | { ok: false; error: FacebookPostError };

export const maxCampaignDelaySeconds = 3_600;

export function validateCampaignInput(input: {
  caption: string;
  groupIds: string[];
  images: ImageMetadata[];
  delayMin: number;
  delayMax: number;
}): FacebookPostError | null {
  if (input.groupIds.length === 0) {
    return { code: "GROUPS_REQUIRED", message: "Pilih minimal satu Facebook Group." };
  }
  if (new Set(input.groupIds).size !== input.groupIds.length) {
    return { code: "GROUPS_DUPLICATE", message: "Facebook Group tidak boleh duplikat." };
  }
  if (
    !Number.isInteger(input.delayMin) ||
    !Number.isInteger(input.delayMax) ||
    input.delayMin < 1 ||
    input.delayMax < input.delayMin ||
    input.delayMax > maxCampaignDelaySeconds
  ) {
    return {
      code: "DELAY_INVALID",
      message: `Delay harus bilangan bulat 1-${maxCampaignDelaySeconds} detik dan minimum tidak boleh melebihi maximum.`,
    };
  }

  return validateSinglePostInput({
    caption: input.caption,
    groupId: input.groupIds[0],
    images: input.images,
  });
}

export function randomDelaySeconds(
  minimum: number,
  maximum: number,
  random: () => number = Math.random,
) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

export async function runCampaignQueue<T>(input: {
  items: T[];
  shouldStop: () => boolean;
  process: (item: T, index: number) => Promise<void>;
  onError?: (error: unknown, item: T, index: number) => "continue" | "stop";
  wait: (index: number) => Promise<boolean>;
}): Promise<"completed" | "stopped"> {
  for (let index = 0; index < input.items.length; index += 1) {
    if (input.shouldStop()) return "stopped";

    const item = input.items[index];
    try {
      await input.process(item, index);
    } catch (error) {
      if (input.onError?.(error, item, index) === "stop") return "stopped";
    }

    if (input.shouldStop()) return "stopped";
    if (index < input.items.length - 1 && !(await input.wait(index))) {
      return "stopped";
    }
  }

  return "completed";
}
