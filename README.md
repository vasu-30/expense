# SmartPenny — Expense Tracker 🐷💰

A personal expense tracker that helps you understand where your money goes, build a daily saving streak, and get smart suggestions to save more next month.

## Features

**Home page**
- Total **income**, **spent** and **saved** for the current month
- **Daily progress line chart** — cumulative spending vs. a dashed budget-pace line, with per-day spend bars
- Monthly **budget progress** with daily limit and month-end projection
- 🔥 **Saving streak** — current & best streak, plus last-7-days status dots
- **Where the money goes** — top spending categories
- **Tips to save more next month** generated from your own spending patterns
- **Badges & appreciation** — Streak, Super Saver, Budget Boss, No-Spend Day, Consistency Star

**Track page**
- Log **Spending**, **Savings**, **Income** and **Pocket Money** with amount, date, category and note
- All entries list with delete
- Monthly budget & currency settings
- Clear-all danger zone

Plus: dark mode, mobile-first responsive UI, animated page transitions.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) + shadcn/ui components
- [Recharts](https://recharts.org) for the progress chart
- [Prisma ORM](https://www.prisma.io) + SQLite
- framer-motion, lucide-react icons

## Getting Started

1. Install dependencies

```bash
bun install
```

2. Create a `.env` file in the project root:

```env
DATABASE_URL=file:./db/custom.db
```

3. Push the database schema:

```bash
bun run db:push
```

4. Start the dev server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and start tracking. Use **Track → Load demo data** to explore the app with a sample month.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # App shell with Home / Track views
│   └── api/
│       ├── transactions/     # Entries CRUD
│       ├── settings/         # Budget & currency
│       └── seed/             # Demo data loader
├── components/
│   ├── tracker/
│   │   ├── home-view.tsx     # Dashboard: stats, chart, streak, tips, badges
│   │   ├── track-view.tsx    # Add entries, list, settings
│   │   ├── progress-chart.tsx
│   │   └── theme-toggle.tsx
│   └── ui/                   # shadcn/ui components
└── lib/
    ├── finance.ts            # Streaks, badges, suggestions & stats logic
    └── db.ts                 # Prisma client
```
