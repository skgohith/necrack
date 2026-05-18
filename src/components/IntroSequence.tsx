import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/target-logo.png";

const STAGES = [
  { t: "INITIALIZING SECURE LINK", sub: "Booting NECRACK kernel v4.2.1" },
  { t: "LOCATING TARGET SERVER", sub: "Resolving narayanagroup.co.in ..." },
  { t: "BYPASSING FIREWALL", sub: "Injecting payload through port 443" },
  { t: "DECRYPTING AES-256 LAYER", sub: "Cracking academic database keys" },
  { t: "ACCESS GRANTED", sub: "Welcome, operator." },
];

const HACK_LINES = [
  "$ nmap -sV 115.241.194.20",
  "[+] open 80/tcp  http",
  "[+] open 443/tcp https",
  "$ sqlmap -u target --batch --dbs",
  "[*] testing parameter 'R' ...",
  "[+] vulnerable to boolean-blind",
  "[+] dumping students_db ...",
  "$ openssl enc -d -aes-256-cbc",
  "[+] key recovered: 0xA1F4...DEAD",
  "[+] 12,847 records exposed",
  "$ scp ./loot.tar.gz @relay:/var",
  "[!] firewall log wiped ✓",
  "[+] root shell acquired",
];

export function IntroSequence({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const DURATION = 6500;
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - startedAt.current) / DURATION) * 100);
      setProgress(p);
      setStage(Math.min(STAGES.length - 1, Math.floor((p / 100) * STAGES.length)));
      if (p >= 100) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setLines((prev) => [...prev.slice(-7), HACK_LINES[i % HACK_LINES.length]]);
      i++;
    }, 380);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
  }, [progress, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center px-4 py-8 overflow-hidden"
    >
      {/* Scanline overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, #fff 2px, #fff 3px)",
        }}
      />
      {/* Grid floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "linear-gradient(to bottom, transparent 30%, black 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 30%, black 60%, transparent 100%)",
          transform: "perspective(400px) rotateX(60deg)",
          transformOrigin: "center bottom",
        }}
      />

      {/* Skip */}
      <button
        onClick={onDone}
        className="absolute top-5 right-5 z-10 glass px-4 py-2 rounded-full text-xs uppercase tracking-[0.3em] text-foreground/80 hover:text-primary transition"
      >
        Skip ⏭
      </button>

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left: Target logo with attack overlay */}
        <div className="relative flex items-center justify-center perspective-1000 order-2 md:order-1">
          {/* Rotating rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
            className="absolute w-[18rem] h-[18rem] sm:w-[22rem] sm:h-[22rem] rounded-full border-2 border-dashed border-primary/40"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, ease: "linear", repeat: Infinity }}
            className="absolute w-[14rem] h-[14rem] sm:w-[17rem] sm:h-[17rem] rounded-full border border-accent/50"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-destructive/20 blur-3xl"
          />

          {/* Target shield logo */}
          <motion.img
            src={logo}
            alt="Target institution shield"
            initial={{ rotateY: -180, opacity: 0 }}
            animate={{
              rotateY: [0, 8, -8, 0],
              y: [0, -6, 0],
              opacity: 1,
            }}
            transition={{
              opacity: { duration: 0.8 },
              rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            className="relative w-32 h-32 sm:w-44 sm:h-44 drop-shadow-[0_0_30px_rgba(255,80,80,0.6)]"
            style={{ transformStyle: "preserve-3d" }}
          />

          {/* Red crosshair lines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="w-[120%] h-px bg-destructive/70" />
            <div className="absolute h-[120%] w-px bg-destructive/70" />
          </motion.div>

          {/* Hacker silhouette */}
          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="absolute right-0 bottom-0 sm:-right-6 sm:-bottom-6 text-[5rem] sm:text-[7rem] select-none"
            style={{ filter: "drop-shadow(0 0 20px rgba(255,40,40,0.6))" }}
          >
            <motion.span
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="inline-block"
            >
              🥷
            </motion.span>
          </motion.div>

          {/* "BREACH" stamp */}
          <motion.div
            initial={{ scale: 3, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: -15 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 120 }}
            className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 px-3 py-1 border-2 border-destructive text-destructive font-display font-bold text-sm sm:text-base tracking-widest bg-background/40"
          >
            BREACH
          </motion.div>
        </div>

        {/* Right: hacker terminal */}
        <div className="order-1 md:order-2 glass rounded-2xl overflow-hidden border-destructive/40">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background/40">
            <span className="w-3 h-3 rounded-full bg-destructive" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-[10px] sm:text-xs font-display text-muted-foreground">
              root@necrack:~#
            </span>
          </div>
          <div className="p-4 font-display text-[11px] sm:text-sm h-48 sm:h-56 overflow-hidden">
            <AnimatePresence initial={false}>
              {lines.map((l, i) => (
                <motion.div
                  key={`${l}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
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
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-primary"
            >
              ▊
            </motion.span>
          </div>
        </div>
      </div>

      {/* Stage + progress */}
      <div className="relative w-full max-w-3xl mt-8 sm:mt-12 px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="text-center mb-3"
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
          <motion.div
            className="h-full bg-gradient-primary"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        <div className="flex justify-between mt-2 font-display text-[10px] sm:text-xs text-muted-foreground">
          <span>{progress.toFixed(1)}%</span>
          <span>NECRACK · SECURE TUNNEL</span>
        </div>
      </div>

      {/* Developer credit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 sm:mt-8 text-center"
        dir="rtl"
      >
        <div className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-1" dir="ltr">
          Developed & Maintained by
        </div>
        <motion.div
          animate={{ textShadow: [
            "0 0 10px var(--primary)",
            "0 0 25px var(--accent)",
            "0 0 10px var(--primary)",
          ]}}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-xl sm:text-3xl font-bold text-gradient"
          style={{ fontFamily: '"Rajdhani", "Tahoma", sans-serif' }}
        >
          محمد جوز باشا
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
