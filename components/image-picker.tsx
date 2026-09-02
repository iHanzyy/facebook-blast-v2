"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { imageAccept, isSupportedImageType } from "@/lib/images";

type ImagePreview = {
  file: File;
  url: string;
};

export function ImagePicker() {
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
      return next;
    });
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="text-sm font-medium" htmlFor="images">
            Upload Images
          </label>
          <p id="images-help" className="mt-1 text-xs text-slate-500">
            JPG, JPEG, PNG, atau WEBP. File hanya disimpan selama halaman aktif.
          </p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-slate-500" aria-live="polite">
          {previews.length} dipilih
        </span>
      </div>
      <input
        id="images"
        type="file"
        multiple
        accept={imageAccept}
        aria-describedby="images-help images-error"
        onChange={handleChange}
        className="mt-4 block w-full rounded-lg border border-dashed border-slate-700 bg-slate-950 p-3 text-sm text-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />
      {error && (
        <p id="images-error" role="alert" className="mt-3 text-xs text-rose-400">
          {error}
        </p>
      )}
      {previews.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((preview, index) => (
            <li key={preview.url} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-950">
              <Image
                fill
                unoptimized
                src={preview.url}
                alt={`Preview ${index + 1}: ${preview.file.name}`}
                sizes="(max-width: 640px) 50vw, 220px"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 truncate bg-slate-950/80 px-2 py-1.5 text-[11px] text-slate-300">
                {preview.file.name}
              </div>
              <button
                type="button"
                onClick={() => removePreview(preview.url)}
                aria-label={`Hapus ${preview.file.name}`}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-slate-950/80 text-sm text-white hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
