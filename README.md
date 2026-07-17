# EcoSync Enterprise Scrap Network

A complete Next.js full-stack application created from the supplied Stitch UI screens. It combines the landing estimator, environmental impact dashboard, service marketplace, and partner onboarding designs into one working business flow.

## Included flows

- Public landing page with live scrap valuation and environmental estimates
- Customer registration, login, secure HTTP-only session cookies, and logout
- Customer dashboard with pickup history, recovered value, notifications, and impact totals
- Pickup scheduling with material rates, address, preferred date, and status tracking
- Environmental impact dashboard with recycling, CO₂, milestone, leaderboard, and trajectory views
- Searchable/filterable services and rates marketplace
- Three-step partner onboarding and verification flow
- Admin operations dashboard
- Admin pickup lifecycle management: pending → scheduled → collected → completed/cancelled
- Automatic impact entry generation when a pickup is completed
- Admin partner approval/rejection and automatic user role promotion
- SQLite persistence, automatic schema initialization, validation, password hashing, and seeded demo data

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Next.js Route Handlers for backend APIs
- Node.js built-in SQLite (`node:sqlite`)
- JWT sessions with `jose`
- Password hashing with `bcryptjs`
- Request validation with `zod`
- Lucide icons
- Custom responsive glassmorphism design system based on the supplied Stitch files

## Requirements

- Node.js 22.5 or newer because the project uses `node:sqlite`
- npm 10 or newer

## Start locally

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

Open `http://localhost:3000`.

The ZIP already contains a seeded `data/ecosync.db`, so `npm run seed` is only needed when you want to reset demo data.

## Production

```bash
npm run build
npm start
```

Set a strong `AUTH_SECRET` in production:

```env
AUTH_SECRET=your-long-random-production-secret
DATABASE_PATH=./data/ecosync.db
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

For serverless hosting, replace local SQLite with PostgreSQL/Supabase because serverless filesystems may be ephemeral. The database access is isolated in `lib/db.ts`, making that migration straightforward.

## Demo accounts

All demo accounts use password `EcoSync@123`.

| Role             | Email                    |
| ---------------- | ------------------------ |
| Admin            | `admin@ecosync.local`    |
| Customer         | `customer@ecosync.local` |
| Approved partner | `partner@ecosync.local`  |

## Main routes

| Route                       | Purpose                                   |
| --------------------------- | ----------------------------------------- |
| `/`                         | Landing page and estimator                |
| `/login`                    | Login                                     |
| `/register`                 | Customer registration                     |
| `/dashboard`                | Authenticated customer/partner dashboard  |
| `/dashboard/request-pickup` | Create pickup request                     |
| `/impact`                   | Environmental impact dashboard            |
| `/market`                   | Services and rates directory              |
| `/partners/apply`           | Partner onboarding wizard                 |
| `/admin`                    | Admin operations and compliance dashboard |

## Project structure

```text
app/                 Next.js pages and backend route handlers
components/          Shared UI, forms, estimator, and admin actions
lib/                 Authentication, database, validation, types, formatting
scripts/seed.mjs     Database reset and demo seed script
data/ecosync.db      Local SQLite database
docs/                Supplied design-system reference and API notes
```

## Validation performed

- `npm run lint` passes
- `npm run build` passes
- Production server responds successfully
- Registration/login flow tested
- Authenticated pickup creation tested
- Partner application tested
- Admin page access tested
- Partner approval API tested
- `npm audit --omit=dev` reports zero vulnerabilities
