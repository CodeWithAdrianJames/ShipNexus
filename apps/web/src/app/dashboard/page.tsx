import DeploymentDashboard from '@/components/DeploymentDashboard';
import type { DeploymentJob } from '@/database/schema';

const API_URL = process.env.API_URL;

type DeploymentsResponse = {
  data: DeploymentJob[];
  total: number;
  page: number;
  limit: number;
};

// Never cache this page — always fetch live data from the API
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    if (!API_URL) {
      throw new Error('API_URL is not set');
    }

    const response = await fetch(`${API_URL}/deployments?page=1&limit=10`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Deployments API returned ${response.status}`);
    }

    const deployments = (await response.json()) as DeploymentsResponse;

    return (
      <DeploymentDashboard
        initialJobs={deployments.data}
        generatedAt={new Date().toISOString()}
        total={deployments.total}
        page={deployments.page}
        limit={deployments.limit}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch deployments";

    return (
      <DeploymentDashboard
        initialJobs={[]}
        generatedAt={new Date().toISOString()}
        total={0}
        page={1}
        limit={10}
        error={message}
      />
    );
  }
}
