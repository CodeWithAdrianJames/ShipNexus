"use client";

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
  background: theme.card.background,
  border: theme.card.border,
  color: theme.text.primary,
};

const saveButtonStyle = {
  background: theme.backButton.color,
  border: theme.backButton.color,
  color: theme.card.background,
};

function saveSettings() {
  window.alert("Settings saved successfully");
}

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
        className="text-xs font-semibold uppercase tracking-wide"
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
      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
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
      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
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
  return (
    <button
      type="button"
      className="rounded-lg px-4 py-2 text-sm font-semibold"
      style={saveButtonStyle}
      onClick={saveSettings}
    >
      Save
    </button>
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
      className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold"
      style={{
        background: theme.table.headerBg,
        border: theme.card.border,
        color: theme.text.body,
      }}
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
            background: checked ? theme.backButton.color : theme.table.rowBorder,
            border: theme.card.border,
          }}
        />
        <span
          className="absolute left-1 top-1 h-4 w-4 rounded-full transition peer-checked:translate-x-5"
          style={{ background: theme.card.background }}
        />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const [applicationName, setApplicationName] = useState("ShipNexus");
  const [defaultEnvironment, setDefaultEnvironment] = useState("production");
  const [timezone, setTimezone] = useState("UTC");
  const [webhookSecret, setWebhookSecret] = useState("shipnexus-webhook-secret");
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3000");
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
              <div className="flex gap-2">
                <TextInput
                  type={showWebhookSecret ? "text" : "password"}
                  value={webhookSecret}
                  onChange={setWebhookSecret}
                />
                <SecondaryButton
                  onClick={() => setShowWebhookSecret((current) => !current)}
                >
                  {showWebhookSecret ? "Hide" : "Show"}
                </SecondaryButton>
              </div>
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
