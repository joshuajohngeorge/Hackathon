# Lease Beaver

Lease Beaver is a student rent and lease helper built for UIUC renters in Champaign-Urbana. The idea is simple: leases are confusing, rent prices are hard to sanity-check, and most students do not have time to read legal language line by line.

This app gives renters a friendlier place to start. It can flag suspicious lease language, compare rent against nearby listings, and help students think through common landlord or housing disputes.

## Features

- **Lease Checker**: Upload or paste lease text and get plain-English flags for risky clauses, confusing terms, hidden fees, and questions worth asking before signing.
- **Rent Fairness Check**: Enter rent, bedroom count, and a Champaign-Urbana location to see how the price compares with nearby listings.
- **Dispute Assistant**: Chat through housing issues like fees, deposits, landlord entry, repairs, and lease terms.
- **Student accounts**: Supabase auth keeps each user’s dashboard and lease history tied to their account.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase
- Anthropic Claude API
- Papa Parse for the local C-U rental listing dataset
- RAG for lease/legal context retrieval.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Apply the Supabase migration in `supabase/migrations/`, then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Key Routes

- `/` - public landing page
- `/signup` and `/login` - authentication
- `/dashboard` - signed-in product hub
- `/analyze` - lease upload and analysis
- `/compare` - rent fairness checker
- `/rent-check` - redirects to the rent fairness checker
- `/dispute-assistant` - lease dispute chat

## Rental Data

Rent comparisons use `uiuc_rentals_clean.csv` as the local listing source. The matching logic lives in `src/lib/compareListings.ts`, and the rent fairness form/map live in `src/app/compare/CompareForm.tsx`.

## Notes

The app uses `public/beaver.png` as the main Lease Beaver logo across the landing page, dashboard, lease checker, and rent fairness page
