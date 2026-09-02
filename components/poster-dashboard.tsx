"use client";

import { useState } from "react";

import { FacebookSession } from "@/components/facebook-session";
import { ImagePicker } from "@/components/image-picker";
import type { FacebookGroup } from "@/lib/groups";

export function PosterDashboard({ groups }: { groups: FacebookGroup[] }) {
  const [caption, setCaption] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedGroups = groups.filter((group) => selectedIds.includes(group.id));

  function toggleGroup(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
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
              Siapkan satu listing, pilih tujuan, lalu pantau setiap posting
              dari satu tempat.
            </p>
          </div>
          <span className="w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
            Local only
          </span>
        </header>

        <form className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-6" aria-label="Posting setup">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <label className="text-sm font-medium" htmlFor="caption">
                  Caption
                </label>
                <span className="text-xs tabular-nums text-slate-500">
                  {caption.length} / 5,000
                </span>
              </div>
              <textarea
                id="caption"
                value={caption}
                maxLength={5000}
                rows={7}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Tulis detail produk, kondisi, harga, dan lokasi..."
                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <ImagePicker />

            <fieldset className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <legend className="text-sm font-medium">Facebook Groups</legend>
              <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500" aria-live="polite">
                  {selectedIds.length} dari {groups.length} dipilih
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(groups.map(({ id }) => id))}
                    className="rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
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
                ) : (
                  groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-slate-800/60"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        className="size-4 rounded border-slate-600 bg-slate-950 accent-blue-500"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                        {group.name}
                      </span>
                      <span className="text-xs text-slate-600">Pending</span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <h2 className="text-sm font-medium">Posting Delay</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="text-xs text-slate-400" htmlFor="delay-min">
                  Minimum
                  <span className="relative mt-2 block">
                    <input id="delay-min" type="number" min="1" defaultValue="60" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-12 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-slate-500">sec</span>
                  </span>
                </label>
                <label className="text-xs text-slate-400" htmlFor="delay-max">
                  Maximum
                  <span className="relative mt-2 block">
                    <input id="delay-max" type="number" min="1" defaultValue="120" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-12 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-slate-500">sec</span>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit" aria-label="Campaign controls">
            <FacebookSession />

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-sm font-medium">Progress</h2>
                <span className="text-xs tabular-nums text-slate-500">0 / {selectedIds.length} processed</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
                <div className="h-full w-0 bg-blue-500" />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950 p-3">
                  <dt className="text-slate-500">Success</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-200">0</dd>
                </div>
                <div className="rounded-lg bg-slate-950 p-3">
                  <dt className="text-slate-500">Failed</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-200">0</dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="text-xs font-medium text-slate-400">Group status</p>
                {selectedGroups.length === 0 ? (
                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    Pilih minimal satu group untuk melihat status campaign.
                  </p>
                ) : (
                  <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                    {selectedGroups.map((group) => (
                      <li key={group.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-slate-400">{group.name}</span>
                        <span className="shrink-0 text-slate-600">Pending</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <h2 className="text-sm font-medium">Campaign</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Kontrol posting akan aktif setelah mesin campaign tersedia.
              </p>
              <div className="mt-5 space-y-3">
              <button type="button" disabled className="w-full cursor-not-allowed rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white opacity-50">
                Start Posting
              </button>
              <button type="button" disabled className="w-full cursor-not-allowed rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-500">
                Stop
              </button>
              </div>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}
