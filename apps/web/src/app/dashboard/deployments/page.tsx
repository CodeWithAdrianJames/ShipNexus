import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DeploymentsTable, {
  type DeploymentTableRow,
} from "@/components/DeploymentsTable";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";

const API_URL = process.env.API_URL;

export const dynamic = "force-dynamic";

type DeploymentsResponse = {
  data: DeploymentTableRow[];
  total: number;
  page: number;
  limit: number;
};

async function fetchDeployments() {
  const response = await fetch(`${API_URL}/deployments?page=1&limit=20`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Deployments API returned ${response.status}`);
  }

  return (await response.json()) as DeploymentsResponse;
}

export default async function DeploymentsPage() {
  let rows: DeploymentTableRow[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const deployments = await fetchDeployments();
    rows = deployments.data;
    total = deployments.total;
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Failed to fetch deployments";
  }

  const failedCount = rows.filter(
    (row) => (row.status as DeploymentStatus) === "failed",
  ).length;

  return (
    <DashboardShell
      title="Deployments"
      description="Browse deployment jobs with service, image, environment, status, duration, trigger, and creation metadata."
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
            Could not load deployments. {error}
          </section>
        ) : null}

        <DeploymentsTable initialRows={rows} initialTotal={total} />
      </div>
    </DashboardShell>
  );
}
