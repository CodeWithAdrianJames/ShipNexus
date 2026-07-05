import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const DAY_MS = 24 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";

type DeploymentJobSummary = {
  serviceName: string;
  imageTag: string;
  environment: string;
  status: DeploymentStatus;
  triggeredBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage?: string | null;
};

type DeploymentsResponse = {
  data: DeploymentJobSummary[];
  total: number;
  page: number;
  limit: number;
};

type TimelineSection = {
  label: string;
  jobs: DeploymentJobSummary[];
};

const cardStyle = {
  background: theme.card.background,
  border: theme.card.border,
  borderRadius: theme.card.borderRadius,
  boxShadow: theme.card.shadow,
};

async function fetchDeployments() {
  const response = await fetch(`${API_URL}/deployments?limit=50`, {
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

function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function relativeTime(value: string, now: Date) {
  const timestamp = getTimestamp(value);

  if (timestamp === 0) {
    return "-";
  }

  const seconds = Math.max(0, Math.floor((now.getTime() - timestamp) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function sectionLabel(value: string, now: Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const day = startOfDay(date);
  const today = startOfDay(now);
  const diffDays = Math.round((today.getTime() - day.getTime()) / DAY_MS);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function durationSeconds(job: DeploymentJobSummary) {
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

function formatDuration(value: number | null) {
  if (value === null) {
    return null;
  }

  if (value >= 60) {
    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    return `${minutes}m ${seconds}s`;
  }

  return `${value.toFixed(1)}s`;
}

function groupByDate(jobs: DeploymentJobSummary[], now: Date) {
  const sections = new Map<string, DeploymentJobSummary[]>();

  for (const job of jobs) {
    const label = sectionLabel(job.createdAt, now);
    const sectionJobs = sections.get(label) ?? [];
    sectionJobs.push(job);
    sections.set(label, sectionJobs);
  }

  return Array.from(sections.entries()).map(
    ([label, sectionJobs]) =>
      ({
        label,
        jobs: sectionJobs,
      }) satisfies TimelineSection,
  );
}

function statusIcon(status: DeploymentStatus) {
  switch (status) {
    case "success":
      return "✓";
    case "failed":
      return "✕";
    case "running":
      return "▶";
    default:
      return "●";
  }
}

function getStatusStyle(status: DeploymentStatus) {
  return theme.status[status];
}

function getEnvironmentStyle(environment: string) {
  const key = environment.toLowerCase() as keyof typeof theme.env;
  return theme.env[key] ?? theme.env.development;
}

function errorSnippet(errorMessage?: string | null) {
  if (!errorMessage) {
    return null;
  }

  return errorMessage.length > 100
    ? `${errorMessage.slice(0, 97)}...`
    : errorMessage;
}

function calculateStats(jobs: DeploymentJobSummary[], now: Date) {
  const lastSevenDays = jobs.filter((job) => {
    const ageMs = now.getTime() - getTimestamp(job.createdAt);
    return ageMs >= 0 && ageMs <= 7 * DAY_MS;
  });
  const successCount = lastSevenDays.filter(
    (job) => job.status === "success",
  ).length;
  const durations = lastSevenDays
    .map(durationSeconds)
    .filter((duration): duration is number => duration !== null);
  const avgDuration =
    durations.length === 0
      ? null
      : durations.reduce((total, duration) => total + duration, 0) /
        durations.length;
  const serviceCounts = jobs.reduce<Record<string, number>>((counts, job) => {
    counts[job.serviceName] = (counts[job.serviceName] ?? 0) + 1;
    return counts;
  }, {});
  const mostDeployedService =
    Object.entries(serviceCounts).sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })[0]?.[0] ?? "-";

  return {
    totalPipelineRuns: jobs.length,
    successRate:
      lastSevenDays.length === 0
        ? 0
        : Math.round((successCount / lastSevenDays.length) * 100),
    avgDuration: formatDuration(avgDuration) ?? "-",
    mostDeployedService,
  };
}

function StatCard({
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

function TimelineEntry({
  job,
  now,
}: {
  job: DeploymentJobSummary;
  now: Date;
}) {
  const duration = formatDuration(durationSeconds(job));
  const failure = job.status === "failed" ? errorSnippet(job.errorMessage) : null;
  const statusStyle = getStatusStyle(job.status);
  const envStyle = getEnvironmentStyle(job.environment);

  return (
    <li className="relative pl-12">
      <span
        className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
        style={{
          background: statusStyle.bg,
          border: statusStyle.border,
          color: statusStyle.text,
        }}
      >
        {statusIcon(job.status)}
      </span>

      <article className="p-5" style={cardStyle}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize"
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.text,
                }}
              >
                {job.status}
              </span>
              <span
                className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold"
                style={{
                  background: envStyle.bg,
                  border: envStyle.border,
                  color: envStyle.text,
                }}
              >
                {job.environment}
              </span>
            </div>

            <h2
              className="mt-3 text-base font-semibold"
              style={{ color: theme.text.primary }}
            >
              {job.serviceName}
            </h2>
            <p
              className="mt-1 break-all font-mono text-xs"
              style={{ color: theme.text.secondary }}
            >
              {job.imageTag}
            </p>
          </div>

          <div className="text-left md:text-right">
            <p
              className="text-sm font-semibold"
              style={{ color: theme.text.body }}
            >
              {relativeTime(job.createdAt, now)}
            </p>
            {duration ? (
              <p className="mt-1 text-xs" style={{ color: theme.text.secondary }}>
                {duration}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap items-center gap-3 text-sm"
          style={{ color: theme.text.secondary }}
        >
          <span>Triggered by {job.triggeredBy}</span>
          <span aria-hidden="true">•</span>
          <time dateTime={job.createdAt}>
            {new Date(job.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        </div>

        {failure ? (
          <p
            className="mt-4 rounded-lg px-3 py-2 text-sm"
            style={{
              background: theme.status.failed.bg,
              border: theme.status.failed.border,
              color: theme.status.failed.text,
            }}
          >
            {failure}
          </p>
        ) : null}
      </article>
    </li>
  );
}

export default async function PipelinesPage() {
  let jobs: DeploymentJobSummary[] = [];
  let error: string | null = null;
  const now = new Date();

  try {
    const deployments = await fetchDeployments();
    jobs = [...deployments.data].sort(
      (a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt),
    );
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Failed to fetch deployments";
  }

  const stats = calculateStats(jobs, now);
  const sections = groupByDate(jobs, now);
  const issueCount = jobs.filter((job) => job.status === "failed").length;

  return (
    <DashboardShell
      title="Pipelines"
      description="Recent deployment pipeline activity grouped by day, including status, triggers, durations, and rollout targets."
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
            Could not load pipeline activity. {error}
          </section>
        ) : null}

        <section
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Pipeline activity stats"
        >
          <StatCard label="Total pipeline runs" value={stats.totalPipelineRuns} />
          <StatCard
            label="Success rate last 7 days"
            value={`${stats.successRate}%`}
          />
          <StatCard label="Avg duration last 7 days" value={stats.avgDuration} />
          <StatCard label="Most deployed service" value={stats.mostDeployedService} />
        </section>

        {sections.length > 0 ? (
          <section className="space-y-8" aria-label="Pipeline activity feed">
            {sections.map((section) => (
              <div key={section.label}>
                <h2
                  className="mb-4 text-sm font-semibold uppercase tracking-wide"
                  style={{ color: theme.text.label }}
                >
                  {section.label}
                </h2>
                <ol className="relative space-y-4">
                  <span
                    className="absolute left-4 top-2 h-full w-px"
                    style={{ background: theme.table.rowBorder }}
                    aria-hidden="true"
                  />
                  {section.jobs.map((job) => (
                    <TimelineEntry
                      key={`${job.serviceName}-${job.imageTag}-${job.createdAt}`}
                      job={job}
                      now={now}
                    />
                  ))}
                </ol>
              </div>
            ))}
          </section>
        ) : (
          <section
            className="px-5 py-12 text-center text-sm"
            style={{ ...cardStyle, color: theme.text.secondary }}
          >
            No pipeline activity found.
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
