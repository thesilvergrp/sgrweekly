# Silver Group Rentals

Marketing and direct-booking site for Silver Group Rentals — whole-home stays across metro Atlanta.
Vite + React + TypeScript, styled with CSS Modules on top of a token-driven design system.

The frontend was rebuilt from scratch against the existing backend contract. The backend
(`lambda/`, `server/`) and the AWS setup are unchanged.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

No environment variables are needed to run the SPA. To exercise live OwnerRez data locally, create a
git-ignored `.env.local` with the two **server-side** credentials, which are deliberately un-prefixed
so Vite cannot leak them into the client bundle:

```
OWNERREZ_USERNAME=you@example.com
OWNERREZ_PAT=…
```

Without them, `/api/*` answers with the proxy's real error envelope and the site falls back to the
repo-managed catalog — a useful way to see the offline and error states.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server + the OwnerRez `/api/*` middleware |
| `npm run build` | Production build to `dist/` (what Amplify Hosting serves) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint |
| `npm run content:export` | Emit the page-copy document as JSON (`content:export stays` for property text) |

## Architecture

```
UI component  →  feature hook  →  service layer  →  fetch('/api/…')  →  Lambda  →  OwnerRez
```

```
src/
  app/         application shell + the ?property= route
  components/  ui/ primitives · layout/ · calendar/ · icons/ · brand/
  features/    catalog · stay · booking · search · map · home · contact
  hooks/       async, focus trap, scroll lock, media query, section spy, in-view
  services/    HTTP transport and one module per backend capability
  lib/         pure logic — dates, availability, pricing, stay rules, formatting, URLs
  content/     the editable content document, stay content, policies
  types/       OwnerRez wire types · application domain types
  styles/      design tokens + base layer
```

Components never see an OwnerRez payload: the wire types stop at `services/stay-mapper.ts`.

## Documentation

| Document | Contents |
|---|---|
| [docs/api-inventory.md](docs/api-inventory.md) | Every endpoint, schema, env var, AWS resource, URL contract, and what must not change |
| [docs/functionality-matrix.md](docs/functionality-matrix.md) | Old feature → backend dependency → new implementation |
| [docs/design-system.md](docs/design-system.md) | Tokens, type scale, spacing, components, responsive and a11y rules |
| [docs/content-architecture.md](docs/content-architecture.md) | How page copy becomes editable without a code change, and the AWS changes that would need approving |
| [docs/verification.md](docs/verification.md) | What was tested, the results, and the known gaps |
| [DEPLOY.md](DEPLOY.md) | Original AWS deployment runbook — unchanged |

## Backend contract in one paragraph

The SPA talks only to same-origin `/api/*`. In production, an Amplify Hosting **200 rewrite** sends
`/api/<*>` to a Lambda Function URL that holds the OwnerRez credentials (AWS Secrets Manager) and
proxies `api.ownerrez.com`. In development, `server/dev-middleware.ts` serves the same routes. The
browser never holds a credential, and there is no Cognito, AppSync, API Gateway or DynamoDB in the
system for the public site. Booking payment is handed off to the OwnerRez widget; the parameter
names and the `postMessage` → top-window redirect are load-bearing and preserved verbatim. The
optional admin editor adds the only authenticated surface: Cognito sign-in, verified server-side in
the Lambda on every write.

## Content

Page copy, business details and the featured-home list live in
[`src/content/site-content.ts`](src/content/site-content.ts); per-stay editorial text lives in
[`src/content/stays-document.ts`](src/content/stays-document.ts). Both ship as bundled defaults, and
at runtime the app merges remote documents (`GET /api/content`, `GET /api/content/stays`) over them,
falling back silently when a route is absent or a document is malformed.

Editing happens at **`?admin`** — a lazily loaded editor behind Cognito sign-in that publishes to S3
through the Lambda. The code is written and tested; the AWS setup is not done. See
[docs/content-architecture.md](docs/content-architecture.md) for the runbook.

Locally, the dev server mirrors the content routes against a git-ignored `./.content` directory and
the editor runs without sign-in, so the whole flow works with no AWS account.

Because this OwnerRez account lacks the *WordPress Plugin + Integrated Websites* add-on, `/v2/listings`
is unavailable, so descriptions, galleries and amenity lists live in
[`src/content/stay-content.ts`](src/content/stay-content.ts), keyed by OwnerRez property id and merged
over the live record. Adding a property means adding an entry there with the same id.

## `legacy-frontend/`

The previous presentation layer, kept for reference only. It is excluded from the TypeScript project
and from ESLint, and nothing in `src/` imports it. Delete it once the rebuild is signed off.
