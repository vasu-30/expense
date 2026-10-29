// Pure calculation logic for the expense tracker.
// Shared between client components — no server imports here.

export type TxType = "EXPENSE" | "SAVING" | "INCOME" | "POCKET_MONEY";

export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string | null;
  date: string; // yyyy-MM-dd
  createdAt: string;
}

export interface Settings {
  monthlyBudget: number;
  currency: string;
}

export interface SeriesPoint {
  day: number;
  daily: number | null;
  cumulative: number | null;
  pace: number | null;
}

export interface DayStatus {
  day: number;
  spent: number;
  entries: number;
  good: boolean;
}

export interface CategorySlice {
  name: string;
  amount: number;
  pct: number;
  color: string;
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

export interface Suggestion {
  icon: string;
  title: string;
  desc: string;
}

export interface Stats {
  monthLabel: string;
  daysInMonth: number;
  today: number;
  todayStr: string;
  income: number;
  expense: number;
  saved: number;
  balance: number;
  budget: number;
  dailyTarget: number;
  budgetPct: number;
  projectedExpense: number;
  series: SeriesPoint[];
  topCategories: CategorySlice[];
  streak: { current: number; best: number };
  last7: { day: number; good: boolean | null }[];
  loggedDays: number;
  overspendDays: number;
  savingsRate: number;
  badges: Badge[];
  suggestions: Suggestion[];
  appreciation: { emoji: string; title: string; sub: string };
  hasBudget: boolean;
  hasData: boolean;
}

export const TYPE_META: Record<
  TxType,
  {
    label: string;
    sign: "plus" | "minus" | "save";
    categories: string[];
    hint: string;
  }
> = {
  EXPENSE: {
    label: "Spending",
    sign: "minus",
    categories: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"],
    hint: "Money going out",
  },
  SAVING: {
    label: "Saving",
    sign: "save",
    categories: ["Piggy Bank", "Bank Deposit", "Investment", "Goal Fund"],
    hint: "Money you set aside",
  },
  INCOME: {
    label: "Income",
    sign: "plus",
    categories: ["Salary", "Freelance", "Gift", "Other"],
    hint: "Money you earn",
  },
  POCKET_MONEY: {
    label: "Pocket Money",
    sign: "plus",
    categories: ["Monthly Allowance", "Weekly Allowance", "Gift", "Other"],
    hint: "Allowance you receive",
  },
};

export const CATEGORY_COLORS = [
  "#10b981", "#f43f5e", "#f59e0b", "#14b8a6", "#f97316",
  "#84cc16", "#d946ef", "#a855f7", "#64748b",
];

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function monthKey(s: string): string {
  return s.slice(0, 7);
}

export function fmtMoney(n: number, currency: string, compact = false): string {
  const abs = Math.abs(n);
  let num: string;
  if (compact && abs >= 1000) {
    num = `${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  } else {
    num = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return `${n < 0 ? "-" : ""}${currency}${num}`;
}

export function computeStats(txs: Tx[], settings: Settings, now = new Date()): Stats {
  const cur = now.getFullYear();
  const mo = now.getMonth();
  const daysInMonth = new Date(cur, mo + 1, 0).getDate();
  const today = now.getDate();
  const mk = `${cur}-${String(mo + 1).padStart(2, "0")}`;
  const tStr = `${mk}-${String(today).padStart(2, "0")}`;
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const monthTx = txs.filter((t) => t.date.startsWith(mk));
  const hasData = monthTx.length > 0;

  let income = 0;
  let expense = 0;
  let saved = 0;
  const spentByDay = new Map<number, number>();
  const entriesByDay = new Map<number, number>();
  const byCategory = new Map<string, number>();

  for (const t of monthTx) {
    const day = parseInt(t.date.slice(8, 10), 10);
    if (t.type === "INCOME" || t.type === "POCKET_MONEY") income += t.amount;
    else if (t.type === "EXPENSE") {
      expense += t.amount;
      spentByDay.set(day, (spentByDay.get(day) ?? 0) + t.amount);
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    } else if (t.type === "SAVING") {
      saved += t.amount;
    }
    entriesByDay.set(day, (entriesByDay.get(day) ?? 0) + 1);
  }

  const budget = settings.monthlyBudget;
  const hasBudget = budget > 0;
  const dailyTarget = hasBudget ? budget / daysInMonth : income > 0 ? income / daysInMonth : 0;

  // Daily series for the whole month; actuals only up to today.
  const series: SeriesPoint[] = [];
  let running = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const spent = spentByDay.get(d) ?? 0;
    if (d <= today) running += spent;
    const future = d > today;
    series.push({
      day: d,
      daily: future ? null : spent,
      cumulative: future ? null : Math.round(running * 100) / 100,
      pace: hasBudget ? Math.round((budget / daysInMonth) * d * 100) / 100 : null,
    });
  }

  // Day statuses: "good" = logged something & stayed under daily target
  const days: DayStatus[] = [];
  for (let d = 1; d <= today; d++) {
    const spent = spentByDay.get(d) ?? 0;
    const entries = entriesByDay.get(d) ?? 0;
    days.push({ day: d, spent, entries, good: entries > 0 && spent <= dailyTarget });
  }

  // Streaks
  let current = 0;
  {
    let start = days.length - 1;
    if (start >= 0 && days[start].entries === 0) start -= 1; // today not logged yet — streak still alive
    let i = start;
    while (i >= 0 && days[i].good) {
      current += 1;
      i -= 1;
    }
  }
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.good ? run + 1 : 0;
    if (run > best) best = run;
  }
  if (current > best) best = current;

  const last7: { day: number; good: boolean | null }[] = [];
  for (let d = Math.max(1, today - 6); d <= today; d++) {
    const st = days.find((x) => x.day === d);
    last7.push({ day: d, good: st ? (st.entries > 0 ? st.good : null) : null });
  }

  // Top categories
  const totalCat = expense;
  const topCategories: CategorySlice[] = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount], i) => ({
      name,
      amount,
      pct: totalCat > 0 ? Math.round((amount / totalCat) * 100) : 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  const loggedDays = days.filter((d) => d.entries > 0).length;
  const overspendDays = days.filter((d) => d.entries > 0 && d.spent > dailyTarget).length;
  const savingsRate = income > 0 ? saved / income : 0;
  const budgetPct = hasBudget && budget > 0 ? expense / budget : 0;
  const projectedExpense = today > 0 ? (expense / today) * daysInMonth : 0;
  const paceToday = hasBudget ? (budget / daysInMonth) * today : Infinity;

  // Badges
  const badges: Badge[] = [];
  if (current >= 3)
    badges.push({ id: "streak", emoji: "🔥", title: `${current}-Day Streak`, desc: "Smart spending, day after day" });
  if (savingsRate >= 0.2)
    badges.push({ id: "saver", emoji: "🏆", title: "Super Saver", desc: `Saved ${Math.round(savingsRate * 100)}% of your income` });
  if (hasBudget && expense <= paceToday)
    badges.push({ id: "budget", emoji: "🎯", title: "Budget Boss", desc: "Spending is ahead of the pace line" });
  if (days.some((d) => d.entries > 0 && d.spent === 0))
    badges.push({ id: "nospend", emoji: "🙌", title: "No-Spend Day", desc: "A whole day with zero spending" });
  if (loggedDays >= 15)
    badges.push({ id: "consistent", emoji: "⭐", title: "Consistency Star", desc: `Logged ${loggedDays} days this month` });

  // Appreciation banner
  let appreciation: Stats["appreciation"];
  if (!hasData) {
    appreciation = { emoji: "👋", title: "Welcome!", sub: "Add your first entry in Track to start your journey." };
  } else if (current >= 3) {
    appreciation = { emoji: "🔥", title: "You're on fire!", sub: `${current} days of smart spending in a row. Keep it going!` };
  } else if (savingsRate >= 0.2) {
    appreciation = { emoji: "🏆", title: "Super saver alert!", sub: `You saved ${Math.round(savingsRate * 100)}% of your income this month. Amazing!` };
  } else if (hasBudget && expense <= paceToday) {
    appreciation = { emoji: "🎯", title: "Right on track!", sub: "Your spending is under the budget pace. Your future self says thanks." };
  } else if (current >= 1) {
    appreciation = { emoji: "👍", title: "Nice going!", sub: "Log your spending daily to grow your streak." };
  } else {
    appreciation = { emoji: "💰", title: "Every penny counts!", sub: "Log today's spending and start a new streak tomorrow." };
  }

  // Savings suggestions for next month
  const suggestions: Suggestion[] = [];
  if (topCategories.length > 0) {
    const top = topCategories[0];
    const cut = top.amount * 0.15;
    suggestions.push({
      icon: "✂️",
      title: `Trim ${top.name} by 15%`,
      desc: `${top.name} is your biggest expense (${top.pct}% of spending). Cutting a little next month frees up about ${fmtMoney(cut, settings.currency)}.`,
    });
  }
  if (income > 0) {
    const goal = income * 0.2;
    if (savingsRate < 0.2) {
      suggestions.push({
        icon: "🏦",
        title: "Aim to save 20%",
        desc: `This month you saved ${Math.round(savingsRate * 100)}%. Try setting aside ${fmtMoney(goal, settings.currency)} — even small auto-saves on allowance day add up.`,
      });
    } else {
      suggestions.push({
        icon: "🚀",
        title: "Level up your goal",
        desc: `You already beat the 20% rule! Pushing to 30% means ${fmtMoney(income * 0.3, settings.currency)} by next month.`,
      });
    }
  }
  if (overspendDays > 0) {
    suggestions.push({
      icon: "🛡️",
      title: `Guard ${overspendDays} risky day${overspendDays > 1 ? "s" : ""}`,
      desc: `You went over your daily limit ${overspendDays} time${overspendDays > 1 ? "s" : ""}. A simple "wait 24h" rule before impulse buys protects your streak.`,
    });
  }
  if (hasBudget && projectedExpense > budget) {
    const daysLeft = Math.max(1, daysInMonth - today);
    suggestions.push({
      icon: "📉",
      title: "Pace warning",
      desc: `At this rate you'll spend ${fmtMoney(projectedExpense, settings.currency)} — over budget. Cap daily spending at ${fmtMoney(Math.max(0, (budget - expense) / daysLeft), settings.currency)} for the rest of the month.`,
    });
  }
  if (suggestions.length === 0 && hasData) {
    suggestions.push({
      icon: "🌟",
      title: "You're doing great",
      desc: "No red flags this month. Keep logging daily and your savings will keep growing.",
    });
  }

  return {
    monthLabel,
    daysInMonth,
    today,
    todayStr: tStr,
    income,
    expense,
    saved,
    balance: income - expense,
    budget,
    dailyTarget,
    budgetPct,
    projectedExpense,
    series,
    topCategories,
    streak: { current, best },
    last7,
    loggedDays,
    overspendDays,
    savingsRate,
    badges,
    suggestions,
    appreciation,
    hasBudget,
    hasData,
  };
}
