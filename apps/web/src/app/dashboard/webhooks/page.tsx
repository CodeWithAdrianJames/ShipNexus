import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import WebhookCard, { type WebhookEvent } from "@/components/WebhookCard";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

type DeploymentJobSummary = {
  serviceName: string;
  status: DeploymentStatus;
  triggeredBy: string;
  webhookEventId: string | null;
  payload?: unknown;
  createdAt: string;
};

type DeploymentsResponse = {
  data: DeploymentJobSummary[];
  total: number;
  page: number;
  limit: number;
};

type WebhookSummary = {
  totalReceived: number;
  successfullyProcessed: number;
  failedProcessing: number;
  mostRecentWebhook: string;
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

function formatDate(value: string) {
  const timestamp = getTimestamp(value);

  if (timestamp === 0) {
    return "-";
  }

  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function payloadJson(payload: unknown) {
  return JSON.stringify(payload ?? null, null, 2) ?? "null";
}

function payloadPreview(payload: unknown) {
  const json = payloadJson(payload);
  return json.length > 120 ? `${json.slice(0, 117)}...` : json;
}

function toWebhookEvent(job: DeploymentJobSummary): WebhookEvent {
  const payload = payloadJson(job.payload);

  return {
    id: `${job.webhookEventId ?? "webhook"}-${job.serviceName}-${job.createdAt}`,
    webhookEventId: job.webhookEventId ?? "N/A",
    source: job.triggeredBy,
    serviceName: job.serviceName,
    receivedAt: formatDate(job.createdAt),
    status: job.status,
    payload,
    payloadPreview: payloadPreview(job.payload),
  };
}

function calculateSummary(
  jobs: DeploymentJobSummary[],
  totalReceived: number,
): WebhookSummary {
  const mostRecent = [...jobs].sort(
    (a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt),
  )[0];

  return {
    totalReceived,
    successfullyProcessed: jobs.filter((job) => job.status === "success").length,
    failedProcessing: jobs.filter((job) => job.status === "failed").length,
    mostRecentWebhook: mostRecent ? formatDate(mostRecent.createdAt) : "-",
  };
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
        className="text-xs font-medium uppercase tracking-normal"
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

export default async function WebhooksPage() {
  let jobs: DeploymentJobSummary[] = [];
  let totalReceived = 0;
  let error: string | null = null;

  try {
    const deployments = await fetchDeployments();
    totalReceived = deployments.total;
    jobs = [...deployments.data].sort(
      (a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt),
    );
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Failed to fetch deployments";
  }

  const summary = calculateSummary(jobs, totalReceived);
  const events = jobs.map(toWebhookEvent);

  return (
    <DashboardShell
      title="Webhooks"
      description="Webhook event processing history derived from recent deployment jobs."
      issueCount={summary.failedProcessing}
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
            Could not load webhook events. {error}
          </section>
        ) : null}

        <section
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Webhook processing summary"
        >
          <SummaryItem
            label="Total webhooks received"
            value={summary.totalReceived}
          />
          <SummaryItem
            label="Successfully processed"
            value={summary.successfullyProcessed}
          />
          <SummaryItem
            label="Failed processing"
            value={summary.failedProcessing}
          />
          <SummaryItem
            label="Most recent webhook"
            value={summary.mostRecentWebhook}
          />
        </section>

        {events.length > 0 ? (
          <section className="space-y-4" aria-label="Webhook event cards">
            {events.map((event) => (
              <WebhookCard key={event.id} event={event} />
            ))}
          </section>
        ) : (
          <section
            className="px-5 py-12 text-center text-sm"
            style={{ ...cardStyle, color: theme.text.secondary }}
          >
            No webhook events found.
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
