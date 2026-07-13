"use client";

// TODO: Add PATCH /settings, persist settings in a settings table or
// SSM-backed config, and add an authorized DELETE /deployments endpoint for
// the danger zone action.

import Link from "next/link";
import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { theme } from "@/lib/dashboard-theme";

const cardStyle = {
  background: theme.card.background,
  border: theme.card.border,
  borderRadius: theme.card.borderRadius,
  boxShadow: theme.card.shadow,
};

const inputStyle = {
  background: theme.table.headerBg,
  border: theme.card.border,
  color: theme.text.primary,
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="p-5" style={cardStyle}>
      <div>
        <h2 className="text-lg font-semibold" style={{ color: theme.text.primary }}>
          {title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.text.secondary }}>
          {description}
        </p>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="text-xs font-semibold uppercase tracking-normal"
        style={{ color: theme.text.label }}
      >
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#526dff]/30"
      style={inputStyle}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#526dff]/30"
      style={inputStyle}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function SaveButton() {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="rounded-lg bg-[#526dff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4059d4] focus:outline-none focus:ring-2 focus:ring-[#7890ff] focus:ring-offset-2 focus:ring-offset-[#1b172d]"
        onClick={() => setShowNotice(true)}
      >
        Save
      </button>
      {showNotice ? (
        <p
          role="status"
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            background: theme.status.pending.bg,
            border: theme.status.pending.border,
            color: theme.status.pending.text,
          }}
        >
          Settings UI is not yet connected to a backend. Changes are not
          persisted.
        </p>
      ) : null}
    </div>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="shrink-0 rounded-lg border border-white/10 bg-[#151225] px-3 py-2 text-sm font-semibold text-[#d4cfdd] transition hover:border-white/20 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#526dff]"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium" style={{ color: theme.text.body }}>
        {label}
      </span>
      <span className="relative inline-flex">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className="h-6 w-11 rounded-full transition"
          style={{
            background: checked ? "#526dff" : theme.table.rowBorder,
            border: theme.card.border,
          }}
        />
        <span
          className="absolute left-1 top-1 h-4 w-4 rounded-full transition peer-checked:translate-x-5"
          style={{ background: theme.text.primary }}
        />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const [applicationName, setApplicationName] = useState("ShipNexus");
  const [defaultEnvironment, setDefaultEnvironment] = useState("production");
  const [timezone, setTimezone] = useState("UTC");
  const [apiBaseUrl, setApiBaseUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL ?? "",
  );
  const [emailFailed, setEmailFailed] = useState(true);
  const [emailSuccessful, setEmailSuccessful] = useState(false);
  const [alertPending, setAlertPending] = useState(true);

  async function copyApiBaseUrl() {
    await navigator.clipboard.writeText(apiBaseUrl);
  }

  return (
    <DashboardShell
      title="Settings"
      description="Configure local dashboard preferences, webhook values, notification defaults, and destructive maintenance actions."
      actions={
        <Link
          href="/dashboard"
          className="font-medium"
          style={theme.backButton}
        >
          &larr; Back to Dashboard
        </Link>
      }
    >
      <div className="space-y-6" style={{ color: theme.text.body }}>
        <SectionCard
          title="General"
          description="Default workspace values used across the dashboard."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <FieldLabel label="Application name">
              <TextInput value={applicationName} onChange={setApplicationName} />
            </FieldLabel>
            <FieldLabel label="Default environment">
              <SelectInput
                value={defaultEnvironment}
                onChange={setDefaultEnvironment}
                options={["production", "staging", "development"]}
              />
            </FieldLabel>
            <FieldLabel label="Timezone">
              <SelectInput
                value={timezone}
                onChange={setTimezone}
                options={[
                  "UTC",
                  "Asia/Manila",
                  "America/New_York",
                  "Europe/London",
                  "Asia/Singapore",
                ]}
              />
            </FieldLabel>
          </div>
          <SaveButton />
        </SectionCard>

        <SectionCard
          title="API & Webhook"
          description="Local integration values for webhook ingestion and API access."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <FieldLabel label="Webhook secret">
              <input
                type="text"
                value="••••••••••••••••"
                readOnly
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <p
                className="mt-2 text-sm leading-6"
                style={{ color: theme.text.secondary }}
              >
                The webhook secret is configured via the GITHUB_WEBHOOK_SECRET
                environment variable on the server and is never exposed to the
                browser for security reasons. To rotate it, update the
                environment variable and restart the API.
              </p>
            </FieldLabel>
            <FieldLabel label="API base URL">
              <div className="flex gap-2">
                <TextInput value={apiBaseUrl} onChange={setApiBaseUrl} />
                <SecondaryButton onClick={() => void copyApiBaseUrl()}>
                  Copy
                </SecondaryButton>
              </div>
            </FieldLabel>
          </div>
          <SaveButton />
        </SectionCard>

        <SectionCard
          title="Notifications"
          description="Choose which deployment events should create notification activity."
        >
          <div className="space-y-4">
            <ToggleSwitch
              label="Email on failed deployment"
              checked={emailFailed}
              onChange={setEmailFailed}
            />
            <ToggleSwitch
              label="Email on successful deployment"
              checked={emailSuccessful}
              onChange={setEmailSuccessful}
            />
            <ToggleSwitch
              label="Alert on pending job > 10 minutes"
              checked={alertPending}
              onChange={setAlertPending}
            />
          </div>
          <SaveButton />
        </SectionCard>

        <SectionCard
          title="Danger Zone"
          description="Destructive maintenance actions for deployment data."
        >
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            onClick={() =>
              window.confirm(
                "This feature is not yet implemented. No data will be deleted.",
              )
            }
            style={{
              background: theme.status.failed.bg,
              border: theme.status.failed.border,
              color: theme.status.failed.text,
            }}
          >
            Clear all deployment history
          </button>
          <p className="text-sm" style={{ color: theme.text.secondary }}>
            This action cannot be undone. All deployment records will be
            permanently deleted.
          </p>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
