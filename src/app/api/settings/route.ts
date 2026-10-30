import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let settings = await db.settings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await db.settings.create({ data: { id: "default" } });
    }
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("GET /api/settings failed", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const monthlyBudget = Number(body.monthlyBudget);
    const currency = String(body.currency ?? "$").slice(0, 4);

    const data = {
      monthlyBudget: Number.isFinite(monthlyBudget) && monthlyBudget >= 0 ? monthlyBudget : 0,
      currency: currency || "$",
    };

    const settings = await db.settings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("PUT /api/settings failed", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
