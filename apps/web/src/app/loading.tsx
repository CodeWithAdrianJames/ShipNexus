import { Rocket } from "lucide-react";

export default function Loading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-950"
      aria-busy="true"
      aria-label="Loading ShipNexus"
    >
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Rocket className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-slate-700">
          Loading ShipNexus
        </span>
      </div>
    </main>
  );
}
