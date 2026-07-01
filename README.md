# Lease Beaver

Lease Beaver is a rent and lease helper we built for UIUC students living around Champaign-Urbana. We kept running into the same problem: leases are long, rent prices are hard to judge, and unfair charges can be really hard to push back on when you do not know what is normal.

The app gives renters a better starting point. You can check a lease for suspicious or unfair clauses, compare your rent against nearby listings, and get help thinking through disputes before paying a charge or accepting a landlord's explanation at face value.

## Features

- **Lease Checker**: Paste or upload a lease and get plain-English notes on suspicious clauses, unfair terms, confusing language, hidden fees, and things worth asking about before signing.
- **Rent Fairness Check**: Enter your rent, bedroom count, and location to see how your price stacks up against nearby Champaign-Urbana listings.
- **Dispute Assistant**: Talk through problems like unfair charges, deposit deductions, repairs, landlord entry, fees, and lease terms so students have a clearer way to push back during disputes.
- **Student accounts**: Sign in, come back later, and keep your lease checks tied to your own dashboard.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase for auth and saved lease analysis
- Anthropic Claude API for lease analysis and dispute chat
- Papa Parse for working with the local Champaign-Urbana rental dataset
- RAG for lease/legal context retrieval and grounding the assistant in more relevant housing information

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

Apply the Supabase migration in `supabase/migrations/`, then run the app:

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

Rent comparisons come from `uiuc_rentals_clean.csv`, a cleaned local dataset of Champaign-Urbana listings. The matching logic lives in `src/lib/compareListings.ts`, and the rent fairness form/map live in `src/app/compare/CompareForm.tsx`.

## Notes

The Beaver logo lives at `public/beaver.png` and is used across the landing page, dashboard, lease checker, and rent fairness page.
