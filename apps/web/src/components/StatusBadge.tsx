import type { DeploymentStatus } from '@/database/schema';

const STYLES: Record<DeploymentStatus, string> = {
  pending:   'bg-amber-50 text-amber-700 ring-amber-200',
  queued:    'bg-sky-50 text-sky-700 ring-sky-200',
  running:   'bg-violet-50 text-violet-700 ring-violet-200',
  success:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  failed:    'bg-rose-50 text-rose-700 ring-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const DOTS: Record<DeploymentStatus, string> = {
  pending:   'bg-amber-400',
  queued:    'bg-sky-500',
  running:   'bg-violet-500 animate-pulse',
  success:   'bg-emerald-500',
  failed:    'bg-rose-500',
  cancelled: 'bg-slate-400',
};

export default function StatusBadge({ status }: { status: DeploymentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status]}`} />
      {status}
    </span>
  );
}
