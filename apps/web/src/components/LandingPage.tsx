import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CirclePlay,
  CloudCog,
  Code2,
  Database,
  GitBranch,
  GitCommitHorizontal,
  Layers3,
  LockKeyhole,
  RadioTower,
  Rocket,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Architecture", href: "#architecture" },
];

const metrics = [
  {
    label: "Deployments observed",
    value: "50",
    detail: "Latest jobs",
    icon: LockKeyhole,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  {
    label: "Refresh cadence",
    value: "10s",
    detail: "Live dashboard",
    icon: TimerReset,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  },
  {
    label: "Pipeline states",
    value: "6",
    detail: "Tracked statuses",
    icon: Workflow,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
];

const problems = [
  {
    title: "Deployment context is scattered",
    copy: "Pipeline status, release ownership, service health, and webhook events often live in separate tools that slow down incident response.",
  },
  {
    title: "Rollout risk is hard to see",
    copy: "Teams need a single operational view that makes failures, pending work, and active rollouts obvious before they spread.",
  },
  {
    title: "Platform teams need repeatability",
    copy: "Reliable delivery depends on workflow automation, clear environments, and deployment records that stay easy to audit.",
  },
];

const features = [
  {
    title: "Smart orchestration",
    copy: "Model deployment workflows with structured status, trigger, service, and environment context.",
    icon: Workflow,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  {
    title: "Real-time monitoring",
    copy: "Monitor recent jobs, status mix, durations, triggers, and rollout velocity from one command center.",
    icon: Activity,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  },
  {
    title: "Environment control",
    copy: "Track which services are moving through production, staging, and preview workflows without digging through logs.",
    icon: Layers3,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    title: "Release visibility",
    copy: "Connect GitHub events, image tags, and deployment triggers into a structured pipeline record.",
    icon: GitBranch,
    tone: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  {
    title: "Failure recovery",
    copy: "Surface failed, queued, running, cancelled, and successful jobs so teams can respond with confidence.",
    icon: ShieldCheck,
    tone: "bg-rose-50 text-rose-700 ring-rose-100",
  },
  {
    title: "Webhook automation",
    copy: "Turn GitHub and release events into auditable deployment records that stay visible to every team.",
    icon: Webhook,
    tone: "bg-amber-50 text-amber-700 ring-amber-100",
  },
];

const workflowSteps = [
  {
    title: "Trigger",
    copy: "A repository event or release command starts a deployment workflow.",
    icon: GitBranch,
  },
  {
    title: "Orchestrate",
    copy: "ShipNexus records service, image, environment, status, and timing metadata.",
    icon: Workflow,
  },
  {
    title: "Observe",
    copy: "Teams watch rollout health, failures, and recent jobs in the live dashboard.",
    icon: RadioTower,
  },
  {
    title: "Improve",
    copy: "Pipeline data becomes a feedback loop for reliability and delivery speed.",
    icon: Zap,
  },
];

const architectureItems = [
  { label: "Git provider", icon: GitCommitHorizontal },
  { label: "Webhook intake", icon: Webhook },
  { label: "Pipeline engine", icon: CloudCog },
  { label: "Deployment store", icon: Database },
  { label: "Service runtime", icon: Server },
  { label: "Ops dashboard", icon: Activity },
];

const benefits = [
  "Give DevOps teams one shared source of deployment truth.",
  "Reduce time spent reconstructing rollout history from scattered systems.",
  "Make failed and active deployments visible before they become incidents.",
  "Create a production-grade demo surface for platform engineering workflows.",
];

function DashboardPreview() {
  const rows = [
    ["api-gateway", "production", "success", "3.0s"],
    ["billing-worker", "staging", "running", "18.4s"],
    ["web-client", "preview", "queued", "-"],
  ];
  const stages = [
    {
      label: "Build",
      value: "128",
      tone: "text-blue-700",
      bar: "bg-blue-600",
      width: "92%",
      icon: Code2,
    },
    {
      label: "Scan",
      value: "124",
      tone: "text-amber-700",
      bar: "bg-amber-500",
      width: "86%",
      icon: ShieldCheck,
    },
    {
      label: "Deploy",
      value: "98",
      tone: "text-emerald-700",
      bar: "bg-emerald-500",
      width: "76%",
      icon: Rocket,
    },
    {
      label: "Observe",
      value: "98.7%",
      tone: "text-violet-700",
      bar: "bg-violet-500",
      width: "94%",
      icon: Activity,
    },
  ];

  return (
    <div
      className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-2xl shadow-blue-950/10"
      aria-label="ShipNexus dashboard preview"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
            <Rocket className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">ShipNexus</p>
            <p className="text-xs text-slate-500">Pipeline overview</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
          <TimerReset className="h-3.5 w-3.5" aria-hidden="true" />
          Last 24 hours
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[132px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-slate-50/70 p-3 xl:block">
          <div className="space-y-1.5">
            {["Overview", "Pipelines", "Deployments", "Environments", "Releases"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${
                    index === 0
                      ? "bg-blue-700 text-white shadow-sm shadow-blue-200"
                      : "text-slate-500"
                  }`}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </aside>

        <div className="min-w-0 bg-[#f6f8fc] p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700">
                Deployment overview
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950 sm:text-xl">
                Operational command center
              </h3>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              <CirclePlay className="h-4 w-4 text-violet-600" aria-hidden="true" />
              2 active workflows
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.label}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-600">
                      {stage.label}
                    </p>
                    <Icon
                      className={`h-4 w-4 ${stage.tone}`}
                      aria-hidden="true"
                    />
                  </div>
                  <p className={`mt-2 text-2xl font-semibold ${stage.tone}`}>
                    {stage.value}
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${stage.bar}`}
                      style={{ width: stage.width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 2xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-950">
                  Deployment flow
                </p>
                <span className="text-xs font-semibold text-emerald-700">
                  Healthy
                </span>
              </div>
              <div className="mt-6 flex items-center justify-between gap-2">
                {["dev", "staging", "prod"].map((env, index) => (
                  <div key={env} className="flex flex-1 items-center gap-2">
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white ${
                          index === 1
                            ? "border-blue-600 text-blue-700"
                            : "border-emerald-500 text-emerald-700"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {env}
                      </span>
                    </div>
                    {index < 2 ? (
                      <span className="h-px flex-1 bg-blue-200" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Success rate</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-slate-950">98.7%</p>
                <span className="text-xs font-semibold text-emerald-700">
                  +2.4% vs yesterday
                </span>
              </div>
              <div className="mt-5 flex h-16 items-end gap-1">
                {[52, 48, 55, 51, 65, 88, 74, 59, 63, 70, 66, 79].map(
                  (height, index) => (
                    <span
                      key={`${height}-${index}`}
                      className="flex-1 rounded-t bg-cyan-400"
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-950">
                Recent deployments
              </p>
              <span className="text-xs font-semibold text-slate-500">
                Last 50
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {rows.map(([service, env, status, duration]) => (
                <div
                  key={`${service}-${env}`}
                  className="grid grid-cols-[minmax(110px,1fr)_minmax(70px,0.6fr)_minmax(72px,0.6fr)] gap-3 px-4 py-3 text-xs sm:grid-cols-[minmax(140px,1fr)_90px_90px_60px]"
                >
                  <span className="truncate font-semibold text-slate-900">
                    {service}
                  </span>
                  <span className="truncate text-slate-500">{env}</span>
                  <span
                    className={`font-semibold ${
                      status === "success"
                        ? "text-emerald-700"
                        : status === "running"
                          ? "text-violet-700"
                          : "text-sky-700"
                    }`}
                  >
                    {status}
                  </span>
                  <span className="hidden font-mono text-slate-500 sm:inline">
                    {duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroScene() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#eef6ff_0%,#f7fbff_48%,#ffffff_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:22px_22px] opacity-25" />
      <div className="absolute inset-x-0 top-0 bottom-0 bg-[linear-gradient(115deg,rgba(37,99,235,0.16)_0%,rgba(6,182,212,0.12)_48%,rgba(255,255,255,0)_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_68%,transparent_100%)]" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm shadow-blue-200">
              <Rocket className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold max-[420px]:hidden">
              ShipNexus
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Landing">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:px-4"
          >
            Launch Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <HeroScene />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 xl:pt-24">
          <div className="grid gap-10 lg:min-h-[600px] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center xl:min-h-[620px] xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:gap-12">
            <div className="max-w-2xl lg:pb-6">
              <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white/85 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Enterprise deployment orchestration
              </div>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-normal text-slate-950 sm:text-6xl lg:text-6xl xl:text-7xl">
                Ship software with one clear{" "}
                <span className="text-blue-700">deployment</span> command
                center.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
                ShipNexus helps DevOps and platform engineering teams manage,
                monitor, and automate deployment workflows across services,
                environments, and release triggers.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View Dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#product"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  See Product Preview
                  <Route className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="w-full max-w-[720px] justify-self-center lg:max-w-none lg:justify-self-end">
              <DashboardPreview />
            </div>
          </div>

          <div className="mt-8 grid overflow-hidden rounded-lg border border-slate-200 bg-white/85 shadow-xl shadow-blue-950/5 backdrop-blur sm:grid-cols-3 lg:mt-4 xl:mt-6">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="flex items-center gap-4 border-b border-slate-200 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${metric.tone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-500">
                      {metric.label}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <p className="text-2xl font-semibold text-slate-950">
                        {metric.value}
                      </p>
                      <p className="text-sm text-slate-600">{metric.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="product" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-700">
              Product preview
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              A live operating layer for deployment teams.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              ShipNexus turns raw deployment jobs into an executive-ready view
              of rollout health, service activity, pipeline failures, and recent
              operational history.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Live Postgres-backed deployment records",
                "Dashboard-first workflow for active incidents",
                "Status, duration, trigger, and environment visibility",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2
                    className="h-5 w-5 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Pipeline health",
                value: "98.7%",
                copy: "Success trends, rollout activity, and failed jobs stay visible at a glance.",
                icon: Activity,
                tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
              },
              {
                title: "Release context",
                value: "24h",
                copy: "Recent service movement, triggers, and environments are grouped by release window.",
                icon: GitCommitHorizontal,
                tone: "bg-blue-50 text-blue-700 ring-blue-100",
              },
              {
                title: "Environment flow",
                value: "3 lanes",
                copy: "Dev, staging, and production states are presented as one operational path.",
                icon: Layers3,
                tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
              },
              {
                title: "Incident signal",
                value: "Live",
                copy: "Running, queued, cancelled, failed, and successful jobs are easy to separate.",
                icon: RadioTower,
                tone: "bg-violet-50 text-violet-700 ring-violet-100",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${item.tone}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="text-2xl font-semibold text-slate-950">
                      {item.value}
                    </p>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="problem" className="border-y border-slate-200 bg-[#f6f9ff] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-rose-700">
              The problem
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Deployment operations break down when teams lose shared context.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {problems.map((problem) => (
              <article
                key={problem.title}
                className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 transition hover:border-blue-200 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold">{problem.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {problem.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase text-blue-700">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Built for platform engineering visibility.
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Open live view
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${feature.tone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-slate-200 bg-[#f8fbff] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase text-blue-700">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              From trigger to operational signal.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              ShipNexus is designed around the deployment lifecycle: capture the
              event, structure the workflow, observe health, and improve the
              next release.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-sm text-slate-400">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {step.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="architecture" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-blue-700">
                Architecture
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                A workflow model that matches modern DevOps infrastructure.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The current product surface focuses on the command center:
                normalized deployment records, operational analytics, and the
                dashboard path teams use during release windows.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#f6f9ff] p-5 shadow-sm shadow-slate-200/70">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {architectureItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70"
                    >
                      <Icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
                      <p className="mt-4 text-sm font-semibold text-slate-900">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
                  <Code2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <span>Next.js interface</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span>Drizzle ORM</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span>Postgres deployment data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f8fbff] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Benefits
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              For teams accountable for shipping reliably.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70"
              >
                <LockKeyhole
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold leading-6 text-slate-700">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-blue-500/20 bg-[linear-gradient(135deg,#155dfc_0%,#0891b2_100%)] px-6 py-12 text-white shadow-xl shadow-blue-200 md:px-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-blue-100">
                Launch ShipNexus
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Move from scattered deployment data to a live operations view.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50">
                Open the existing dashboard to explore live deployment jobs,
                status trends, and pipeline health.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-950/10 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
            >
              Launch Dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-semibold text-slate-700">ShipNexus</span>
          </div>
          <div className="flex flex-wrap gap-5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-semibold transition hover:text-slate-950"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              className="font-semibold text-blue-700 transition hover:text-blue-800"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
