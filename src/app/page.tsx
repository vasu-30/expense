"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home as HomeIcon, PiggyBank, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { computeStats, type Settings, type Tx } from "@/lib/finance";
import { HomeView } from "@/components/tracker/home-view";
import { TrackView } from "@/components/tracker/track-view";
import { ThemeToggle } from "@/components/tracker/theme-toggle";

type View = "home" | "track";

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [settings, setSettings] = useState<Settings>({ monthlyBudget: 0, currency: "$" });
  const [loading, setLoading] = useState(true);

  const switchView = useCallback((next: View) => {
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [tRes, sRes] = await Promise.all([fetch("/api/transactions"), fetch("/api/settings")]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      setTxs(Array.isArray(tData.transactions) ? tData.transactions : []);
      if (sData.settings) {
        setSettings({
          monthlyBudget: sData.settings.monthlyBudget ?? 0,
          currency: sData.settings.currency ?? "$",
        });
      }
    } catch (e) {
      console.error("Failed to load tracker data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => computeStats(txs, settings), [txs, settings]);

  return (
    <div className="min-h-screen bg-muted/40 dark:bg-background">
      <div className="mx-auto w-full max-w-lg px-4 pb-32 pt-6">
        {/* App header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <PiggyBank className="size-5 text-white" aria-hidden />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight tracking-tight">SmartPenny</p>
              <p className="text-[11px] leading-tight text-muted-foreground">Track · Save · Celebrate</p>
            </div>
          </div>
          <ThemeToggle />
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <HomeView stats={stats} currency={settings.currency} onGoTrack={() => switchView("track")} />
              </motion.div>
            ) : (
              <motion.div
                key="track"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <TrackView txs={txs} settings={settings} onDataChanged={refresh} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom navigation */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
      >
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-zinc-900/95 p-1.5 shadow-xl backdrop-blur dark:bg-zinc-800/95">
          <NavButton
            active={view === "home"}
            label="Home"
            onClick={() => switchView("home")}
            icon={<HomeIcon className="size-4" aria-hidden />}
          />
          <NavButton
            active={view === "track"}
            label="Track"
            onClick={() => switchView("track")}
            icon={<PlusCircle className="size-4" aria-hidden />}
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-[44px] items-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-colors ${
        active ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-full bg-white"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
