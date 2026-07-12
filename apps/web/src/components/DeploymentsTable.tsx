"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";
import StatusBadge from "./StatusBadge";

export type DeploymentTableRow = {
  id: string;
  serviceName: string;
  imageTag: string;
  environment: string;
  status: DeploymentStatus;
  triggeredBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type DeploymentsResponse = {
  data: DeploymentTableRow[];
  total: number;
  page: number;
  limit: number;
};

type StatusFilter = "all" | "pending" | "queued" | "running" | "success" | "failed";

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Queued", value: "queued" },
  { label: "Running", value: "running" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
];

const tableStyle = {
  background: theme.card.background,
  border: theme.card.border,
  borderRadius: theme.card.borderRadius,
  boxShadow: theme.card.shadow,
};

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value: string) {
  const timestamp = getTimestamp(value);

  if (timestamp === 0) {
    return "-";
  }

  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function duration(job: DeploymentTableRow) {
  if (!job.startedAt || !job.completedAt) {
    return "-";
  }

  const durationMs =
    new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "-";
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
}

function environmentStyle(environment: string) {
  const key = environment.toLowerCase() as keyof typeof theme.env;
  return theme.env[key] ?? theme.env.development;
}

function filterPillStyle(value: StatusFilter, active: boolean) {
  if (value === "all") {
    return {
      background: active ? theme.table.headerBg : theme.card.background,
      border: theme.card.border,
      color: active ? theme.text.primary : theme.text.secondary,
    };
  }

  const statusStyle = theme.status[value];

  return {
    background: active ? statusStyle.bg : theme.card.background,
    border: statusStyle.border,
    color: statusStyle.text,
  };
}

function EnvironmentBadge({ environment }: { environment: string }) {
  const style = environmentStyle(environment);

  return (
    <span
      className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold"
      style={{
        background: style.bg,
        border: style.border,
        color: style.text,
      }}
    >
      {environment}
    </span>
  );
}

export default function DeploymentsTable({
  initialRows,
  initialTotal,
  apiUrl,
}: {
  initialRows: DeploymentTableRow[];
  initialTotal: number;
  apiUrl: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => row.serviceName.toLowerCase().includes(query));
  }, [rows, search]);

  async function applyStatusFilter(nextFilter: StatusFilter) {
    setStatusFilter(nextFilter);
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: "1",
      limit: "20",
    });

    if (nextFilter !== "all") {
      params.set("status", nextFilter);
    }

    try {
      const response = await fetch(`${apiUrl}/deployments?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Deployments API returned ${response.status}`);
      }

      const deployments = (await response.json()) as DeploymentsResponse;
      setRows(deployments.data);
      setTotal(deployments.total);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to fetch deployments",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-4" aria-label="Deployments list">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Deployment status filters">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className="rounded-full px-3 py-1.5 text-sm font-semibold transition"
              style={filterPillStyle(filter.value, statusFilter === filter.value)}
              onClick={() => void applyStatusFilter(filter.value)}
              disabled={isLoading}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="min-w-0 lg:w-80">
          <span className="sr-only">Search by service name</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search service name"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: theme.card.background,
              border: theme.card.border,
              color: theme.text.primary,
            }}
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold" style={{ color: theme.text.body }}>
          {filteredRows.length} deployment{filteredRows.length === 1 ? "" : "s"} found
        </p>
        <p className="text-sm" style={{ color: theme.text.secondary }}>
          {statusFilter === "all" ? total : `${total} total for ${statusFilter}`}
        </p>
      </div>

      {error ? (
        <section
          className="rounded-lg px-4 py-3 text-sm font-semibold"
          style={{
            background: theme.status.failed.bg,
            border: theme.status.failed.border,
            color: theme.status.failed.text,
          }}
        >
          Could not update deployments. {error}
        </section>
      ) : null}

      <div className="overflow-hidden" style={tableStyle}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead style={{ background: theme.table.headerBg }}>
              <tr>
                {[
                  "Service name",
                  "Image tag",
                  "Environment",
                  "Status",
                  "Duration",
                  "Triggered by",
                  "Created at",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal"
                    style={{
                      borderBottom: theme.card.border,
                      color: theme.table.headerText,
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td
                    className="px-4 py-4 align-top font-semibold"
                    style={{
                      borderBottom: theme.card.border,
                      color: theme.text.primary,
                    }}
                  >
                    <Link href={`/dashboard/deployments/${row.id}`}>
                      {row.serviceName}
                    </Link>
                  </td>
                  <td
                    className="break-all px-4 py-4 align-top font-mono text-xs"
                    style={{
                      borderBottom: theme.card.border,
                      color: theme.text.secondary,
                    }}
                  >
                    {row.imageTag}
                  </td>
                  <td
                    className="px-4 py-4 align-top"
                    style={{ borderBottom: theme.card.border }}
                  >
                    <EnvironmentBadge environment={row.environment} />
                  </td>
                  <td
                    className="px-4 py-4 align-top"
                    style={{ borderBottom: theme.card.border }}
                  >
                    <StatusBadge status={row.status} />
                  </td>
                  <td
                    className="px-4 py-4 align-top"
                    style={{
                      borderBottom: theme.card.border,
                      color: theme.text.body,
                    }}
                  >
                    {duration(row)}
                  </td>
                  <td
                    className="px-4 py-4 align-top"
                    style={{
                      borderBottom: theme.card.border,
                      color: theme.text.body,
                    }}
                  >
                    {row.triggeredBy}
                  </td>
                  <td
                    className="px-4 py-4 align-top"
                    style={{
                      borderBottom: theme.card.border,
                      color: theme.text.secondary,
                    }}
                  >
                    {formatDate(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 ? (
          <div
            className="px-5 py-12 text-center text-sm"
            style={{ color: theme.text.secondary }}
          >
            No deployments found.
          </div>
        ) : null}
      </div>
    </section>
  );
}
