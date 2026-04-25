"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  BellRing,
  FileOutput,
  Gauge,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert
} from "lucide-react";
import { primaryNavigation } from "@/shared/config/navigation";
import { useToast } from "@/shared/ui/ToastProvider";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"15m" | "1h" | "24h">("1h");
  const [environment, setEnvironment] = useState<"DEMO" | "PROD_SIM">("DEMO");
  const [search, setSearch] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const toast = useToast();
  const iconMap = {
    "layout-dashboard": LayoutDashboard,
    activity: Activity,
    "triangle-alert": TriangleAlert,
    "scroll-text": ScrollText,
    sparkles: Sparkles,
    "bell-ring": BellRing,
    "sliders-horizontal": SlidersHorizontal,
    gauge: Gauge,
    "file-output": FileOutput,
    "shield-check": ShieldCheck
  } as const;
  const sectionOrder = ["OVERVIEW", "MONITORING", "INTELLIGENCE", "ADMIN"] as const;
  const sectionLabel = {
    OVERVIEW: "Overview",
    MONITORING: "Monitoring",
    INTELLIGENCE: "Intelligence",
    ADMIN: "Admin"
  } as const;

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as {
        settings: {
          environment: "DEMO" | "PROD_SIM";
          globalTimeRange: "15m" | "1h" | "24h";
        };
      };
      setEnvironment(data.settings.environment);
      setTimeRange(data.settings.globalTimeRange);
    }
    void loadSettings();
  }, []);

  async function saveGlobalSettings(next: {
    environment?: "DEMO" | "PROD_SIM";
    globalTimeRange?: "15m" | "1h" | "24h";
  }) {
    setIsSavingSettings(true);
    try {
      if (next.environment) {
        const envRes = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ environment: next.environment })
        });
        if (!envRes.ok) {
          toast.error("Failed to update environment setting.");
          return;
        }
      }
      if (next.globalTimeRange) {
        const rangeRes = await fetch("/api/sla-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ globalTimeRange: next.globalTimeRange })
        });
        if (!rangeRes.ok) {
          toast.error("Failed to update global time range.");
          return;
        }
      }
      toast.success("Global settings updated.");
    } catch {
      toast.error("Unable to save global settings.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.info("Logged out successfully.");
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-dot" />
          <h2 className="brand">Digital Pioneer</h2>
        </div>
        <p className="sidebar-subtitle">SLA Intelligence Console</p>
        <nav>
          {sectionOrder.map((section) => {
            const items = primaryNavigation.filter((item) => item.section === section);
            return (
              <div key={section} className="nav-section">
                <p className="nav-section-title">{sectionLabel[section]}</p>
                <ul className="nav-list">
                  {items.map((item) => {
                    const Icon = iconMap[item.icon as keyof typeof iconMap];
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={pathname === item.href ? "nav-link nav-link-active" : "nav-link"}
                        >
                          <span className="nav-icon-wrap">{Icon ? <Icon size={15} /> : null}</span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
      <section className="content">
        <header className="topbar">
          <div className="topbar-left">
            <p className="topbar-title">Operations Workspace</p>
            <p className="topbar-subtitle">Realtime SLA monitoring and incident response</p>
          </div>
          <div className="topbar-actions">
            <select
              className="input"
              value={timeRange}
              disabled={isSavingSettings}
              onChange={(event) => {
                const value = event.target.value as "15m" | "1h" | "24h";
                setTimeRange(value);
                void saveGlobalSettings({ globalTimeRange: value });
              }}
            >
              <option value="15m">Last 15m</option>
              <option value="1h">Last 1h</option>
              <option value="24h">Last 24h</option>
            </select>
            <select
              className="input"
              value={environment}
              disabled={isSavingSettings}
              onChange={(event) => {
                const value = event.target.value as "DEMO" | "PROD_SIM";
                setEnvironment(value);
                void saveGlobalSettings({ environment: value });
              }}
            >
              <option value="DEMO">Demo</option>
              <option value="PROD_SIM">Prod-sim</option>
            </select>
            <input
              className="input"
              value={search}
              placeholder="Search endpoint/incident"
              disabled={isSavingSettings}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Link className="btn btn-primary" href="/ai-reports">
              Generate Report
            </Link>
            <button className="btn" onClick={() => void logout()}>
              Logout
            </button>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}
