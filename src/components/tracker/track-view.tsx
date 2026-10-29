"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Loader2,
  PiggyBank,
  Plus,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fmtMoney, todayStr, TYPE_META, type Settings, type Tx, type TxType } from "@/lib/finance";

const TYPES: TxType[] = ["EXPENSE", "SAVING", "INCOME", "POCKET_MONEY"];

const TYPE_UI: Record<TxType, { icon: typeof Wallet; chip: string; text: string; active: string }> = {
  EXPENSE: {
    icon: ShoppingBag,
    chip: "bg-rose-100 dark:bg-rose-950",
    text: "text-rose-600 dark:text-rose-400",
    active: "bg-rose-500 text-white shadow-sm",
  },
  SAVING: {
    icon: PiggyBank,
    chip: "bg-teal-100 dark:bg-teal-950",
    text: "text-teal-600 dark:text-teal-400",
    active: "bg-teal-500 text-white shadow-sm",
  },
  INCOME: {
    icon: Wallet,
    chip: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-600 dark:text-emerald-400",
    active: "bg-emerald-500 text-white shadow-sm",
  },
  POCKET_MONEY: {
    icon: Gift,
    chip: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-600 dark:text-amber-400",
    active: "bg-amber-500 text-white shadow-sm",
  },
};

function formatDay(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrackView({
  txs,
  settings,
  onDataChanged,
}: {
  txs: Tx[];
  settings: Settings;
  onDataChanged: () => void;
}) {
  const { toast } = useToast();
  const [type, setType] = useState<TxType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(TYPE_META.EXPENSE.categories[0]);
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [budgetInput, setBudgetInput] = useState(String(settings.monthlyBudget || ""));
  const [currencyInput, setCurrencyInput] = useState(settings.currency);
  const [savingSettings, setSavingSettings] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    setBudgetInput(String(settings.monthlyBudget || ""));
    setCurrencyInput(settings.currency);
  }, [settings.monthlyBudget, settings.currency]);

  useEffect(() => {
    setCategory(TYPE_META[type].categories[0]);
  }, [type]);

  const currency = settings.currency;

  const amountValue = useMemo(() => parseFloat(amount), [amount]);
  const valid = Number.isFinite(amountValue) && amountValue > 0 && category && /^\d{4}-\d{2}-\d{2}$/.test(date);

  async function addEntry() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: amountValue, category, date, note: note || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save the entry");
      }
      if (type === "SAVING") {
        toast({ title: "Way to go! 🎉", description: `${fmtMoney(amountValue, currency)} moved to savings. Future you says thanks!` });
      } else if (type === "EXPENSE") {
        toast({ title: "Entry added ✅", description: `${fmtMoney(amountValue, currency)} spending logged. Keep that streak alive!` });
      } else {
        toast({ title: "Entry added ✅", description: `${fmtMoney(amountValue, currency)} income logged.` });
      }
      setAmount("");
      setNote("");
      onDataChanged();
    } catch (e) {
      toast({ title: "Oops!", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    try {
      const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete the entry");
      toast({ title: "Entry deleted" });
      onDataChanged();
    } catch (e) {
      toast({ title: "Oops!", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    }
  }

  async function saveSettings() {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: parseFloat(budgetInput) || 0, currency: currencyInput }),
      });
      if (!res.ok) throw new Error("Could not save settings");
      toast({ title: "Settings saved ✅", description: "Your budget powers streaks, pace line and tips." });
      onDataChanged();
    } catch (e) {
      toast({ title: "Oops!", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  }

  async function loadDemo() {
    if (seeding) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.seeded) {
        toast({ title: "Demo data loaded 🎈", description: "Explore the app with a sample month of entries." });
      } else {
        toast({ title: "Already have data", description: "Demo data is only added when your tracker is empty." });
      }
      onDataChanged();
    } catch {
      toast({ title: "Oops!", description: "Could not load demo data", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  }

  async function clearAll() {
    try {
      const res = await fetch("/api/transactions?all=true", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not clear data");
      toast({ title: "All entries cleared", description: "Fresh start! Add your first entry above." });
      onDataChanged();
    } catch (e) {
      toast({ title: "Oops!", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-xl font-bold tracking-tight">Track Money 💸</h1>
        <p className="text-sm text-muted-foreground">Log every spending, saving and pocket money here</p>
      </motion.header>

      {/* Add entry form */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add an Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type selector */}
            <div role="radiogroup" aria-label="Entry type" className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => {
                const ui = TYPE_UI[t];
                const Icon = ui.icon;
                const isActive = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setType(t)}
                    className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-medium transition-all ${
                      isActive ? `${ui.active} border-transparent` : "bg-background hover:bg-muted/60"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden />
                    {TYPE_META[t].label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {currency}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_META[type].categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                placeholder={TYPE_META[type].hint}
                value={note}
                maxLength={80}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addEntry();
                }}
              />
            </div>

            <Button className="w-full gap-1.5" disabled={!valid || saving} onClick={addEntry}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {saving ? "Saving..." : `Add ${TYPE_META[type].label}`}
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      {/* Entries list */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>All Entries</span>
              <span className="text-xs font-normal text-muted-foreground">{txs.length} record{txs.length === 1 ? "" : "s"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="size-6 text-muted-foreground" aria-hidden />
                </div>
                <div>
                  <p className="font-medium">No entries yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add your first one above, or load a demo month to explore.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadDemo} disabled={seeding} className="gap-1.5">
                  {seeding ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Load demo data
                </Button>
              </div>
            ) : (
              <ul className="max-h-96 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {txs.map((t) => {
                  const ui = TYPE_UI[t.type];
                  const Icon = ui.icon;
                  const amtCls =
                    t.type === "EXPENSE"
                      ? "text-rose-600 dark:text-rose-400"
                      : t.type === "SAVING"
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-emerald-600 dark:text-emerald-400";
                  const sign = t.type === "EXPENSE" ? "-" : t.type === "SAVING" ? "" : "+";
                  return (
                    <li key={t.id} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${ui.chip}`}>
                        <Icon className={`size-4 ${ui.text}`} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.category}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDay(t.date)}
                          {t.note ? ` · ${t.note}` : ""}
                        </p>
                      </div>
                      <p className={`shrink-0 text-sm font-bold ${amtCls}`}>
                        {sign}
                        {fmtMoney(t.amount, currency)}
                      </p>
                      <button
                        type="button"
                        aria-label={`Delete ${t.category} entry`}
                        onClick={() => deleteEntry(t.id)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Settings */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-4 text-muted-foreground" aria-hidden /> Budget & Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[1fr_88px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="budget">Monthly budget</Label>
                <Input
                  id="budget"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  placeholder="e.g. 500"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currencyInput} onValueChange={setCurrencyInput}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["$", "₹", "€", "£", "¥"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Save settings
            </Button>

            {txs.length > 0 && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm font-medium">Danger zone</p>
                <p className="mt-0.5 text-xs text-muted-foreground">This deletes every entry permanently.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="mt-2">
                      Clear all data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all entries?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Every spending, saving and income record will be deleted forever. Your budget settings stay.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAll}>Yes, clear everything</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
