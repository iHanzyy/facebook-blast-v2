export function removeImagePreview<T extends { url: string }>(
  previews: readonly T[],
  url: string,
): T[] {
  return previews.filter((preview) => preview.url !== url);
}
