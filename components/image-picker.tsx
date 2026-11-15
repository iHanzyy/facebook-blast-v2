"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { imageAccept, isSupportedImageType } from "@/lib/images";

type ImagePreview = {
  file: File;
  url: string;
};

export function ImagePicker({
  disabled = false,
  onFilesChange,
}: {
  disabled?: boolean;
  onFilesChange: (files: File[]) => void;
}) {
  const [error, setError] = useState<string>();
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const previewsRef = useRef<ImagePreview[]>([]);

  useEffect(
    () => () => {
      previewsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    },
    [],
  );

  function replacePreviews(files: File[]) {
    previewsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    previewsRef.current = next;
    setPreviews(next);
    onFilesChange(files);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    const unsupported = files.filter((file) => !isSupportedImageType(file.type));
    if (unsupported.length > 0) {
      setError(`Format tidak didukung: ${unsupported.map(({ name }) => name).join(", ")}`);
      return;
    }

    setError(undefined);
    replacePreviews(files);
  }

  function removePreview(url: string) {
    URL.revokeObjectURL(url);
    setPreviews((current) => {
      const next = current.filter((preview) => preview.url !== url);
      previewsRef.current = next;
      onFilesChange(next.map(({ file }) => file));
      return next;
    });
  }

  return (
    <section className={`border border-line bg-panel px-4 py-4 sm:px-5 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="text-sm font-semibold text-ink" htmlFor="images">
            Foto produk
          </label>
          <p id="images-help" className="mt-1 text-xs leading-5 text-muted">
            JPG, PNG, atau WEBP · maksimal 10 file, 10 MB per file · hanya disimpan selama campaign.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted" aria-live="polite">
          {previews.length} dipilih
        </span>
      </div>
      <input
        id="images"
        type="file"
        multiple
        disabled={disabled}
        accept={imageAccept}
        aria-describedby="images-help images-error"
        onChange={handleChange}
        className="mt-4 block w-full border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-muted file:mr-4 file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed"
      />
      {error && (
        <p id="images-error" role="alert" className="mt-3 text-xs text-rose-700">
          {error}
        </p>
      )}
      {previews.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((preview, index) => (
            <li key={preview.url} className="group relative aspect-square overflow-hidden border border-line bg-slate-100">
              <Image
                fill
                unoptimized
                src={preview.url}
                alt={`Preview ${index + 1}: ${preview.file.name}`}
                sizes="(max-width: 640px) 50vw, 220px"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 truncate bg-slate-950/80 px-2 py-1.5 text-[11px] text-white">
                {preview.file.name}
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removePreview(preview.url)}
                aria-label={`Hapus ${preview.file.name}`}
                className="absolute right-2 top-2 flex size-8 items-center justify-center bg-slate-950/80 text-sm text-white hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
