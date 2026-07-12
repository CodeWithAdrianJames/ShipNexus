import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const dynamic = "force-dynamic";

type DeploymentJobSummary = {
  id: string;
  serviceName: string;
  status: DeploymentStatus;
  createdAt: string;
  errorMessage?: string | null;
};

type DeploymentsResponse = {
  data: DeploymentJobSummary[];
  total: number;
  page: number;
  limit: number;
};

type AlertSeverity = "critical" | "warning" | "info";

type DeploymentAlert = {
  id: string;
  severity: AlertSeverity;
  message: string;
  serviceName: string;
  timestamp: string;
  deploymentId: string;
};

type SeverityGroup = {
  severity: AlertSeverity;
  label: string;
  alerts: DeploymentAlert[];
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

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(1, Math.floor(milliseconds / MINUTE_MS));

  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${
    minutes === 1 ? "" : "s"
  }`;
}

function severityStyle(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return theme.status.failed;
    case "warning":
      return theme.status.pending;
    case "info":
      return theme.status.queued;
  }
}

const cardStyle = {
  background: theme.card.background,
  border: theme.card.border,
  borderRadius: theme.card.borderRadius,
  boxShadow: theme.card.shadow,
};

function groupJobsByService(jobs: DeploymentJobSummary[]) {
  const services = new Map<string, DeploymentJobSummary[]>();

  for (const job of jobs) {
    const serviceJobs = services.get(job.serviceName) ?? [];
    serviceJobs.push(job);
    services.set(job.serviceName, serviceJobs);
  }

  for (const serviceJobs of services.values()) {
    serviceJobs.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
  }

  return services;
}

function buildCriticalAlerts(jobs: DeploymentJobSummary[], now: Date) {
  const cutoff = now.getTime() - 24 * HOUR_MS;

  return jobs
    .filter(
      (job) =>
        job.status === "failed" &&
        getTimestamp(job.createdAt) >= cutoff &&
        getTimestamp(job.createdAt) <= now.getTime(),
    )
    .map(
      (job) =>
        ({
          id: `critical-${job.id}`,
          severity: "critical",
          message: `${job.serviceName} deployment failed: ${
            job.errorMessage ?? "No error message provided"
          }`,
          serviceName: job.serviceName,
          timestamp: job.createdAt,
          deploymentId: job.id,
        }) satisfies DeploymentAlert,
    );
}

function buildWarningAlerts(
  jobs: DeploymentJobSummary[],
  services: Map<string, DeploymentJobSummary[]>,
  now: Date,
) {
  const alerts: DeploymentAlert[] = [];

  for (const [serviceName, serviceJobs] of services.entries()) {
    if (serviceJobs.length >= 3) {
      const failedJobs = serviceJobs.filter((job) => job.status === "failed");
      const failureRate = Math.round((failedJobs.length / serviceJobs.length) * 100);

      if (failureRate > 50) {
        const latestJob = serviceJobs[0];
        alerts.push({
          id: `warning-failure-rate-${serviceName}`,
          severity: "warning",
          message: `${serviceName} has ${failureRate}% failure rate`,
          serviceName,
          timestamp: latestJob.createdAt,
          deploymentId: latestJob.id,
        });
      }
    }
  }

  for (const job of jobs) {
    const ageMs = now.getTime() - getTimestamp(job.createdAt);

    if (job.status === "pending" && ageMs > 10 * MINUTE_MS) {
      alerts.push({
        id: `warning-pending-${job.id}`,
        severity: "warning",
        message: `${job.serviceName} has been pending for ${formatDuration(ageMs)}`,
        serviceName: job.serviceName,
        timestamp: job.createdAt,
        deploymentId: job.id,
      });
    }
  }

  return alerts;
}

function buildInfoAlerts(services: Map<string, DeploymentJobSummary[]>) {
  const alerts: DeploymentAlert[] = [];

  for (const [serviceName, serviceJobs] of services.entries()) {
    let consecutiveSuccesses = 0;

    for (const job of serviceJobs) {
      if (job.status !== "success") {
        break;
      }

      consecutiveSuccesses += 1;
    }

    if (consecutiveSuccesses >= 3) {
      const latestJob = serviceJobs[0];
      alerts.push({
        id: `info-stable-${serviceName}`,
        severity: "info",
        message: `${serviceName} stable across last ${consecutiveSuccesses} deployments`,
        serviceName,
        timestamp: latestJob.createdAt,
        deploymentId: latestJob.id,
      });
    }
  }

  return alerts;
}

function buildAlerts(jobs: DeploymentJobSummary[], now: Date) {
  const services = groupJobsByService(jobs);

  return [
    ...buildCriticalAlerts(jobs, now),
    ...buildWarningAlerts(jobs, services, now),
    ...buildInfoAlerts(services),
  ].sort((a, b) => getTimestamp(b.timestamp) - getTimestamp(a.timestamp));
}

function groupAlerts(alerts: DeploymentAlert[]): SeverityGroup[] {
  return [
    {
      severity: "critical",
      label: "Critical",
      alerts: alerts.filter((alert) => alert.severity === "critical"),
    },
    {
      severity: "warning",
      label: "Warning",
      alerts: alerts.filter((alert) => alert.severity === "warning"),
    },
    {
      severity: "info",
      label: "Info",
      alerts: alerts.filter((alert) => alert.severity === "info"),
    },
  ];
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const style = severityStyle(severity);

  return (
    <span
      className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize"
      style={{
        background: style.bg,
        border: style.border,
        color: style.text,
      }}
    >
      {severity}
    </span>
  );
}

function AlertCard({ alert }: { alert: DeploymentAlert }) {
  const style = severityStyle(alert.severity);

  return (
    <article
      className="p-5"
      style={{
        ...cardStyle,
        borderLeft: `4px solid ${style.text}`,
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <SeverityBadge severity={alert.severity} />
          <h3
            className="mt-3 text-base font-semibold"
            style={{ color: theme.text.primary }}
          >
            {alert.message}
          </h3>
          <p className="mt-2 text-sm" style={{ color: theme.text.secondary }}>
            Affected service: {alert.serviceName}
          </p>
        </div>

        <div className="shrink-0 md:text-right">
          <p className="text-sm font-medium" style={{ color: theme.text.body }}>
            {formatTimestamp(alert.timestamp)}
          </p>
          <Link
            href={`/dashboard/deployments/${alert.deploymentId}`}
            className="mt-2 inline-flex text-sm font-semibold"
            style={theme.backButton}
          >
            View deployment
          </Link>
        </div>
      </div>
    </article>
  );
}

function SummaryBar({
  criticalCount,
  warningCount,
  infoCount,
}: {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}) {
  const total = criticalCount + warningCount + infoCount;

  if (total === 0) {
    return (
      <section
        className="px-5 py-4 text-sm font-semibold"
        style={{
          background: theme.status.success.bg,
          border: theme.status.success.border,
          borderRadius: theme.card.borderRadius,
          color: theme.status.success.text,
        }}
      >
        All clear — no active alerts
      </section>
    );
  }

  return (
    <section
      className="flex flex-wrap gap-4 px-5 py-4 text-sm font-semibold"
      style={cardStyle}
      aria-label="Alert summary"
    >
      <span style={{ color: theme.status.failed.text }}>
        {criticalCount} Critical
      </span>
      <span style={{ color: theme.status.pending.text }}>
        {warningCount} Warnings
      </span>
      <span style={{ color: theme.status.queued.text }}>{infoCount} Info</span>
    </section>
  );
}

export default async function AlertsPage() {
  let alerts: DeploymentAlert[] = [];
  let error: string | null = null;
  const now = new Date();

  try {
    const deployments = await fetchDeployments();
    alerts = buildAlerts(deployments.data, now);
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Failed to fetch deployments";
  }

  const groups = groupAlerts(alerts);
  const criticalCount = groups[0].alerts.length;
  const warningCount = groups[1].alerts.length;
  const infoCount = groups[2].alerts.length;

  return (
    <DashboardShell
      title="Alerts"
      description="Deployment alerts derived from recent failures, stuck pending jobs, failure rates, and stable services."
      issueCount={criticalCount + warningCount}
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
            Could not load deployment alerts. {error}
          </section>
        ) : null}

        <SummaryBar
          criticalCount={criticalCount}
          warningCount={warningCount}
          infoCount={infoCount}
        />

        {alerts.length > 0 ? (
          <section className="space-y-8" aria-label="Deployment alerts">
            {groups.map((group) =>
              group.alerts.length > 0 ? (
                <div key={group.severity}>
                  <h2
                    className="mb-4 text-sm font-semibold uppercase tracking-normal"
                    style={{ color: theme.text.label }}
                  >
                    {group.label}
                  </h2>
                  <div className="space-y-4">
                    {group.alerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}
