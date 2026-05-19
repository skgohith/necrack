export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwK0X5FEFZ3pn0sCcFPFTaZkpTWkzfja8aejsiOo2Ies0rGqzLuzDByrc9VJkR9wmHN/exec";

export type Stats = {
  totalAccesses: number;
  themesUsed: string[];
  unlockedAchievements: string[];
};

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  target: number;
};

export type ThemeDef = { id: string; label: string };

export const defaultAchievements: Achievement[] = [
  { id: "first", icon: "🎯", title: "First Access", desc: "First portal access", target: 1 },
  { id: "regular", icon: "📚", title: "Regular User", desc: "10 accesses", target: 10 },
  { id: "veteran", icon: "⭐", title: "Veteran", desc: "50 accesses", target: 50 },
  { id: "explorer", icon: "🎨", title: "Explorer", desc: "Try all themes", target: 3 },
];

export const defaultThemes: ThemeDef[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "neon", label: "Neon" },
];

const ACH_KEY = "necrack_achievements_v1";
const THEMES_KEY = "necrack_themes_v1";
const LOGS_KEY = "necrack_access_logs_v1";
const AUDIT_KEY = "necrack_audit_logs_v1";


export function getAchievements(): Achievement[] {
  try {
    const s = localStorage.getItem(ACH_KEY);
    return s ? JSON.parse(s) : defaultAchievements;
  } catch { return defaultAchievements; }
}
export function saveAchievements(list: Achievement[]) {
  try { localStorage.setItem(ACH_KEY, JSON.stringify(list)); } catch {}
}

export function getThemes(): ThemeDef[] {
  try {
    const s = localStorage.getItem(THEMES_KEY);
    return s ? JSON.parse(s) : defaultThemes;
  } catch { return defaultThemes; }
}
export function saveThemes(list: ThemeDef[]) {
  try { localStorage.setItem(THEMES_KEY, JSON.stringify(list)); } catch {}
}

// kept for backward compat
export const achievements = defaultAchievements;

export function getStats(): Stats {
  try {
    const s = sessionStorage.getItem("necrack_stats");
    return s ? JSON.parse(s) : { totalAccesses: 0, themesUsed: ["dark"], unlockedAchievements: [] };
  } catch {
    return { totalAccesses: 0, themesUsed: ["dark"], unlockedAchievements: [] };
  }
}

export function saveStats(s: Stats) {
  try { sessionStorage.setItem("necrack_stats", JSON.stringify(s)); } catch {}
}

export type AccessLog = {
  registrationNumber: string;
  timestamp: string;
  userAgent: string;
};

export function getAccessLogs(): AccessLog[] {
  try {
    const s = localStorage.getItem(LOGS_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}
export function clearAccessLogs() {
  try { localStorage.removeItem(LOGS_KEY); } catch {}
}
function pushLocalLog(log: AccessLog) {
  try {
    const cur = getAccessLogs();
    cur.unshift(log);
    localStorage.setItem(LOGS_KEY, JSON.stringify(cur.slice(0, 1000)));
  } catch {}
}

export function logUserAccess(regNumber: string) {
  const log: AccessLog = {
    registrationNumber: regNumber,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
  pushLocalLog(log);
  try {
    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    }).catch(() => {});
  } catch {}
}

export function logsToCSV(logs: AccessLog[]): string {
  const header = ["registrationNumber", "timestamp", "userAgent"];
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const rows = logs.map(l => [esc(l.registrationNumber), esc(l.timestamp), esc(l.userAgent)].join(","));
  return [header.join(","), ...rows].join("\n");
}

export type AuditAction = "create" | "update" | "delete" | "reset";
export type AuditTarget = "achievement" | "theme";
export type AuditLog = {
  timestamp: string;
  actor: string;
  action: AuditAction;
  target: AuditTarget;
  itemId: string;
  before?: unknown;
  after?: unknown;
  note?: string;
};

export function getAuditLogs(): AuditLog[] {
  try {
    const s = localStorage.getItem(AUDIT_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}
export function pushAuditLog(entry: Omit<AuditLog, "timestamp">) {
  try {
    const cur = getAuditLogs();
    cur.unshift({ ...entry, timestamp: new Date().toISOString() });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(cur.slice(0, 2000)));
  } catch {}
}
export function clearAuditLogs() {
  try { localStorage.removeItem(AUDIT_KEY); } catch {}
}
export function auditToCSV(logs: AuditLog[]): string {
  const header = ["timestamp", "actor", "action", "target", "itemId", "before", "after", "note"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = logs.map(l => [
    esc(l.timestamp), esc(l.actor), esc(l.action), esc(l.target), esc(l.itemId),
    esc(JSON.stringify(l.before ?? "")), esc(JSON.stringify(l.after ?? "")), esc(l.note ?? ""),
  ].join(","));
  return [header.join(","), ...rows].join("\n");
}


export const attendanceUrl = (encoded: string) =>
  `http://115.241.194.20/sis/Examination/Reports/StudentSearchHTMLReport_student.aspx?R=${encoded}&T=-8584723613578166740`;

export const resultUrl = (encoded: string) =>
  `https://narayanagroup.co.in/patient/EngAutonomousReport.aspx/${encoded}`;
