import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_TYPES = ["EXPENSE", "SAVING", "INCOME", "POCKET_MONEY"];

export async function GET() {
  try {
    const txs = await db.transaction.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ transactions: txs });
  } catch (e) {
    console.error("GET /api/transactions failed", e);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = String(body.type ?? "").toUpperCase();
    const amount = Number(body.amount);
    const category = String(body.category ?? "").trim();
    const date = String(body.date ?? "").trim();
    const note = body.note ? String(body.note).trim() : null;

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid entry type" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Date must be yyyy-MM-dd" }, { status: 400 });
    }

    const tx = await db.transaction.create({
      data: { type, amount, category, note, date },
    });
    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (e) {
    console.error("POST /api/transactions failed", e);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("all") === "true") {
      await db.transaction.deleteMany({});
      return NextResponse.json({ ok: true, cleared: true });
    }
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await db.transaction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/transactions failed", e);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
