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
          "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#526dff] focus:ring-offset-2 focus:ring-offset-[#171329]",
          active
            ? "bg-[#526dff] text-white"
            : "border border-white/10 bg-[#1b172d] text-[#aaa4b5] hover:border-white/20 hover:bg-white/5 hover:text-white",
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
        "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#526dff] focus:ring-offset-2 focus:ring-offset-[#100d1c]",
        active
          ? "bg-[#526dff] text-white"
          : "text-[#aaa4b5] hover:bg-white/5 hover:text-white",
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
    <div className="relative min-h-screen bg-[#171329] text-white">
      <div className="fixed inset-x-0 top-0 z-50 flex h-1" aria-hidden="true">
        <span className="w-1/2 bg-[#526dff]" />
        <span className="w-1/2 bg-[#ef5aa5]" />
      </div>
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#100d1c] px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start lg:flex-col lg:overflow-y-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-[#526dff] focus:ring-offset-2 focus:ring-offset-[#100d1c]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#526dff] text-white">
              <Rocket className="h-5 w-5" aria-hidden={true} />
            </div>
            <div>
              <p className="text-xl font-semibold">ShipNexus</p>
              <p className="text-sm text-[#817a90]">Deployment Pipeline</p>
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
                  ? "border-[#6b3056] bg-[#25162a]"
                  : "border-[#245548] bg-[#122a29]",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-md bg-[#171329] ring-1",
                    issueCount > 0
                      ? "text-[#ff78b7] ring-[#6b3056]"
                      : "text-[#5ee0b1] ring-[#245548]",
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
                      issueCount > 0 ? "text-[#ff9fca]" : "text-[#83eac6]",
                    )}
                  >
                    {issueCount > 0
                      ? `${issueCount} issue${issueCount === 1 ? "" : "s"}`
                      : "All clear"}
                  </p>
                  <p
                    className={cx(
                      "mt-1 text-xs leading-5",
                      issueCount > 0 ? "text-[#d989ae]" : "text-[#75bfa9]",
                    )}
                  >
                    {issueCount > 0
                      ? "Failed deployments require attention."
                      : "No blocking deployment issues in view."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#151225] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#526dff] text-sm font-semibold text-white">
                  N
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Nexus Admin</p>
                  <p className="truncate text-xs text-[#817a90]">
                    admin@shipnexus.io
                  </p>
                </div>
                <ChevronDown
                  className="h-4 w-4 text-[#696276]"
                  aria-hidden={true}
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="z-20 border-b border-white/10 bg-[#171329]/95 px-4 py-4 backdrop-blur md:px-6 lg:sticky lg:top-0 xl:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3 lg:hidden">
                  <Link
                    href="/dashboard"
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-[#526dff] text-white focus:outline-none focus:ring-2 focus:ring-[#526dff] focus:ring-offset-2 focus:ring-offset-[#171329]"
                    aria-label="ShipNexus dashboard"
                  >
                    <Rocket className="h-5 w-5" aria-hidden={true} />
                  </Link>
                  <div>
                    <span className="text-base font-semibold">ShipNexus</span>
                    <p className="text-xs text-[#817a90]">
                      Deployment Pipeline
                    </p>
                  </div>
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-normal text-white lg:mt-0 md:text-3xl">
                  {title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#aaa4b5]">
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
