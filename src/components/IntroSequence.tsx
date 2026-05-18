import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/reduced-motion";

const STAGES = [
  { t: "INITIALIZING SECURE LINK", sub: "Booting NECRACK kernel v4.2.1" },
  { t: "ESTABLISHING TUNNEL", sub: "Negotiating encrypted handshake" },
  { t: "AUTH HANDSHAKE", sub: "Verifying operator credentials" },
  { t: "DECRYPTING LAYER", sub: "Unlocking academic data channel" },
  { t: "ACCESS GRANTED", sub: "Welcome, operator." },
];

const HACK_LINES = [
  "$ necrack --boot",
  "[+] loading kernel modules",
  "[+] tls 1.3 handshake ok",
  "$ tunnel up --port 443",
  "[*] route via relay-04",
  "[+] secure channel ready",
  "$ auth --token ******",
  "[+] operator verified",
  "$ stream open /portal",
  "[+] payload streaming",
  "[+] integrity: ok",
  "[+] ready",
];

export function IntroSequence({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const startedAt = useRef(Date.now());

  const DURATION = reduced ? 1200 : 5500;

  useEffect(() => {
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - startedAt.current) / DURATION) * 100);
      setProgress(p);
      setStage(Math.min(STAGES.length - 1, Math.floor((p / 100) * STAGES.length)));
      if (p >= 100) clearInterval(id);
    }, reduced ? 120 : 50);
    return () => clearInterval(id);
  }, [DURATION, reduced]);

  useEffect(() => {
    if (reduced) {
      setLines(HACK_LINES.slice(-6));
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      setLines((prev) => [...prev.slice(-7), HACK_LINES[i % HACK_LINES.length]]);
      i++;
    }, 380);
    return () => clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onDone, reduced ? 150 : 600);
      return () => clearTimeout(t);
    }
  }, [progress, onDone, reduced]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.15 : 0.5 }}
      className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center px-4 py-8 overflow-hidden"
    >
      {!reduced && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0, transparent 2px, #fff 2px, #fff 3px)",
          }}
        />
      )}

      <button
        onClick={onDone}
        className="absolute top-5 right-5 z-10 glass px-4 py-2 rounded-full text-xs uppercase tracking-[0.3em] text-foreground/80 hover:text-primary transition"
      >
        Skip ⏭
      </button>

      <div className="relative w-full max-w-2xl flex flex-col items-center text-center gap-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.6 }}
          className="font-display text-3xl sm:text-5xl font-bold text-gradient tracking-[0.25em]"
        >
          NECRACK
        </motion.div>
        <div className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-muted-foreground -mt-3">
          Secure Academic Portal · v4.2
        </div>

        {/* Terminal */}
        <div className="w-full glass rounded-2xl overflow-hidden border-border">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background/40">
            <span className="w-3 h-3 rounded-full bg-destructive" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-[10px] sm:text-xs font-display text-muted-foreground">
              root@necrack:~#
            </span>
          </div>
          <div className="p-4 font-display text-[11px] sm:text-sm h-48 sm:h-56 overflow-hidden text-left">
            <AnimatePresence initial={false}>
              {lines.map((l, i) => (
                <motion.div
                  key={`${l}-${i}`}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={
                    l.startsWith("$")
                      ? "text-primary"
                      : l.startsWith("[!]")
                      ? "text-destructive"
                      : "text-green-400"
                  }
                >
                  {l}
                </motion.div>
              ))}
            </AnimatePresence>
            {!reduced && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-primary"
              >
                ▊
              </motion.span>
            )}
          </div>
        </div>

        {/* Stage + progress */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={reduced ? false : { y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? undefined : { y: -8, opacity: 0 }}
              className="mb-3"
            >
              <div className="font-display text-base sm:text-xl text-gradient tracking-[0.3em]">
                {STAGES[stage].t}
              </div>
              <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                {STAGES[stage].sub}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="h-2 rounded-full bg-muted overflow-hidden border border-border">
            <div
              className="h-full bg-gradient-primary transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 font-display text-[10px] sm:text-xs text-muted-foreground">
            <span>{progress.toFixed(1)}%</span>
            <span>NECRACK · SECURE TUNNEL</span>
          </div>
        </div>

        {/* Developer credit */}
        <div className="mt-2 text-center" dir="rtl">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-1" dir="ltr">
            Developed & Maintained by
          </div>
          <div
            className="text-xl sm:text-2xl font-bold text-gradient"
            style={{ fontFamily: '"Rajdhani", "Tahoma", sans-serif' }}
          >
            محمد جوز باشا
          </div>
        </div>
      </div>
    </motion.div>
  );
}
