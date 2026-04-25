export type NavigationItem = {
  href: string;
  label: string;
  icon: string;
  section: "OVERVIEW" | "MONITORING" | "INTELLIGENCE" | "ADMIN";
};

export const primaryNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Overview", icon: "layout-dashboard", section: "OVERVIEW" },
  { href: "/endpoints", label: "Endpoints", icon: "activity", section: "MONITORING" },
  { href: "/incidents", label: "Incidents", icon: "triangle-alert", section: "MONITORING" },
  { href: "/logs", label: "Log Explorer", icon: "scroll-text", section: "MONITORING" },
  { href: "/simulator", label: "Simulator/Replay", icon: "gauge", section: "MONITORING" },
  { href: "/ai-reports", label: "AI Reports", icon: "sparkles", section: "INTELLIGENCE" },
  { href: "/alert-rules", label: "Alert Rules", icon: "bell-ring", section: "INTELLIGENCE" },
  { href: "/exports", label: "Reports & Exports", icon: "file-output", section: "INTELLIGENCE" },
  { href: "/sla-settings", label: "SLA/SLO Settings", icon: "sliders-horizontal", section: "ADMIN" },
  { href: "/admin-data", label: "Admin/Data", icon: "shield-check", section: "ADMIN" }
];
