export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwK0X5FEFZ3pn0sCcFPFTaZkpTWkzfja8aejsiOo2Ies0rGqzLuzDByrc9VJkR9wmHN/exec";

export type Stats = {
  totalAccesses: number;
  themesUsed: string[];
  unlockedAchievements: string[];
};

export const achievements = [
  { id: "first", icon: "🎯", title: "First Access", desc: "First portal access", target: 1 },
  { id: "regular", icon: "📚", title: "Regular User", desc: "10 accesses", target: 10 },
  { id: "veteran", icon: "⭐", title: "Veteran", desc: "50 accesses", target: 50 },
  { id: "explorer", icon: "🎨", title: "Explorer", desc: "Try all themes", target: 3 },
];

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

export function logUserAccess(regNumber: string) {
  try {
    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationNumber: regNumber,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  } catch {}
}

export const attendanceUrl = (encoded: string) =>
  `http://115.241.194.20/sis/Examination/Reports/StudentSearchHTMLReport_student.aspx?R=${encoded}&T=-8584723613578166740`;

export const resultUrl = (encoded: string) =>
  `https://narayanagroup.co.in/patient/EngAutonomousReport.aspx/${encoded}`;
