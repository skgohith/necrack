import { motion } from "framer-motion";

export function DevCredit({ floating = false }: { floating?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={
        floating
          ? "fixed bottom-3 left-1/2 -translate-x-1/2 z-40 glass px-4 py-2 rounded-full flex items-center gap-2 text-[10px] sm:text-xs"
          : "inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs"
      }
    >
      <span className="uppercase tracking-[0.3em] text-muted-foreground hidden sm:inline">
        Dev & Maintained by
      </span>
      <span className="uppercase tracking-[0.25em] text-muted-foreground sm:hidden">
        Dev by
      </span>
      <motion.span
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="font-bold text-gradient text-sm sm:text-base"
        style={{ backgroundSize: "200% 100%" }}
        dir="rtl"
      >
        محمد جوز باشا
      </motion.span>
    </motion.div>
  );
}
