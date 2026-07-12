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
    tone: "bg-[#2b3157] text-[#8da7ff] ring-white/10",
  },
  {
    label: "Refresh cadence",
    value: "10s",
    detail: "Live dashboard",
    icon: TimerReset,
    tone: "bg-[#163d49] text-[#58d8e8] ring-white/10",
  },
  {
    label: "Pipeline states",
    value: "6",
    detail: "Tracked statuses",
    icon: Workflow,
    tone: "bg-[#163b38] text-[#5ee0b1] ring-white/10",
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
    tone: "bg-[#282d54] text-[#91a5ff] ring-white/10",
  },
  {
    title: "Real-time monitoring",
    copy: "Monitor recent jobs, status mix, durations, triggers, and rollout velocity from one command center.",
    icon: Activity,
    tone: "bg-[#153b45] text-[#67d5e5] ring-white/10",
  },
  {
    title: "Environment control",
    copy: "Track which services are moving through production, staging, and preview workflows without digging through logs.",
    icon: Layers3,
    tone: "bg-[#153a35] text-[#5ee0b1] ring-white/10",
  },
  {
    title: "Release visibility",
    copy: "Connect GitHub events, image tags, and deployment triggers into a structured pipeline record.",
    icon: GitBranch,
    tone: "bg-[#34204a] text-[#c89cff] ring-white/10",
  },
  {
    title: "Failure recovery",
    copy: "Surface failed, queued, running, cancelled, and successful jobs so teams can respond with confidence.",
    icon: ShieldCheck,
    tone: "bg-[#47203a] text-[#ff78b7] ring-white/10",
  },
  {
    title: "Webhook automation",
    copy: "Turn GitHub and release events into auditable deployment records that stay visible to every team.",
    icon: Webhook,
    tone: "bg-[#49371d] text-[#ffc66d] ring-white/10",
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
      tone: "text-[#526dff]",
      bar: "bg-[#526dff]",
      width: "92%",
      icon: Code2,
    },
    {
      label: "Scan",
      value: "124",
      tone: "text-[#c66a13]",
      bar: "bg-[#f59e42]",
      width: "86%",
      icon: ShieldCheck,
    },
    {
      label: "Deploy",
      value: "98",
      tone: "text-[#168a68]",
      bar: "bg-[#2dcf9b]",
      width: "76%",
      icon: Rocket,
    },
    {
      label: "Observe",
      value: "98.7%",
      tone: "text-[#d33f8d]",
      bar: "bg-[#ef5aa5]",
      width: "94%",
      icon: Activity,
    },
  ];

  return (
    <div
      className="relative h-[410px] sm:h-[430px] lg:h-[440px]"
      aria-label="ShipNexus dashboard preview"
    >
      <div className="absolute inset-x-0 top-0 mx-auto w-full overflow-hidden rounded-lg border border-white/15 bg-[#0d0b18] shadow-[0_30px_90px_rgba(4,3,16,0.5)] md:w-[82%]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#151225] px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#526dff] text-white">
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">ShipNexus</p>
              <p className="text-xs text-[#9993aa]">Pipeline overview</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-[#d2cedd]">
            <TimerReset className="h-3.5 w-3.5" aria-hidden="true" />
            Last 24 hours
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[116px_minmax(0,1fr)]">
          <aside className="hidden border-r border-white/10 bg-[#110e20] p-2.5 md:block">
            <div className="space-y-1">
              {["Overview", "Pipelines", "Deployments", "Environments", "Releases"].map(
                (item, index) => (
                  <div
                    key={item}
                    className={`rounded-md px-2.5 py-2 text-[10px] font-semibold ${
                      index === 0
                        ? "bg-[#526dff] text-white"
                        : "text-[#928ca3]"
                    }`}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </aside>

          <div className="min-w-0 bg-[#f1f3f8] p-2.5 sm:p-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#4059c7]">
                  Deployment overview
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-[#121528] sm:text-lg">
                  Operational command center
                </h3>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#dfe3ed] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#555b70]">
                <CirclePlay className="h-3.5 w-3.5 text-[#d33f8d]" aria-hidden="true" />
                2 active workflows
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <div
                    key={stage.label}
                    className="rounded-md border border-[#dfe3ed] bg-white p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold text-[#60667a]">
                        {stage.label}
                      </p>
                      <Icon
                        className={`h-3.5 w-3.5 ${stage.tone}`}
                        aria-hidden="true"
                      />
                    </div>
                    <p className={`mt-1.5 text-xl font-semibold ${stage.tone}`}>
                      {stage.value}
                    </p>
                    <div className="mt-2 h-1 rounded-full bg-[#e9ecf3]">
                      <div
                        className={`h-full rounded-full ${stage.bar}`}
                        style={{ width: stage.width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="mt-2 rounded-md border border-[#dfe3ed] bg-white p-3"
              aria-hidden="true"
            >
              <div className="flex h-16 items-end gap-1">
                {[52, 48, 55, 51, 65, 88, 74, 59, 63, 70, 66, 79].map(
                  (height, index) => (
                    <span
                      key={`${height}-${index}`}
                      className={`flex-1 rounded-t-sm ${
                        index === 5 || index === 11
                          ? "bg-[#ef5aa5]"
                          : "bg-[#56cfe1]"
                        }`}
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-[13.25rem] z-20 hidden w-[290px] overflow-hidden rounded-lg border border-[#49415f] bg-[#1a1630] shadow-[0_24px_60px_rgba(4,3,16,0.38)] lg:block xl:w-[315px]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-white">Recent deployments</p>
          <span className="text-xs font-semibold text-[#9892a7]">Last 50</span>
        </div>
        <div className="divide-y divide-white/10">
          {rows.map(([service, env, status, duration]) => (
            <div
              key={`${service}-${env}`}
              className="grid grid-cols-[minmax(0,1fr)_65px_48px] gap-2 px-4 py-3 text-[11px]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{service}</p>
                <p className="mt-0.5 truncate text-[#8f899f]">{env}</p>
              </div>
              <span
                className={`self-center font-semibold ${
                  status === "success"
                    ? "text-[#5ee0b1]"
                    : status === "running"
                      ? "text-[#ff70b3]"
                      : "text-[#8da7ff]"
                }`}
              >
                {status}
              </span>
              <span className="self-center text-right font-mono text-[#aaa4b5]">
                {duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-0 top-[12.5rem] z-20 hidden w-[280px] rounded-lg border border-[#49415f] bg-[#1a1630] p-4 shadow-[0_24px_60px_rgba(4,3,16,0.38)] lg:block xl:w-[305px]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Deployment flow</p>
          <span className="text-xs font-semibold text-[#5ee0b1]">Healthy</span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-1.5">
          {["dev", "staging", "prod"].map((env, index) => (
            <div key={env} className="flex flex-1 items-center gap-1.5">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 bg-[#1a1630] ${
                    index === 1
                      ? "border-[#7890ff] text-[#a5b4ff]"
                      : "border-[#45cda0] text-[#5ee0b1]"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-semibold text-[#d4cfdd]">
                  {env}
                </span>
              </div>
              {index < 2 ? (
                <span className="h-px flex-1 bg-[#60577a]" />
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#aaa4b5]">Success rate</p>
              <p className="mt-1 text-[10px] font-semibold text-[#5ee0b1]">
                +2.4% vs yesterday
              </p>
            </div>
            <p className="text-xl font-semibold text-white">98.7%</p>
          </div>
          <div className="mt-2 flex h-8 items-end gap-1">
            {[42, 58, 52, 76, 64, 88, 72, 96].map((height, index) => (
              <span
                key={`${height}-${index}`}
                className={`flex-1 rounded-t-sm ${
                  index === 7 ? "bg-[#ef5aa5]" : "bg-[#526dff]"
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <span
        className="absolute bottom-3 left-[8%] hidden h-2 w-2 rounded-sm bg-[#526dff] lg:block"
        aria-hidden="true"
      />
      <span
        className="absolute right-[8%] bottom-3 hidden h-2 w-2 rounded-sm bg-[#ef5aa5] lg:block"
        aria-hidden="true"
      />
      <span
        className="absolute inset-x-[8%] bottom-[0.95rem] hidden border-t border-white/10 lg:block"
        aria-hidden="true"
      />
    </div>
  );
}

function HeroScene() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-y-0 left-[8%] border-l border-white/[0.045]" />
      <div className="absolute inset-y-0 right-[8%] border-r border-white/[0.045]" />
      <div className="absolute left-1/2 top-0 h-[28rem] border-l border-white/[0.045]" />
      <div className="absolute left-1/4 top-[28rem] bottom-0 border-l border-white/[0.035]" />
      <div className="absolute right-1/4 top-[28rem] bottom-0 border-r border-white/[0.035]" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#171329] text-white selection:bg-[#ef5aa5] selection:text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#151225]/95 text-white backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 flex h-1" aria-hidden="true">
          <span className="w-1/2 bg-[#526dff]" />
          <span className="w-1/2 bg-[#ef5aa5]" />
        </div>
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#8398ff] focus:ring-offset-4 focus:ring-offset-[#151225]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#526dff] text-white">
              <Rocket className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold max-[380px]:hidden">
              ShipNexus
            </span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Landing">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-semibold text-[#bdb8ca] transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[#8398ff]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-[#171329] transition-colors hover:bg-[#e9ebf4] focus:outline-none focus:ring-2 focus:ring-[#8398ff] focus:ring-offset-2 focus:ring-offset-[#151225] sm:px-4"
          >
            Launch Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="relative h-[calc(100svh-5.5rem)] min-h-[590px] max-h-[900px] overflow-hidden bg-[#171329] text-white">
        <HeroScene />
        <div className="relative mx-auto max-w-[90rem] px-4 pt-9 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
          <div className="mx-auto max-w-[76rem] text-center">
            <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase text-[#aebaff] sm:text-sm">
              <span className="hidden h-px w-8 bg-[#526dff] min-[360px]:block" />
              <Sparkles className="h-4 w-4 text-[#ef5aa5]" aria-hidden="true" />
              Enterprise deployment orchestration
            </div>
            <h1 className="mx-auto mt-4 text-4xl font-semibold leading-[1.02] tracking-normal text-white sm:mt-5 sm:text-6xl lg:text-7xl xl:text-[5rem]">
              <span className="xl:whitespace-nowrap">
                Ship software with one clear
              </span>{" "}
              <br className="hidden xl:block" />
              <span className="relative top-0.5 inline-block -rotate-2 px-1 text-[#ff5aa8]">
                deployment
              </span>{" "}
              command center.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#c9c5d3] sm:mt-5 sm:text-lg sm:leading-8">
              ShipNexus helps DevOps and platform engineering teams manage,
              monitor, and automate deployment workflows across services,
              environments, and release triggers.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:mt-7 sm:flex-row sm:gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#171329] transition-colors hover:bg-[#e9ebf4] focus:outline-none focus:ring-2 focus:ring-[#8398ff] focus:ring-offset-2 focus:ring-offset-[#171329] sm:h-12"
              >
                View Dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#product"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#f46aac] bg-transparent px-5 text-sm font-semibold text-white transition-colors hover:bg-[#ef5aa5]/10 focus:outline-none focus:ring-2 focus:ring-[#f46aac] focus:ring-offset-2 focus:ring-offset-[#171329] sm:h-12"
              >
                See Product Preview
                <Route className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="relative mx-auto mt-8 w-full max-w-7xl sm:mt-11">
            <span
              className="absolute -top-5 inset-x-0 border-t border-white/[0.045]"
              aria-hidden="true"
            />
            <span
              className="absolute -left-1 -top-6 h-2 w-2 rounded-full bg-[#526dff]"
              aria-hidden="true"
            />
            <span
              className="absolute -right-1 -top-6 h-2 w-2 rounded-full bg-[#ef5aa5]"
              aria-hidden="true"
            />
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section id="product" className="scroll-mt-20 border-t border-white/10 bg-[#171329] px-4 pb-28 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl overflow-hidden border-x border-b border-white/10 bg-[#211b37] text-white sm:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="flex items-center gap-4 border-b border-white/10 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:px-7"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ring-1 ${metric.tone}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#aba6b7] sm:text-sm">
                    {metric.label}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <p className="text-2xl font-semibold text-white">
                      {metric.value}
                    </p>
                    <p className="text-xs text-[#c7c2d0] sm:text-sm">
                      {metric.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 pt-24 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase text-[#91a5ff] sm:text-sm">
              <span className="h-px w-8 bg-[#526dff]" />
              Product preview
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
              A live operating layer for deployment teams.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#bdb7c7]">
              ShipNexus turns raw deployment jobs into an executive-ready view
              of rollout health, service activity, pipeline failures, and recent
              operational history.
            </p>
            <div className="mt-7 grid gap-3.5">
              {[
                "Live Postgres-backed deployment records",
                "Dashboard-first workflow for active incidents",
                "Status, duration, trigger, and environment visibility",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-[#5ee0b1]"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-[#d8d3df]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid overflow-hidden rounded-lg border border-[#373149] bg-[#171329] text-white shadow-[0_24px_60px_rgba(31,25,51,0.16)] sm:grid-cols-2">
            {[
              {
                title: "Pipeline health",
                value: "98.7%",
                copy: "Success trends, rollout activity, and failed jobs stay visible at a glance.",
                icon: Activity,
                tone: "bg-[#153b45] text-[#67d5e5] ring-white/10",
                valueTone: "text-[#67d5e5]",
              },
              {
                title: "Release context",
                value: "24h",
                copy: "Recent service movement, triggers, and environments are grouped by release window.",
                icon: GitCommitHorizontal,
                tone: "bg-[#282d54] text-[#91a5ff] ring-white/10",
                valueTone: "text-[#91a5ff]",
              },
              {
                title: "Environment flow",
                value: "3 lanes",
                copy: "Dev, staging, and production states are presented as one operational path.",
                icon: Layers3,
                tone: "bg-[#153a35] text-[#5ee0b1] ring-white/10",
                valueTone: "text-[#5ee0b1]",
              },
              {
                title: "Incident signal",
                value: "Live",
                copy: "Running, queued, cancelled, failed, and successful jobs are easy to separate.",
                icon: RadioTower,
                tone: "bg-[#47203a] text-[#ff78b7] ring-white/10",
                valueTone: "text-[#ff78b7]",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`p-5 sm:p-6 ${
                    index < 3 ? "border-b border-white/10" : ""
                  } ${index === 0 || index === 2 ? "sm:border-r" : ""} ${
                    index === 2 ? "sm:border-b-0" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-md ring-1 ${item.tone}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className={`font-mono text-2xl font-semibold ${item.valueTone}`}>
                      {item.value}
                    </p>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#bdb7c7]">
                    {item.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="problem" className="scroll-mt-20 border-t border-white/10 bg-[#171329] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase text-[#ff78b7] sm:text-sm">
              <span className="h-px w-8 bg-[#ef5aa5]" />
              The problem
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Deployment operations break down when teams lose shared context.
            </h2>
          </div>
          <div className="mt-12 grid border-y border-white/10 md:grid-cols-3">
            {problems.map((problem, index) => (
              <article
                key={problem.title}
                className={`border-b border-white/10 py-7 last:border-b-0 md:border-b-0 md:px-8 md:py-9 ${
                  index < problems.length - 1 ? "md:border-r" : ""
                } ${index === 0 ? "md:pl-0" : ""} ${
                  index === problems.length - 1 ? "md:pr-0" : ""
                }`}
              >
                <span
                  className={`block h-1 w-10 ${
                    index === 1 ? "bg-[#ef5aa5]" : "bg-[#526dff]"
                  }`}
                  aria-hidden="true"
                />
                <h3 className="mt-6 text-lg font-semibold text-white">
                  {problem.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#aaa4b5]">
                  {problem.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-t border-white/10 bg-[#171329] px-4 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase text-[#91a5ff] sm:text-sm">
                <span className="h-px w-8 bg-[#526dff]" />
                Features
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
                Built for platform engineering visibility.
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-md border border-white/20 bg-transparent px-4 text-sm font-semibold text-white transition-colors hover:border-[#ef5aa5] hover:text-[#ff78b7] focus:outline-none focus:ring-2 focus:ring-[#526dff] focus:ring-offset-2 focus:ring-offset-[#171329]"
            >
              Open live view
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-14 grid gap-px border-y border-white/10 bg-white/10 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="bg-[#171329] p-7 transition-colors hover:bg-[#1d1830] sm:min-h-[250px] sm:p-9"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-md ring-1 ${feature.tone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[#aaa4b5]">
                    {feature.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-20 border-t border-white/10 bg-[#171329] px-4 py-28 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="flex items-center justify-center gap-3 text-xs font-semibold uppercase text-[#91a5ff] sm:text-sm">
              <span className="h-px w-8 bg-[#526dff]" />
              How it works
              <span className="h-px w-8 bg-[#526dff]" />
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
              From trigger to operational signal.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#bdb7c7]">
              ShipNexus is designed around the deployment lifecycle: capture the
              event, structure the workflow, observe health, and improve the
              next release.
            </p>
          </div>
          <div className="relative mt-16">
            <span
              className="absolute left-[12.5%] right-[12.5%] top-14 hidden border-t border-white/20 md:block"
              aria-hidden="true"
            />
            <div className="grid border-y border-white/10 md:grid-cols-4 md:border-y-0">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    className="relative border-b border-white/10 py-7 last:border-b-0 md:border-b-0 md:px-6 md:py-7"
                  >
                    <div className="relative z-10 flex items-center justify-between">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#171329] ring-1 ${
                        index === 1
                          ? "bg-[#47203a] text-[#ff78b7] ring-[#6b3056]"
                          : index === 2
                            ? "bg-[#153b45] text-[#67d5e5] ring-[#245967]"
                            : "bg-[#282d54] text-[#91a5ff] ring-[#3d4678]"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-sm text-[#7f788e]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-7 text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#aaa4b5]">
                    {step.copy}
                  </p>
                </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="scroll-mt-20 border-t border-white/10 bg-[#171329] px-4 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
            <div className="max-w-xl">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase text-[#91a5ff] sm:text-sm">
                <span className="h-px w-8 bg-[#526dff]" />
                Architecture
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
                A workflow model that matches modern{" "}
                <span className="text-[#d33f8d]">DevOps infrastructure.</span>
              </h2>
              <p className="mt-5 text-base leading-7 text-[#bdb7c7]">
                The current product surface focuses on the command center:
                normalized deployment records, operational analytics, and the
                dashboard path teams use during release windows.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#343047] bg-[#151225] text-white">
              <div className="flex h-11 items-center gap-2 border-b border-white/10 px-4" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef5aa5]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#f1ad4b]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#55d6b2]" />
              </div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
                {architectureItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-[#151225] p-5">
                      <Icon
                        className={`h-5 w-5 ${
                          index === 1 || index === 4
                            ? "text-[#ff6cad]"
                            : "text-[#7890ff]"
                        }`}
                        aria-hidden="true"
                      />
                      <p className="mt-4 text-sm font-semibold text-white">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/10 bg-[#0f0d1b] p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#d5d0dc]">
                  <Code2 className="h-4 w-4 text-[#67d5e5]" aria-hidden="true" />
                  <span>Next.js interface</span>
                  <ArrowRight className="h-4 w-4 text-[#746e82]" aria-hidden="true" />
                  <span>Drizzle ORM</span>
                  <ArrowRight className="h-4 w-4 text-[#746e82]" aria-hidden="true" />
                  <span>Postgres deployment data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#171329] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:gap-16">
          <div className="max-w-lg">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase text-[#c5ffec] sm:text-sm">
              <span className="h-px w-8 bg-[#8af0ce]" />
              Benefits
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
              For teams accountable for shipping reliably.
            </h2>
          </div>
          <div className="grid gap-px border-y border-white/10 bg-white/10 md:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex gap-3 bg-[#171329] py-5 md:px-5"
              >
                <LockKeyhole
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#b9ffe7]"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold leading-6 text-white">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#171329] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 border-l-4 border-[#ef5aa5] pl-6 md:grid-cols-[1fr_auto] md:items-center md:pl-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-[#ff83bd] sm:text-sm">
              Launch ShipNexus
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
              Move from scattered deployment data to a{" "}
              <span className="text-[#ff78b7]">live operations view.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#c8c3d0]">
              Open the existing dashboard to explore live deployment jobs,
              status trends, and pipeline health.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#171329] transition-colors hover:bg-[#e9ebf4] focus:outline-none focus:ring-2 focus:ring-[#8398ff] focus:ring-offset-2 focus:ring-offset-[#171329]"
          >
            Launch Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0f0d1b] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-[#9892a4] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#526dff] text-white">
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-semibold text-white">ShipNexus</span>
          </div>
          <div className="flex flex-wrap gap-5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-semibold transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[#8398ff]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              className="font-semibold text-[#91a5ff] transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[#8398ff]"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
