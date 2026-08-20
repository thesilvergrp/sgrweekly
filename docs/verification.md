# Phase 6 — Verification

Everything below was run against this repository on the date of the rebuild.
No AWS resource was created, modified, deleted or deployed at any point.

## 1. Build, types, lint

| Check | Command | Result |
|---|---|---|
| TypeScript (strict, `noUnusedLocals`, `noUnusedParameters`) | `npm run typecheck` | **Pass**, 0 errors |
| ESLint | `npm run lint` | **Pass**, 0 errors, 0 warnings |
| Production build | `npm run build` | **Pass** — `dist/index.html` 1.76 kB, CSS 63.2 kB (16.1 kB gzip), JS 432.9 kB (137.3 kB gzip) |

The build still emits to `dist/` with the same `npm ci` → `npm run build` sequence, so `amplify.yml`
needed no change.

## 2. Business-logic checks

Availability, weekly-stay and pricing rules were bundled with esbuild and executed in Node.
17/17 assertions pass:

* **Availability** — cancelled bookings ignored (`Cancelled` and `Canceled`); zero-length records
  dropped; arrival and mid-stay nights closed; **departure day stays open** (turnover); owner blocks
  distinguished from guest reservations; a range ending on a booked arrival day is not a conflict;
  an overlapping range is.
* **Weekly stay rule** — arrivals that cannot fit seven nights are rejected; departure is always
  arrival + 7 × weeks; a stay starting on a turnover day is allowed.
* **Pricing** — non-positive amounts are not treated as rates; a quote sums only nights the feed
  actually priced and reports `complete: false` when nights are missing (it never extrapolates).

## 3. Preserved-integration checks

20/20 assertions pass against `services/ownerrez-widget.ts` and `services/enquiry.service.ts`:

* Widget URL is `https://app.ownerrez.com/widgets/a607f72c561749baa59066d916909564?…` — id unchanged.
* Params emitted: `or_propertyId` (the numeric property id, **not** `propertyKey`), `or_arrival`,
  `or_departure`, `or_guests`, `or_adults`, and `or_pets` only when greater than zero.
* `postMessage` handling parses both object and JSON-string payloads, ignores anything without a
  URL, and rejects non-`https:` URLs. The `event.origin === 'https://app.ownerrez.com'` check is in
  the dialog and is not optional.
* Inquiry body matches the backend contract exactly, including the `"Jane Anne Smith"` →
  `first_name: "Jane"`, `last_name: "Anne Smith"` split, and the client-side mirror of the server's
  required-field rule.

## 4. Live proxy checks (Vite dev server)

Run with **no** OwnerRez credentials present, which exercises the failure paths:

| Request | Response | Reading |
|---|---|---|
| `GET /api/health` | `200 {"ok":true,"hasCredentials":false}` | Proxy reachable, credentials absent — exactly what the catalog error state uses to tell the visitor it is not their problem |
| `GET /api/properties` | `500 {"error":"OwnerRez credentials missing…"}` | Upstream error envelope preserved; the SPA falls back to the repo catalog and shows a warning notice |
| `POST /api/inquiries` with `{}` | `400 {"error":"property_id, arrival, departure, guest.first_name and guest.email_address are required"}` | Backend validation intact and unchanged |
| `GET /?property=the-silver-cottage` | `200` | Deep-link route serves the SPA |

Live-data rendering (real OwnerRez responses) could not be exercised here because the credentials
live in AWS Secrets Manager / a git-ignored `.env.local`, and reading or changing them was out of
scope. The response contract is unchanged, so this is the same code path the previous frontend used;
it is called out as untested-against-live rather than claimed as verified.

## 5. Render checks

Both routes were server-rendered in Node with the whole component tree, catching any render-time
throw or invalid prop:

| Route | Result |
|---|---|
| `/` | Renders header, hero, finder, catalog grid, amenities, about and contact. 32.6 kB of markup, **no React warnings** |
| `/?property=the-silver-cottage` | Renders the stay detail view (gallery, story, amenities, location, "Before you book"), and correctly does **not** render the home sections. 29.5 kB of markup, **no React warnings** |

## 6. Bundle audit

| Check | Result |
|---|---|
| API paths in the shipped JS | `/api/health`, `/api/properties`, `/api/inquiries` (plus the `bookings` / `pricing` sub-paths built from template literals) — all same-origin, all within the existing Amplify rewrite |
| OwnerRez widget id present | Yes, once |
| `or_*` params present | `or_propertyId`, `or_arrival`, `or_departure`, `or_guests`, `or_adults`, `or_pets` |
| Occurrences of `OWNERREZ_PAT` / `OWNERREZ_USERNAME` in the bundle | **0** — credentials remain server-side only |
| Auth headers, cookies or tokens sent by the SPA | None. `services/http.ts` sends `Content-Type` on POST and nothing else |

## 7. Backend and infrastructure untouched

`server/ownerrez-client.ts` and `amplify.yml` still carry their original modification timestamps.

`lambda/handler.mjs` and `server/dev-middleware.ts` **were** subsequently edited to add the content
routes (§9). Those are repo files: Amplify builds only the frontend, so nothing was deployed by
editing them, and the Lambda change reaches AWS only when it is pasted into the console. The
existing routes in both files are byte-identical in behaviour, which §9 verifies.

Still true throughout: no `amplify push`, no CloudFormation operation, no AWS resource created,
modified or deleted, no Cognito or IAM change, no S3 bucket, no Secrets Manager change, no
credential rotation, no deployment. The one behavioural change to an existing line is the Lambda's
CORS header, which now also permits `PUT` and `Authorization`; it applies only to direct Function
URL calls, since production traffic is same-origin through the Amplify rewrite.

## 8. Accessibility spot-checks

* Skip link is the first focusable element and reveals on focus.
* Landmarks: one `<header>`, one `<main id="main">`, one `<footer>`; one `<h1>` per view.
* Dialogs (`Modal`, gallery viewer, nav drawer) set `role="dialog"` + `aria-modal`, trap Tab, restore
  focus on close, close on Escape, and lock background scroll with a reference count so nested
  overlays cannot unlock early.
* The stay finder is a proper combobox: `aria-expanded`, `aria-controls`, `aria-activedescendant`,
  `role="listbox"`/`role="option"`, arrow-key navigation, Enter to open, Escape to dismiss.
* Calendar days are real buttons carrying a full label — e.g. *"Sat, Sep 5 — available, $210 a
  night"*, *"Tue, Mar 10 — booked"* — so availability is never colour-only.
* Steppers announce their value through a polite live region.
* The map is mirrored by a keyboard-reachable list of the same places.
* Every animation, smooth scroll and shimmer is disabled under `prefers-reduced-motion: reduce`.

## 9. Editable content and the admin editor

Added after the rebuild; see [content-architecture.md](content-architecture.md) for the design.

| Suite | Checks | Result |
|---|---|---|
| Content parser + stay overlay | 24 | **Pass** |
| Lambda content routes, Cognito verification, S3 behaviour | 27 | **Pass** |
| Local end-to-end round trip (dev server) | publish → read back → junk rejected | **Pass** |

The Lambda suite generates a **real RSA keypair**, mints RS256 tokens with it and serves them through
a stubbed JWKS endpoint, so signature verification is genuinely exercised. Rejected: tampered
signatures, unknown key ids, expired tokens, wrong audience, wrong issuer, access tokens used as id
tokens, callers outside the admin group, and unauthenticated writes. Confirmed unchanged in the same
run: `/api/health`, `/api/properties`, unknown-route 404s and the `/api/inquiries` validation.

Bundle audit after the change:

| Check | Result |
|---|---|
| Admin UI in the main chunk | **No** — separate 18 kB chunk, fetched only for `?admin` |
| Dev-only sign-in bypass in the production bundle | **No occurrences** — folded out by the bundler. Verified by grep, after a first attempt where it *did* survive because the flag was read through a helper instead of `import.meta.env.DEV` directly |
| Secrets or client secrets in the bundle | **0** — the Cognito app client is a public client with no secret |
| Content routes shipped | `/api/content`, `/api/content/stays`, same-origin |

Not automated: a browser rendering remote content end to end, since there is no browser here. The
parser, the service and the local HTTP round trip are each covered; what sits between them is a
context provider passing a value through.

## 10. Known gaps, stated plainly

1. **Live OwnerRez data was never rendered locally** — no credentials available (see §4).
2. **`POST /api/inquiries` has never been confirmed against live OwnerRez.** `DEPLOY.md` says the
   payload shape may need adjusting after the first real POST. It is implemented exactly as the
   existing backend defines it, wired as a secondary action, and its failure path is handled — but it
   is unproven end to end.
3. **`/api/properties/{id}/pricing` may 4xx on this OwnerRez account** (it proxies the v1 listings
   API, gated behind a premium feature). The UI treats rates as optional and hides all rate surfaces
   when the endpoint does not answer, so this degrades cleanly either way.
4. **The general contact form has no backend.** It composes a `mailto:` rather than pretending to
   send. Wiring it to SES or OwnerRez messaging is a backend task and was not in scope.
5. **No automated test runner is configured.** The checks throughout were executed as one-off
   esbuild bundles; adding Vitest would be the natural next step and would give all ~90 assertions a
   permanent home.
6. **The content store and Cognito do not exist yet.** All of §9 was verified against stubs and the
   dev server. Nothing has been created in AWS — the runbook in content-architecture.md §5 is yours
   to run, and the code is inert until you do: `?admin` reports "not configured", and the content
   routes answer 404 while the site serves its bundled copy.
