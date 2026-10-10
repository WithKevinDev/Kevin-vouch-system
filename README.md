# Kevin Vouch System

A red/black customer-vouch demo designed for GitHub + Cloudflare Pages.

## Included
- Responsive red/black UI with animated glow and particles
- Public vouch wall, search/filter, reactions
- Customer submission form with basic client-side validation
- Demo vouches are clearly marked as demo content
- Admin page UI for adding/removing vouches and bulk **demo** entries
- Cloudflare Pages Functions API examples with rate limiting hooks and server-side validation

## Important security/deployment notes
This is a starter project. Do **not** treat client-side checks as security. Before accepting public submissions in production:
1. Set up a Cloudflare D1 database and apply `schema.sql`.
2. Configure Cloudflare Turnstile and set `TURNSTILE_SECRET` as a Pages secret.
3. Set `ADMIN_TOKEN` as a Pages secret. Never put it in browser code or commit it.
4. Configure a real authentication provider or Cloudflare Access for `/admin.html`. The starter admin token check is a minimal example, not a full user-management system.
5. Review moderation rules and privacy obligations for your audience.
6. Do not publish fabricated testimonials as genuine purchases. Bulk tool labels generated items as demo content.

## Deploy with GitHub + Cloudflare Pages
1. Create a GitHub repository and upload all files in this folder.
2. In Cloudflare Dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Select your repository.
4. Framework preset: **None**. Build command: leave blank. Build output directory: `/`.
5. Add the D1 database binding named `DB` and the environment variables/secrets described above.
6. Deploy.

Cloudflare Pages Functions in `/functions/api/` are deployed automatically.

## API routes
- `GET /api/vouches` — fetch vouches from D1
- `POST /api/vouches` — submit a customer vouch
- `POST /api/react` — react to a vouch
- `POST /api/admin/vouches` — admin-only create or bulk-create demo vouches

The front end falls back to local demo content if the API/database is not configured.

## Admin access
Open `/admin.html`. Enter the same `ADMIN_TOKEN` value configured as a Cloudflare Pages secret. For stronger protection, use Cloudflare Access and an identity provider. Do not share the token.
