import type { DeploymentStatus } from '@/database/schema';

const STYLES: Record<DeploymentStatus, string> = {
  pending:   'bg-[#49371d] text-[#ffc66d] ring-[#6b512b]',
  queued:    'bg-[#282d54] text-[#91a5ff] ring-[#3d4678]',
  running:   'bg-[#34204a] text-[#c89cff] ring-[#50306e]',
  success:   'bg-[#153a35] text-[#5ee0b1] ring-[#245548]',
  failed:    'bg-[#47203a] text-[#ff78b7] ring-[#6b3056]',
  cancelled: 'bg-[#211c31] text-[#aaa4b5] ring-white/10',
};

const DOTS: Record<DeploymentStatus, string> = {
  pending:   'bg-[#ffc66d]',
  queued:    'bg-[#91a5ff]',
  running:   'bg-[#c89cff] animate-pulse',
  success:   'bg-[#5ee0b1]',
  failed:    'bg-[#ff78b7]',
  cancelled: 'bg-[#817a90]',
};

export default function StatusBadge({ status }: { status: DeploymentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status]}`} />
      {status}
    </span>
  );
}
