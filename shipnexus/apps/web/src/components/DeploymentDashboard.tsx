'use client';

import { useRouter }          from 'next/navigation';
import { useEffect, useState } from 'react';
import StatusBadge             from './StatusBadge';
import type { DeploymentJob }  from '@/database/schema';

type Props = { initialJobs: DeploymentJob[] };

function formatDate(d: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    month:  'short', day: 'numeric',
    hour:   '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function duration(start: Date | string | null, end: Date | string | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function DeploymentDashboard({ initialJobs }: Props) {
  const router                    = useRouter();
  const [lastRefresh, setRefresh] = useState(new Date());
  const [ticking, setTicking]     = useState(false);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setRefresh(new Date());
    }, 10_000);
    return () => clearInterval(id);
  }, [router]);

  function handleManualRefresh() {
    setTicking(true);
    router.refresh();
    setRefresh(new Date());
    setTimeout(() => setTicking(false), 600);
  }

  // Compute stats
  const stats = {
    total:   initialJobs.length,
    running: initialJobs.filter((j) => j.status === 'running').length,
    success: initialJobs.filter((j) => j.status === 'success').length,
    failed:  initialJobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            🚀 ShipNexus
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Deployment Pipeline Orchestration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Last updated {formatDate(lastRefresh)}
          </span>
          <button
            onClick={handleManualRefresh}
            className={`px-3 py-1.5 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all ${ticking ? 'opacity-50' : ''}`}
          >
            {ticking ? 'Refreshing…' : '↺ Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs',  value: stats.total,   color: 'text-gray-100' },
          { label: 'Running',     value: stats.running, color: 'text-purple-400' },
          { label: 'Successful',  value: stats.success, color: 'text-green-400' },
          { label: 'Failed',      value: stats.failed,  color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">
            Recent Deployments
          </h2>
        </div>

        {initialJobs.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No deployment jobs yet. Trigger one via{' '}
            <code className="text-gray-400">POST /deployments</code>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Service</th>
                  <th className="text-left px-4 py-3">Image Tag</th>
                  <th className="text-left px-4 py-3">Env</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Duration</th>
                  <th className="text-left px-4 py-3">Triggered By</th>
                  <th className="text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {initialJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-100">
                      {job.serviceName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[140px] truncate">
                      {job.imageTag}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                        {job.environment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {duration(job.startedAt, job.completedAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {job.triggeredBy}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(job.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}