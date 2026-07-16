"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell
      title="Dashboard unavailable"
      description="Deployment data could not be loaded. Check the deployments API request path, API service health, and configured API URL, then try again."
      issueCount={1}
    >
      <section
        className="mx-auto w-full max-w-lg rounded-lg border border-white/10 bg-[#1b172d] p-6 text-center shadow-[0_18px_45px_rgba(4,3,16,0.16)]"
        aria-labelledby="dashboard-error-title"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#47203a] text-[#ff78b7] ring-1 ring-[#6b3056]">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2
          id="dashboard-error-title"
          className="mt-4 text-lg font-semibold text-white"
        >
          Dashboard unavailable
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#aaa4b5]">
          Deployment data could not be loaded. Check the deployments API
          request path, API service health, and configured API URL, then try
          again.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-[#817a90]">
            Error reference: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#526dff] px-4 text-sm font-semibold text-white transition hover:bg-[#4059d4] focus:outline-none focus:ring-2 focus:ring-[#7890ff] focus:ring-offset-2 focus:ring-offset-[#1b172d]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </section>
    </DashboardShell>
  );
}
