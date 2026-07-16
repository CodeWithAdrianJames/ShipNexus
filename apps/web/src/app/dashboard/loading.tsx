function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/[0.07] ${className}`} />
  );
}

export default function Loading() {
  return (
    <div
      className="relative min-h-screen bg-[#171329] text-white"
      aria-busy="true"
      aria-label="Loading deployment dashboard"
    >
      <div className="fixed inset-x-0 top-0 z-50 flex h-1" aria-hidden="true">
        <span className="w-1/2 bg-[#526dff]" />
        <span className="w-1/2 bg-[#ef5aa5]" />
      </div>

      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#100d1c] px-6 py-6 lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start lg:overflow-y-auto">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10" />
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-28" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            {Array.from({ length: 10 }, (_, index) => (
              <SkeletonBlock key={index} className="h-11 w-full" />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-white/10 px-4 py-5 md:px-6 xl:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <SkeletonBlock className="h-8 w-40" />
                <SkeletonBlock className="h-4 w-72 max-w-full" />
              </div>
              <div className="flex gap-3">
                <SkeletonBlock className="h-10 w-40" />
                <SkeletonBlock className="h-10 w-28" />
              </div>
            </div>
          </header>

          <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
            <section
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
              aria-label="Loading deployment summary"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-white/10 bg-[#1b172d] p-5"
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
              <SkeletonBlock className="h-[420px] border border-white/10 bg-[#1b172d]" />
              <SkeletonBlock className="h-[420px] border border-white/10 bg-[#1b172d]" />
            </section>

            <SkeletonBlock className="h-[420px] border border-white/10 bg-[#1b172d]" />
          </div>
        </main>
      </div>
    </div>
  );
}
