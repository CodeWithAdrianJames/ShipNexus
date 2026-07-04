"use client";

import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CirclePlay,
  Clock3,
  Database,
  MoreHorizontal,
  RefreshCw,
  Server,
  ShieldCheck,
  TimerReset,
  Webhook,
  XCircle,
} from "lucide-react";
import DashboardShell from "./dashboard/DashboardShell";
import {
  cx,
  ICON_BUTTON_CLASS,
  PANEL_CLASS,
  PANEL_HEADER_CLASS,
} from "./dashboard/styles";
import StatusBadge from "./StatusBadge";
import type { DeploymentJob, DeploymentStatus } from "@/database/schema";

type Props = {
  initialJobs: DeploymentJob[];
  generatedAt: string;
  total: number;
  page: number;
  limit: number;
  error?: string;
};

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
    label: "Pending",
    dot: "bg-amber-400",
    text: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    chart: "#f59e0b",
  },
  queued: {
    label: "Queued",
    dot: "bg-sky-500",
    text: "text-sky-700",
    bg: "bg-sky-50",
    ring: "ring-sky-200",
    chart: "#0ea5e9",
  },
  running: {
    label: "Running",
    dot: "bg-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
    chart: "#7c3aed",
  },
  success: {
    label: "Successful",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    chart: "#10b981",
  },
  failed: {
    label: "Failed",
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    ring: "ring-rose-200",
    chart: "#ef4444",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-100",
    ring: "ring-slate-200",
    chart: "#94a3b8",
  },
};

const STATUS_ORDER: DeploymentStatus[] = [
  "success",
  "running",
  "queued",
  "pending",
  "failed",
  "cancelled",
];

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Queued", value: "queued" },
  { label: "Running", value: "running" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES: DeploymentStatus[] = ["pending", "queued", "running"];
const RETRY_SECONDS = 15;
const EMPTY_DEPLOYMENT_CURL = `curl -X POST http://localhost:3000/deployments \\
  -H "Content-Type: application/json" \\
  -d '{"serviceName":"my-service","imageTag":"v1.0.0",
       "triggeredBy":"dashboard"}'`;

type DeploymentsResponse = {
  data: DeploymentJob[];
  total: number;
  page: number;
  limit: number;
};

type TriggerForm = {
  serviceName: string;
  imageTag: string;
  environment: string;
  triggeredBy: string;
};

type TriggerFormErrors = Partial<Record<keyof TriggerForm, string>>;

function formatDate(d: Date | string | null): string {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duration(
  start: Date | string | null,
  end: Date | string | null,
): string {
  if (!start || !end) return "-";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "-";
  return `${(ms / 1000).toFixed(1)}s`;
}

function getDurationMs(job: DeploymentJob): number | null {
  if (!job.startedAt || !job.completedAt) return null;
  const ms =
    new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

function percent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function trendCopy(value: number, total: number, label: string): string {
  if (total === 0) return "No jobs yet";
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
  if (total === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";

  let cursor = 0;
  const segments = STATUS_ORDER.flatMap((status) => {
    const value = byStatus[status];
    if (value === 0) return [];
    const start = cursor;
    cursor += (value / total) * 100;
    return `${STATUS_TONES[status].chart} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function MiniSparkline({ color, points }: { color: string; points: number[] }) {
  const max = Math.max(...points, 1);
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 92 + 4;
      const y = 42 - (point / max) * 28;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="h-11 w-24 shrink-0"
      viewBox="0 0 100 48"
      role="img"
      aria-label={`Seven day trend ending at ${points.at(-1) ?? 0} jobs`}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path d={`${path} L 96 46 L 4 46 Z`} fill={color} opacity="0.08" />
    </svg>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-blue-200 bg-[#f8fbff] px-6 text-center">
      <Activity className="h-6 w-6 text-blue-500" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-slate-700">
        No chart activity yet
      </p>
      <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
        Deployment activity will appear here after jobs are created.
      </p>
    </div>
  );
}

function LineChart({
  daily,
  maxValue,
}: {
  daily: Array<{
    label: string;
    success: number;
    failed: number;
    total: number;
  }>;
  maxValue: number;
}) {
  const width = 680;
  const height = 276;
  const padding = { top: 22, right: 22, bottom: 44, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  function getPoint(value: number, index: number) {
    const x =
      padding.left + (index / Math.max(daily.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  }

  function pathFor(key: "success" | "failed") {
    return daily
      .map((day, index) => {
        const point = getPoint(day[key], index);
        return `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      })
      .join(" ");
  }

  const ticks = Array.from(
    { length: Math.min(maxValue, 4) + 1 },
    (_, index) => {
      const value = Math.round((maxValue / Math.min(maxValue, 4)) * index);
      return Number.isFinite(value) ? value : 0;
    },
  );

  return (
    <div className="h-[320px] overflow-x-auto">
      <svg
        className="h-full min-w-[640px] w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Successful and failed deployment executions over the last seven days"
      >
        <desc>
          Line chart comparing successful and failed deployment counts over the
          last seven days.
        </desc>
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
              <text
                x={padding.left - 14}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[12px]"
              >
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
              <text
                x={x}
                y={height - 16}
                textAnchor="middle"
                className="fill-slate-500 text-[12px]"
              >
                {day.label}
              </text>
            </g>
          );
        })}

        <path
          d={`${pathFor("success")} L ${width - padding.right} ${padding.top + chartHeight} L ${padding.left} ${
            padding.top + chartHeight
          } Z`}
          fill="url(#success-fill)"
        />
        <path
          d={pathFor("success")}
          fill="none"
          stroke="#10b981"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d={pathFor("failed")}
          fill="none"
          stroke="#ef4444"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />

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

export default function DeploymentDashboard({
  initialJobs,
  generatedAt,
  total,
  page,
  error,
}: Props) {
  const [currentPage, setCurrentPage] = useState(page);
  const [activeFilter, setActiveFilter] = useState("all");
  const [jobs, setJobs] = useState<DeploymentJob[]>(initialJobs);
  const [totalJobs, setTotalJobs] = useState(total);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setRefresh] = useState(() => new Date(generatedAt));
  const [ticking, setTicking] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(error ?? null);
  const [retryCountdown, setRetryCountdown] = useState(RETRY_SECONDS);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [triggerForm, setTriggerForm] = useState<TriggerForm>({
    serviceName: "",
    imageTag: "",
    environment: "production",
    triggeredBy: "dashboard-ui",
  });
  const [triggerErrors, setTriggerErrors] = useState<TriggerFormErrors>({});
  const [triggerApiError, setTriggerApiError] = useState<string | null>(null);
  const [isTriggerSubmitting, setIsTriggerSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const fetchJobs = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(PAGE_SIZE),
    });

    if (activeFilter !== "all") {
      params.set("status", activeFilter);
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/deployments?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Deployments API returned ${response.status}`);
      }

      const deployments = (await response.json()) as DeploymentsResponse;
      setJobs(deployments.data);
      setTotalJobs(deployments.total);
      setRefresh(new Date());
      setFetchError(null);
    } catch {
      setFetchError("Could not reach the API.");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, currentPage]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!fetchError) return;

    setRetryCountdown(RETRY_SECONDS);

    const id = setInterval(() => {
      setRetryCountdown((seconds) => {
        if (seconds <= 1) {
          void fetchJobs();
          return RETRY_SECONDS;
        }

        return seconds - 1;
      });
    }, 1_000);

    return () => clearInterval(id);
  }, [fetchError, fetchJobs]);

  function handleManualRefresh() {
    if (ticking) return;
    setTicking(true);
    void fetchJobs();
    setTimeout(() => setTicking(false), 600);
  }

  async function handleCopyCurl() {
    await navigator.clipboard.writeText(EMPTY_DEPLOYMENT_CURL);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1_500);
  }

  function closeModal() {
    setIsModalOpen(false);
    setTriggerErrors({});
    setTriggerApiError(null);
  }

  useEffect(() => {
    if (!isModalOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!toastMessage) return;

    const id = setTimeout(() => setToastMessage(null), 3_000);
    return () => clearTimeout(id);
  }, [toastMessage]);

  function validateTriggerForm() {
    const errors: TriggerFormErrors = {};

    if (!triggerForm.serviceName.trim()) {
      errors.serviceName = "Service name is required";
    }

    if (!triggerForm.imageTag.trim()) {
      errors.imageTag = "Image tag is required";
    }

    if (!triggerForm.triggeredBy.trim()) {
      errors.triggeredBy = "Triggered by is required";
    }

    setTriggerErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleTriggerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTriggerApiError(null);

    if (!validateTriggerForm()) return;

    const serviceName = triggerForm.serviceName.trim();
    setIsTriggerSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/deployments/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceName,
          imageTag: triggerForm.imageTag.trim(),
          environment: triggerForm.environment,
          triggeredBy: triggerForm.triggeredBy.trim(),
          webhookEventId: crypto.randomUUID(),
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(
          errorBody?.message ?? `Trigger request failed with ${response.status}`,
        );
      }

      closeModal();
      setTriggerForm({
        serviceName: "",
        imageTag: "",
        environment: "production",
        triggeredBy: "dashboard-ui",
      });
      await fetchJobs();
      setToastMessage(`Deployment triggered for ${serviceName}`);
    } catch (submitError) {
      setTriggerApiError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to trigger deployment",
      );
    } finally {
      setIsTriggerSubmitting(false);
    }
  }

  const analytics = useMemo(() => {
    const total = jobs.length;
    const byStatus = jobs.reduce(
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
      const dayJobs = jobs.filter((job) =>
        sameDay(new Date(job.createdAt), day),
      );
      return {
        label: day.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        success: dayJobs.filter((job) => job.status === "success").length,
        failed: dayJobs.filter((job) => job.status === "failed").length,
        total: dayJobs.length,
      };
    });

    const completedDurations = jobs
      .map(getDurationMs)
      .filter((value): value is number => value !== null);
    const avgDurationMs = completedDurations.length
      ? completedDurations.reduce((sum, value) => sum + value, 0) /
        completedDurations.length
      : 0;

    const environmentCounts = jobs.reduce<Record<string, number>>(
      (acc, job) => {
        acc[job.environment] = (acc[job.environment] ?? 0) + 1;
        return acc;
      },
      {},
    );
    const topEnvironment =
      Object.entries(environmentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "production";

    const latestJob = jobs[0] ?? null;

    return {
      total,
      byStatus,
      daily,
      latestJob,
      successRate: percent(byStatus.success, total),
      failureRate: percent(byStatus.failed, total),
      activeCount: byStatus.pending + byStatus.queued + byStatus.running,
      avgDuration: avgDurationMs
        ? `${(avgDurationMs / 1000).toFixed(1)}s`
        : "-",
      topEnvironment,
    };
  }, [jobs, lastRefresh]);

  const maxDailyValue = Math.max(
    ...analytics.daily.flatMap((day) => [day.success, day.failed, day.total]),
    1,
  );
  const isPollingActive = jobs.some((job) =>
    ACTIVE_STATUSES.includes(job.status),
  );

  useEffect(() => {
    if (!isPollingActive || fetchError) return;

    const id = setInterval(() => {
      void fetchJobs();
    }, 8_000);

    return () => clearInterval(id);
  }, [fetchError, fetchJobs, isPollingActive]);

  const totalPages = Math.max(Math.ceil(totalJobs / PAGE_SIZE), 1);
  const resultStart = totalJobs === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const resultEnd = Math.min(currentPage * PAGE_SIZE, totalJobs);

  const summaryCards = [
    {
      label: "Total Jobs",
      value: analytics.total,
      detail: "Last 50 records",
      icon: Database,
      color: "#2563eb",
      bg: "bg-blue-50",
      tone: "text-blue-700",
      points: analytics.daily.map((day) => day.total),
    },
    {
      label: "Active",
      value: analytics.activeCount,
      detail: trendCopy(analytics.activeCount, analytics.total, "in progress"),
      icon: CirclePlay,
      color: "#7c3aed",
      bg: "bg-violet-50",
      tone: "text-violet-700",
      points: analytics.daily.map((day) => day.total),
    },
    {
      label: "Successful",
      value: analytics.byStatus.success,
      detail: `${analytics.successRate}% success rate`,
      icon: CheckCircle2,
      color: "#059669",
      bg: "bg-emerald-50",
      tone: "text-emerald-700",
      points: analytics.daily.map((day) => day.success),
    },
    {
      label: "Failed",
      value: analytics.byStatus.failed,
      detail: `${analytics.failureRate}% failure rate`,
      icon: XCircle,
      color: "#e11d48",
      bg: "bg-rose-50",
      tone: "text-rose-700",
      points: analytics.daily.map((day) => day.failed),
    },
  ];

  return (
    <>
    <DashboardShell
      title="Overview"
      description="Monitor deployment health, rollout velocity, and recent pipeline executions."
      issueCount={analytics.byStatus.failed}
      actions={
        <>
          <style>
            {`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}
          </style>
          <div
            className="flex h-10 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm shadow-blue-950/5"
            aria-live="polite"
          >
            <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                isPollingActive ? "bg-emerald-500" : "bg-slate-300",
              )}
              style={
                isPollingActive
                  ? { animation: "pulse 1.5s infinite" }
                  : undefined
              }
              aria-hidden="true"
            />
            <span>Last updated: {formatDate(lastRefresh)}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-950/10 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <CirclePlay className="h-4 w-4" aria-hidden="true" />
            Trigger Deployment
          </button>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={ticking}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm shadow-blue-950/5 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Refresh deployment data"
          >
            <RefreshCw
              className={cx("h-4 w-4", ticking && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </button>
        </>
      }
    >
            <section
              className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4"
              aria-label="Deployment summary"
            >
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className={cx(
                      PANEL_CLASS,
                      "p-5 transition hover:border-blue-200 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={cx(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                          card.bg,
                          card.tone,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <MiniSparkline color={card.color} points={card.points} />
                    </div>
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        {card.label}
                      </p>
                      <div className="mt-2 flex min-h-12 flex-wrap items-end justify-between gap-3">
                        <p className="text-3xl font-semibold tabular-nums text-slate-950 md:text-4xl">
                          {card.value}
                        </p>
                        <p
                          className={cx(
                            "pb-1 text-sm font-semibold leading-5",
                            card.tone,
                          )}
                        >
                          {card.detail}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
              <article className={cx(PANEL_CLASS, "p-5")}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">
                      Jobs Status Overview
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Status mix across the current result set.
                    </p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Last 7 days
                  </div>
                </div>

                <div className="mt-7 grid gap-7 md:grid-cols-[210px_minmax(0,1fr)] md:items-center xl:grid-cols-1 2xl:grid-cols-[210px_minmax(0,1fr)]">
                  <div className="relative mx-auto h-52 w-52">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: statusGradient(
                          analytics.byStatus,
                          analytics.total,
                        ),
                      }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-7 rounded-full bg-white shadow-inner"
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-semibold">
                        {analytics.total}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Total jobs
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {STATUS_ORDER.map((status) => {
                      const count = analytics.byStatus[status];
                      const tone = STATUS_TONES[status];
                      return (
                        <div key={status}>
                          <div className="mb-1.5 flex items-center gap-3">
                            <span
                              className={cx(
                                "h-2.5 w-2.5 rounded-full",
                                tone.dot,
                              )}
                            />
                            <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">
                              {tone.label}
                            </span>
                            <span className="text-sm font-semibold text-slate-950">
                              {count}
                            </span>
                            <span className="w-12 text-right text-sm text-slate-500">
                              {percent(count, analytics.total)}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cx("h-full rounded-full", tone.dot)}
                              style={{
                                width: `${percent(count, analytics.total)}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>

              <article className={cx(PANEL_CLASS, "p-5")}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">
                      Job Executions Over Time
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Successful and failed deployments by day.
                    </p>
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
                    <LineChart
                      daily={analytics.daily}
                      maxValue={maxDailyValue}
                    />
                  )}
                </div>
              </article>
            </section>

            <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_350px]">
              <article className={cx(PANEL_CLASS, "overflow-hidden")}>
                <div className={PANEL_HEADER_CLASS}>
                  <div>
                    <h2 className="text-base font-semibold">
                      Recent Deployments
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Showing {resultStart} to {resultEnd} of {totalJobs} results
                    </p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    <Database
                      className="h-4 w-4 text-slate-500"
                      aria-hidden="true"
                    />
                    Live database view
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-4">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => {
                        setCurrentPage(1);
                        setActiveFilter(filter.value);
                      }}
                      className={cx(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        activeFilter === filter.value
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-200 bg-transparent text-slate-600 hover:border-indigo-200 hover:text-indigo-700",
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {fetchError ? (
                  <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-800">
                    Could not reach the API. Retrying in {retryCountdown}s...
                  </div>
                ) : null}

                {jobs.length === 0 ? (
                  activeFilter === "all" ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Server className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <p className="mt-4 text-base font-semibold text-slate-800">
                        No deployments yet
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Trigger one via POST /deployments
                      </p>
                      <div className="mt-5 w-full max-w-2xl overflow-hidden rounded-lg bg-slate-950 text-left shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
                          <span className="text-xs font-semibold text-slate-400">
                            curl
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCurl}
                            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-blue-400 hover:text-white"
                          >
                            {copiedCurl ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-100">
                          <code>{EMPTY_DEPLOYMENT_CURL}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Server className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <p className="mt-4 text-base font-semibold text-slate-800">
                        No {activeFilter} deployments found
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter("all");
                          setCurrentPage(1);
                        }}
                        className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Clear filter
                      </button>
                    </div>
                  )
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className={cx(
                        "w-full min-w-[980px] text-sm",
                        isLoading && "opacity-50",
                      )}
                    >
                      <caption className="sr-only">
                        Recent deployment jobs including service, image tag,
                        environment, status, duration, trigger, and creation
                        time.
                      </caption>
                      <thead className="border-b border-slate-200 bg-[#f8fbff] text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th scope="col" className="px-5 py-3 text-left">
                            Service
                          </th>
                          <th scope="col" className="px-5 py-3 text-left">
                            Image Tag
                          </th>
                          <th scope="col" className="px-5 py-3 text-left">
                            Env
                          </th>
                          <th scope="col" className="px-5 py-3 text-left">
                            Status
                          </th>
                          <th scope="col" className="px-5 py-3 text-left">
                            Duration
                          </th>
                          <th scope="col" className="px-5 py-3 text-left">
                            Triggered By
                          </th>
                          <th scope="col" className="px-5 py-3 text-left">
                            Created
                          </th>
                          <th scope="col" className="px-5 py-3 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {jobs.map((job) => (
                          <tr
                            key={job.id}
                            className="transition hover:bg-blue-50/40"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                  <Server
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </div>
                                <Link
                                  href={`/dashboard/deployments/${job.id}`}
                                  className="max-w-52 truncate font-semibold text-slate-900"
                                  title={job.serviceName}
                                >
                                  {job.serviceName}
                                </Link>
                              </div>
                            </td>
                            <td
                              className="px-5 py-4 font-mono text-xs text-slate-500"
                              title={job.imageTag}
                            >
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
                                <TimerReset
                                  className="h-3.5 w-3.5 text-slate-400"
                                  aria-hidden="true"
                                />
                                {duration(job.startedAt, job.completedAt)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <Webhook
                                  className="h-4 w-4 text-slate-700"
                                  aria-hidden="true"
                                />
                                {job.triggeredBy}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-500">
                              {formatDate(job.createdAt)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                disabled
                                title="Deployment actions unavailable"
                                className={ICON_BUTTON_CLASS}
                                aria-label={`Deployment actions unavailable for ${job.serviceName}`}
                              >
                                <MoreHorizontal
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((value) => Math.max(value - 1, 1))
                      }
                      disabled={currentPage <= 1 || isLoading}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((value) =>
                          Math.min(value + 1, totalPages),
                        )
                      }
                      disabled={currentPage >= totalPages || isLoading}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </article>

              <aside className="grid gap-5 md:grid-cols-2 2xl:grid-cols-1">
                <article className={cx(PANEL_CLASS, "p-5")}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold">
                        Operational Health
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Live rollout indicators.
                      </p>
                    </div>
                    <ShieldCheck
                      className="h-5 w-5 text-emerald-600"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-[#f8fbff]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">
                        Primary environment
                      </span>
                      <span
                        className="max-w-32 truncate text-sm font-semibold text-slate-950"
                        title={analytics.topEnvironment}
                      >
                        {analytics.topEnvironment}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">
                        Average duration
                      </span>
                      <span className="text-sm font-semibold text-slate-950">
                        {analytics.avgDuration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">
                        Refresh cadence
                      </span>
                      <span className="text-sm font-semibold text-slate-950">
                        10s
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">
                        Latest job
                      </span>
                      <span className="max-w-32 truncate text-sm font-semibold text-slate-950">
                        {analytics.latestJob?.serviceName ?? "-"}
                      </span>
                    </div>
                  </div>
                </article>

                <article className={cx(PANEL_CLASS, "p-5")}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold">
                        Pipeline Signals
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Current stability read.
                      </p>
                    </div>
                    <Activity
                      className="h-5 w-5 text-blue-600"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3 rounded-lg bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {analytics.successRate}% success rate
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {analytics.byStatus.success} successful deployment
                          {analytics.byStatus.success === 1 ? "" : "s"} in view.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg bg-rose-50/60 p-3 ring-1 ring-rose-100">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                        <ArrowDownRight
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {analytics.failureRate}% failure rate
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {analytics.byStatus.failed} failed deployment
                          {analytics.byStatus.failed === 1 ? "" : "s"} currently
                          visible.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </aside>
            </section>
    </DashboardShell>

    {isModalOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="trigger-deployment-title"
          className="w-full max-w-lg rounded-lg bg-white shadow-xl shadow-slate-950/20"
        >
          <div className="border-b border-slate-200 px-6 py-5">
            <h2
              id="trigger-deployment-title"
              className="text-lg font-semibold text-slate-950"
            >
              Trigger Deployment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a deployment job from the dashboard.
            </p>
          </div>

          <form onSubmit={handleTriggerSubmit} className="space-y-4 px-6 py-5">
            {triggerApiError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                {triggerApiError}
              </div>
            ) : null}

            <div>
              <label
                htmlFor="trigger-service-name"
                className="text-sm font-semibold text-slate-700"
              >
                Service name
              </label>
              <input
                ref={firstFieldRef}
                id="trigger-service-name"
                type="text"
                required
                placeholder="payments-service"
                value={triggerForm.serviceName}
                onChange={(event) =>
                  setTriggerForm((value) => ({
                    ...value,
                    serviceName: event.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              />
              {triggerErrors.serviceName ? (
                <p className="mt-1 text-sm font-medium text-rose-700">
                  {triggerErrors.serviceName}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="trigger-image-tag"
                className="text-sm font-semibold text-slate-700"
              >
                Image tag
              </label>
              <input
                id="trigger-image-tag"
                type="text"
                required
                placeholder="sha256-abc123"
                value={triggerForm.imageTag}
                onChange={(event) =>
                  setTriggerForm((value) => ({
                    ...value,
                    imageTag: event.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              />
              {triggerErrors.imageTag ? (
                <p className="mt-1 text-sm font-medium text-rose-700">
                  {triggerErrors.imageTag}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="trigger-environment"
                className="text-sm font-semibold text-slate-700"
              >
                Environment
              </label>
              <select
                id="trigger-environment"
                value={triggerForm.environment}
                onChange={(event) =>
                  setTriggerForm((value) => ({
                    ...value,
                    environment: event.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="production">production</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="trigger-triggered-by"
                className="text-sm font-semibold text-slate-700"
              >
                Triggered by
              </label>
              <input
                id="trigger-triggered-by"
                type="text"
                value={triggerForm.triggeredBy}
                onChange={(event) =>
                  setTriggerForm((value) => ({
                    ...value,
                    triggeredBy: event.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              />
              {triggerErrors.triggeredBy ? (
                <p className="mt-1 text-sm font-medium text-rose-700">
                  {triggerErrors.triggeredBy}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isTriggerSubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTriggerSubmitting ? "Triggering..." : "Trigger Deployment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null}

    {toastMessage ? (
      <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20">
        {toastMessage}
      </div>
    ) : null}
    </>
  );
}
