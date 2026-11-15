"use client";

import { useMemo, useState } from "react";

import { GroupList } from "@/components/group-list";
import type { FacebookGroup } from "@/lib/groups";

type GroupCategory = FacebookGroup["category"];

const categoryDetails: Record<
  GroupCategory,
  { label: string; description: string }
> = {
  iphone: {
    label: "iPhone & HP",
    description: "Grup jual beli iPhone, handphone, dan gadget.",
  },
  laptop: {
    label: "Laptop",
    description: "Grup jual beli laptop dan komputer.",
  },
};

const groupPageSize = 60;

export function GroupSelector({
  groups,
  selectedIds,
  disabled,
  onChange,
}: {
  groups: FacebookGroup[];
  selectedIds: string[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
}) {
  const [activeCategory, setActiveCategory] =
    useState<GroupCategory>("iphone");
  const [query, setQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(groupPageSize);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const groupsByCategory = useMemo(
    () => ({
      iphone: groups.filter(({ category }) => category === "iphone"),
      laptop: groups.filter(({ category }) => category === "laptop"),
    }),
    [groups],
  );

  const categoryGroups = groupsByCategory[activeCategory];
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  const visibleGroups = normalizedQuery
    ? categoryGroups.filter(({ name }) =>
        name.toLocaleLowerCase("id-ID").includes(normalizedQuery),
      )
    : categoryGroups;
  const renderedGroups = visibleGroups.slice(0, visibleLimit);
  const categorySelectedCount = categoryGroups.filter(({ id }) =>
    selectedIdSet.has(id),
  ).length;
  const allCategorySelected =
    categoryGroups.length > 0 && categorySelectedCount === categoryGroups.length;

  function toggleGroup(id: string) {
    onChange(
      selectedIdSet.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  }

  function toggleCategory() {
    const categoryIdSet = new Set(categoryGroups.map(({ id }) => id));
    const idsOutsideCategory = selectedIds.filter((id) => !categoryIdSet.has(id));
    onChange(
      allCategorySelected
        ? idsOutsideCategory
        : [...idsOutsideCategory, ...categoryGroups.map(({ id }) => id)],
    );
  }

  return (
    <fieldset
      disabled={disabled}
      className="border border-line bg-panel disabled:opacity-60"
    >
      <legend className="sr-only">Pilih Facebook Group</legend>

      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Tujuan posting</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              iPhone/HP dan laptop dipisahkan agar target tidak tercampur.
            </p>
          </div>
          <p className="text-xs font-medium tabular-nums text-muted" aria-live="polite">
            {selectedIds.length} dari {groups.length} dipilih
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Jenis grup">
          {(Object.keys(categoryDetails) as GroupCategory[]).map((category) => {
            const details = categoryDetails[category];
            const total = groupsByCategory[category].length;
            const selected = groupsByCategory[category].filter(({ id }) =>
              selectedIdSet.has(id),
            ).length;
            const isActive = category === activeCategory;

            return (
              <button
                key={category}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setActiveCategory(category);
                  setQuery("");
                  setVisibleLimit(groupPageSize);
                }}
                className={`border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink hover:border-slate-400"
                }`}
              >
                <span className="block text-sm font-semibold">{details.label}</span>
                <span
                  className={`mt-1 block text-xs tabular-nums ${
                    isActive ? "text-slate-300" : "text-muted"
                  }`}
                >
                  {selected} dipilih · {total} grup
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <label className="relative block min-w-0 flex-1" htmlFor="group-search">
          <span className="sr-only">Cari grup {categoryDetails[activeCategory].label}</span>
          <input
            id="group-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleLimit(groupPageSize);
            }}
            placeholder={`Cari ${categoryDetails[activeCategory].label.toLocaleLowerCase("id-ID")}...`}
            className="min-h-10 w-full border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleCategory}
            className="min-h-10 border border-line px-3 text-xs font-semibold text-ink hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {allCategorySelected ? "Kosongkan kategori" : "Pilih semua kategori"}
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="min-h-10 px-3 text-xs font-medium text-muted hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Hapus semua
          </button>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-5">
        <p className="mb-3 text-xs text-muted">
          {categoryDetails[activeCategory].description}
        </p>
        <div className="max-h-96 overflow-y-auto border border-line bg-white">
          <GroupList
            categoryIsEmpty={categoryGroups.length === 0}
            groups={renderedGroups}
            hasMore={renderedGroups.length < visibleGroups.length}
            remainingCount={Math.min(
              groupPageSize,
              visibleGroups.length - renderedGroups.length,
            )}
            selectedIdSet={selectedIdSet}
            onLoadMore={() =>
              setVisibleLimit((current) => current + groupPageSize)
            }
            onToggle={toggleGroup}
          />
        </div>
      </div>
    </fieldset>
  );
}
