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
  triggeredBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage?: string | null;
  webhookEventId: string | null;
};

type DeploymentsResponse = {
  data: DeploymentJobSummary[];
  total: number;
  page: number;
  limit: number;
};

type ServiceSummary = {
  serviceName: string;
  totalDeployments: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  lastDeployed: string;
  lastStatus: DeploymentStatus;
  environments: string[];
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

function rateTone(value: number) {
  if (value >= 80) {
    return theme.successRate.high;
  }

  if (value >= 50) {
    return theme.successRate.medium;
  }

  return theme.successRate.low;
}

function groupDeploymentsByService(jobs: DeploymentJobSummary[]) {
  const services = new Map<string, DeploymentJobSummary[]>();

  for (const job of jobs) {
    const serviceJobs = services.get(job.serviceName) ?? [];
    serviceJobs.push(job);
    services.set(job.serviceName, serviceJobs);
  }

  return Array.from(services.entries())
    .map(([serviceName, serviceJobs]) => {
      const sortedJobs = [...serviceJobs].sort(
        (a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt),
      );
      const successCount = serviceJobs.filter(
        (job) => job.status === "success",
      ).length;
      const failedCount = serviceJobs.filter(
        (job) => job.status === "failed",
      ).length;
      const totalDeployments = serviceJobs.length;
      const latestJob = sortedJobs[0];

      return {
        serviceName,
        totalDeployments,
        successCount,
        failedCount,
        successRate:
          totalDeployments === 0 ? 0 : (successCount / totalDeployments) * 100,
        lastDeployed: latestJob.createdAt,
        lastStatus: latestJob.status,
        environments: Array.from(
          new Set(serviceJobs.map((job) => job.environment)),
        ).sort((a, b) => a.localeCompare(b)),
      } satisfies ServiceSummary;
    })
    .sort((a, b) => {
      if (b.totalDeployments !== a.totalDeployments) {
        return b.totalDeployments - a.totalDeployments;
      }

      return a.serviceName.localeCompare(b.serviceName);
    });
}

function getMostActiveService(services: ServiceSummary[]) {
  return services[0] ?? null;
}

function getHealthiestService(services: ServiceSummary[]) {
  return (
    services
      .filter((service) => service.totalDeployments >= 2)
      .sort((a, b) => {
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate;
        }

        if (b.totalDeployments !== a.totalDeployments) {
          return b.totalDeployments - a.totalDeployments;
        }

        return a.serviceName.localeCompare(b.serviceName);
      })[0] ?? null
  );
}

function cardStyle() {
  const { shadow, ...card } = theme.card;
  return { ...card, boxShadow: shadow };
}

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="p-5" style={cardStyle()}>
      <p
        className="text-xs font-semibold uppercase"
        style={{ color: theme.text.label }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-3xl font-semibold"
        style={{ color: theme.text.primary }}
      >
        {value}
      </p>
      <p className="mt-1 text-sm" style={{ color: theme.text.secondary }}>
        {detail}
      </p>
    </div>
  );
}

function getEnvironmentStyle(environment: string) {
  const key = environment.toLowerCase() as keyof typeof theme.env;
  return theme.env[key] ?? theme.env.development;
}

function StatusBadge({ status }: { status: DeploymentStatus }) {
  const statusStyle = theme.status[status];

  return (
    <span
      className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize"
      style={{
        background: statusStyle.bg,
        border: statusStyle.border,
        color: statusStyle.text,
      }}
    >
      {status}
    </span>
  );
}

export default async function ServicesPage() {
  let services: ServiceSummary[] = [];
  let error: string | null = null;

  try {
    const deployments = await fetchDeployments();
    services = groupDeploymentsByService(deployments.data);
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Failed to fetch deployments";
  }

  const mostActiveService = getMostActiveService(services);
  const healthiestService = getHealthiestService(services);
  const issueCount = services.reduce(
    (total, service) => total + service.failedCount,
    0,
  );

  return (
    <DashboardShell
      title="Services"
      description="Deployment health, activity, and environment coverage grouped by service from the latest 100 deployment jobs."
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
      <style>
        {`
          .services-table-row:hover {
            background: ${theme.table.rowHover};
          }
        `}
      </style>
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
            Could not load service deployment data. {error}
          </section>
        ) : null}

        <section
          className="grid gap-3 md:grid-cols-3"
          aria-label="Services summary"
        >
          <SummaryItem
            label="Unique services"
            value={String(services.length)}
            detail="Services with at least one deployment"
          />
          <SummaryItem
            label="Most active service"
            value={mostActiveService?.serviceName ?? "-"}
            detail={
              mostActiveService
                ? `${mostActiveService.totalDeployments} deployment${
                    mostActiveService.totalDeployments === 1 ? "" : "s"
                  }`
                : "No deployment activity"
            }
          />
          <SummaryItem
            label="Healthiest service"
            value={healthiestService?.serviceName ?? "-"}
            detail={
              healthiestService
                ? `${formatRate(healthiestService.successRate)} success across ${
                    healthiestService.totalDeployments
                  } deployments`
                : "Needs at least 2 deployments"
            }
          />
        </section>

        <section className="overflow-hidden" style={cardStyle()}>
          <div
            className="px-5 py-4"
            style={{ borderBottom: `1px solid ${theme.table.rowBorder}` }}
          >
            <h2
              className="text-base font-semibold"
              style={{ color: theme.text.primary }}
            >
              Service deployment health
            </h2>
            <p className="mt-1 text-sm" style={{ color: theme.text.secondary }}>
              Success rates are calculated from all fetched jobs for each
              service.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead
                style={{
                  background: theme.table.headerBg,
                  borderBottom: `1px solid ${theme.table.rowBorder}`,
                }}
              >
                <tr>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                    style={{ color: theme.table.headerText }}
                  >
                    Service name
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                    style={{ color: theme.table.headerText }}
                  >
                    Total deployments
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                    style={{ color: theme.table.headerText }}
                  >
                    Success rate
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                    style={{ color: theme.table.headerText }}
                  >
                    Last deployed
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                    style={{ color: theme.table.headerText }}
                  >
                    Last status
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                    style={{ color: theme.table.headerText }}
                  >
                    Environments
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.length > 0 ? (
                  services.map((service) => (
                    <tr
                      key={service.serviceName}
                      className="services-table-row transition"
                      style={{
                        borderBottom: `1px solid ${theme.table.rowBorder}`,
                      }}
                    >
                      <td
                        className="whitespace-nowrap px-5 py-4 text-sm font-semibold"
                        style={{ color: theme.text.primary }}
                      >
                        {service.serviceName}
                      </td>
                      <td
                        className="whitespace-nowrap px-5 py-4 text-sm"
                        style={{ color: theme.text.body }}
                      >
                        {service.totalDeployments}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm">
                        <span
                          className="font-semibold"
                          style={{ color: rateTone(service.successRate) }}
                        >
                          {formatRate(service.successRate)}
                        </span>
                        <span
                          className="ml-2 text-xs"
                          style={{ color: theme.text.secondary }}
                        >
                          {service.successCount} success /{" "}
                          {service.failedCount} failed
                        </span>
                      </td>
                      <td
                        className="whitespace-nowrap px-5 py-4 text-sm"
                        style={{ color: theme.text.secondary }}
                      >
                        {formatDate(service.lastDeployed)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm">
                        <StatusBadge status={service.lastStatus} />
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {service.environments.map((environment) => {
                            const envStyle = getEnvironmentStyle(environment);

                            return (
                              <span
                                key={environment}
                                className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold"
                                style={{
                                  background: envStyle.bg,
                                  border: envStyle.border,
                                  color: envStyle.text,
                                }}
                              >
                                {environment}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm"
                      style={{ color: theme.text.secondary }}
                    >
                      No deployments found for any service.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
