# API & AWS Integration Inventory

Compiled during Phase 1 (discovery) by reading `lambda/handler.mjs`, `server/dev-middleware.ts`,
`server/ownerrez-client.ts`, `src/lib/api.ts`, `vite.config.ts`, `amplify.yml`, and `DEPLOY.md`.

**Nothing in this inventory was modified.** No AWS resource was created, changed, or deleted.

---

## 1. Runtime topology (unchanged)

```
Browser (SPA, Amplify Hosting from dist/)
  │
  │  same-origin fetch to /api/*
  ▼
Amplify Hosting rewrite rule:  /api/<*>  →  https://<fn-id>.lambda-url.<region>.on.aws/api/<*>   (200 rewrite)
  ▼
Lambda Function URL  (payload format v2.0, auth type NONE, permissive CORS)
  └─ AWS Secrets Manager: secret `silver-group/ownerrez` → { OWNERREZ_USERNAME, OWNERREZ_PAT }
  ▼
OwnerRez REST API   https://api.ownerrez.com/v2  (+ /v1 for pricing)   HTTP Basic auth
```

Local development substitutes a Vite middleware (`server/dev-middleware.ts`) for the Lambda at the
same `/api/*` paths, so the frontend contract is identical in both environments.

Two integrations bypass the proxy and are called by the browser directly:

* **OwnerRez booking widget** — `https://app.ownerrez.com/widgets/<widgetId>` in an `<iframe>`.
* **OwnerRez image CDN** — `https://uc.orez.io/i/<guid>-<Size>` for photography.
* **OpenStreetMap tiles** — `https://{s}.tile.openstreetmap.org/...` for the location map.
* **Amazon S3** — brand asset, see §4.

---

## 2. HTTP endpoint inventory

All paths are same-origin `/api/*` from the browser. Auth column = *what the browser must send*.

| # | Endpoint | Method | Browser auth | Request | Response | Consumed by (old → new) | Env vars | AWS service | Must stay unchanged |
|---|----------|--------|--------------|---------|----------|-------------------------|----------|-------------|---------------------|
| 1 | `/api/health` | GET | None (public) | — | `{ ok: true, hasCredentials: boolean }` | *(unused)* → `services/health.service.ts`, used to classify catalog errors | server-side `OWNERREZ_USERNAME`, `OWNERREZ_PAT` | Lambda (+ Secrets Manager) | **Yes** |
| 2 | `/api/properties` | GET | None (public) | — | `OwnerRezListResponse<OwnerRezProperty>` — `{ count, items[], limit, offset, next_page_url? }` | `src/lib/api.ts#fetchProperties` (App) → `services/properties.service.ts` | same | Lambda → OwnerRez `/v2/properties?active=true` | **Yes** |
| 3 | `/api/properties/{id}` | GET | None (public) | path `id` = OwnerRez property id | single `OwnerRezProperty` | *(unused)* → available in `services/properties.service.ts` | same | Lambda → OwnerRez `/v2/properties/{id}` | **Yes** |
| 4 | `/api/properties/{id}/bookings` | GET | None (public) | query `since` (ISO-8601, required in practice; server defaults to *now*), `offset?`, `limit?` | `OwnerRezListResponse<OwnerRezBooking>` where booking = `{ id, property_id, arrival, departure, is_block, status? }` | `src/lib/api.ts#fetchAllBookings` (PropertyDetail) → `services/bookings.service.ts` | same | Lambda → OwnerRez `/v2/bookings` | **Yes** |
| 5 | `/api/properties/{id}/quotes` | GET | None (public) | path `id` | `OwnerRezListResponse<Quote>` | *(unused, both old and new)* | same | Lambda → OwnerRez `/v2/quotes` | **Yes** (left untouched) |
| 6 | `/api/properties/{id}/pricing` | GET | None (public) | query `start`, `end` — **both required**, `400` otherwise | `PricingDay[]` — `{ date, amount, minNights, isArrivalDisallowed, isDepartureDisallowed, isStayDisallowed }[]` | `src/lib/api.ts#fetchPricing` (defined but never called) → `services/pricing.service.ts`, now rendered | same | Lambda → OwnerRez **v1** `/v1/listings/{id}/pricing?includePricingRules=true` | **Yes** |
| 7 | `/api/inquiries` | POST | None (public) | JSON body, see §3.3. Server rejects with `400` unless `property_id`, `arrival`, `departure`, `guest.first_name`, `guest.email_address` are all present | OwnerRez inquiry record (pass-through) | `src/lib/api.ts#submitInquiry` (defined but never called) → `services/enquiry.service.ts` | same | Lambda → OwnerRez `/v2/inquiries` | **Yes** |
| 8 | `/api/listings`, `/api/listings/{id}` | GET | None (public) | — | OwnerRez listing payloads | *(dev middleware only — **not** implemented in `lambda/handler.mjs`)* | same | — | **Yes** — do not call from the SPA; it 404s in production |
| 9 | `/api/properties/{id}/reviews` | GET | None (public) | — | `OwnerRezListResponse<Review>` | *(dev middleware only — **not** in the Lambda)* | same | — | **Yes** — not called by the SPA |
| 10 | `/api/debug` | GET | None | — | credential fingerprints (never the PAT) | *(dev middleware only)* | same | — | Dev-only diagnostic; not called by the SPA |

Notes carried forward:

* Endpoints 8, 9, 10 exist **only** in the Vite dev middleware. The deployed Lambda returns
  `404 {"error":"No route for GET /api/listings"}`. The new frontend therefore never calls them —
  same restriction the old frontend observed.
* OwnerRez `/v2/listings` and `/v2/reviews` additionally require the *WordPress Plugin + Integrated
  Websites* premium add-on, which this OwnerRez account does not have. This is why marketing content
  (descriptions, galleries, amenities) is repo-managed rather than API-sourced (§5).
* Endpoint 6 (`/pricing`) hits the **v1** API and may return a non-2xx on accounts without the
  premium feature. The new frontend treats pricing as strictly optional and degrades silently.

### 2.1 Error envelope (all endpoints)

Non-2xx responses from both the Lambda and the dev middleware share one shape:

```json
{ "error": "<upstream OwnerRez body or message>" }
```

with the **upstream OwnerRez status code preserved** (`ProxyError.status`), except unexpected
failures which become `500`. `401`/`403` therefore mean *the proxy's OwnerRez credentials* are bad —
never the site visitor. The new frontend maps these to visitor-safe messages and preserves the raw
status for diagnostics.

### 2.2 Response headers set by the Lambda

`Content-Type: application/json`, `Access-Control-Allow-Origin: *`,
`Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`.
Because production traffic goes through the Amplify same-origin rewrite, CORS is not exercised by
the SPA. **Unchanged.**

---

## 3. Request / response schemas the frontend depends on

### 3.1 `OwnerRezProperty` (endpoint 2, 3)

Consumed fields — everything else is ignored:

| Field | Type | Frontend use |
|---|---|---|
| `id` | number | **Join key.** Stringified; joins to repo content, to `?property=` deep links, to the widget's `or_propertyId`. |
| `name` | string | Internal name; fallback display name. |
| `external_name` | string? | Preferred public display name. |
| `active` | boolean | **Filter:** only `true` is shown. |
| `is_snoozed` | boolean | **Filter:** `true` is hidden. |
| `property_type` | string? | Displayed / used in generated summary. |
| `address` | `{ street1, street2?, city, state, country, postal_code }` | Location line + full address. `Georgia` → `GA` abbreviation. |
| `bedrooms`, `bathrooms`, `max_guests` | number | Facts row, guest stepper ceiling. |
| `max_pets` | number | Informational. |
| `living_area` | number? | Square footage (nullable). |
| `latitude`, `longitude` | number | Map markers. |
| `display_order` | number? | **Sort key** (ascending, default 999). |
| `thumbnail_url_large` / `thumbnail_url` / `thumbnail_url_medium` | string? | Cover photo, preferred in that order. |

### 3.2 `OwnerRezBooking` (endpoint 4)

`{ id, property_id, arrival: 'YYYY-MM-DD', departure: 'YYYY-MM-DD', is_block: boolean, status?: string }`

Availability rules (**business logic preserved verbatim**):

1. Items whose `status` starts with `cancel` (matches both *canceled* and *cancelled*) are ignored.
2. Each remaining item blocks the **half-open** interval `[arrival, departure)` — the departure day
   is a turnover day and remains bookable as someone else's arrival.
3. `is_block: true` (owner block) and `is_block: false` (guest reservation) both block nights; when
   both cover a day, the reservation is the stronger signal for display purposes.
4. `since_utc` filters by **last-modified time, not stay dates** — hence the deliberate 2-year
   look-back window. Preserved.
5. Pagination: follow `next_page_url` / `offset + items.length < count`; bail out if the server
   echoes an offset different from the one requested (the Lambda currently ignores `offset`/`limit`
   and returns a single page). De-duplicate by `id`. Preserved.

### 3.3 `POST /api/inquiries` body

```jsonc
{
  "property_id": 478121,          // number, required — OwnerRez property id
  "arrival":     "2026-09-05",    // YYYY-MM-DD, required
  "departure":   "2026-09-12",    // YYYY-MM-DD, required
  "adults":      4,               // number
  "children":    0,               // number, optional
  "pets":        0,               // number, optional
  "guest": {
    "first_name":    "Jane",      // required
    "last_name":     "Smith",
    "email_address": "jane@example.com",  // required
    "phone":         "+1 404 555 0143"    // optional
  },
  "notes": "free text"            // optional
}
```

Server-side validation (mirrored client-side so the visitor sees the error before the round trip):
`property_id && arrival && departure && guest.first_name && guest.email_address`.
A single display name is split on whitespace: first token → `first_name`, remainder → `last_name`.

> ⚠️ Per `DEPLOY.md`, this payload shape has never been confirmed against a live OwnerRez POST.
> It is implemented exactly as the existing client defines it and is **not** the primary booking
> path — the widget handoff (§4.4) is.

### 3.4 `PricingDay[]` (endpoint 6)

`{ date: 'YYYY-MM-DD', amount: number, minNights: number, isArrivalDisallowed, isDepartureDisallowed, isStayDisallowed }`
`amount` is the nightly rate as a plain number in the listing's currency. A stay total is the sum of
each night's `amount`; nights missing from the feed fall back to the surrounding average.

---

## 4. AWS & third-party service inventory

| Service | Resource | Relationship to the frontend | Config owner | Changed? |
|---|---|---|---|---|
| **Amplify Hosting** | App serving `dist/` per `amplify.yml` (`npm ci` → `npm run build`, artifacts `dist/**/*`) | Serves the SPA. `amplify.yml` is unchanged — the new app builds with the same commands and output directory. | `amplify.yml` (repo) | **No** |
| **Amplify Hosting — rewrites** | `/api/<*>` → `https://<fn>.lambda-url.<region>.on.aws/api/<*>`, type **200 (Rewrite)** | The reason all data calls are same-origin `/api/*`. The new frontend keeps every call under `/api/`, so **no rewrite rule change is required**. | Amplify console | **No** |
| **Amplify Hosting — SPA fallback** | *Not configured* | Consequence: only `/` is guaranteed to serve `index.html`. **This is why the new app keeps `?property=<slug>` query-param routing on `/` instead of introducing `/stays/<slug>` path routing** — path routing would require adding a `/<*> → /index.html` 200 rewrite, an infrastructure change that is out of scope. | Amplify console | **No** |
| **AWS Lambda** | `silver-group-ownerrez-proxy`, Node 20.x/22.x, arm64, Function URL (auth `NONE`), payload v2.0 | The only backend the SPA talks to. `lambda/handler.mjs` is the repo source of truth and is **untouched**. | `lambda/handler.mjs` + console | **No** |
| **AWS Secrets Manager** | Secret `silver-group/ownerrez` → `{ OWNERREZ_USERNAME, OWNERREZ_PAT }`, read once per cold start | Supplies OwnerRez Basic-auth credentials. Never reaches the browser. | AWS console | **No** |
| **AWS IAM** | Lambda execution role with `secretsmanager:GetSecretValue` on that secret ARN | Required for the above. | AWS console | **No** |
| **Amazon CloudWatch Logs** | `/aws/lambda/silver-group-ownerrez-proxy` | Diagnostics only. | AWS | **No** |
| **Amazon S3** | Bucket `silvergroup-logo` (`us-east-2`), object `sgLogo.png`, public-read, served over HTTPS as a plain `<img>` (no CORS, no SDK, no credentials) | Brand artwork. The old `AboutSection` rendered it. The new UI ships its own vector brand mark, so the URL is retained in `src/config/assets.ts` and documented but not required for the page to render. Bucket policy untouched. | AWS console | **No** |
| **OwnerRez REST API** | `api.ownerrez.com/v2` + `/v1`, HTTP Basic | The system of record for properties, bookings and pricing. | OwnerRez account | **No** |
| **OwnerRez booking widget** | `app.ownerrez.com/widgets/a607f72c561749baa59066d916909564` | Payment/checkout handoff, see §4.4. Widget id preserved verbatim. | OwnerRez account | **No** |
| **OwnerRez image CDN** | `uc.orez.io` | Property photography referenced by URL. | OwnerRez account | **No** |
| **OpenStreetMap tiles** | `{s}.tile.openstreetmap.org` via Leaflet | Location map raster tiles + required attribution. | Public service | **No** |
| **Google Fonts** | `fonts.googleapis.com` / `fonts.gstatic.com` | Webfonts. The new design selects **different families**, but the delivery mechanism is unchanged. | — | n/a |

### 4.1 Cognito

**Not used.** There is no Cognito user pool, identity pool, hosted UI, sign-in/sign-up flow,
authenticated route, JWT, or session anywhere in the repository. The site is 100% anonymous; guest
identity is only ever collected inside the OwnerRez widget/checkout, which OwnerRez owns.

### 4.2 AppSync / GraphQL

**Not used.** No `.graphql`/`.gql` documents, no AppSync endpoint, no `aws-amplify` dependency, no
`amplify/` backend directory, no `aws-exports.js` / `amplifyconfiguration.json`. All data access is
plain `fetch` over REST.

### 4.3 API Gateway / DynamoDB

**Not used.** The Lambda is exposed through a **Function URL**, not API Gateway (explicitly stated in
`DEPLOY.md`). No DynamoDB table is read or written by any code path; OwnerRez is the datastore.

### 4.4 Amplify configuration

The word "Amplify" here means **Amplify Hosting only**: a CI build spec (`amplify.yml`) plus console
rewrite rules. There is no Amplify JS library, no `Amplify.configure()`, and therefore no Amplify
client configuration contract for the new frontend to preserve — only the build output location
(`dist/`) and the `/api/*` same-origin path prefix, both of which are preserved exactly.

### 4.5 Booking handoff contract (browser → OwnerRez widget) — **preserved verbatim**

The widget is embedded as a direct `<iframe>` (deliberately **not** via `widget.js`, which appends a
`referrer` param that OwnerRez rejects with `403` on unauthorised domains):

```
https://app.ownerrez.com/widgets/a607f72c561749baa59066d916909564
  ?or_propertyId=<OwnerRez property id>   ← the id, NOT propertyKey (a different GUID)
  &or_arrival=YYYY-MM-DD
  &or_departure=YYYY-MM-DD
  &or_guests=<n>
  &or_adults=<n>
  &or_pets=<n>                            ← only when > 0
```

On "Book Now"/"Send Inquiry" the iframe does **not** navigate itself: it `postMessage`s
`{ url: "<checkout url>" }` to the parent (a job normally done by `widget.js`) and expects the parent
to navigate the **top** window. The parent must therefore:

1. listen for `message` events,
2. **verify `event.origin === 'https://app.ownerrez.com'`**,
3. `JSON.parse` string payloads,
4. `window.location.href = data.url`.

Without step 4 the widget hangs on "Redirecting to checkout…". All four steps are reimplemented in
the new `ReservationHandoffDialog`.

### 4.6 Return-trip URL contract

OwnerRez returns the visitor to the site with transient `or_*` query parameters attached. Because the
app renders at `/`, those must be stripped from the address bar on load, before render, via
`history.replaceState`. Preserved.

---

## 5. Environment-variable contract

| Variable | Where it lives | Exposed to the browser? | Purpose | Changed? |
|---|---|---|---|---|
| `OWNERREZ_USERNAME` | Lambda env var **or** Secrets Manager `silver-group/ownerrez`; locally `.env` / `.env.local` (git-ignored) | **No** — deliberately un-prefixed so Vite's `VITE_` filter excludes it from the client bundle | OwnerRez Basic-auth user (login email) | **No** |
| `OWNERREZ_PAT` | same | **No** — same reason | OwnerRez Personal Access Token | **No** |
| *(none)* | Amplify Hosting build env | — | The SPA build requires **zero** environment variables; `DEPLOY.md` step 3.6 states this explicitly | **No** |

`vite.config.ts` lifts the two variables out of `loadEnv(mode, cwd, '')` into `process.env` for the
dev middleware only. **Preserved unchanged** — the new frontend adds no new required variables.

One *optional*, backwards-compatible addition: `VITE_API_BASE_URL`. It defaults to `''`, which
produces exactly the current same-origin `/api/...` URLs. It exists only so the SPA can be pointed at
a Lambda Function URL directly during local troubleshooting. Leaving it unset preserves today's
behaviour byte-for-byte, and it is unset in Amplify.

---

## 6. URL / routing contract

| URL | Meaning | Required | Handling |
|---|---|---|---|
| `/` | Home (hero, stays, amenities, about, contact) | Yes | Preserved |
| `/?property=<slug>` | Deep-link straight into a stay's detail view. Matches on `slug` **or** raw OwnerRez `id`. Emitted by the Share action. | **Yes — shared links in the wild** | Preserved and promoted to the canonical detail route (see below) |
| `/?or_*=...` | Transient params on return from the OwnerRez widget | Yes | Stripped on load via `replaceState` |
| `#properties`, `#amenities`, `#about`, `#contact` | In-page section anchors used by nav/footer | Yes | Preserved as section ids |

**Deliberate behavioural change (contract-compatible):** the old app consumed `?property=` once and
then deleted it from the address bar, so the detail view had no URL and the browser Back button
skipped it. The new app keeps `?property=<slug>` in the address bar while a stay is open and uses
`pushState`/`popstate`, so Back/Forward, refresh and copy-link all work. The accepted parameter, its
name, and its slug-or-id matching are unchanged, so every previously shared link still resolves — and
no Amplify rewrite rule change is needed, because the path stays `/`.

---

## 7. Repo-managed content layer (not an API)

`src/lib/properties.ts` (old) → `src/content/stay-content.ts` (new).

Because the OwnerRez account lacks the *WordPress Plugin + Integrated Websites* add-on, `/v2/listings`
is unavailable, so descriptions, photo galleries and amenity lists cannot be fetched. They live in the
repo, **keyed by OwnerRez property id**, and are merged over the live API record. This is a permanent
architectural split, not a stopgap:

* **OwnerRez owns:** address, geo, bedrooms/bathrooms/max guests, living area, display order, active
  and snoozed flags, cover thumbnail.
* **The repo owns:** long description, marketing summary, amenity list, photo gallery, bed count,
  square footage, cancellation policy, pet policy.

The merge is by `id`, never by name, so renaming `external_name` in OwnerRez cannot break the join.
When `/api/properties` is unreachable the repo catalog renders standalone as the offline fallback.

This content is the **client's own listing data** (their descriptions, their photographs on OwnerRez's
CDN). It is business data, not the previous site's presentation, so it is carried across verbatim as
data while every line of markup and styling around it is new.
