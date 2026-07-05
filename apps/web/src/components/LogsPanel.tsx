"use client";

import { useMemo, useState } from "react";
import { theme } from "@/lib/dashboard-theme";

export type LogEntry = {
  id: string;
  status: "success" | "failed" | "pending" | "running";
  line: string;
};

type Filter = "all" | LogEntry["status"];

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
  { label: "Pending", value: "pending" },
  { label: "Running", value: "running" },
];

const panelStyle = {
  background: theme.card.background,
  border: theme.card.border,
  borderRadius: theme.card.borderRadius,
  boxShadow: theme.card.shadow,
};

function filterStyle(value: Filter, active: boolean) {
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

export default function LogsPanel({ entries }: { entries: LogEntry[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filteredEntries = useMemo(
    () =>
      filter === "all"
        ? entries
        : entries.filter((entry) => entry.status === filter),
    [entries, filter],
  );

  return (
    <section className="space-y-4" aria-label="Deployment log entries">
      <div className="flex flex-wrap gap-2" aria-label="Log status filters">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            className="rounded-full px-3 py-1.5 text-sm font-semibold transition"
            style={filterStyle(option.value, filter === option.value)}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden" style={panelStyle}>
        {filteredEntries.length > 0 ? (
          <ol className="divide-y" style={{ borderColor: theme.table.rowBorder }}>
            {filteredEntries.map((entry) => (
              <li
                key={entry.id}
                className="overflow-x-auto px-4 py-3 font-mono text-sm leading-6"
                style={{
                  borderColor: theme.table.rowBorder,
                  color: theme.status[entry.status].text,
                }}
              >
                <span className="whitespace-pre">{entry.line}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div
            className="px-5 py-12 text-center text-sm"
            style={{ color: theme.text.secondary }}
          >
            No log entries match this filter.
          </div>
        )}
      </div>
    </section>
  );
}
