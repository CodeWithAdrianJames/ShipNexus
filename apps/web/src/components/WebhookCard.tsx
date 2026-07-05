"use client";

import { useState } from "react";
import type { DeploymentStatus } from "@/database/schema";
import { theme } from "@/lib/dashboard-theme";

export type WebhookEvent = {
  id: string;
  webhookEventId: string;
  source: string;
  serviceName: string;
  receivedAt: string;
  status: DeploymentStatus;
  payload: string;
  payloadPreview: string;
};

const cardStyle = {
  background: theme.card.background,
  border: theme.card.border,
  borderRadius: theme.card.borderRadius,
  boxShadow: theme.card.shadow,
};

function StatusBadge({ status }: { status: DeploymentStatus }) {
  const statusStyle = theme.status[status];

  return (
    <span
      className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize"
      style={{
        background: statusStyle.bg,
        border: statusStyle.border,
        color: statusStyle.text,
      }}
    >
      {status}
    </span>
  );
}

export default function WebhookCard({ event }: { event: WebhookEvent }) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = theme.status[event.status];

  return (
    <article
      className="overflow-hidden p-5"
      style={{
        ...cardStyle,
        borderLeft: `4px solid ${statusStyle.text}`,
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} />
            <span
              className="font-mono text-xs"
              style={{ color: theme.text.secondary }}
            >
              {event.webhookEventId}
            </span>
          </div>

          <h2
            className="mt-3 text-base font-semibold"
            style={{ color: theme.text.primary }}
          >
            {event.serviceName}
          </h2>
          <p className="mt-1 text-sm" style={{ color: theme.text.secondary }}>
            Source: {event.source}
          </p>
        </div>

        <p className="text-sm font-medium" style={{ color: theme.text.body }}>
          {event.receivedAt}
        </p>
      </div>

      <div
        className="mt-4 rounded-lg p-3"
        style={{
          background: theme.table.headerBg,
          border: theme.card.border,
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: theme.text.label }}
        >
          Payload preview
        </p>
        <pre
          className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-6"
          style={{ color: theme.text.body }}
        >
          {expanded ? event.payload : event.payloadPreview}
        </pre>
      </div>

      <button
        type="button"
        className="mt-4 text-sm font-semibold"
        style={theme.backButton}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Collapse payload" : "Expand payload"}
      </button>
    </article>
  );
}
