# Beata-shop

Source code for the Beata-shop storefront and administration tools.

## Stack

- Next.js 16 and React 19
- TypeScript and Tailwind CSS 4
- Supabase/PostgreSQL
- Stripe payments
- Netlify deployment

## Local development

Use Node.js 22.13.0 or newer.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set the environment variables for your own environment. Keep credentials out of Git.
3. Run `npm run dev` and open http://localhost:3000.

## Checks and production build

`npm run lint` runs the linter.

`npm run build` builds the website and checks the admin build.

## Deployment

See [the Netlify deployment guide](docs/netlify-deployment.md) and [Stripe setup](STRIPE_SETUP.md). Configure environment variables in the deployment environment.

Local inventory snapshots, generated reports, verification screenshots, dependencies and build output are excluded from this repository. Production data and secrets remain in their configured services.
