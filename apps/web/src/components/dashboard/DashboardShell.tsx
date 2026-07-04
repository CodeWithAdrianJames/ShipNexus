"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Boxes,
  ChevronDown,
  GitBranch,
  History,
  Home,
  Layers3,
  Rocket,
  Settings,
  ShipWheel,
  Tags,
  Webhook,
  Workflow,
} from "lucide-react";
import { cx } from "./styles";

type DashboardNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Pipelines", href: "/dashboard/pipelines", icon: Workflow },
  { label: "Deployments", href: "/dashboard/deployments", icon: GitBranch },
  { label: "Services", href: "/dashboard/services", icon: Boxes },
  { label: "Environments", href: "/dashboard/environments", icon: Layers3 },
  { label: "Releases", href: "/dashboard/releases", icon: Tags },
  { label: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { label: "Logs", href: "/dashboard/logs", icon: History },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function NavLink({
  item,
  compact = false,
}: {
  item: DashboardNavItem;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  if (compact) {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          active
            ? "bg-blue-700 text-white shadow-sm shadow-blue-200"
            : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden={true} />
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        active
          ? "bg-blue-700 text-white shadow-sm shadow-blue-200"
          : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
      )}
    >
      <Icon className="h-4.5 w-4.5" aria-hidden={true} />
      {item.label}
    </Link>
  );
}

export default function DashboardShell({
  title,
  description,
  actions,
  children,
  issueCount = 0,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
  issueCount?: number;
}) {
  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-[272px] shrink-0 border-r border-slate-200/80 bg-white px-4 py-5 shadow-sm shadow-blue-950/5 lg:flex lg:flex-col">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm shadow-blue-200">
              <Rocket className="h-5 w-5" aria-hidden={true} />
            </div>
            <div>
              <p className="text-xl font-semibold">ShipNexus</p>
              <p className="text-sm text-slate-500">Deployment Pipeline</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-1" aria-label="Primary">
            {DASHBOARD_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div
              className={cx(
                "rounded-lg border p-4",
                issueCount > 0
                  ? "border-rose-200 bg-rose-50"
                  : "border-emerald-200 bg-emerald-50",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1",
                    issueCount > 0
                      ? "text-rose-600 ring-rose-100"
                      : "text-emerald-600 ring-emerald-100",
                  )}
                >
                  {issueCount > 0 ? (
                    <AlertTriangle className="h-4.5 w-4.5" aria-hidden={true} />
                  ) : (
                    <ShipWheel className="h-4.5 w-4.5" aria-hidden={true} />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={cx(
                      "text-sm font-semibold",
                      issueCount > 0 ? "text-rose-800" : "text-emerald-800",
                    )}
                  >
                    {issueCount > 0
                      ? `${issueCount} issue${issueCount === 1 ? "" : "s"}`
                      : "All clear"}
                  </p>
                  <p
                    className={cx(
                      "mt-1 text-xs leading-5",
                      issueCount > 0 ? "text-rose-700" : "text-emerald-700",
                    )}
                  >
                    {issueCount > 0
                      ? "Failed deployments require attention."
                      : "No blocking deployment issues in view."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-blue-950/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white shadow-sm shadow-blue-200">
                  N
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Nexus Admin</p>
                  <p className="truncate text-xs text-slate-500">
                    admin@shipnexus.io
                  </p>
                </div>
                <ChevronDown
                  className="h-4 w-4 text-slate-400"
                  aria-hidden={true}
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f8fbff]/95 px-4 py-4 backdrop-blur md:px-6 xl:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3 lg:hidden">
                  <Link
                    href="/dashboard"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="ShipNexus dashboard"
                  >
                    <Rocket className="h-5 w-5" aria-hidden={true} />
                  </Link>
                  <div>
                    <span className="text-base font-semibold">ShipNexus</span>
                    <p className="text-xs text-slate-500">
                      Deployment Pipeline
                    </p>
                  </div>
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950 lg:mt-0 md:text-3xl">
                  {title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>

              {actions ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {actions}
                </div>
              ) : null}
            </div>

            <nav
              className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
              aria-label="Mobile primary"
            >
              {DASHBOARD_NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} compact />
              ))}
            </nav>
          </header>

          <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
