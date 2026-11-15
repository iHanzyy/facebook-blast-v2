import { isSupportedImageType } from "../images.ts";

export const maxFacebookImageBytes = 10 * 1024 * 1024;
export const maxFacebookImages = 10;

export type FacebookPostErrorCode =
  | "BROWSER_NOT_OPEN"
  | "CAMPAIGN_RUNNING"
  | "CAPTION_REQUIRED"
  | "CAPTION_TOO_LONG"
  | "COMPOSER_NOT_FOUND"
  | "DELAY_INVALID"
  | "FORBIDDEN"
  | "GROUP_NOT_FOUND"
  | "GROUP_REQUIRED"
  | "GROUPS_DUPLICATE"
  | "GROUPS_REQUIRED"
  | "IMAGE_UPLOAD_FAILED"
  | "IMAGE_REQUIRED"
  | "IMAGE_TOO_LARGE"
  | "IMAGE_TYPE_UNSUPPORTED"
  | "MANUAL_ACTION_REQUIRED"
  | "POST_FAILED"
  | "POST_SUBMIT_FAILED"
  | "GROUP_NAVIGATION_FAILED"
  | "TOO_MANY_IMAGES";

export type FacebookPostError = {
  code: FacebookPostErrorCode;
  message: string;
};

export type ImageMetadata = {
  name: string;
  size: number;
  type: string;
};

export function validateSinglePostInput(input: {
  caption: string;
  groupId: string;
  images: ImageMetadata[];
}): FacebookPostError | null {
  if (!input.caption.trim()) {
    return { code: "CAPTION_REQUIRED", message: "Caption wajib diisi." };
  }
  if (input.caption.length > 5000) {
    return {
      code: "CAPTION_TOO_LONG",
      message: "Caption maksimal 5.000 karakter.",
    };
  }
  if (!input.groupId) {
    return { code: "GROUP_REQUIRED", message: "Pilih tepat satu Facebook Group." };
  }
  if (input.images.length === 0) {
    return { code: "IMAGE_REQUIRED", message: "Pilih minimal satu gambar." };
  }
  if (input.images.length > maxFacebookImages) {
    return {
      code: "TOO_MANY_IMAGES",
      message: `Maksimal ${maxFacebookImages} gambar per posting.`,
    };
  }

  for (const image of input.images) {
    if (!isSupportedImageType(image.type)) {
      return {
        code: "IMAGE_TYPE_UNSUPPORTED",
        message: `Format gambar tidak didukung: ${image.name}.`,
      };
    }
    if (image.size <= 0 || image.size > maxFacebookImageBytes) {
      return {
        code: "IMAGE_TOO_LARGE",
        message: `Ukuran ${image.name} harus antara 1 byte dan 10 MB.`,
      };
    }
  }

  return null;
}

export type FacebookPostResponse =
  | { ok: true; groupId: string; message: string }
  | { ok: false; error: FacebookPostError };

export function isFacebookManualActionUrl(rawUrl: string) {
  try {
    const { hostname, pathname } = new URL(rawUrl);
    return (
      hostname === "www.facebook.com" &&
      /^\/(login|checkpoint|recover|two_step_verification)(\/|$)/.test(pathname)
    );
  } catch {
    return false;
  }
}
