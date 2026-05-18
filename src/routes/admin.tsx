import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  type Achievement,
  type ThemeDef,
  getAccessLogs,
  clearAccessLogs,
  getAchievements,
  saveAchievements,
  getThemes,
  saveThemes,
  defaultAchievements,
  defaultThemes,
  logsToCSV,
} from "@/lib/necrack";
import { DevCredit } from "@/components/DevCredit";

const ADMIN_EMAIL = "admin@123";
const ADMIN_PASSWORD = "Skgohith2651x@";
const SESSION_KEY = "necrack_admin_session";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "NECRACK Admin" },
      { name: "description", content: "NECRACK admin dashboard" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    } catch {}
  }, []);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setAuthed(false);
  }} />;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
      toast.success("Welcome, admin");
      onSuccess();
    } else {
      setErr("Invalid credentials");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Toaster position="top-right" richColors />
      <form onSubmit={submit} className="glass rounded-3xl p-8 w-full max-w-md">
        <h1 className="font-display text-2xl text-gradient tracking-[0.2em] mb-1">ADMIN</h1>
        <p className="text-xs text-muted-foreground mb-6 uppercase tracking-widest">Restricted access</p>
        <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-input/60 border border-border outline-none focus:border-primary"
          placeholder="admin@..."
          autoComplete="username"
        />
        <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-input/60 border border-border outline-none focus:border-primary"
          autoComplete="current-password"
        />
        {err && <div className="text-destructive text-sm mb-3">{err}</div>}
        <button className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold tracking-widest glow">
          SIGN IN
        </button>
        <Link to="/" className="block mt-4 text-center text-xs text-muted-foreground hover:text-primary">
          ← Back to portal
        </Link>
      </form>
      <DevCredit floating />
    </main>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"logs" | "achievements" | "themes">("logs");
  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <Toaster position="top-right" richColors />
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-gradient tracking-[0.2em]">NECRACK ADMIN</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Control panel</p>
        </div>
        <div className="flex gap-2">
          <Link to="/" className="glass px-4 py-2 rounded-full text-xs uppercase tracking-widest">Portal</Link>
          <button onClick={onLogout} className="glass px-4 py-2 rounded-full text-xs uppercase tracking-widest text-destructive">
            Logout
          </button>
        </div>
      </header>

      <nav className="flex gap-2 mb-6 flex-wrap">
        {(["logs", "achievements", "themes"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs uppercase tracking-widest border-2 transition ${
              tab === t ? "border-primary text-primary bg-primary/10" : "border-border text-foreground/70"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "logs" && <LogsPanel />}
      {tab === "achievements" && <AchievementsPanel />}
      {tab === "themes" && <ThemesPanel />}

      <DevCredit floating />
    </main>
  );
}

function LogsPanel() {
  const [logs, setLogs] = useState(() => getAccessLogs());
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => logs.filter(l => l.registrationNumber.toLowerCase().includes(q.toLowerCase())),
    [logs, q],
  );

  const exportCSV = () => {
    const csv = logsToCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `necrack-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const clearAll = () => {
    if (!confirm("Clear all local access logs?")) return;
    clearAccessLogs();
    setLogs([]);
    toast.message("Logs cleared");
  };

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search registration #"
          className="flex-1 min-w-[180px] px-4 py-2 rounded-xl bg-input/60 border border-border outline-none focus:border-primary"
        />
        <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs tracking-widest">
          ⬇ EXPORT CSV
        </button>
        <button onClick={clearAll} className="px-4 py-2 rounded-xl border border-destructive/50 text-destructive text-xs tracking-widest">
          CLEAR
        </button>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        Showing {filtered.length} of {logs.length} logs (local cache).
      </div>
      <div className="overflow-auto max-h-[60vh] rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card/90 backdrop-blur">
            <tr className="text-left">
              <th className="px-3 py-2 font-display tracking-widest text-xs">REG #</th>
              <th className="px-3 py-2 font-display tracking-widest text-xs">TIMESTAMP</th>
              <th className="px-3 py-2 font-display tracking-widest text-xs">USER AGENT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No logs yet</td></tr>
            )}
            {filtered.map((l, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="px-3 py-2 font-mono">{l.registrationNumber}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-3 py-2 text-muted-foreground truncate max-w-[280px]" title={l.userAgent}>{l.userAgent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AchievementsPanel() {
  const [list, setList] = useState<Achievement[]>(() => getAchievements());

  const persist = (next: Achievement[]) => {
    setList(next);
    saveAchievements(next);
  };

  const add = () => {
    const next = [...list, { id: `ach_${Date.now()}`, icon: "🏅", title: "New Achievement", desc: "Describe…", target: 1 }];
    persist(next);
  };

  const update = (i: number, patch: Partial<Achievement>) => {
    const next = list.map((a, idx) => idx === i ? { ...a, ...patch } : a);
    persist(next);
  };

  const remove = (i: number) => {
    if (!confirm("Remove this achievement?")) return;
    persist(list.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    if (!confirm("Reset to defaults?")) return;
    persist(defaultAchievements);
  };

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-display tracking-widest">Achievements</h2>
        <div className="flex gap-2">
          <button onClick={add} className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs tracking-widest font-bold">+ ADD</button>
          <button onClick={reset} className="px-4 py-2 rounded-xl border border-border text-xs tracking-widest">RESET</button>
        </div>
      </div>
      <div className="grid gap-3">
        {list.map((a, i) => (
          <div key={a.id} className="grid grid-cols-12 gap-2 items-center border border-border rounded-xl p-3">
            <input value={a.icon} onChange={e => update(i, { icon: e.target.value })} className="col-span-2 sm:col-span-1 text-2xl text-center bg-input/40 rounded-lg py-2 border border-border" />
            <input value={a.title} onChange={e => update(i, { title: e.target.value })} placeholder="Title" className="col-span-10 sm:col-span-3 px-3 py-2 rounded-lg bg-input/40 border border-border" />
            <input value={a.desc} onChange={e => update(i, { desc: e.target.value })} placeholder="Description" className="col-span-12 sm:col-span-5 px-3 py-2 rounded-lg bg-input/40 border border-border" />
            <input type="number" value={a.target} onChange={e => update(i, { target: Number(e.target.value) || 0 })} placeholder="Target" className="col-span-8 sm:col-span-2 px-3 py-2 rounded-lg bg-input/40 border border-border" />
            <button onClick={() => remove(i)} className="col-span-4 sm:col-span-1 text-destructive text-sm">✕</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThemesPanel() {
  const [list, setList] = useState<ThemeDef[]>(() => getThemes());

  const persist = (next: ThemeDef[]) => {
    setList(next);
    saveThemes(next);
  };

  const update = (i: number, patch: Partial<ThemeDef>) => {
    persist(list.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  };

  const remove = (i: number) => {
    if (!confirm("Remove this theme?")) return;
    persist(list.filter((_, idx) => idx !== i));
  };

  const add = () => {
    persist([...list, { id: `theme_${Date.now()}`, label: "New" }]);
  };

  const reset = () => {
    if (!confirm("Reset to defaults?")) return;
    persist(defaultThemes);
  };

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-display tracking-widest">Themes</h2>
        <div className="flex gap-2">
          <button onClick={add} className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs tracking-widest font-bold">+ ADD</button>
          <button onClick={reset} className="px-4 py-2 rounded-xl border border-border text-xs tracking-widest">RESET</button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Built-in themes: dark, light, neon. Custom theme IDs fall back to dark styling.
      </p>
      <div className="grid gap-3">
        {list.map((t, i) => (
          <div key={t.id} className="grid grid-cols-12 gap-2 items-center border border-border rounded-xl p-3">
            <input value={t.id} onChange={e => update(i, { id: e.target.value })} placeholder="id" className="col-span-5 px-3 py-2 rounded-lg bg-input/40 border border-border font-mono text-xs" />
            <input value={t.label} onChange={e => update(i, { label: e.target.value })} placeholder="Label" className="col-span-6 px-3 py-2 rounded-lg bg-input/40 border border-border" />
            <button onClick={() => remove(i)} className="col-span-1 text-destructive text-sm">✕</button>
          </div>
        ))}
      </div>
    </section>
  );
}
