# EcoSync Enterprise Scrap Network — Codebase Reference for AI Assistants

> Use this document to give an AI assistant (e.g. ChatGPT) complete context about this project before asking it to help with code, debugging, or features.

---

## 1. Project Overview

**EcoSync Enterprise Scrap Network** (`ecosync-enterprise-scrap-network`) is a full-stack **Next.js 16** web application for an e-waste / scrap recycling business. It connects customers, recycling partners, and admins in a single platform.

Key capabilities:
- Public landing page with a live scrap value estimator
- Customer registration, login (email/password + OTP), and session management
- Customer dashboard: pickup history, recovered value, notifications, impact totals
- Pickup scheduling with material rates, address, preferred date, and real-time status tracking
- Environmental impact dashboard: CO2 saved, recycling milestones, leaderboard, trajectory charts
- Searchable/filterable services and rates marketplace
- Three-step partner onboarding and verification wizard
- Admin operations dashboard: pickup lifecycle, partner approval, compliance oversight
- Automated impact entry generation when a pickup is marked "completed"
- E-bill / PDF invoice generation per pickup
- OTP verification via SMS (Fast2SMS) and email (Nodemailer/Gmail)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5.9 |
| Styling | Custom CSS (glassmorphism design system, `app/globals.css`) |
| Icons | Lucide React |
| Maps | Leaflet + React-Leaflet |
| Backend | Next.js Route Handlers (`app/api/`) |
| Database | PostgreSQL via Supabase (connection pooling, `postgres` npm driver) |
| Auth | HTTP-only session cookies + JWT (`jose`), OTP flow |
| Password hashing | `bcryptjs` |
| Validation | `zod` |
| PDF generation | `jspdf` + `html2canvas` |
| Email | `nodemailer` (Gmail SMTP) |
| SMS OTP | Fast2SMS REST API |

---

## 3. Environment Variables (`.env`)

```
AUTH_SECRET=<long-random-secret>           # JWT signing secret
DATABASE_URL=<postgresql-connection-url>   # Supabase PostgreSQL (pooled)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Public base URL
SMTP_EMAIL=<gmail-address>                 # Nodemailer sender
SMTP_PASSWORD=<gmail-app-password>         # Gmail App Password (16-char)
FAST2SMS_API_KEY=<fast2sms-key>            # SMS OTP provider
```

> **Note:** The database is **PostgreSQL on Supabase** (not local SQLite). The `DATABASE_URL` uses the Supabase connection pooler on AWS ap-southeast-2.

---

## 4. Project Structure

```
ecosync/
├── app/                          # Next.js App Router pages & API routes
│   ├── page.tsx                  # Public landing page (estimator, hero)
│   ├── layout.tsx                # Root layout (fonts, theme provider)
│   ├── globals.css               # Full design system (CSS variables, utilities)
│   ├── login/                    # Login page
│   ├── register/                 # Customer registration page
│   ├── dashboard/                # Authenticated customer/partner dashboard
│   │   └── request-pickup/       # Pickup scheduling form
│   ├── impact/                   # Environmental impact dashboard
│   ├── market/                   # Services & rates marketplace
│   ├── partner/                  # Partner portal login & landing
│   ├── partner-portal/           # Authenticated partner pages
│   ├── bill/                     # E-bill / PDF invoice viewer
│   ├── admin/                    # Admin operations & compliance dashboard
│   └── api/                      # Backend Route Handlers
│       ├── auth/
│       │   ├── register/         # POST: user registration
│       │   ├── login/            # POST: login (sets session cookie)
│       │   └── logout/           # POST: clears session cookie
│       ├── user/                 # GET: current user profile
│       ├── pickups/              # GET/POST: pickup CRUD
│       │   └── [id]/
│       │       ├── ebill/        # GET: generate e-bill data for a pickup
│       │       └── track/        # GET: tracking status for a pickup
│       ├── admin/                # Admin-only APIs
│       │   ├── pickups/          # GET/PATCH: manage all pickups
│       │   └── partners/         # GET/PATCH: partner approval
│       ├── partner/              # Partner portal APIs
│       │   └── apply/            # POST: submit partner application
│       ├── materials/            # GET: scrap material rates
│       ├── estimate/             # POST: scrap value estimation
│       ├── notifications/        # GET/PATCH: user notifications
│       ├── tracking/             # GET: public pickup tracking
│       └── bill/                 # GET: bill lookup
│
├── components/                   # Shared React components
│   ├── site-header.tsx           # Top navigation bar
│   ├── site-footer.tsx           # Footer
│   ├── estimator.tsx             # Live scrap value estimator widget
│   ├── notifications-dropdown.tsx # Bell icon + notification list
│   ├── logout-button.tsx         # Session logout
│   ├── admin-actions.tsx         # Admin quick-action buttons
│   ├── theme-provider.tsx        # Dark/light theme context
│   ├── theme-toggle.tsx          # Theme toggle button
│   ├── forms/
│   │   ├── login-form.tsx        # Customer login form
│   │   ├── partner-login-form.tsx # Partner login form
│   │   ├── register-form.tsx     # Registration form (name, email, phone, password)
│   │   ├── otp-verify-form.tsx   # OTP verification step (SMS/email)
│   │   └── pickup-form.tsx       # Pickup scheduling form
│   ├── admin/                    # Admin-specific UI components
│   ├── customer/                 # Customer-specific UI components
│   ├── partner/                  # Partner-specific UI components
│   ├── tracking/                 # Pickup tracking map/timeline components
│   └── ui/                       # Primitive UI components (buttons, inputs, cards...)
│
├── lib/                          # Shared server-side utilities
│   ├── db.ts                     # PostgreSQL client + all DB query functions
│   ├── auth.ts                   # Session helpers (getSession, requireAuth)
│   ├── validators.ts             # Zod schemas for all API inputs
│   ├── types.ts                  # Shared TypeScript interfaces/types
│   ├── format.ts                 # Currency, date, and unit formatters
│   └── otp.ts                    # OTP generation, sending (SMS + email), verification
│
├── scripts/
│   └── alter_tracking.mjs        # DB migration / alter script for tracking table
│
├── data/                         # (Legacy) local SQLite DB files (now replaced by Supabase)
├── docs/                         # Design-system reference and API notes
├── public/                       # Static assets
├── .env                          # Environment variables (not committed)
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies and npm scripts
```

---

## 5. Authentication Flow

1. **Register** → `POST /api/auth/register` → validates with Zod, hashes password with `bcryptjs`, inserts user into DB, sends OTP via SMS (Fast2SMS) and email (Nodemailer).
2. **OTP Verify** → `POST /api/auth/verify-otp` → checks OTP from DB, marks account verified.
3. **Login** → `POST /api/auth/login` → compares password hash, signs JWT with `jose`, sets `session` HTTP-only cookie.
4. **Session** → `lib/auth.ts` `getSession()` reads and verifies the JWT cookie on every protected route.
5. **Logout** → `POST /api/auth/logout` → clears the cookie.

Roles: `customer`, `partner`, `admin`. Role is stored in the JWT payload and enforced inside each Route Handler.

---

## 6. Database

- **Provider:** Supabase (PostgreSQL), connection pooler on AWS ap-southeast-2.
- **Driver:** `postgres` npm package (not Prisma, not Drizzle).
- **All queries** live in `lib/db.ts` as plain SQL template literals.
- **Key tables:** `users`, `pickups`, `materials`, `impact_entries`, `partner_applications`, `notifications`, `otp_tokens`, `pickup_tracking`.

---

## 7. Key API Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login, set session cookie |
| POST | `/api/auth/logout` | Any | Clear session cookie |
| GET | `/api/user` | Customer | Get current user profile |
| GET | `/api/pickups` | Customer | List own pickups |
| POST | `/api/pickups` | Customer | Schedule new pickup |
| GET | `/api/pickups/[id]/ebill` | Customer | Get e-bill data for a pickup |
| GET | `/api/pickups/[id]/track` | Public | Track a pickup by ID |
| GET | `/api/materials` | Public | List scrap material rates |
| POST | `/api/estimate` | Public | Calculate estimated scrap value |
| GET | `/api/notifications` | Customer | List user notifications |
| PATCH | `/api/notifications` | Customer | Mark notifications as read |
| GET | `/api/admin/pickups` | Admin | List all pickups |
| PATCH | `/api/admin/pickups` | Admin | Update pickup status |
| GET | `/api/admin/partners` | Admin | List partner applications |
| PATCH | `/api/admin/partners` | Admin | Approve/reject partner |
| POST | `/api/partner/apply` | Public | Submit partner application |

---

## 8. npm Scripts

```bash
npm run dev     # Start Next.js dev server (http://localhost:3000)
npm run build   # Production build
npm start       # Start production server
npm run lint    # TypeScript type-check (tsc --noEmit)
npm run seed    # Run scripts/seed.mjs (demo data reset)
```

---

## 9. Design System

- All styles are in `app/globals.css` (~20 KB).
- Uses **CSS custom properties** for theming (dark/light mode via `[data-theme]`).
- **Glassmorphism** aesthetic: frosted-glass cards, gradient backgrounds, soft shadows.
- Responsive across mobile, tablet, and desktop.
- No Tailwind — pure vanilla CSS utility classes.

---

## 10. Notes for AI Assistants

- **Do not suggest SQLite** — the DB is PostgreSQL on Supabase.
- **Do not suggest Prisma or Drizzle** — all queries use the `postgres` driver with raw SQL in `lib/db.ts`.
- **Do not add Tailwind** — styling is vanilla CSS in `globals.css`.
- When adding a new API route, follow the existing pattern in `app/api/` — export named async functions (`GET`, `POST`, `PATCH`), use `getSession()` from `lib/auth.ts` for auth, and validate with Zod schemas from `lib/validators.ts`.
- When adding a new component, place it in the appropriate subfolder under `components/` and use existing CSS class names from `globals.css`.
- The `lib/db.ts` file is the single source of truth for all database access — add new query functions there.
- OTP logic (send + verify) is fully encapsulated in `lib/otp.ts`.
