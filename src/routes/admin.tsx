import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  type Achievement,
  type ThemeDef,
  type AuditLog,
  getAccessLogs,
  clearAccessLogs,
  getAchievements,
  saveAchievements,
  getThemes,
  saveThemes,
  defaultAchievements,
  defaultThemes,
  logsToCSV,
  pushAuditLog,
  getAuditLogs,
  clearAuditLogs,
  auditToCSV,
} from "@/lib/necrack";
import { verifyAdmin } from "@/lib/admin-auth.functions";
import { DevCredit } from "@/components/DevCredit";

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
  const [actor, setActor] = useState("admin");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { actor?: string };
        setAuthed(true);
        if (p.actor) setActor(p.actor);
      }
    } catch {}
  }, []);

  if (!authed) {
    return <Login onSuccess={(email) => { setActor(email); setAuthed(true); }} />;
  }
  return <Dashboard actor={actor} onLogout={() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setAuthed(false);
  }} />;
}

function Login({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await verifyAdmin({ data: { email, password } });
      if (!res.ok) {
        setErr(res.error || "Invalid credentials");
        return;
      }
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ actor: email, token: res.token }));
      } catch {}
      toast.success("Welcome, admin");
      onSuccess(email);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Server error";
      setErr(msg);
    } finally {
      setLoading(false);
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
        <button
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold tracking-widest glow disabled:opacity-60"
        >
          {loading ? "VERIFYING…" : "SIGN IN"}
        </button>
        <Link to="/" className="block mt-4 text-center text-xs text-muted-foreground hover:text-primary">
          ← Back to portal
        </Link>
      </form>
      <DevCredit floating />
    </main>
  );
}

function Dashboard({ actor, onLogout }: { actor: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"users" | "achievements" | "themes" | "audit">("users");
  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <Toaster position="top-right" richColors />
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-gradient tracking-[0.2em]">NECRACK ADMIN</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Signed in as {actor}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/" className="glass px-4 py-2 rounded-full text-xs uppercase tracking-widest">Portal</Link>
          <button onClick={onLogout} className="glass px-4 py-2 rounded-full text-xs uppercase tracking-widest text-destructive">
            Logout
          </button>
        </div>
      </header>

      <nav className="flex gap-2 mb-6 flex-wrap">
        {(["users", "achievements", "themes", "audit"] as const).map(t => (
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

      {tab === "users" && <UsersPanel />}
      {tab === "achievements" && <AchievementsPanel actor={actor} />}
      {tab === "themes" && <ThemesPanel actor={actor} />}
      {tab === "audit" && <AuditPanel />}

      <DevCredit floating />
    </main>
  );
}

function UsersPanel() {
  const [logs, setLogs] = useState(() => getAccessLogs());
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = useMemo(
    () => logs.filter(l => l.registrationNumber.toLowerCase().includes(q.toLowerCase())),
    [logs, q],
  );

  // Aggregate unique users
  const users = useMemo(() => {
    const map = new Map<string, { reg: string; count: number; first: string; last: string; agents: Set<string> }>();
    for (const l of logs) {
      const k = l.registrationNumber;
      const cur = map.get(k) ?? { reg: k, count: 0, first: l.timestamp, last: l.timestamp, agents: new Set<string>() };
      cur.count++;
      if (l.timestamp < cur.first) cur.first = l.timestamp;
      if (l.timestamp > cur.last) cur.last = l.timestamp;
      cur.agents.add(l.userAgent);
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last));
  }, [logs]);

  const exportCSV = () => {
    const csv = logsToCSV(filtered);
    download(csv, `necrack-access-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    toast.success("CSV exported");
  };

  const clearAll = () => {
    if (!confirm("Clear ALL local access logs? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;
    clearAccessLogs();
    setLogs([]);
    toast.message("Access logs cleared");
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

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <h3 className="font-display tracking-widest text-xs mb-2 text-muted-foreground">UNIQUE USERS ({users.length})</h3>
          <div className="overflow-auto max-h-[55vh] rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card/90 backdrop-blur">
                <tr className="text-left">
                  <th className="px-3 py-2 text-xs">REG #</th>
                  <th className="px-3 py-2 text-xs">VISITS</th>
                  <th className="px-3 py-2 text-xs">LAST SEEN</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No users yet</td></tr>}
                {users.map(u => (
                  <tr key={u.reg} className="border-t border-border/50 hover:bg-primary/5">
                    <td className="px-3 py-2 font-mono">{u.reg}</td>
                    <td className="px-3 py-2">{u.count}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{new Date(u.last).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-display tracking-widest text-xs mb-2 text-muted-foreground">
            ALL ACCESS EVENTS ({filtered.length}/{logs.length})
          </h3>
          <div className="overflow-auto max-h-[55vh] rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card/90 backdrop-blur">
                <tr className="text-left">
                  <th className="px-3 py-2 text-xs">REG #</th>
                  <th className="px-3 py-2 text-xs">TIMESTAMP</th>
                  <th className="px-3 py-2 text-xs">DETAIL</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No logs</td></tr>}
                {filtered.map((l, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="px-3 py-2 font-mono">{l.registrationNumber}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => setSelected(i)} className="text-primary text-xs underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected !== null && filtered[selected] && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div onClick={e => e.stopPropagation()} className="glass rounded-2xl p-6 max-w-xl w-full">
            <h3 className="font-display tracking-widest text-primary mb-3">USER DETAIL</h3>
            <pre className="text-xs whitespace-pre-wrap break-all bg-input/40 p-3 rounded-lg">{JSON.stringify(filtered[selected], null, 2)}</pre>
            <button onClick={() => setSelected(null)} className="mt-4 w-full py-2 rounded-xl border border-border text-primary text-xs tracking-widest">Close</button>
          </div>
        </div>
      )}
    </section>
  );
}

function AchievementsPanel({ actor }: { actor: string }) {
  const [list, setList] = useState<Achievement[]>(() => getAchievements());

  const persist = (next: Achievement[]) => {
    setList(next);
    saveAchievements(next);
  };

  const add = () => {
    const item: Achievement = { id: `ach_${Date.now()}`, icon: "🏅", title: "New Achievement", desc: "Describe…", target: 1 };
    persist([...list, item]);
    pushAuditLog({ actor, action: "create", target: "achievement", itemId: item.id, after: item });
    toast.success("Achievement added");
  };

  const update = (i: number, patch: Partial<Achievement>) => {
    const before = list[i];
    const after = { ...before, ...patch };
    persist(list.map((a, idx) => idx === i ? after : a));
    pushAuditLog({ actor, action: "update", target: "achievement", itemId: before.id, before, after });
  };

  const remove = (i: number) => {
    const before = list[i];
    if (!confirm(`Delete achievement "${before.title}"? This cannot be undone.`)) return;
    if (!confirm("Confirm permanent deletion?")) return;
    persist(list.filter((_, idx) => idx !== i));
    pushAuditLog({ actor, action: "delete", target: "achievement", itemId: before.id, before });
    toast.message("Achievement removed");
  };

  const reset = () => {
    if (!confirm("Reset all achievements to defaults? Custom achievements will be lost.")) return;
    if (!confirm("Final confirmation: reset?")) return;
    persist(defaultAchievements);
    pushAuditLog({ actor, action: "reset", target: "achievement", itemId: "*", before: list, after: defaultAchievements });
    toast.message("Reset to defaults");
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

function ThemesPanel({ actor }: { actor: string }) {
  const [list, setList] = useState<ThemeDef[]>(() => getThemes());

  const persist = (next: ThemeDef[]) => {
    setList(next);
    saveThemes(next);
  };

  const update = (i: number, patch: Partial<ThemeDef>) => {
    const before = list[i];
    const after = { ...before, ...patch };
    persist(list.map((t, idx) => idx === i ? after : t));
    pushAuditLog({ actor, action: "update", target: "theme", itemId: before.id, before, after });
  };

  const remove = (i: number) => {
    const before = list[i];
    if (!confirm(`Remove theme "${before.label}"?`)) return;
    if (!confirm("Confirm permanent removal?")) return;
    persist(list.filter((_, idx) => idx !== i));
    pushAuditLog({ actor, action: "delete", target: "theme", itemId: before.id, before });
    toast.message("Theme removed");
  };

  const add = () => {
    const item: ThemeDef = { id: `theme_${Date.now()}`, label: "New" };
    persist([...list, item]);
    pushAuditLog({ actor, action: "create", target: "theme", itemId: item.id, after: item });
    toast.success("Theme added");
  };

  const reset = () => {
    if (!confirm("Reset themes to defaults?")) return;
    if (!confirm("Final confirmation: reset themes?")) return;
    persist(defaultThemes);
    pushAuditLog({ actor, action: "reset", target: "theme", itemId: "*", before: list, after: defaultThemes });
    toast.message("Reset to defaults");
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

function AuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return logs.filter(l =>
      !needle ||
      l.actor.toLowerCase().includes(needle) ||
      l.action.includes(needle) ||
      l.target.includes(needle) ||
      l.itemId.toLowerCase().includes(needle),
    );
  }, [logs, q]);

  const exportCSV = () => {
    download(auditToCSV(filtered), `necrack-audit-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    toast.success("Audit CSV exported");
  };

  const clearAll = () => {
    if (!confirm("Clear ALL audit logs?")) return;
    if (!confirm("Are you absolutely sure?")) return;
    clearAuditLogs();
    setLogs([]);
    toast.message("Audit log cleared");
  };

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search actor / action / target / id"
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-input/60 border border-border outline-none focus:border-primary"
        />
        <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs tracking-widest">⬇ EXPORT CSV</button>
        <button onClick={clearAll} className="px-4 py-2 rounded-xl border border-destructive/50 text-destructive text-xs tracking-widest">CLEAR</button>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{filtered.length} of {logs.length} entries</div>
      <div className="overflow-auto max-h-[60vh] rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card/90 backdrop-blur">
            <tr className="text-left">
              <th className="px-3 py-2 text-xs">TIME</th>
              <th className="px-3 py-2 text-xs">ACTOR</th>
              <th className="px-3 py-2 text-xs">ACTION</th>
              <th className="px-3 py-2 text-xs">TARGET</th>
              <th className="px-3 py-2 text-xs">ITEM</th>
              <th className="px-3 py-2 text-xs">CHANGE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No audit entries</td></tr>}
            {filtered.map((l, i) => (
              <tr key={i} className="border-t border-border/50 align-top">
                <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs">{l.actor}</td>
                <td className="px-3 py-2 text-xs font-mono">
                  <span className={
                    l.action === "delete" ? "text-destructive"
                    : l.action === "create" ? "text-green-400"
                    : l.action === "reset" ? "text-yellow-500"
                    : "text-primary"
                  }>{l.action}</span>
                </td>
                <td className="px-3 py-2 text-xs">{l.target}</td>
                <td className="px-3 py-2 text-xs font-mono">{l.itemId}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground max-w-[280px] truncate" title={JSON.stringify({ before: l.before, after: l.after })}>
                  {l.before !== undefined && <span>was: {short(l.before)} </span>}
                  {l.after !== undefined && <span>now: {short(l.after)}</span>}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function short(v: unknown) {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
