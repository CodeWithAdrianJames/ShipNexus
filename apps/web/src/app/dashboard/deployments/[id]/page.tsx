import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import type { DeploymentJob } from "@/database/schema";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date | string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

function duration(start: Date | string | null, end: Date | string | null) {
  if (!start || !end) return "-";

  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "-";

  return `${(ms / 1000).toFixed(1)}s`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="break-words text-sm font-semibold text-slate-950">
        {value}
      </dd>
    </div>
  );
}

export default async function DeploymentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const response = await fetch(`${API_URL}/deployments/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`Deployments API returned ${response.status}`);
  }

  const job = (await response.json()) as DeploymentJob;
  const payload = JSON.stringify(job.payload ?? null, null, 2);

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
        >
          ← Back to Dashboard
        </Link>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm shadow-blue-950/5">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Deployment Job
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                {job.serviceName}
              </h1>
              <p className="mt-2 break-all font-mono text-xs text-slate-500">
                {job.id}
              </p>
            </div>
            <StatusBadge status={job.status} />
          </header>

          <dl className="px-6">
            <DetailRow label="Service name" value={job.serviceName} />
            <DetailRow label="Image tag" value={job.imageTag} />
            <DetailRow label="Environment" value={job.environment} />
            <DetailRow label="Created at" value={formatDate(job.createdAt)} />
            <DetailRow label="Started at" value={formatDate(job.startedAt)} />
            <DetailRow
              label="Completed at"
              value={formatDate(job.completedAt)}
            />
            <DetailRow
              label="Duration"
              value={duration(job.startedAt, job.completedAt)}
            />
          </dl>

          {job.status === "failed" && job.errorMessage ? (
            <section className="mx-6 mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4">
              <h2 className="text-sm font-semibold text-rose-900">
                Error message
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-rose-800">
                {job.errorMessage}
              </p>
            </section>
          ) : null}

          <section className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Payload</h2>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
              <code>{payload}</code>
            </pre>
          </section>
        </section>
      </div>
    </main>
  );
}
