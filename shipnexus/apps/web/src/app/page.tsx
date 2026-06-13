import { db }                  from '@/database/db';
import { deploymentJobs }      from '@/database/schema';
import { desc }                from 'drizzle-orm';
import DeploymentDashboard     from '@/components/DeploymentDashboard';

// Never cache this page — always fetch live data from Postgres
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const jobs = await db
    .select()
    .from(deploymentJobs)
    .orderBy(desc(deploymentJobs.createdAt))
    .limit(50);

  return <DeploymentDashboard initialJobs={jobs} />;
}