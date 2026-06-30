function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-5 text-slate-950 md:px-6 xl:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-8 w-40" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-3">
            <SkeletonBlock className="h-10 w-40" />
            <SkeletonBlock className="h-10 w-28" />
          </div>
        </div>

        <section
          className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4"
          aria-label="Loading deployment summary"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <SkeletonBlock className="h-12 w-12" />
                <SkeletonBlock className="h-11 w-24" />
              </div>
              <div className="mt-5 space-y-3">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-9 w-28" />
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
          <SkeletonBlock className="h-[420px] border border-slate-200 bg-white" />
          <SkeletonBlock className="h-[420px] border border-slate-200 bg-white" />
        </section>

        <SkeletonBlock className="h-[420px] border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
