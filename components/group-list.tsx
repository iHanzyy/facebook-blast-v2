import type { FacebookGroup } from "@/lib/groups";

export function GroupList({
  categoryIsEmpty,
  groups,
  hasMore,
  remainingCount,
  selectedIdSet,
  onLoadMore,
  onToggle,
}: {
  categoryIsEmpty: boolean;
  groups: FacebookGroup[];
  hasMore: boolean;
  remainingCount: number;
  selectedIdSet: Set<string>;
  onLoadMore: () => void;
  onToggle: (id: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted">
        {categoryIsEmpty
          ? "Belum ada grup aktif di kategori ini."
          : "Tidak ada grup yang cocok dengan pencarian."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {groups.map((group) => (
        <li key={group.id}>
          <label className="flex min-h-12 cursor-pointer items-start gap-3 px-3 py-3 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={selectedIdSet.has(group.id)}
              onChange={() => onToggle(group.id)}
              className="mt-0.5 size-4 shrink-0 accent-accent"
            />
            <span className="min-w-0 text-sm leading-5 text-ink">
              {group.name}
            </span>
          </label>
        </li>
      ))}
      {hasMore ? (
        <li className="p-3">
          <button
            type="button"
            onClick={onLoadMore}
            className="min-h-10 w-full border border-line px-3 text-xs font-semibold text-ink hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Tampilkan {remainingCount} grup berikutnya
          </button>
        </li>
      ) : null}
    </ul>
  );
}
