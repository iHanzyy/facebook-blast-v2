export const supportedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const imageAccept = supportedImageTypes.join(",");

export function isSupportedImageType(type: string): boolean {
  return supportedImageTypes.some((supportedType) => supportedType === type);
}
