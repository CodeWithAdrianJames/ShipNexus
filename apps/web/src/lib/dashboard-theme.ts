export const theme = {
  page: { background: "#171329" },
  card: {
    background: "#1b172d",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "8px",
    shadow: "0 18px 45px rgba(4,3,16,0.16)",
  },
  text: {
    primary: "#f8f7fb",
    secondary: "#aaa4b5",
    body: "#d4cfdd",
    label: "#817a90",
  },
  status: {
    success: {
      bg: "#153a35",
      text: "#5ee0b1",
      border: "1px solid #245548",
    },
    failed: {
      bg: "#47203a",
      text: "#ff78b7",
      border: "1px solid #6b3056",
    },
    pending: {
      bg: "#49371d",
      text: "#ffc66d",
      border: "1px solid #6b512b",
    },
    running: {
      bg: "#34204a",
      text: "#c89cff",
      border: "1px solid #50306e",
    },
    queued: {
      bg: "#282d54",
      text: "#91a5ff",
      border: "1px solid #3d4678",
    },
    cancelled: {
      bg: "#211c31",
      text: "#aaa4b5",
      border: "1px solid rgba(255,255,255,0.10)",
    },
  },
  env: {
    production: {
      bg: "#282d54",
      text: "#91a5ff",
      border: "1px solid #3d4678",
    },
    staging: {
      bg: "#49371d",
      text: "#ffc66d",
      border: "1px solid #6b512b",
    },
    development: {
      bg: "#211c31",
      text: "#c8c3d0",
      border: "1px solid rgba(255,255,255,0.10)",
    },
  },
  successRate: {
    high: "#5ee0b1",
    medium: "#ffc66d",
    low: "#ff78b7",
  },
  backButton: { color: "#91a5ff", fontSize: "14px" },
  table: {
    headerText: "#817a90",
    headerBg: "#151225",
    rowBorder: "rgba(255,255,255,0.08)",
    rowHover: "#211c34",
  },
} as const;
