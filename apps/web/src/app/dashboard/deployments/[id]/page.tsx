import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";
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
    <div className="grid gap-1 border-b border-white/10 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm font-medium text-[#817a90]">{label}</dt>
      <dd className="break-words text-sm font-semibold text-[#f8f7fb]">
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
    <DashboardShell
      title="Deployment Job"
      description={job.id}
      issueCount={job.status === "failed" ? 1 : 0}
      actions={<StatusBadge status={job.status} />}
    >
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-[#91a5ff] transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#526dff]"
        >
          ← Back to Dashboard
        </Link>

        <section className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-[#1b172d] shadow-[0_18px_45px_rgba(4,3,16,0.16)]">
          <header className="border-b border-white/10 px-6 py-5">
            <p className="text-xs font-semibold uppercase text-[#817a90]">
              Service name
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {job.serviceName}
            </h2>
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
            <section className="mx-6 mt-6 rounded-lg border border-[#6b3056] bg-[#47203a] p-4">
              <h2 className="text-sm font-semibold text-[#ff9fca]">
                Error message
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#f5bad5]">
                {job.errorMessage}
              </p>
            </section>
          ) : null}

          <section className="p-6">
            <h2 className="text-sm font-semibold text-[#f8f7fb]">Payload</h2>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-[#0d0b18] p-4 text-sm leading-6 text-[#ded9e3]">
              <code>{payload}</code>
            </pre>
          </section>
        </section>
      </div>
    </DashboardShell>
  );
}
