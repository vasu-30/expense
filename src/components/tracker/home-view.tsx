"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  PiggyBank,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fmtMoney, type Stats } from "@/lib/finance";
import { ProgressChart } from "./progress-chart";

function fadeUp(i = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: i * 0.06, ease: "easeOut" as const },
  };
}

export function HomeView({
  stats,
  currency,
  onGoTrack,
}: {
  stats: Stats;
  currency: string;
  onGoTrack: () => void;
}) {
  const budgetUsed = Math.min(100, Math.round(stats.budgetPct * 100));
  const barColor = budgetUsed >= 90 ? "bg-rose-500" : budgetUsed >= 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-4">
      {/* Greeting + streak chip */}
      <motion.header {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hi there 👋</h1>
          <p className="text-sm text-muted-foreground">Here is your {stats.monthLabel} money story</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <Flame className="size-4 fill-amber-500 text-amber-500" aria-hidden />
          {stats.streak.current} day{stats.streak.current === 1 ? "" : "s"}
        </div>
      </motion.header>

      {/* Appreciation banner */}
      <motion.section {...fadeUp(1)} aria-live="polite">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-md">
          <Sparkles className="absolute -right-3 -top-3 size-24 opacity-15" aria-hidden />
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none" aria-hidden>
              {stats.appreciation.emoji}
            </span>
            <div>
              <p className="text-lg font-bold">{stats.appreciation.title}</p>
              <p className="mt-0.5 text-sm text-emerald-50/90">{stats.appreciation.sub}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Money overview */}
      <motion.section {...fadeUp(2)} aria-label="Monthly totals">
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
              </div>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Income</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 sm:text-base">
                {fmtMoney(stats.income, currency)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                <ShoppingBag className="size-4 text-rose-600 dark:text-rose-400" aria-hidden />
              </div>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Spent</p>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 sm:text-base">
                {fmtMoney(stats.expense, currency)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950">
                <PiggyBank className="size-4 text-teal-600 dark:text-teal-400" aria-hidden />
              </div>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Saved</p>
              <p className="text-sm font-bold text-teal-600 dark:text-teal-400 sm:text-base">
                {fmtMoney(stats.saved, currency)}
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Budget progress */}
      <motion.section {...fadeUp(3)}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Monthly Budget</span>
              <span className="text-sm font-semibold text-muted-foreground">{budgetUsed}% used</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.hasBudget ? (
              <>
                <Progress value={budgetUsed} className="h-2.5" indicatorClassName={barColor} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {fmtMoney(stats.expense, currency)} of {fmtMoney(stats.budget, currency)}
                  </span>
                  <span className="font-medium">
                    {fmtMoney(Math.max(0, stats.budget - stats.expense), currency)} left
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Daily limit</p>
                    <p className="font-semibold">{fmtMoney(stats.dailyTarget, currency)}/day</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">On this pace, month ends at</p>
                    <p className={`font-semibold ${stats.projectedExpense > stats.budget ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {fmtMoney(stats.projectedExpense, currency)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted-foreground">
                  Set a monthly budget to unlock your daily limit, pace line, streaks and smart tips.
                </p>
                <Button size="sm" onClick={onGoTrack} className="gap-1.5">
                  Set budget <ArrowRight className="size-4" aria-hidden />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Daily progress chart */}
      <motion.section {...fadeUp(4)}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Daily Progress</CardTitle>
            <p className="text-xs text-muted-foreground">
              How your spending grows day by day — stay under the dashed pace line to win.
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <ProgressChart series={stats.series} currency={currency} daysInMonth={stats.daysInMonth} />
          </CardContent>
        </Card>
      </motion.section>

      {/* Streak card */}
      <motion.section {...fadeUp(5)}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-4 fill-amber-500 text-amber-500" aria-hidden /> Saving Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-extrabold leading-none">{stats.streak.current}</p>
                  <p className="mt-1 text-xs text-muted-foreground">current streak</p>
                </div>
                <div className="border-l pl-4">
                  <p className="text-xl font-bold leading-none text-amber-600 dark:text-amber-400">{stats.streak.best}</p>
                  <p className="mt-1 text-xs text-muted-foreground">best this month</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5" aria-label="Last 7 days status">
                {stats.last7.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-1">
                    <span
                      className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${
                        d.good === null
                          ? "bg-muted text-muted-foreground"
                          : d.good
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                      title={`Day ${d.day}: ${d.good === null ? "not logged" : d.good ? "on target" : "over target"}`}
                    >
                      {d.good === null ? "–" : d.good ? "✓" : "✕"}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A day counts when you log it and stay under {fmtMoney(stats.dailyTarget, currency)}. Log daily to keep the flame alive!
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* Where money goes */}
      {stats.topCategories.length > 0 && (
        <motion.section {...fadeUp(6)}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Where the Money Goes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topCategories.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                      {c.name}
                    </span>
                    <span className="text-muted-foreground">
                      {fmtMoney(c.amount, currency)} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Suggestions */}
      <motion.section {...fadeUp(7)}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-emerald-600" aria-hidden /> Tips to Save More Next Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.suggestions.map((s, i) => (
              <div key={i} className="flex gap-3 rounded-xl bg-muted/60 p-3">
                <span className="text-xl leading-none" aria-hidden>
                  {s.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.section>

      {/* Badges */}
      <motion.section {...fadeUp(8)}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Badges Earned</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.badges.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 rounded-full border bg-muted/60 py-1.5 pl-2 pr-3.5"
                    title={b.desc}
                  >
                    <span className="text-lg" aria-hidden>
                      {b.emoji}
                    </span>
                    <div className="leading-tight">
                      <p className="text-xs font-semibold">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="size-4" aria-hidden />
                No badges yet — log your spending daily to earn your first one!
              </p>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
