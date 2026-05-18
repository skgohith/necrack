import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { ThreeBackground } from "@/components/ThreeBackground";
import { TiltCard } from "@/components/TiltCard";
import { IntroSequence } from "@/components/IntroSequence";
import { DevCredit } from "@/components/DevCredit";
import {
  attendanceUrl,
  getAchievements,
  getStats,
  getThemes,
  logUserAccess,
  resultUrl,
  saveStats,
} from "@/lib/necrack";
import { getRMMode, setRMMode, useReducedMotion, type RMMode } from "@/lib/reduced-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NECRACK — Secure Academic Portal" },
      { name: "description", content: "A smooth 4D secure academic portal for attendance and results." },
      { property: "og:title", content: "NECRACK — Secure Academic Portal" },
      { property: "og:description", content: "Immersive secure portal with attendance & results." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap",
      },
    ],
  }),
  component: NecrackApp,
});

type View = "landing" | "portal";
type Theme = "dark" | "light" | "neon";

function NecrackApp() {
  const reduced = useReducedMotion();
  const [introDone, setIntroDone] = useState(false);
  const [view, setView] = useState<View>("landing");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [rmMode, setRmModeState] = useState<RMMode>("system");
  const themes = useMemo(() => getThemes(), []);
  const achievements = useMemo(() => getAchievements(), []);

  useEffect(() => {
    setRmModeState(getRMMode());
    try {
      if (sessionStorage.getItem("necrack_intro_seen") === "1") setIntroDone(true);
    } catch {}
  }, []);

  const finishIntro = () => {
    try { sessionStorage.setItem("necrack_intro_seen", "1"); } catch {}
    setIntroDone(true);
  };
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [encoded, setEncoded] = useState("");
  const [stats, setStats] = useState(() => getStats());

  useEffect(() => {
    try {
      const t = (sessionStorage.getItem("necrack_theme") as Theme) || "dark";
      setTheme(t);
    } catch { setTheme("dark"); }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.body.setAttribute("data-theme", t);
    try { sessionStorage.setItem("necrack_theme", t); } catch {}
    setStats(prev => {
      const themesUsed = Array.from(new Set([...prev.themesUsed, t]));
      const next = { ...prev, themesUsed };
      checkAchievements(next);
      saveStats(next);
      return next;
    });
  };

  const checkAchievements = (s: ReturnType<typeof getStats>) => {
    achievements.forEach(a => {
      if (s.unlockedAchievements.includes(a.id)) return;
      let unlock = false;
      if (a.id === "first" && s.totalAccesses >= 1) unlock = true;
      if (a.id === "regular" && s.totalAccesses >= 10) unlock = true;
      if (a.id === "veteran" && s.totalAccesses >= 50) unlock = true;
      if (a.id === "explorer" && s.themesUsed.length >= 3) unlock = true;
      if (unlock) {
        s.unlockedAchievements.push(a.id);
        toast.success("🏆 Achievement Unlocked!", { description: a.title });
      }
    });
  };

  const handleStart = () => {
    setStarting(true);
    setTimeout(() => {
      try { sessionStorage.setItem("necrackUser", JSON.stringify({ timestamp: Date.now() })); } catch {}
      toast.success("Welcome to NECRACK Portal");
      setTimeout(() => { setView("portal"); setStarting(false); }, 700);
    }, 900);
  };

  const handleBack = () => {
    try { sessionStorage.removeItem("necrackUser"); } catch {}
    setView("landing");
    toast.message("Returned to landing");
  };

  const handleAccess = () => {
    const r = reg.trim();
    if (!r) { toast.error("Enter registration number"); return; }
    const enc = btoa(r);
    setEncoded(enc);
    logUserAccess(r);
    setStats(prev => {
      const next = { ...prev, totalAccesses: prev.totalAccesses + 1 };
      checkAchievements(next);
      saveStats(next);
      return next;
    });
    setLoading(true);
    setTimeout(() => { setLoading(false); setShowResults(true); }, 1800);
  };

  return (
    <>
      <ThreeBackground />
      <Toaster position="top-right" theme={theme === "light" ? "light" : "dark"} richColors closeButton />

      <AnimatePresence>
        {!introDone && <IntroSequence key="intro" onDone={finishIntro} />}
      </AnimatePresence>

      <DevCredit floating />

      {/* Floating watermark */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 flex items-center justify-center -z-[5] select-none"
      >
        <span className="font-display text-[14vw] font-black tracking-[0.3em] text-foreground/[0.025]">
          NECRACK
        </span>
      </div>

      {/* Top bar (only in portal) */}
      <AnimatePresence>
        {view === "portal" && (
          <motion.div
            initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="fixed top-5 right-5 z-50 flex gap-2"
          >
            <IconBtn onClick={() => setShowMenu(true)} label="Open settings menu">☰</IconBtn>
            <IconBtn onClick={handleBack} label="Back to home">🏠</IconBtn>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <motion.section
              key="landing"
              initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.85, rotateX: 15 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl text-center perspective-1000"
            >
              <SkullTitle subtitle="Secure Academic Portal" />
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStart}
                disabled={starting}
                className="mt-10 px-12 py-5 rounded-2xl bg-gradient-primary text-primary-foreground font-display font-bold text-lg tracking-[0.3em] glow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {starting ? "⏳ LOADING…" : "🚀 START"}
              </motion.button>
              <p className="mt-8 text-xs uppercase tracking-[0.4em] text-muted-foreground">
                Move your cursor · Tilt the depth
              </p>
            </motion.section>
          ) : (
            <motion.section
              key="portal"
              initial={{ opacity: 0, scale: 0.92, rotateY: 25 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.92, rotateY: -25 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl perspective-1000"
            >
              <SkullTitle subtitle="Access your academic records" />
              <TiltCard className="glass rounded-3xl p-8 md:p-10 mt-8 will-change-transform">
                <label className="block uppercase tracking-[0.2em] text-xs font-semibold mb-3 text-muted-foreground">
                  Registration Number
                </label>
                <div className="relative" style={{ transform: "translateZ(40px)" }}>
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">🎓</span>
                  <input
                    value={reg}
                    onChange={(e) => setReg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAccess()}
                    placeholder="Enter Registration Number"
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-input/60 border border-border text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  onClick={handleAccess}
                  style={{ transform: "translateZ(30px)" }}
                  className="w-full mt-6 py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-display font-bold tracking-[0.3em] glow disabled:opacity-60"
                >
                  {loading ? "⏳ ACCESSING…" : "ACCESS PORTAL"}
                </motion.button>
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-5 h-1.5 rounded-full overflow-hidden bg-muted"
                    >
                      <motion.div
                        initial={{ width: "0%" }} animate={{ width: "100%" }}
                        transition={{ duration: 1.6, ease: "easeOut" }}
                        className="h-full bg-gradient-primary"
                        style={{ backgroundSize: "200% 100%", animation: "shimmer 1.2s linear infinite" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </TiltCard>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <Stat label="Accesses" value={stats.totalAccesses} />
                <Stat label="Themes" value={stats.themesUsed.length} />
                <Stat label="Trophies" value={stats.unlockedAchievements.length} />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Results Modal */}
      <Modal open={showResults} onClose={() => setShowResults(false)} title="🎯 Links Generated" subtitle="Your secure links are ready">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalBtn onClick={() => {
            window.open(attendanceUrl(encoded), "_blank");
            toast.message("Attendance page opened");
            setShowResults(false);
          }}>🏫 Attendance</ModalBtn>
          <ModalBtn onClick={() => {
            window.open(resultUrl(encoded), "_blank");
            toast.message("Results page opened");
            setShowResults(false);
          }}>📊 Results</ModalBtn>
        </div>
        <button onClick={() => setShowResults(false)} className="mt-5 w-full py-3 rounded-xl border border-border text-primary font-semibold tracking-wider">
          Close
        </button>
      </Modal>

      {/* Settings Modal */}
      <Modal open={showMenu} onClose={() => setShowMenu(false)} title="⚙️ SETTINGS">
        <div className="text-left">
          <div className="mb-6">
            <div className="text-sm font-semibold mb-3 uppercase tracking-wider">🎨 Theme</div>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(td => (
                <button
                  key={td.id}
                  onClick={() => { setTheme(td.id as Theme); toast.message(`Switched to ${td.label}`); }}
                  className={`py-3 rounded-xl border-2 capitalize font-semibold tracking-widest text-sm transition-all ${
                    theme === td.id ? "border-primary text-primary bg-primary/10" : "border-border text-foreground/80"
                  }`}
                >
                  {td.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <div className="text-sm font-semibold mb-3 uppercase tracking-wider">🌙 Reduced Motion</div>
            <div className="grid grid-cols-3 gap-2">
              {(["system", "on", "off"] as RMMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setRMMode(m); setRmModeState(m); toast.message(`Reduced motion: ${m}`); }}
                  className={`py-3 rounded-xl border-2 capitalize font-semibold tracking-widest text-xs transition-all ${
                    rmMode === m ? "border-primary text-primary bg-primary/10" : "border-border text-foreground/80"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Currently: {reduced ? "minimized animations" : "full animations"}
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3 uppercase tracking-wider">🏆 Achievements</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {achievements.map(a => {
                const unlocked = stats.unlockedAchievements.includes(a.id);
                return (
                  <div key={a.id} className={`rounded-xl p-3 text-center border-2 transition-all ${
                    unlocked ? "border-primary bg-primary/10" : "border-border opacity-50 grayscale"
                  }`}>
                    <div className="text-2xl mb-1">{a.icon}</div>
                    <div className="text-[11px] font-bold">{a.title}</div>
                    <div className="text-[10px] text-muted-foreground">{a.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <Link
            to="/admin"
            onClick={() => setShowMenu(false)}
            className="block mt-6 text-center text-xs text-muted-foreground hover:text-primary uppercase tracking-widest"
          >
            🔐 Admin dashboard
          </Link>
        </div>
        <button onClick={() => setShowMenu(false)} className="mt-6 w-full py-3 rounded-xl border border-border text-primary font-semibold tracking-wider">
          Close
        </button>
      </Modal>
    </>
  );
}

function SkullTitle({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={{ y: [0, -14, 0], rotateZ: [0, 3, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="text-[clamp(4rem,12vw,7rem)] animate-pulse-glow"
      >
        💀
      </motion.div>
      <h1 className="font-display text-[clamp(2.5rem,8vw,4.5rem)] font-bold text-gradient leading-none mt-2">
        NECRACK
      </h1>
      <p className="mt-2 text-xs sm:text-sm uppercase tracking-[0.4em] text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label}
      className="glass w-12 h-12 rounded-full text-xl flex items-center justify-center"
    >
      {children}
    </motion.button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-xl py-3">
      <div className="text-2xl font-display text-gradient">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Modal({
  open, onClose, title, subtitle, children,
}: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.85, opacity: 0, rotateX: -20 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.85, opacity: 0, rotateX: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-3xl p-8 max-w-lg w-full text-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            <h2 className="font-display text-2xl text-primary tracking-[0.2em] mb-2">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModalBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="py-4 px-5 rounded-xl bg-gradient-primary text-primary-foreground font-bold tracking-wider"
    >
      {children}
    </motion.button>
  );
}
