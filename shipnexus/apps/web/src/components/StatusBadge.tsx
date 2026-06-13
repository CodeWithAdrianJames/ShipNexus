import type { DeploymentStatus } from '@/database/schema';

const STYLES: Record<DeploymentStatus, string> = {
  pending:   'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
  queued:    'bg-blue-900/40   text-blue-300   border border-blue-700',
  running:   'bg-purple-900/40 text-purple-300 border border-purple-700',
  success:   'bg-green-900/40  text-green-300  border border-green-700',
  failed:    'bg-red-900/40    text-red-300    border border-red-700',
  cancelled: 'bg-gray-800/40   text-gray-400   border border-gray-600',
};

const DOTS: Record<DeploymentStatus, string> = {
  pending:   'bg-yellow-400',
  queued:    'bg-blue-400',
  running:   'bg-purple-400 animate-pulse',
  success:   'bg-green-400',
  failed:    'bg-red-400',
  cancelled: 'bg-gray-500',
};

export default function StatusBadge({ status }: { status: DeploymentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status]}`} />
      {status}
    </span>
  );
}