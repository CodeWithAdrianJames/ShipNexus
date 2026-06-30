'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CirclePlay,
  Clock3,
  Database,
  GitBranch,
  History,
  Home,
  Layers3,
  MoreHorizontal,
  RefreshCw,
  Rocket,
  Server,
  Settings,
  ShieldCheck,
  TimerReset,
  Webhook,
  XCircle,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { DeploymentJob, DeploymentStatus } from '@/database/schema';

type Props = { initialJobs: DeploymentJob[] };

type StatusTone = {
  label: string;
  dot: string;
  text: string;
  bg: string;
  ring: string;
  chart: string;
};

const STATUS_TONES: Record<DeploymentStatus, StatusTone> = {
  pending: {
    label: 'Pending',
    dot: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    chart: '#f59e0b',
  },
  queued: {
    label: 'Queued',
    dot: 'bg-sky-500',
    text: 'text-sky-700',
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
    chart: '#0ea5e9',
  },
  running: {
    label: 'Running',
    dot: 'bg-violet-500',
    text: 'text-violet-700',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
    chart: '#7c3aed',
  },
  success: {
    label: 'Successful',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    chart: '#10b981',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    ring: 'ring-rose-200',
    chart: '#ef4444',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    ring: 'ring-slate-200',
    chart: '#94a3b8',
  },
};

const STATUS_ORDER: DeploymentStatus[] = [
  'success',
  'running',
  'queued',
  'pending',
  'failed',
  'cancelled',
];

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, active: true },
  { label: 'Deployments', icon: GitBranch },
  { label: 'Services', icon: Boxes },
  { label: 'Environments', icon: Layers3 },
  { label: 'Webhooks', icon: Webhook },
  { label: 'Alerts', icon: Bell },
  { label: 'Logs', icon: History },
  { label: 'Settings', icon: Settings },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatDate(d: Date | string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function duration(start: Date | string | null, end: Date | string | null): string {
  if (!start || !end) return '-';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

function getDurationMs(job: DeploymentJob): number | null {
  if (!job.startedAt || !job.completedAt) return null;
  const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

function percent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function trendCopy(value: number, total: number, label: string): string {
  if (total === 0) return 'No jobs yet';
  return `${percent(value, total)}% ${label}`;
}

function shortImageTag(tag: string): string {
  if (tag.length <= 30) return tag;
  return `${tag.slice(0, 17)}...${tag.slice(-9)}`;
}

function getRecentDays(now: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now.getTime() - (6 - index) * DAY_MS);
    day.setHours(0, 0, 0, 0);
    return day;
  });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function statusGradient(
  byStatus: Record<DeploymentStatus, number>,
  total: number,
): string {
  if (total === 0) return 'conic-gradient(#e2e8f0 0deg 360deg)';

  let cursor = 0;
  const segments = STATUS_ORDER.flatMap((status) => {
    const value = byStatus[status];
    if (value === 0) return [];
    const start = cursor;
    cursor += (value / total) * 100;
    return `${STATUS_TONES[status].chart} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${segments.join(', ')})`;
}

function MiniSparkline({ color, points }: { color: string; points: number[] }) {
  const max = Math.max(...points, 1);
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 92 + 4;
      const y = 42 - (point / max) * 28;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg className="h-11 w-24 shrink-0" viewBox="0 0 100 48" role="img" aria-label="Seven day trend">
      <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeWidth="2.5" />
      <path d={`${path} L 96 46 L 4 46 Z`} fill={color} opacity="0.08" />
    </svg>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full min-h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
      Deployment activity will appear here after jobs are created.
    </div>
  );
}

function LineChart({
  daily,
  maxValue,
}: {
  daily: Array<{ label: string; success: number; failed: number; total: number }>;
  maxValue: number;
}) {
  const width = 680;
  const height = 276;
  const padding = { top: 22, right: 22, bottom: 44, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  function getPoint(value: number, index: number) {
    const x = padding.left + (index / Math.max(daily.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  }

  function pathFor(key: 'success' | 'failed') {
    return daily
      .map((day, index) => {
        const point = getPoint(day[key], index);
        return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      })
      .join(' ');
  }

  const ticks = Array.from({ length: Math.min(maxValue, 4) + 1 }, (_, index) => {
    const value = Math.round((maxValue / Math.min(maxValue, 4)) * index);
    return Number.isFinite(value) ? value : 0;
  });

  return (
    <div className="h-[320px] overflow-x-auto">
      <svg
        className="h-full min-w-[640px] w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Successful and failed deployment executions over the last seven days"
      >
        <defs>
          <linearGradient id="success-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => {
          const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 5"
              />
              <text x={padding.left - 14} y={y + 4} textAnchor="end" className="fill-slate-500 text-[12px]">
                {tick}
              </text>
            </g>
          );
        })}

        {daily.map((day, index) => {
          const x = getPoint(0, index).x;
          return (
            <g key={day.label}>
              <line
                x1={x}
                x2={x}
                y1={padding.top}
                y2={padding.top + chartHeight}
                stroke="#e2e8f0"
                strokeDasharray="3 6"
              />
              <text x={x} y={height - 16} textAnchor="middle" className="fill-slate-500 text-[12px]">
                {day.label}
              </text>
            </g>
          );
        })}

        <path
          d={`${pathFor('success')} L ${width - padding.right} ${padding.top + chartHeight} L ${padding.left} ${
            padding.top + chartHeight
          } Z`}
          fill="url(#success-fill)"
        />
        <path d={pathFor('success')} fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <path d={pathFor('failed')} fill="none" stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

        {daily.map((day, index) => {
          const success = getPoint(day.success, index);
          const failed = getPoint(day.failed, index);
          return (
            <g key={`${day.label}-points`}>
              <circle cx={success.x} cy={success.y} fill="#10b981" r="4" />
              <circle cx={failed.x} cy={failed.y} fill="#ef4444" r="4" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function DeploymentDashboard({ initialJobs }: Props) {
  const router = useRouter();
  const [lastRefresh, setRefresh] = useState(new Date());
  const [ticking, setTicking] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setRefresh(new Date());
    }, 10_000);
    return () => clearInterval(id);
  }, [router]);

  function handleManualRefresh() {
    if (ticking) return;
    setTicking(true);
    router.refresh();
    setRefresh(new Date());
    setTimeout(() => setTicking(false), 600);
  }

  const analytics = useMemo(() => {
    const total = initialJobs.length;
    const byStatus = initialJobs.reduce(
      (acc, job) => {
        acc[job.status] += 1;
        return acc;
      },
      {
        pending: 0,
        queued: 0,
        running: 0,
        success: 0,
        failed: 0,
        cancelled: 0,
      } satisfies Record<DeploymentStatus, number>,
    );

    const now = lastRefresh;
    const days = getRecentDays(now);
    const daily = days.map((day) => {
      const jobs = initialJobs.filter((job) => sameDay(new Date(job.createdAt), day));
      return {
        label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        success: jobs.filter((job) => job.status === 'success').length,
        failed: jobs.filter((job) => job.status === 'failed').length,
        total: jobs.length,
      };
    });

    const completedDurations = initialJobs
      .map(getDurationMs)
      .filter((value): value is number => value !== null);
    const avgDurationMs = completedDurations.length
      ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
      : 0;

    const environmentCounts = initialJobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.environment] = (acc[job.environment] ?? 0) + 1;
      return acc;
    }, {});
    const topEnvironment =
      Object.entries(environmentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'production';

    const latestJob = initialJobs[0] ?? null;

    return {
      total,
      byStatus,
      daily,
      latestJob,
      successRate: percent(byStatus.success, total),
      failureRate: percent(byStatus.failed, total),
      activeCount: byStatus.pending + byStatus.queued + byStatus.running,
      avgDuration: avgDurationMs ? `${(avgDurationMs / 1000).toFixed(1)}s` : '-',
      topEnvironment,
    };
  }, [initialJobs, lastRefresh]);

  const maxDailyValue = Math.max(
    ...analytics.daily.flatMap((day) => [day.success, day.failed, day.total]),
    1,
  );

  const summaryCards = [
    {
      label: 'Total Jobs',
      value: analytics.total,
      detail: 'Last 50 records',
      icon: Database,
      color: '#2563eb',
      bg: 'bg-blue-50',
      tone: 'text-blue-700',
      points: analytics.daily.map((day) => day.total),
    },
    {
      label: 'Active',
      value: analytics.activeCount,
      detail: trendCopy(analytics.activeCount, analytics.total, 'in progress'),
      icon: CirclePlay,
      color: '#7c3aed',
      bg: 'bg-violet-50',
      tone: 'text-violet-700',
      points: analytics.daily.map((day) => day.total),
    },
    {
      label: 'Successful',
      value: analytics.byStatus.success,
      detail: `${analytics.successRate}% success rate`,
      icon: CheckCircle2,
      color: '#059669',
      bg: 'bg-emerald-50',
      tone: 'text-emerald-700',
      points: analytics.daily.map((day) => day.success),
    },
    {
      label: 'Failed',
      value: analytics.byStatus.failed,
      detail: `${analytics.failureRate}% failure rate`,
      icon: XCircle,
      color: '#e11d48',
      bg: 'bg-rose-50',
      tone: 'text-rose-700',
      points: analytics.daily.map((day) => day.failed),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-[272px] shrink-0 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
              <Rocket className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-semibold">ShipNexus</p>
              <p className="text-sm text-slate-500">Deployment Pipeline</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={item.active ? 'page' : undefined}
                  className={cx(
                    'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    item.active
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                  )}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-rose-600 ring-1 ring-rose-100">
                  <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-rose-800">
                    {analytics.byStatus.failed} issue{analytics.byStatus.failed === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-rose-700">
                    Failed deployments require attention.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-700 text-sm font-semibold text-white">
                  N
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Nexus Admin</p>
                  <p className="truncate text-xs text-slate-500">admin@shipnexus.io</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f6f8fc]/95 px-4 py-4 backdrop-blur md:px-6 xl:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3 lg:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <Rocket className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-base font-semibold">ShipNexus</span>
                    <p className="text-xs text-slate-500">Deployment Pipeline</p>
                  </div>
                </div>
                <h1 className="mt-4 text-2xl font-semibold text-slate-950 lg:mt-0 md:text-3xl">
                  Overview
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Monitor deployment health, rollout velocity, and recent pipeline executions.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm">
                  <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span>Last updated: {formatDate(lastRefresh)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={ticking}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Refresh deployment data"
                >
                  <RefreshCw className={cx('h-4 w-4', ticking && 'animate-spin')} aria-hidden="true" />
                  Refresh
                </button>
              </div>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Mobile primary">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-current={item.active ? 'page' : undefined}
                    className={cx(
                      'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      item.active
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-600',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </header>

          <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4" aria-label="Deployment summary">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className={cx('flex h-12 w-12 items-center justify-center rounded-lg', card.bg, card.tone)}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <MiniSparkline color={card.color} points={card.points} />
                    </div>
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase text-slate-500">{card.label}</p>
                      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                        <p className="text-4xl font-semibold text-slate-950">{card.value}</p>
                        <p className={cx('pb-1 text-sm font-semibold', card.tone)}>{card.detail}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Jobs Status Overview</h2>
                    <p className="mt-1 text-sm text-slate-500">Status mix across the current result set.</p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Last 7 days
                  </div>
                </div>

                <div className="mt-7 grid gap-7 md:grid-cols-[210px_minmax(0,1fr)] md:items-center xl:grid-cols-1 2xl:grid-cols-[210px_minmax(0,1fr)]">
                  <div className="relative mx-auto h-52 w-52">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: statusGradient(analytics.byStatus, analytics.total) }}
                      aria-hidden="true"
                    />
                    <div className="absolute inset-7 rounded-full bg-white shadow-inner" aria-hidden="true" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-semibold">{analytics.total}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">Total jobs</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {STATUS_ORDER.map((status) => {
                      const count = analytics.byStatus[status];
                      const tone = STATUS_TONES[status];
                      return (
                        <div key={status}>
                          <div className="mb-1.5 flex items-center gap-3">
                            <span className={cx('h-2.5 w-2.5 rounded-full', tone.dot)} />
                            <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{tone.label}</span>
                            <span className="text-sm font-semibold text-slate-950">{count}</span>
                            <span className="w-12 text-right text-sm text-slate-500">
                              {percent(count, analytics.total)}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cx('h-full rounded-full', tone.dot)}
                              style={{ width: `${percent(count, analytics.total)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Job Executions Over Time</h2>
                    <p className="mt-1 text-sm text-slate-500">Successful and failed deployments by day.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Success
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Failed
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  {analytics.total === 0 ? (
                    <EmptyChart />
                  ) : (
                    <LineChart daily={analytics.daily} maxValue={maxDailyValue} />
                  )}
                </div>
              </article>
            </section>

            <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_350px]">
              <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Recent Deployments</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Showing {Math.min(initialJobs.length, 50)} most recent jobs.
                    </p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    <Database className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    Live database view
                  </div>
                </div>

                {initialJobs.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Server className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-800">No deployment jobs yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Trigger one via <code className="rounded bg-slate-100 px-1.5 py-0.5">POST /deployments</code>.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3 text-left">Service</th>
                          <th className="px-5 py-3 text-left">Image Tag</th>
                          <th className="px-5 py-3 text-left">Env</th>
                          <th className="px-5 py-3 text-left">Status</th>
                          <th className="px-5 py-3 text-left">Duration</th>
                          <th className="px-5 py-3 text-left">Triggered By</th>
                          <th className="px-5 py-3 text-left">Created</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {initialJobs.map((job) => (
                          <tr key={job.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                  <Server className="h-4 w-4" aria-hidden="true" />
                                </div>
                                <span className="font-semibold text-slate-900">{job.serviceName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-slate-500" title={job.imageTag}>
                              {shortImageTag(job.imageTag)}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                                {job.environment}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={job.status} />
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                                <TimerReset className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                                {duration(job.startedAt, job.completedAt)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <Webhook className="h-4 w-4 text-slate-700" aria-hidden="true" />
                                {job.triggeredBy}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-500">{formatDate(job.createdAt)}</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label={`Open actions for deployment ${job.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              <aside className="grid gap-5 md:grid-cols-2 2xl:grid-cols-1">
                <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold">Operational Health</h2>
                      <p className="mt-1 text-sm text-slate-500">Live rollout indicators.</p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  </div>

                  <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">Primary environment</span>
                      <span className="text-sm font-semibold text-slate-950">{analytics.topEnvironment}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">Average duration</span>
                      <span className="text-sm font-semibold text-slate-950">{analytics.avgDuration}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">Refresh cadence</span>
                      <span className="text-sm font-semibold text-slate-950">10s</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">Latest job</span>
                      <span className="max-w-32 truncate text-sm font-semibold text-slate-950">
                        {analytics.latestJob?.serviceName ?? '-'}
                      </span>
                    </div>
                  </div>
                </article>

                <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold">Pipeline Signals</h2>
                      <p className="mt-1 text-sm text-slate-500">Current stability read.</p>
                    </div>
                    <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{analytics.successRate}% success rate</p>
                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {analytics.byStatus.success} successful deployment
                          {analytics.byStatus.success === 1 ? '' : 's'} in view.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                        <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{analytics.failureRate}% failure rate</p>
                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {analytics.byStatus.failed} failed deployment
                          {analytics.byStatus.failed === 1 ? '' : 's'} currently visible.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </aside>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
