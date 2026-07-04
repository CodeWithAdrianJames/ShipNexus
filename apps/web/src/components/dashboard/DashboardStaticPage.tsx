import type { ComponentType } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  Boxes,
  CheckCircle2,
  CirclePlay,
  ClipboardCheck,
  Code2,
  Database,
  FileText,
  GitBranch,
  Globe2,
  KeyRound,
  Layers3,
  LockKeyhole,
  RadioTower,
  Rocket,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  TimerReset,
  Webhook,
  Workflow,
} from "lucide-react";
import DashboardShell from "./DashboardShell";
import { cx, PANEL_CLASS } from "./styles";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

type Metric = {
  label: string;
  value: string;
  detail: string;
  icon: Icon;
  tone: string;
};

type TimelineItem = {
  title: string;
  meta: string;
  detail: string;
  status: string;
  tone: string;
};

type RecordRow = {
  name: string;
  detail: string;
  owner: string;
  status: string;
  tone: string;
};

type SideItem = {
  label: string;
  value: string;
  detail: string;
};

type PageConfig = {
  title: string;
  description: string;
  action: string;
  secondaryAction: string;
  issueCount?: number;
  metrics: Metric[];
  leadTitle: string;
  leadDescription: string;
  timeline: TimelineItem[];
  tableTitle: string;
  tableDescription: string;
  records: RecordRow[];
  sideTitle: string;
  sideDescription: string;
  sideItems: SideItem[];
  emptyTitle: string;
  emptyDescription: string;
};

export type StaticDashboardPageKey =
  | "pipelines"
  | "deployments"
  | "services"
  | "environments"
  | "releases"
  | "webhooks"
  | "alerts"
  | "logs"
  | "settings";

const blueTone = "bg-blue-50 text-blue-700 ring-blue-100";
const cyanTone = "bg-cyan-50 text-cyan-700 ring-cyan-100";
const emeraldTone = "bg-emerald-50 text-emerald-700 ring-emerald-100";
const violetTone = "bg-violet-50 text-violet-700 ring-violet-100";
const amberTone = "bg-amber-50 text-amber-700 ring-amber-100";
const roseTone = "bg-rose-50 text-rose-700 ring-rose-100";

const pageConfigs: Record<StaticDashboardPageKey, PageConfig> = {
  pipelines: {
    title: "Pipelines",
    description:
      "Design, observe, and harden the delivery workflows that move services toward production.",
    action: "New pipeline",
    secondaryAction: "Import workflow",
    metrics: [
      {
        label: "Active pipelines",
        value: "12",
        detail: "Across core services",
        icon: Workflow,
        tone: blueTone,
      },
      {
        label: "Guarded stages",
        value: "4",
        detail: "Approval or policy gates",
        icon: ShieldCheck,
        tone: emeraldTone,
      },
      {
        label: "Median duration",
        value: "6m 18s",
        detail: "Build to deploy",
        icon: TimerReset,
        tone: violetTone,
      },
    ],
    leadTitle: "Delivery workflow map",
    leadDescription:
      "A practical view of build, scan, release, deploy, and observe stages for platform teams.",
    timeline: [
      {
        title: "Build artifacts",
        meta: "Source checks and container build",
        detail: "API, worker, and web images are prepared for promotion.",
        status: "Healthy",
        tone: emeraldTone,
      },
      {
        title: "Security scan",
        meta: "Dependency and image policy",
        detail: "High severity findings block production promotion.",
        status: "Guarded",
        tone: amberTone,
      },
      {
        title: "Deploy",
        meta: "Runtime rollout",
        detail: "ECS service updates, task health, and completion state.",
        status: "Live",
        tone: blueTone,
      },
    ],
    tableTitle: "Pipeline templates",
    tableDescription: "Reusable workflow blueprints ready for backend wiring.",
    records: [
      {
        name: "Standard service rollout",
        detail: "Build, scan, deploy, verify",
        owner: "Platform",
        status: "Recommended",
        tone: blueTone,
      },
      {
        name: "Worker queue rollout",
        detail: "Drain, deploy, replay health checks",
        owner: "Reliability",
        status: "Draft",
        tone: amberTone,
      },
      {
        name: "Hotfix fast lane",
        detail: "Approval gate with shortened verification",
        owner: "Release",
        status: "Guarded",
        tone: roseTone,
      },
    ],
    sideTitle: "Workflow readiness",
    sideDescription: "Near-term controls to connect as orchestration expands.",
    sideItems: [
      {
        label: "Policy gates",
        value: "Configured",
        detail: "Scan and approval checks are represented in the model.",
      },
      {
        label: "Manual approvals",
        value: "Planned",
        detail: "Approval actions need backend mutation endpoints.",
      },
      {
        label: "Audit trail",
        value: "Ready",
        detail: "Events can be attached to deployment records.",
      },
    ],
    emptyTitle: "Pipeline editor pending",
    emptyDescription:
      "The page is ready for workflow creation once the orchestration API exposes template mutations.",
  },
  deployments: {
    title: "Deployments",
    description:
      "Track rollout records, active jobs, ownership, timing, and status without leaving the dashboard.",
    action: "Trigger deploy",
    secondaryAction: "Export CSV",
    issueCount: 1,
    metrics: [
      {
        label: "Observed jobs",
        value: "50",
        detail: "Most recent records",
        icon: Database,
        tone: blueTone,
      },
      {
        label: "Running now",
        value: "2",
        detail: "Awaiting completion",
        icon: CirclePlay,
        tone: violetTone,
      },
      {
        label: "Needs review",
        value: "1",
        detail: "Failed or blocked",
        icon: AlertCircle,
        tone: roseTone,
      },
    ],
    leadTitle: "Rollout command list",
    leadDescription:
      "Operational deployment states organized for scanning during releases and incidents.",
    timeline: [
      {
        title: "web-client to production",
        meta: "v2.8.1 from main",
        detail: "Promotion completed after smoke checks passed.",
        status: "Success",
        tone: emeraldTone,
      },
      {
        title: "billing-worker to staging",
        meta: "v1.19.0-rc.2",
        detail: "Background worker rollout is still reporting health.",
        status: "Running",
        tone: violetTone,
      },
      {
        title: "api-gateway to preview",
        meta: "PR #184",
        detail: "Waiting for queue capacity before deployment starts.",
        status: "Queued",
        tone: cyanTone,
      },
    ],
    tableTitle: "Deployment queue",
    tableDescription: "A focused list for the jobs that need operator context.",
    records: [
      {
        name: "api-gateway",
        detail: "production / sha-90ac1f2",
        owner: "Core API",
        status: "Healthy",
        tone: emeraldTone,
      },
      {
        name: "billing-worker",
        detail: "staging / sha-2d9fb12",
        owner: "Payments",
        status: "Running",
        tone: violetTone,
      },
      {
        name: "web-client",
        detail: "preview / sha-b14d882",
        owner: "Frontend",
        status: "Queued",
        tone: cyanTone,
      },
    ],
    sideTitle: "Rollout policy",
    sideDescription: "Controls that keep deployment actions intentional.",
    sideItems: [
      {
        label: "Production trigger",
        value: "Guarded",
        detail: "Release owner approval is required.",
      },
      {
        label: "Rollback window",
        value: "30m",
        detail: "Operators can inspect recent deploys before expiry.",
      },
      {
        label: "Source of truth",
        value: "Postgres",
        detail: "Live jobs populate the overview table.",
      },
    ],
    emptyTitle: "Manual deployment actions pending",
    emptyDescription:
      "Trigger and rollback buttons are staged for the API endpoints that will mutate deployment jobs.",
  },
  services: {
    title: "Services",
    description:
      "Inventory deployable services, ownership, runtime targets, and their delivery readiness.",
    action: "Register service",
    secondaryAction: "Sync catalog",
    metrics: [
      {
        label: "Services",
        value: "8",
        detail: "Ready for rollout tracking",
        icon: Boxes,
        tone: blueTone,
      },
      {
        label: "Runtime targets",
        value: "3",
        detail: "Web, API, worker",
        icon: Server,
        tone: cyanTone,
      },
      {
        label: "Owner coverage",
        value: "100%",
        detail: "Every service has a team",
        icon: ClipboardCheck,
        tone: emeraldTone,
      },
    ],
    leadTitle: "Service catalog",
    leadDescription:
      "A compact catalog view that ties deployable units to owners and operational context.",
    timeline: [
      {
        title: "api-gateway",
        meta: "Node service / ECS",
        detail: "Primary API surface for deployment intake and job lookup.",
        status: "Tracked",
        tone: blueTone,
      },
      {
        title: "worker-processor",
        meta: "Queue consumer / ECS",
        detail: "Processes deployment jobs and updates rollout state.",
        status: "Tracked",
        tone: emeraldTone,
      },
      {
        title: "web-dashboard",
        meta: "Next.js application",
        detail: "Operator dashboard and product surface for ShipNexus.",
        status: "Tracked",
        tone: violetTone,
      },
    ],
    tableTitle: "Service ownership",
    tableDescription: "Operational contacts for each deployable unit.",
    records: [
      {
        name: "api-gateway",
        detail: "Production and staging",
        owner: "Core API",
        status: "Deployable",
        tone: emeraldTone,
      },
      {
        name: "worker-processor",
        detail: "Queue-backed runtime",
        owner: "Platform",
        status: "Deployable",
        tone: emeraldTone,
      },
      {
        name: "web-dashboard",
        detail: "Customer-facing console",
        owner: "Frontend",
        status: "Preview ready",
        tone: cyanTone,
      },
    ],
    sideTitle: "Catalog readiness",
    sideDescription: "The service page is prepared for catalog integration.",
    sideItems: [
      {
        label: "Ownership",
        value: "Modeled",
        detail: "Team and service metadata can be added to records.",
      },
      {
        label: "Runtime health",
        value: "Planned",
        detail: "Health checks need runtime telemetry wiring.",
      },
      {
        label: "Dependencies",
        value: "Next",
        detail: "Service dependency graphs can extend this layout.",
      },
    ],
    emptyTitle: "Catalog mutations pending",
    emptyDescription:
      "Registration controls are visible, with backend writes ready to attach later.",
  },
  environments: {
    title: "Environments",
    description:
      "Compare production, staging, preview, and development readiness across rollout lanes.",
    action: "Add environment",
    secondaryAction: "Review policy",
    metrics: [
      {
        label: "Environments",
        value: "4",
        detail: "Production to preview",
        icon: Layers3,
        tone: blueTone,
      },
      {
        label: "Protected",
        value: "2",
        detail: "Approval enforced",
        icon: LockKeyhole,
        tone: emeraldTone,
      },
      {
        label: "Preview lanes",
        value: "6",
        detail: "Available for branches",
        icon: Globe2,
        tone: cyanTone,
      },
    ],
    leadTitle: "Environment lanes",
    leadDescription:
      "Policy and visibility for each place a service can be promoted.",
    timeline: [
      {
        title: "Production",
        meta: "Protected / customer traffic",
        detail: "Requires approval, audit context, and rollback plan.",
        status: "Protected",
        tone: emeraldTone,
      },
      {
        title: "Staging",
        meta: "Shared verification",
        detail: "Release candidates and integration checks land here first.",
        status: "Active",
        tone: blueTone,
      },
      {
        title: "Preview",
        meta: "Branch-scoped",
        detail: "Short-lived deployments for review and validation.",
        status: "Elastic",
        tone: cyanTone,
      },
    ],
    tableTitle: "Environment policies",
    tableDescription: "Controls and ownership by rollout destination.",
    records: [
      {
        name: "production",
        detail: "Manual approval, audit required",
        owner: "Release",
        status: "Protected",
        tone: emeraldTone,
      },
      {
        name: "staging",
        detail: "Automated deploy after scan",
        owner: "Platform",
        status: "Open",
        tone: blueTone,
      },
      {
        name: "preview",
        detail: "Branch TTL and auto-cleanup",
        owner: "Frontend",
        status: "Elastic",
        tone: cyanTone,
      },
    ],
    sideTitle: "Promotion checks",
    sideDescription: "Environment-specific controls for safer movement.",
    sideItems: [
      {
        label: "Approvals",
        value: "Production",
        detail: "Approval gates apply to customer-facing deploys.",
      },
      {
        label: "TTL cleanup",
        value: "Preview",
        detail: "Preview lanes are ready for automated cleanup rules.",
      },
      {
        label: "Secrets",
        value: "Scoped",
        detail: "Environment secrets are separated by lane.",
      },
    ],
    emptyTitle: "Environment editor pending",
    emptyDescription:
      "Policy cards are ready for persisted environment settings when those endpoints exist.",
  },
  releases: {
    title: "Releases",
    description:
      "Coordinate version bundles, promotion decisions, release notes, and rollback context.",
    action: "Create release",
    secondaryAction: "Draft notes",
    metrics: [
      {
        label: "Release trains",
        value: "3",
        detail: "Weekly, hotfix, preview",
        icon: Tags,
        tone: blueTone,
      },
      {
        label: "Ready changes",
        value: "14",
        detail: "Waiting promotion",
        icon: GitBranch,
        tone: violetTone,
      },
      {
        label: "Rollback notes",
        value: "100%",
        detail: "Required for prod",
        icon: FileText,
        tone: emeraldTone,
      },
    ],
    leadTitle: "Release coordination",
    leadDescription:
      "A release-oriented view that connects commits, deployment jobs, notes, and owners.",
    timeline: [
      {
        title: "2026.07 platform train",
        meta: "Scheduled release",
        detail: "API, worker, and dashboard changes queued for staging.",
        status: "Preparing",
        tone: blueTone,
      },
      {
        title: "Billing hotfix",
        meta: "Patch release",
        detail: "Rollback notes drafted and awaiting approval.",
        status: "Review",
        tone: amberTone,
      },
      {
        title: "Preview bundle",
        meta: "Feature validation",
        detail: "Design and workflow changes running in preview lanes.",
        status: "Preview",
        tone: cyanTone,
      },
    ],
    tableTitle: "Release candidates",
    tableDescription: "Release bundles staged for team review.",
    records: [
      {
        name: "2026.07.03",
        detail: "Platform release train",
        owner: "Release",
        status: "Preparing",
        tone: blueTone,
      },
      {
        name: "billing-hotfix-12",
        detail: "Worker patch",
        owner: "Payments",
        status: "Review",
        tone: amberTone,
      },
      {
        name: "dashboard-pages",
        detail: "Console completion",
        owner: "Frontend",
        status: "Preview",
        tone: cyanTone,
      },
    ],
    sideTitle: "Release hygiene",
    sideDescription: "The release page keeps coordination visible.",
    sideItems: [
      {
        label: "Notes",
        value: "Required",
        detail: "Production releases should include operator notes.",
      },
      {
        label: "Rollback",
        value: "Linked",
        detail: "Rollback context belongs beside release records.",
      },
      {
        label: "Approvals",
        value: "Planned",
        detail: "Release approvals can reuse the pipeline gate model.",
      },
    ],
    emptyTitle: "Release creation pending",
    emptyDescription:
      "Release records can be connected when a release model is added to the API.",
  },
  webhooks: {
    title: "Webhooks",
    description:
      "Inspect inbound delivery events, provider health, signatures, and retry posture.",
    action: "Add endpoint",
    secondaryAction: "Send test",
    metrics: [
      {
        label: "Providers",
        value: "2",
        detail: "GitHub and release API",
        icon: Webhook,
        tone: blueTone,
      },
      {
        label: "Verified events",
        value: "99.4%",
        detail: "Signature checks",
        icon: ShieldCheck,
        tone: emeraldTone,
      },
      {
        label: "Retry window",
        value: "15m",
        detail: "Backoff policy",
        icon: TimerReset,
        tone: violetTone,
      },
    ],
    leadTitle: "Webhook intake",
    leadDescription:
      "Inbound events are modeled as deployment triggers with audit and retry context.",
    timeline: [
      {
        title: "GitHub push",
        meta: "Repository event",
        detail: "Creates deployment candidates from branch and SHA payloads.",
        status: "Verified",
        tone: emeraldTone,
      },
      {
        title: "Release command",
        meta: "Internal API",
        detail: "Accepts controlled production deploy requests.",
        status: "Ready",
        tone: blueTone,
      },
      {
        title: "Manual replay",
        meta: "Operator action",
        detail: "Replay controls need backend mutation wiring.",
        status: "Planned",
        tone: amberTone,
      },
    ],
    tableTitle: "Event sources",
    tableDescription: "Configured event sources and expected payloads.",
    records: [
      {
        name: "github.push",
        detail: "Branch and commit metadata",
        owner: "Platform",
        status: "Verified",
        tone: emeraldTone,
      },
      {
        name: "github.workflow_run",
        detail: "CI completion signal",
        owner: "CI",
        status: "Ready",
        tone: blueTone,
      },
      {
        name: "release.promote",
        detail: "Internal promotion event",
        owner: "Release",
        status: "Planned",
        tone: amberTone,
      },
    ],
    sideTitle: "Security posture",
    sideDescription: "Controls that make webhook intake reliable.",
    sideItems: [
      {
        label: "Signature guard",
        value: "Enabled",
        detail: "GitHub webhook requests are verified before intake.",
      },
      {
        label: "Idempotency",
        value: "Modeled",
        detail: "Event IDs can protect against duplicated delivery.",
      },
      {
        label: "Replay",
        value: "Pending",
        detail: "Replay needs an operator mutation endpoint.",
      },
    ],
    emptyTitle: "Webhook management pending",
    emptyDescription:
      "Endpoint controls are staged for provider management once settings are persisted.",
  },
  alerts: {
    title: "Alerts",
    description:
      "Centralize failed deployments, slow rollouts, stuck queues, and policy exceptions.",
    action: "Create rule",
    secondaryAction: "Mute schedule",
    issueCount: 2,
    metrics: [
      {
        label: "Open alerts",
        value: "2",
        detail: "Need operator review",
        icon: Bell,
        tone: roseTone,
      },
      {
        label: "Rules",
        value: "6",
        detail: "Deployment health checks",
        icon: SlidersHorizontal,
        tone: blueTone,
      },
      {
        label: "Mean ack",
        value: "4m",
        detail: "Target response time",
        icon: TimerReset,
        tone: violetTone,
      },
    ],
    leadTitle: "Alert inbox",
    leadDescription:
      "Actionable alert groups for the conditions most likely to affect delivery.",
    timeline: [
      {
        title: "Production deploy failed",
        meta: "api-gateway",
        detail: "A failed production rollout should page the release owner.",
        status: "Open",
        tone: roseTone,
      },
      {
        title: "Queue wait exceeded",
        meta: "worker-processor",
        detail: "Queued jobs are waiting longer than the configured threshold.",
        status: "Open",
        tone: amberTone,
      },
      {
        title: "Preview cleanup complete",
        meta: "preview lanes",
        detail: "Short-lived environments cleaned up without action.",
        status: "Resolved",
        tone: emeraldTone,
      },
    ],
    tableTitle: "Alert rules",
    tableDescription: "Useful starter rules for deployment observability.",
    records: [
      {
        name: "Failed production deploy",
        detail: "Any failed production job",
        owner: "Release",
        status: "Critical",
        tone: roseTone,
      },
      {
        name: "Stuck running job",
        detail: "Running longer than 20 minutes",
        owner: "Platform",
        status: "Warning",
        tone: amberTone,
      },
      {
        name: "Webhook verification failed",
        detail: "Invalid signature or duplicate event",
        owner: "Security",
        status: "Warning",
        tone: amberTone,
      },
    ],
    sideTitle: "Response workflow",
    sideDescription: "The page is structured for incident handoff.",
    sideItems: [
      {
        label: "Escalation",
        value: "Release owner",
        detail: "Production failures route to release ownership.",
      },
      {
        label: "Mute support",
        value: "Planned",
        detail: "Maintenance windows need persistence.",
      },
      {
        label: "Audit",
        value: "Ready",
        detail: "Alert lifecycle can attach to deployment jobs.",
      },
    ],
    emptyTitle: "Alert actions pending",
    emptyDescription:
      "Acknowledge, mute, and resolve actions are ready for alert API endpoints.",
  },
  logs: {
    title: "Logs",
    description:
      "Review structured deployment events, webhook intake, worker progress, and operator context.",
    action: "Stream logs",
    secondaryAction: "Download",
    metrics: [
      {
        label: "Events indexed",
        value: "1.2k",
        detail: "Last 24 hours",
        icon: FileText,
        tone: blueTone,
      },
      {
        label: "Sources",
        value: "4",
        detail: "API, worker, webhooks, runtime",
        icon: RadioTower,
        tone: cyanTone,
      },
      {
        label: "Retention",
        value: "14d",
        detail: "Operational window",
        icon: Database,
        tone: violetTone,
      },
    ],
    leadTitle: "Event stream",
    leadDescription:
      "Log-shaped operational data that keeps deployment history explainable.",
    timeline: [
      {
        title: "deployment.created",
        meta: "api-gateway",
        detail: "A new job was recorded after a verified webhook event.",
        status: "Info",
        tone: blueTone,
      },
      {
        title: "worker.started",
        meta: "worker-processor",
        detail: "The processor acquired a lock and began rollout work.",
        status: "Info",
        tone: cyanTone,
      },
      {
        title: "deployment.failed",
        meta: "billing-worker",
        detail: "A task update returned an unhealthy deployment state.",
        status: "Error",
        tone: roseTone,
      },
    ],
    tableTitle: "Saved log views",
    tableDescription: "Filters operators will expect when logs are connected.",
    records: [
      {
        name: "Failed deploys",
        detail: "status:error service:* environment:*",
        owner: "Release",
        status: "Saved",
        tone: blueTone,
      },
      {
        name: "Webhook intake",
        detail: "source:webhook signature:*",
        owner: "Platform",
        status: "Saved",
        tone: blueTone,
      },
      {
        name: "Worker locks",
        detail: "source:worker lock:*",
        owner: "Reliability",
        status: "Draft",
        tone: amberTone,
      },
    ],
    sideTitle: "Search posture",
    sideDescription: "Prepared for a dedicated logging backend.",
    sideItems: [
      {
        label: "Structured events",
        value: "Modeled",
        detail: "Rows use event names, sources, and deployment context.",
      },
      {
        label: "Live tail",
        value: "Pending",
        detail: "Streaming requires a backend event source.",
      },
      {
        label: "Exports",
        value: "Planned",
        detail: "Download actions can attach once logs are stored.",
      },
    ],
    emptyTitle: "Live logging pending",
    emptyDescription:
      "The logs interface is ready for indexed events and streaming transport.",
  },
  settings: {
    title: "Settings",
    description:
      "Manage workspace defaults, access controls, deployment policy, and integration readiness.",
    action: "Save changes",
    secondaryAction: "Invite member",
    metrics: [
      {
        label: "Workspace",
        value: "Nexus",
        detail: "Production demo team",
        icon: Settings,
        tone: blueTone,
      },
      {
        label: "Members",
        value: "6",
        detail: "Admins and operators",
        icon: KeyRound,
        tone: violetTone,
      },
      {
        label: "Policy checks",
        value: "5",
        detail: "Ready to enforce",
        icon: ShieldCheck,
        tone: emeraldTone,
      },
    ],
    leadTitle: "Workspace controls",
    leadDescription:
      "Settings are grouped around the levers operators will use most often.",
    timeline: [
      {
        title: "Deployment defaults",
        meta: "Environment and rollback policy",
        detail: "Set primary environment, retry posture, and required notes.",
        status: "Ready",
        tone: blueTone,
      },
      {
        title: "Access control",
        meta: "Roles and permissions",
        detail: "Separate platform admins from release operators.",
        status: "Planned",
        tone: amberTone,
      },
      {
        title: "Integrations",
        meta: "GitHub and runtime providers",
        detail: "Connect source events and infrastructure targets.",
        status: "Ready",
        tone: emeraldTone,
      },
    ],
    tableTitle: "Policy defaults",
    tableDescription: "Settings prepared for persistence in the product API.",
    records: [
      {
        name: "Production approvals",
        detail: "Require release owner confirmation",
        owner: "Admins",
        status: "Enabled",
        tone: emeraldTone,
      },
      {
        name: "Failed deploy alerting",
        detail: "Notify on production failures",
        owner: "Admins",
        status: "Enabled",
        tone: emeraldTone,
      },
      {
        name: "Preview TTL",
        detail: "Clean preview lanes after 72 hours",
        owner: "Platform",
        status: "Draft",
        tone: amberTone,
      },
    ],
    sideTitle: "Account setup",
    sideDescription: "Current workspace posture for a SaaS-ready dashboard.",
    sideItems: [
      {
        label: "Branding",
        value: "ShipNexus",
        detail: "Workspace naming matches the product surface.",
      },
      {
        label: "Roles",
        value: "Planned",
        detail: "Role persistence can be added without changing layout.",
      },
      {
        label: "Integrations",
        value: "Ready",
        detail: "Provider cards can connect to OAuth or secrets later.",
      },
    ],
    emptyTitle: "Persistence pending",
    emptyDescription:
      "Settings controls are visually complete and ready for mutation endpoints.",
  },
};

function ActionButton({
  children,
  primary = false,
}: {
  children: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      title={`${children} will be available when backend actions are connected.`}
      className={cx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        primary
          ? "bg-blue-700 text-white shadow-blue-200 hover:bg-blue-800 disabled:hover:bg-blue-700"
          : "border border-slate-200 bg-white text-slate-900 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-900",
      )}
    >
      {primary ? (
        <Rocket className="h-4 w-4" aria-hidden={true} />
      ) : (
        <Code2 className="h-4 w-4" aria-hidden={true} />
      )}
      {children}
    </button>
  );
}

export default function DashboardStaticPage({
  page,
}: {
  page: StaticDashboardPageKey;
}) {
  const config = pageConfigs[page];

  return (
    <DashboardShell
      title={config.title}
      description={config.description}
      issueCount={config.issueCount}
      actions={
        <>
          <ActionButton>{config.secondaryAction}</ActionButton>
          <ActionButton primary>{config.action}</ActionButton>
        </>
      }
    >
      <section
        className="grid gap-4 md:grid-cols-3"
        aria-label={`${config.title} summary`}
      >
        {config.metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.label}
              className={cx(PANEL_CLASS, "p-5 transition hover:border-blue-200 hover:shadow-md")}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={cx(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ring-1",
                    metric.tone,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden={true} />
                </div>
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                  Live view
                </span>
              </div>
              <p className="mt-5 text-xs font-semibold uppercase text-slate-500">
                {metric.label}
              </p>
              <div className="mt-2 flex min-h-12 flex-wrap items-end justify-between gap-3">
                <p className="text-3xl font-semibold tabular-nums text-slate-950 md:text-4xl">
                  {metric.value}
                </p>
                <p className="pb-1 text-sm font-semibold leading-5 text-slate-600">
                  {metric.detail}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <article className={cx(PANEL_CLASS, "p-5")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">{config.leadTitle}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                {config.leadDescription}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              <Activity className="h-4 w-4" aria-hidden={true} />
              Operator ready
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            {config.timeline.map((item, index) => (
              <div
                key={item.title}
                className="grid gap-4 rounded-lg border border-slate-200 bg-[#f8fbff] p-4 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-start"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-blue-100 shadow-sm shadow-blue-950/5">
                  <span className="text-sm font-semibold tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                    {item.meta}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.detail}
                  </p>
                </div>
                <span
                  className={cx(
                    "inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ring-1",
                    item.tone,
                  )}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-5">
          <article className={cx(PANEL_CLASS, "p-5")}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">{config.sideTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {config.sideDescription}
                </p>
              </div>
              <CheckCircle2
                className="h-5 w-5 text-emerald-600"
                aria-hidden={true}
              />
            </div>

            <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-[#f8fbff]">
              {config.sideItems.map((item) => (
                <div key={item.label} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">
                      {item.label}
                    </span>
                    <span className="text-right text-sm font-semibold text-slate-950">
                      {item.value}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className={cx(PANEL_CLASS, "p-5")}>
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-blue-200 bg-[#f8fbff] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Workflow className="h-5 w-5" aria-hidden={true} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  {config.emptyTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {config.emptyDescription}
                </p>
              </div>
            </div>
          </article>
        </aside>
      </section>

      <section className={cx(PANEL_CLASS, "overflow-hidden")}>
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">{config.tableTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {config.tableDescription}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            <Database className="h-4 w-4" aria-hidden={true} />
            Workspace scope
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-slate-200 bg-[#f8fbff] text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 text-left">
                  Name
                </th>
                <th scope="col" className="px-5 py-3 text-left">
                  Detail
                </th>
                <th scope="col" className="px-5 py-3 text-left">
                  Owner
                </th>
                <th scope="col" className="px-5 py-3 text-left">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {config.records.map((record) => (
                <tr key={record.name} className="transition hover:bg-blue-50/40">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    {record.name}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{record.detail}</td>
                  <td className="px-5 py-4 text-slate-600">{record.owner}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cx(
                        "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1",
                        record.tone,
                      )}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
