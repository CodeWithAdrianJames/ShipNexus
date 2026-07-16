import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

type DeploymentJobSummary = {
  serviceName: string;
  environment: string;
  status: DeploymentStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type DeploymentsResponse = {
  data: DeploymentJobSummary[];
  total: number;
  page: number;
  limit: number;
};

type EnvironmentSummary = {
  environment: string;
  totalDeployments: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  activeServices: number;
  lastActivity: string;
  avgDuration: number | null;
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

function getDurationSeconds(job: DeploymentJobSummary) {
  if (!job.startedAt || !job.completedAt) {
    return null;
  }

  const durationMs =
    new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return null;
  }

  return durationMs / 1000;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRate(value: number) {
  return `${Math.round(value)}%`;
}

function formatDuration(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(1)}s`;
}

function rateTone(value: number) {
  if (value >= 80) {
    return theme.successRate.high;
  }

  if (value >= 50) {
    return theme.successRate.medium;
  }

  return theme.successRate.low;
}

function getEnvironmentStyle(environment: string) {
  const key = environment.toLowerCase() as keyof typeof theme.env;
  return theme.env[key] ?? theme.env.development;
}

function environmentSortValue(environment: string) {
  const order: Record<string, number> = {
    production: 0,
    staging: 1,
    development: 2,
  };

  return order[environment.toLowerCase()] ?? 10;
}

function groupDeploymentsByEnvironment(jobs: DeploymentJobSummary[]) {
  const environments = new Map<string, DeploymentJobSummary[]>();

  for (const job of jobs) {
    const environmentJobs = environments.get(job.environment) ?? [];
    environmentJobs.push(job);
    environments.set(job.environment, environmentJobs);
  }

  return Array.from(environments.entries())
    .map(([environment, environmentJobs]) => {
      const successCount = environmentJobs.filter(
        (job) => job.status === "success",
      ).length;
      const failedCount = environmentJobs.filter(
        (job) => job.status === "failed",
      ).length;
      const totalDeployments = environmentJobs.length;
      const latestJob = [...environmentJobs].sort(
        (a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt),
      )[0];
      const durations = environmentJobs
        .map(getDurationSeconds)
        .filter((duration): duration is number => duration !== null);
      const avgDuration =
        durations.length === 0
          ? null
          : durations.reduce((total, duration) => total + duration, 0) /
            durations.length;

      return {
        environment,
        totalDeployments,
        successCount,
        failedCount,
        successRate:
          totalDeployments === 0 ? 0 : (successCount / totalDeployments) * 100,
        activeServices: new Set(
          environmentJobs.map((job) => job.serviceName),
        ).size,
        lastActivity: latestJob.createdAt,
        avgDuration,
      } satisfies EnvironmentSummary;
    })
    .sort((a, b) => {
      const envOrder =
        environmentSortValue(a.environment) - environmentSortValue(b.environment);

      if (envOrder !== 0) {
        return envOrder;
      }

      return a.environment.localeCompare(b.environment);
    });
}

function cardStyle() {
  const { shadow, ...card } = theme.card;
  return { ...card, boxShadow: shadow };
}

function Metric({
  label,
  value,
  valueColor = theme.text.primary,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase"
        style={{ color: theme.text.label }}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}

function RatioBar({
  successCount,
  failedCount,
}: {
  successCount: number;
  failedCount: number;
}) {
  const total = successCount + failedCount;
  const successWidth = total === 0 ? 0 : (successCount / total) * 100;
  const failedWidth = total === 0 ? 0 : (failedCount / total) * 100;

  return (
    <div>
      <div
        className="flex h-2 overflow-hidden rounded-full"
        style={{ background: theme.table.rowBorder }}
      >
        {total === 0 ? (
          <div
            className="h-full w-full"
            style={{ background: theme.status.cancelled.bg }}
          />
        ) : (
          <>
            <div
              className="h-full"
              style={{
                background: theme.successRate.high,
                width: `${successWidth}%`,
              }}
            />
            <div
              className="h-full"
              style={{
                background: theme.successRate.low,
                width: `${failedWidth}%`,
              }}
            />
          </>
        )}
      </div>
      <div
        className="mt-2 flex justify-between text-xs"
        style={{ color: theme.text.secondary }}
      >
        <span>{successCount} success</span>
        <span>{failedCount} failed</span>
      </div>
    </div>
  );
}

function EnvironmentCard({
  environment,
}: {
  environment: EnvironmentSummary;
}) {
  const envStyle = getEnvironmentStyle(environment.environment);

  return (
    <article className="p-5" style={cardStyle()}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize"
            style={{
              background: envStyle.bg,
              border: envStyle.border,
              color: envStyle.text,
            }}
          >
            {environment.environment}
          </span>
          <h2
            className="mt-4 text-xl font-semibold"
            style={{ color: theme.text.primary }}
          >
            {environment.environment}
          </h2>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            background: envStyle.bg,
            border: envStyle.border,
            color: envStyle.text,
          }}
        >
          {environment.totalDeployments} total
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-5">
        <Metric label="Total deployments" value={environment.totalDeployments} />
        <Metric
          label="Success rate"
          value={formatRate(environment.successRate)}
          valueColor={rateTone(environment.successRate)}
        />
        <Metric label="Active services" value={environment.activeServices} />
        <Metric
          label="Avg duration"
          value={formatDuration(environment.avgDuration)}
        />
      </div>

      <div
        className="mt-6 rounded-lg p-4"
        style={{
          background: theme.table.rowHover,
          border: theme.card.border,
        }}
      >
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: theme.text.label }}
        >
          Last activity
        </p>
        <p
          className="mt-1 text-sm font-semibold"
          style={{ color: theme.text.primary }}
        >
          {formatDate(environment.lastActivity)}
        </p>
      </div>

      <div className="mt-6">
        <RatioBar
          successCount={environment.successCount}
          failedCount={environment.failedCount}
        />
      </div>
    </article>
  );
}

export default async function EnvironmentsPage() {
  let environments: EnvironmentSummary[] = [];
  let error: string | null = null;

  try {
    const deployments = await fetchDeployments();
    environments = groupDeploymentsByEnvironment(deployments.data);
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Failed to fetch deployments";
  }
  const issueCount = environments.reduce(
    (total, environment) => total + environment.failedCount,
    0,
  );

  return (
    <DashboardShell
      title="Environments"
      description="Deployment health, service coverage, and rollout duration grouped by environment from the latest 100 deployment jobs."
      issueCount={issueCount}
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
            Could not load environment deployment data. {error}
          </section>
        ) : null}

        {environments.length > 0 ? (
          <section
            className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3"
            aria-label="Environment deployment summaries"
          >
            {environments.map((environment) => (
              <EnvironmentCard
                key={environment.environment}
                environment={environment}
              />
            ))}
          </section>
        ) : (
          <section
            className="px-5 py-12 text-center text-sm"
            style={{ ...cardStyle(), color: theme.text.secondary }}
          >
            No deployments found for any environment.
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
