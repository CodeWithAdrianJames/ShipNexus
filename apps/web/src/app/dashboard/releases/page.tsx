import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

type DeploymentJobSummary = {
  serviceName: string;
  imageTag: string;
  environment: string;
  status: DeploymentStatus;
  createdAt: string;
};

type DeploymentsResponse = {
  data: DeploymentJobSummary[];
  total: number;
  page: number;
  limit: number;
};

type ReleaseStatus = "success" | "failed" | "partial";

type ReleaseSummary = {
  imageTag: string;
  services: string[];
  environments: string[];
  totalDeployments: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  firstDeployed: string;
  lastDeployed: string;
  overallStatus: ReleaseStatus;
};

async function fetchDeployments() {
  const response = await fetch(`${API_URL}/deployments?limit=100`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Deployments API returned ${response.status}`);
  }

  return (await response.json()) as DeploymentsResponse;
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatTimestamp(value: string) {
  const timestamp = getTimestamp(value);

  if (timestamp === 0) {
    return "-";
  }

  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function releaseStatus(jobs: DeploymentJobSummary[]): ReleaseStatus {
  if (jobs.every((job) => job.status === "success")) {
    return "success";
  }

  if (jobs.some((job) => job.status === "failed")) {
    return "failed";
  }

  return "partial";
}

function releaseStatusStyle(status: ReleaseStatus) {
  if (status === "success") {
    return theme.status.success;
  }

  if (status === "failed") {
    return theme.status.failed;
  }

  return theme.status.pending;
}

function environmentStyle(environment: string) {
  const key = environment.toLowerCase() as keyof typeof theme.env;
  return theme.env[key] ?? theme.env.development;
}

function groupDeploymentsByImageTag(jobs: DeploymentJobSummary[]) {
  const releases = new Map<string, DeploymentJobSummary[]>();

  for (const job of jobs) {
    const releaseJobs = releases.get(job.imageTag) ?? [];
    releaseJobs.push(job);
    releases.set(job.imageTag, releaseJobs);
  }

  return Array.from(releases.entries())
    .map(([imageTag, releaseJobs]) => {
      const sortedJobs = [...releaseJobs].sort(
        (a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt),
      );
      const successCount = releaseJobs.filter(
        (job) => job.status === "success",
      ).length;
      const failedCount = releaseJobs.filter((job) => job.status === "failed").length;
      const totalDeployments = releaseJobs.length;

      return {
        imageTag,
        services: Array.from(
          new Set(releaseJobs.map((job) => job.serviceName)),
        ).sort((a, b) => a.localeCompare(b)),
        environments: Array.from(
          new Set(releaseJobs.map((job) => job.environment)),
        ).sort((a, b) => a.localeCompare(b)),
        totalDeployments,
        successCount,
        failedCount,
        successRate:
          totalDeployments === 0
            ? 0
            : Math.round((successCount / totalDeployments) * 100),
        firstDeployed: sortedJobs[0]?.createdAt ?? "",
        lastDeployed: sortedJobs[sortedJobs.length - 1]?.createdAt ?? "",
        overallStatus: releaseStatus(releaseJobs),
      } satisfies ReleaseSummary;
    })
    .sort((a, b) => getTimestamp(b.lastDeployed) - getTimestamp(a.lastDeployed));
}

const cardStyle = {
  background: theme.card.background,
  border: theme.card.border,
  borderRadius: theme.card.borderRadius,
  boxShadow: theme.card.shadow,
};

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4" style={cardStyle}>
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: theme.text.label }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold"
        style={{ color: theme.text.primary }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReleaseStatus }) {
  const style = releaseStatusStyle(status);

  return (
    <span
      className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize"
      style={{
        background: style.bg,
        border: style.border,
        color: style.text,
      }}
    >
      {status}
    </span>
  );
}

function ServicePill({ serviceName }: { serviceName: string }) {
  return (
    <span
      className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold"
      style={{
        background: theme.table.headerBg,
        border: theme.card.border,
        color: theme.text.body,
      }}
    >
      {serviceName}
    </span>
  );
}

function EnvironmentPill({ environment }: { environment: string }) {
  const style = environmentStyle(environment);

  return (
    <span
      className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold"
      style={{
        background: style.bg,
        border: style.border,
        color: style.text,
      }}
    >
      {environment}
    </span>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: theme.text.label }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-lg font-semibold"
        style={{ color: theme.text.primary }}
      >
        {value}
      </p>
    </div>
  );
}

function ReleaseCard({ release }: { release: ReleaseSummary }) {
  return (
    <article className="p-5" style={cardStyle}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: theme.text.label }}
          >
            Release
          </p>
          <h2
            className="mt-2 break-all font-mono text-lg font-semibold"
            style={{ color: theme.text.primary }}
          >
            {release.imageTag}
          </h2>
        </div>
        <StatusBadge status={release.overallStatus} />
      </div>

      <div className="mt-5">
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: theme.text.label }}
        >
          Services deployed
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {release.services.map((serviceName) => (
            <ServicePill key={serviceName} serviceName={serviceName} />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: theme.text.label }}
        >
          Environments
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {release.environments.map((environment) => (
            <EnvironmentPill key={environment} environment={environment} />
          ))}
        </div>
      </div>

      <div
        className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4"
        style={{ borderColor: theme.table.rowBorder }}
      >
        <Metric label="Total deployments" value={release.totalDeployments} />
        <Metric label="Success rate" value={`${release.successRate}%`} />
        <Metric
          label="First deployed"
          value={formatTimestamp(release.firstDeployed)}
        />
        <Metric label="Last deployed" value={formatTimestamp(release.lastDeployed)} />
      </div>
    </article>
  );
}

export default async function ReleasesPage() {
  let releases: ReleaseSummary[] = [];
  let error: string | null = null;

  try {
    const deployments = await fetchDeployments();
    releases = groupDeploymentsByImageTag(deployments.data);
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Failed to fetch deployments";
  }

  const successfulReleases = releases.filter(
    (release) => release.overallStatus === "success",
  ).length;
  const releasesWithFailures = releases.filter(
    (release) => release.failedCount > 0,
  ).length;

  return (
    <DashboardShell
      title="Releases"
      description="Deployment jobs grouped into releases by image tag across services and environments."
      issueCount={releasesWithFailures}
      actions={
        <Link
          href="/dashboard"
          className="font-medium"
          style={theme.backButton}
        >
          &larr; Back to Dashboard
        </Link>
      }
    >
      <div className="space-y-6" style={{ color: theme.text.body }}>
        {error ? (
          <section
            className="rounded-lg px-4 py-3 text-sm font-semibold"
            style={{
              background: theme.status.failed.bg,
              border: theme.status.failed.border,
              color: theme.status.failed.text,
            }}
          >
            Could not load releases. {error}
          </section>
        ) : null}

        <section
          className="grid gap-3 md:grid-cols-3"
          aria-label="Release summary"
        >
          <SummaryItem label="Total unique releases" value={releases.length} />
          <SummaryItem
            label="Fully successful releases"
            value={successfulReleases}
          />
          <SummaryItem label="Releases with failures" value={releasesWithFailures} />
        </section>

        {releases.length > 0 ? (
          <section className="grid gap-4 xl:grid-cols-2" aria-label="Release cards">
            {releases.map((release) => (
              <ReleaseCard key={release.imageTag} release={release} />
            ))}
          </section>
        ) : (
          <section
            className="px-5 py-12 text-center text-sm"
            style={{ ...cardStyle, color: theme.text.secondary }}
          >
            No releases found.
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
