export const theme = {
  page: { background: "#f8fafc" },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    shadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  text: {
    primary: "#0f172a",
    secondary: "#64748b",
    body: "#334155",
    label: "#94a3b8",
  },
  status: {
    success: {
      bg: "#f0fdf4",
      text: "#16a34a",
      border: "1px solid #bbf7d0",
    },
    failed: {
      bg: "#fef2f2",
      text: "#dc2626",
      border: "1px solid #fecaca",
    },
    pending: {
      bg: "#fffbeb",
      text: "#d97706",
      border: "1px solid #fde68a",
    },
    running: {
      bg: "#f5f3ff",
      text: "#7c3aed",
      border: "1px solid #ddd6fe",
    },
    queued: {
      bg: "#eff6ff",
      text: "#2563eb",
      border: "1px solid #bfdbfe",
    },
    cancelled: {
      bg: "#f8fafc",
      text: "#64748b",
      border: "1px solid #e2e8f0",
    },
  },
  env: {
    production: {
      bg: "#eff6ff",
      text: "#2563eb",
      border: "1px solid #bfdbfe",
    },
    staging: {
      bg: "#fffbeb",
      text: "#d97706",
      border: "1px solid #fde68a",
    },
    development: {
      bg: "#f8fafc",
      text: "#64748b",
      border: "1px solid #e2e8f0",
    },
  },
  successRate: {
    high: "#16a34a",
    medium: "#d97706",
    low: "#dc2626",
  },
  backButton: { color: "#6366f1", fontSize: "14px" },
  table: {
    headerText: "#94a3b8",
    headerBg: "#f8fafc",
    rowBorder: "#f1f5f9",
    rowHover: "#f8fafc",
  },
} as const;
