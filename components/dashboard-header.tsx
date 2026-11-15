export function DashboardHeader() {
  return (
    <header className="mb-5 border-b border-line pb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Local dispatch workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Facebook Group Poster
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Siapkan satu listing, pisahkan target iPhone/HP dan laptop, lalu pantau waktu serta hasil setiap pengiriman.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="size-2 bg-emerald-500" aria-hidden="true" />
          Berjalan lokal di komputer ini
        </div>
      </div>
    </header>
  );
}
