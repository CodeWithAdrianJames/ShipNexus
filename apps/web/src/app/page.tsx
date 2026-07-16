import { db }                  from '@/database/db';
import { deploymentJobs }      from '@/database/schema';
import { desc }                from 'drizzle-orm';
import DeploymentDashboard     from '@/components/DeploymentDashboard';

// Never cache this page — always fetch live data from Postgres
export const dynamic = 'force-dynamic';


