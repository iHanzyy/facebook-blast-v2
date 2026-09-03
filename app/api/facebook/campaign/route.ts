import {
  getCampaignStatus,
  isCampaignActive,
  startCampaign,
  stopCampaign,
} from "@/lib/facebook/campaign-runtime";
import {
  type CampaignResponse,
  validateCampaignInput,
} from "@/lib/facebook/campaign";
import type { FacebookPostError } from "@/lib/facebook/post";
import { isSameOriginRequest } from "@/lib/facebook/session";
import { getGroups } from "@/lib/groups";

export const runtime = "nodejs";

function errorResponse(error: FacebookPostError, status: number) {
  const body: CampaignResponse = { ok: false, error };
  return Response.json(body, { status });
}

export function GET() {
  const body: CampaignResponse = { ok: true, campaign: getCampaignStatus() };
  return Response.json(body);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return errorResponse(
      { code: "FORBIDDEN", message: "Request origin is not allowed." },
      403,
    );
  }
  if (isCampaignActive()) {
    return errorResponse(
      { code: "CAMPAIGN_RUNNING", message: "Campaign lain masih berjalan." },
      409,
    );
  }

  try {
    const formData = await request.formData();
    const caption = formData.get("caption");
    const groupIds = formData
      .getAll("groupIds")
      .filter((value): value is string => typeof value === "string");
    const images = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File);
    const delayMinRaw = formData.get("delayMin");
    const delayMaxRaw = formData.get("delayMax");

    if (
      typeof caption !== "string" ||
      typeof delayMinRaw !== "string" ||
      typeof delayMaxRaw !== "string"
    ) {
      return errorResponse(
        { code: "CAPTION_REQUIRED", message: "Data campaign tidak valid." },
        400,
      );
    }

    const delayMin = Number(delayMinRaw);
    const delayMax = Number(delayMaxRaw);
    const validationError = validateCampaignInput({
      caption,
      groupIds,
      images,
      delayMin,
      delayMax,
    });
    if (validationError) return errorResponse(validationError, 400);

    const groupsById = new Map(getGroups().map((group) => [group.id, group]));
    const groups = groupIds.map((id) => groupsById.get(id));
    if (groups.some((group) => !group)) {
      return errorResponse(
        { code: "GROUP_NOT_FOUND", message: "Facebook Group tidak ditemukan." },
        400,
      );
    }

    const started = startCampaign({
      caption: caption.trim(),
      groups: groups.filter((group) => group !== undefined),
      images: await Promise.all(
        images.map(async (image) => ({
          buffer: Buffer.from(await image.arrayBuffer()),
          mimeType: image.type,
          name: image.name,
        })),
      ),
      delayMin,
      delayMax,
    });
    if (!started) {
      return errorResponse(
        { code: "CAMPAIGN_RUNNING", message: "Campaign lain masih berjalan." },
        409,
      );
    }

    const body: CampaignResponse = { ok: true, campaign: getCampaignStatus() };
    return Response.json(body, { status: 202 });
  } catch {
    return errorResponse(
      { code: "POST_FAILED", message: "Campaign tidak dapat dimulai." },
      500,
    );
  }
}

export function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return errorResponse(
      { code: "FORBIDDEN", message: "Request origin is not allowed." },
      403,
    );
  }

  const body: CampaignResponse = { ok: true, campaign: stopCampaign() };
  return Response.json(body);
}
