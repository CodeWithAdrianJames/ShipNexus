import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import LogsPanel, { type LogEntry } from "@/components/LogsPanel";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

type DeploymentJobSummary = {
  serviceName: string;
  status: DeploymentStatus;
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
    return "unknown-time";
  }

  return new Date(timestamp).toISOString();
}

function durationSeconds(job: DeploymentJobSummary) {
  if (!job.completedAt) {
    return 0;
  }

  const startedAt = getTimestamp(job.startedAt ?? job.createdAt);
  const completedAt = getTimestamp(job.completedAt);
  const durationMs = completedAt - startedAt;

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return 0;
  }

  return durationMs / 1000;
}

function normalizeLogStatus(status: DeploymentStatus): LogEntry["status"] {
  switch (status) {
    case "success":
    case "failed":
    case "running":
      return status;
    default:
      return "pending";
  }
}

function logMessage(job: DeploymentJobSummary) {
  switch (normalizeLogStatus(job.status)) {
    case "success":
      return `Deployment completed in ${durationSeconds(job).toFixed(1)}s`;
    case "failed":
      return `Deployment failed: ${job.errorMessage ?? "No error message provided"}`;
    case "running":
      return "Deployment in progress";
    case "pending":
      return "Deployment queued, awaiting worker";
  }
}

function toLogEntry(job: DeploymentJobSummary): LogEntry {
  const status = normalizeLogStatus(job.status);
  const timestamp = formatTimestamp(job.createdAt);

  return {
    id: `${job.serviceName}-${job.createdAt}-${status}`,
    status,
    line: `[${timestamp}] [${status.toUpperCase()}] [${job.serviceName}] ${logMessage(
      job,
    )}`,
  };
}

const cardStyle = {
  background: theme.card.background,
  border: theme.card.border,
  borderRadius: theme.card.borderRadius,
  boxShadow: theme.card.shadow,
};

export default async function LogsPage() {
  let entries: LogEntry[] = [];
  let error: string | null = null;

  try {
    const deployments = await fetchDeployments();
    entries = [...deployments.data]
      .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
      .map(toLogEntry);
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Failed to fetch deployments";
  }

  const failedCount = entries.filter((entry) => entry.status === "failed").length;

  return (
    <DashboardShell
      title="Logs"
      description="Deployment logs generated from the latest deployment activity."
      issueCount={failedCount}
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
            Could not load deployment logs. {error}
          </section>
        ) : null}

        <section className="p-4" style={cardStyle}>
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: theme.text.label }}
          >
            Total log entries
          </p>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{ color: theme.text.primary }}
          >
            {entries.length}
          </p>
        </section>

        <LogsPanel entries={entries} />
      </div>
    </DashboardShell>
  );
}
