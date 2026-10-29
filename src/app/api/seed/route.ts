import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface SeedRow {
  daysAgo?: number; // 0 = today, 1 = yesterday, ... (clamped to day 1)
  day?: number; // fixed day of month (clamped to month length)
  type: string;
  amount: number;
  category: string;
  note: string;
}

// Demo month shaped so the tracker shows streaks, badges & suggestions.
const SEED: SeedRow[] = [
  { day: 1, type: "POCKET_MONEY", amount: 200, category: "Monthly Allowance", note: "Monthly allowance" },
  { day: 1, type: "EXPENSE", amount: 12.5, category: "Food", note: "Groceries" },
  { day: 2, type: "EXPENSE", amount: 8, category: "Transport", note: "Bus pass top-up" },
  { day: 3, type: "EXPENSE", amount: 22.75, category: "Shopping", note: "New t-shirt" },
  { day: 4, type: "EXPENSE", amount: 6.5, category: "Food", note: "Lunch at canteen" },
  { day: 5, type: "SAVING", amount: 40, category: "Piggy Bank", note: "Weekly save" },
  { day: 6, type: "EXPENSE", amount: 15, category: "Entertainment", note: "Movie night" },
  { day: 7, type: "EXPENSE", amount: 9.99, category: "Food", note: "Pizza slice + drink" },
  { day: 8, type: "EXPENSE", amount: 3.5, category: "Food", note: "Snacks" },
  { day: 9, type: "EXPENSE", amount: 14, category: "Transport", note: "Cab to library" },
  { day: 10, type: "EXPENSE", amount: 18.4, category: "Food", note: "Dinner with friends" },
  { day: 11, type: "EXPENSE", amount: 25, category: "Bills", note: "Mobile recharge" },
  { day: 13, type: "EXPENSE", amount: 7.25, category: "Food", note: "Sandwich" },
  { day: 15, type: "SAVING", amount: 25, category: "Bank Deposit", note: "Save day!" },
  { day: 16, type: "EXPENSE", amount: 11.5, category: "Shopping", note: "Notebook + pens" },
  { day: 17, type: "EXPENSE", amount: 20.99, category: "Entertainment", note: "Game pass" },
  { day: 19, type: "EXPENSE", amount: 5.5, category: "Food", note: "Coffee + bagel" },
  { day: 21, type: "EXPENSE", amount: 13.2, category: "Transport", note: "Metro card" },
  { day: 22, type: "EXPENSE", amount: 8.75, category: "Food", note: "Noodles" },
  { day: 23, type: "EXPENSE", amount: 4.5, category: "Food", note: "Juice" },
  { day: 24, type: "EXPENSE", amount: 6, category: "Food", note: "Canteen lunch" },
  // Last 5 days (relative to today) — all under the daily target to build a live streak
  { daysAgo: 4, type: "EXPENSE", amount: 9.5, category: "Food", note: "Wrap" },
  { daysAgo: 3, type: "EXPENSE", amount: 12.3, category: "Shopping", note: "Gift wrap" },
  { daysAgo: 2, type: "EXPENSE", amount: 7.8, category: "Food", note: "Salad" },
  { daysAgo: 1, type: "EXPENSE", amount: 10.25, category: "Food", note: "Ramen" },
  { daysAgo: 0, type: "EXPENSE", amount: 6.75, category: "Food", note: "Breakfast" },
  { daysAgo: 0, type: "SAVING", amount: 15, category: "Piggy Bank", note: "Top-up savings" },
];

export async function POST() {
  try {
    const count = await db.transaction.count();
    if (count > 0) {
      return NextResponse.json({ seeded: false, reason: "Data already exists" });
    }

    const now = new Date();
    const cur = now.getFullYear();
    const mo = now.getMonth();
    const daysInMonth = new Date(cur, mo + 1, 0).getDate();
    const today = now.getDate();
    const mk = `${cur}-${String(mo + 1).padStart(2, "0")}`;

    const rows = SEED.map((r) => {
      const raw = r.daysAgo !== undefined ? today - r.daysAgo : (r.day ?? 1);
      const day = Math.max(1, Math.min(daysInMonth, raw));
      return {
        type: r.type,
        amount: r.amount,
        category: r.category,
        note: r.note,
        date: `${mk}-${String(day).padStart(2, "0")}`,
      };
    });

    await db.transaction.createMany({ data: rows });
    await db.settings.upsert({
      where: { id: "default" },
      update: { monthlyBudget: 500 },
      create: { id: "default", monthlyBudget: 500, currency: "$" },
    });

    return NextResponse.json({ seeded: true, count: rows.length });
  } catch (e) {
    console.error("POST /api/seed failed", e);
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}
