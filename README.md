# Pharmadex 🇪🇹

A simple, professional, mobile-first pharmacy management system tailored for Ethiopian community pharmacies.

## Project Scope & Core Principles
- **Users**: 1 Owner/Admin and 2–3 Pharmacists with individual accounts.
- **Strict Scope**: Zero bloat, no unnecessary charts or discount logic. Focus on rock-solid inventory integrity, financial accountability, and ease of use.
- **Currency & Localization**: Ethiopian Birr (ETB) with Gregorian calendar dates.
- **Supported Payment Channels**: Cash, Telebirr, CBE Birr, and Bank Transfer.
- **Single Open Shift Policy**: Database-level guarantee ensuring only one cashier shift can be active across the pharmacy at any time.
- **Pack & Unit Accounting**: Accurate pack-to-unit conversions allowing sales of both full boxes and individual tablets/capsules without floating-point stock discrepancies.

---

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Neutral palette with restrained `#0f766e` medical teal accent)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Row-Level Security)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Database Architecture

The PostgreSQL schema is structured across 11 core tables in `supabase/migrations/`:

| Entity | Purpose & Integrity Constraints |
| :--- | :--- |
| `profiles` | User accounts linked to `auth.users`, roles (`ADMIN`, `PHARMACIST`), contact details. |
| `suppliers` | Medicine distributors with unique names and contact info. |
| `medicines` | Essential attributes only: name, strength, dosage form, base unit, units per pack, low-stock threshold. Unique on `(name, strength, dosage_form)`. |
| `batches` | Batch numbers, supplier link, expiry date, pack and unit prices, initial and current base units. Indexed for **FEFO** (`idx_batches_fefo`). |
| `shifts` | Shift tracking with opening/closing cash, expected vs actual cash, discrepancy. Enforced **single open shift** via `idx_single_open_shift`. |
| `stock_movements` | Immutable audit ledger linking every inventory change to the batch, medicine, reference transaction, and user. |
| `sales` | Sales records with unique receipt numbers, shift link, payment method, cashier ID, and ETB totals. |
| `sale_items` | Line items supporting full packs or individual units with batch deduction. |
| `returns` | Authorized sale cancellations and item returns with stock restoration tracking. |
| `cash_movements` | Shift till movements (pay-ins, pay-outs, expenses, deposits). |
| `audit_logs` | System-wide operational audit log for security and compliance. |

---

## Getting Started

### 1. Prerequisites
- Node.js 18.18+ (tested on Node 22+)
- A Supabase project (cloud or local)

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
NEXT_PUBLIC_APP_NAME="Pharmadex"
NEXT_PUBLIC_CURRENCY="ETB"
```

### 3. Run Database Migrations
In your Supabase project dashboard (SQL Editor) or via the Supabase CLI, run the migration scripts in sequential order:
1. `supabase/migrations/20261009000001_initial_schema.sql` - Core schema, tables, foreign keys, check constraints, and indexes.
2. `supabase/migrations/20261009000002_rls_and_policies.sql` - Row-level security rules and helper functions.
3. `supabase/seed.sql` - Essential Ethiopian medicines (Amoxicillin, Paracetamol, Metformin, ORS) and sample suppliers.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## Directory Structure
```
Pharmadex-2/
├── .env.example              # Environment variables template
├── .env.local                # Local environment configurations (git-ignored)
├── README.md                 # Project documentation
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── postcss.config.mjs        # PostCSS configuration for Tailwind v4
├── next.config.ts            # Next.js configuration
├── supabase/
│   ├── migrations/
│   │   ├── 20261009000001_initial_schema.sql      # Core PostgreSQL tables, constraints, indexes
│   │   └── 20261009000002_rls_and_policies.sql    # Row-Level Security (RLS) rules
│   └── seed.sql                                   # Ethiopian medicines & supplier seed data
└── src/
    ├── app/
    │   ├── layout.tsx        # Responsive mobile-first root layout
    │   ├── page.tsx          # Status verification page
    │   ├── globals.css       # Tailwind CSS styles & typography
    │   └── api/
    │       └── health/
    │           └── route.ts  # Database connection test endpoint
    ├── components/
    │   └── ui/               # Touch-friendly, minimal UI components
    │       ├── button.tsx
    │       ├── card.tsx
    │       └── badge.tsx
    ├── lib/
    │   ├── supabase/         # Supabase client helpers
    │   │   ├── client.ts     # Client component Supabase instance
    │   │   ├── server.ts     # Server component & Admin Supabase instances
    │   │   └── middleware.ts # Auth session refresh helper
    │   └── utils.ts          # ETB currency, date, and styling helpers
    └── types/
        ├── database.types.ts # Strongly-typed PostgreSQL schema types
        └── index.ts          # Re-exports and composite application models
```
