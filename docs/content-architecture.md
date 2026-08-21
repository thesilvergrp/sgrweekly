# Editable Content — Architecture & Options

Goal: let an operator change page copy, business details, which homes are featured, and per-property
editorial text **without a developer and without a code change**.

Status: **built and deployed.** The AWS resources were created on 2026-08-20 and the editor is live.
§5 records what was provisioned and the exact identifiers.

Chosen design: **S3 content store, read through the existing Lambda, edited through an admin page in
the app behind Cognito sign-in, with per-stay editorial text included.**

---

## 1. What is already in place

The frontend no longer hard-codes copy. Everything editable lives in one typed document.

```
src/content/site-content.ts      page-copy document: type + bundled defaults
src/content/stays-document.ts    per-stay editorial document: type + seed builder
src/lib/content-schema.ts        parsers/validators for untrusted remote documents
src/services/content.service.ts  reads both documents; writes them with a bearer token
src/app/ContentProvider.tsx      resolves both at start-up, provides them to the tree
src/app/content-context.ts       useSiteContent() / useStaysContent() / useBusiness()
src/lib/stay-overlay.ts          applies per-stay editorial at render time
src/config/auth.ts               Cognito configuration (optional)
src/services/auth.service.ts     PKCE sign-in, token handling, sign-out
src/app/AuthProvider.tsx         admin session state
src/features/admin/              the editor (lazily loaded; never shipped to visitors)
scripts/export-content.mjs       emits either document as JSON
```

### Resolution order

```
bundled defaults  ──►  first paint (instant, no network)
        │
        ├─ GET /api/content        ──► parse + validate ──► merge over defaults ──► re-render
        └─ GET /api/content/stays  ──► parse + validate ──► overlay onto the catalog
                    │
                    └─ 404 / 5xx / timeout / malformed ──► keep the bundled content
```

The two documents are fetched independently, so a large property document failing cannot take the
page headings down with it.

**Any** failure falls back to the bundled copy. Marketing text is not worth an error state, and the
route does not exist yet — so this already ships safely today and changes nothing visible until a
backend answers `/api/content`.

### What is editable

| Area | Fields |
|---|---|
| Meta | browser/tab title, meta description (runtime only — see §6) |
| Business | name, email, phone + `tel:` link, service areas, region, response-time wording |
| Hero | overline, three-part headline, lede, the three stat labels |
| Collection | section index, overline, title, lede |
| Amenities | section intro + the four feature cards (icon, title, body) |
| About | section intro, paragraphs, pull quote, the three points |
| Contact | section intro, the enquiry-topic options, the small print |
| Footer | blurb and the three column titles |
| Curation | `featuredStayIds` — which homes appear in the home-page grid |
| Per stay | display name, summary, story, amenity tags, photo list, bed count, "guest favourite" flag |

### What is deliberately NOT editable

* **Section ids** (`stays`, `about`, `amenities`, `contact`) — part of the URL contract.
* **Navigation structure** — structural, not editorial.
* **Operational property facts** — address, geo, bedrooms, bathrooms, sleeps, living area, display
  order. OwnerRez owns these. A content document that could contradict the booking system is how a
  guest ends up booking a house that does not fit their party.
* **A stay's `slug`** — even when the display name is overridden. Slugs are the `?property=` deep-link
  contract and shared links must keep resolving after a rename.

### Safety properties (verified, 24 checks)

* Garbage input — `null`, a string, a number, an array, `{}` — resolves to the bundled document.
* Empty or whitespace-only strings do not overwrite real copy.
* A document with an unexpected `version` is ignored **wholesale** rather than merged.
* `phoneHref` accepts only `tel:` / `mailto:` / `http(s):`; a `javascript:` URL is rejected.
* Stay photo URLs accept only `http(s):`; anything else is dropped.
* Stay keys must be numeric OwnerRez ids; bed counts must be non-negative numbers.
* A stay's `slug` is never derived from an edited name, so shared `?property=` links keep resolving.
* OwnerRez `living_area` always wins over an edited square-footage — the content document can never
  contradict the booking system on a fact a guest books against.
* An all-invalid `featuredStayIds` list falls back rather than emptying the grid.
* Unknown icon names render a fallback glyph instead of an empty box.
* **No content is ever rendered as HTML.** Nothing in the app uses `dangerouslySetInnerHTML`, so
  React escapes every string. A compromised content document cannot inject script.

---

## 2. Recommended backend: S3 + the existing Lambda

```
Admin  ──writes──►  S3  s3://<content-bucket>/site/site.json   (versioning ON, public access BLOCKED)
                     │
Browser ──GET /api/content──►  Amplify rewrite ──► existing Lambda ──► s3:GetObject ──► JSON
```

**Why read through the Lambda instead of fetching S3 directly from the browser:**

| | Via the Lambda (recommended) | Browser → S3 directly |
|---|---|---|
| Amplify rewrite | Already covers `/api/<*>` — no change | Needs a new rule or a second origin |
| CORS | None needed (same origin) | Bucket CORS config required |
| Bucket exposure | Stays fully private | Must be public-read, or need OAC/CloudFront |
| Caching | One `Cache-Control` header, cached at Amplify's CloudFront | Separate cache policy |
| Failure shape | Same `{error}` envelope as every other route | Different, S3-flavoured XML errors |

**Why S3 rather than DynamoDB or SSM/AppConfig:** object versioning gives free rollback and an audit
trail of every edit (`aws s3api list-object-versions`), the document is far past SSM's 4–8 KB limit,
and one JSON blob is the simplest thing that works for a single-editor site. DynamoDB becomes the
better answer only if you want *concurrent* editors or per-record edits without read-modify-write.

### The Lambda route

Implemented in `lambda/handler.mjs` (`readContent`, `writeContent`, `requireAdmin`, and the
`/api/content` routes). Behaviour worth knowing:

* **Reads are cached per warm container** for `CONTENT_TTL_MS` (60 s default), revalidated with a
  conditional `IfNoneMatch` GET so an unchanged document costs a 304 rather than a transfer.
* **Read responses carry** `Cache-Control: public, max-age=60, stale-while-revalidate=300`, so
  Amplify's CloudFront serves most page loads without reaching S3. Every other route stays uncached —
  availability and pricing must never be stale.
* **A missing document is a 404**, not an error: the site falls back to its bundled copy.
* **Writes drop the local cache** so the next read in that container is immediate; other containers
  catch up within the TTL.
* **Writes are capped at 2 MB** and must be a JSON object carrying a numeric `version`.

### Bucket layout

```
s3://<content-bucket>/
  site/site.json    page copy, business facts, curation   (~4 KB)
  site/stays.json   per-stay editorial                    (~47 KB)
  media/            future: admin-uploaded photography
```

Enable **versioning** (rollback + audit) and **Block Public Access** (reads go through the Lambda).

Seeding is covered by the runbook in §5.2.

---

## 3. The admin editor — what was built

`?admin` on the site opens the editor. It is a **separately loaded chunk** (18 kB JS, 4 kB CSS) that
a normal visitor never downloads.

### Sign-in: OAuth 2.0 Authorization Code + PKCE

* The browser redirects to the **Cognito hosted UI**; no sign-in form is implemented here, so no
  password ever passes through this code.
* **PKCE**, because a browser app is a public client and cannot hold a client secret. The implicit
  grant is deprecated and is not used.
* **The refresh token is never stored.** Only the short-lived id/access tokens are kept, in
  `sessionStorage`, so they die with the tab. On expiry the user bounces through the hosted UI again,
  which usually returns instantly because Cognito holds its own session cookie. The longest-lived
  credential therefore never touches web storage.
* `state` is validated on return (CSRF), and the post-login redirect only honours a **same-origin**
  target, so the stored return path cannot become an open redirect.
* **No SDK.** The whole flow is two redirects and one form POST; `aws-amplify` would have added
  hundreds of kilobytes for it.

### Authorisation: verified in the Lambda, never trusted from the client

Every `PUT` carries the Cognito **ID token** as a bearer token. `requireAdmin()` in
`lambda/handler.mjs` verifies, using only Node's built-in `crypto`:

| Check | Rejects |
|---|---|
| `alg` is RS256 | algorithm-confusion attempts |
| `kid` matches a key in the pool's JWKS (cached 1 h) | unknown signers |
| RSA signature over `header.payload` | forged or tampered tokens |
| `iss` equals this user pool | tokens from another pool |
| `token_use` is `id` | access tokens swapped in |
| `aud` equals the app client | tokens minted for another client |
| `exp` / `nbf` | expired or not-yet-valid tokens |
| `cognito:groups` contains `COGNITO_ADMIN_GROUP`, when set | authenticated-but-not-admin users |

All nine are covered by tests (§6). With `COGNITO_USER_POOL_ID` or `COGNITO_CLIENT_ID` unset the
write routes answer `503` — editing cannot be accidentally left open.

### The editor

Ten panels: Hero, Collection, What-you-get, About, Contact, Footer, Featured homes, Property text,
Business details, Page title. Edits are a **local draft**; nothing is written until *Publish*, and
only the document that actually changed is written — editing a heading does not rewrite the 50 kB
property document. *Discard* restores the published state.

The property panel shows OwnerRez facts (address, bed/bath, sleeps) **read-only** beside the editable
text, so it is obvious which fields the booking system owns.

### Local development without AWS

The dev server mirrors the content routes against a git-ignored `./.content` directory, and the
editor runs without sign-in when Cognito is unconfigured **in a dev build only** — the bypass is
gated on `import.meta.env.DEV`, which Vite replaces with `false` in production, so the branch is
dead code and is stripped from the shipped bundle. The editor shows a banner saying as much.

## 4. Environment variables

Still **zero** required to build and serve the public site. The admin adds two optional ones; leave
them unset and `?admin` reports that editing is not configured while everything else is unchanged.

| Variable | Where | Value |
|---|---|---|
| `VITE_COGNITO_DOMAIN` | Amplify build env | `https://<prefix>.auth.<region>.amazoncognito.com` |
| `VITE_COGNITO_CLIENT_ID` | Amplify build env | the app client id |
| `VITE_COGNITO_SCOPES` | optional | defaults to `openid email` |

None are secrets — a browser app client is a public client with no secret.

Lambda side:

| Variable | Required for | Value |
|---|---|---|
| `CONTENT_BUCKET` | reads and writes | the bucket name |
| `CONTENT_PREFIX` | optional | key prefix, defaults to `site` |
| `CONTENT_TTL_MS` | optional | cache lease, defaults to `60000` |
| `COGNITO_USER_POOL_ID` | writes | e.g. `us-east-1_ABC123` |
| `COGNITO_CLIENT_ID` | writes | same app client id as above |
| `COGNITO_ADMIN_GROUP` | optional | e.g. `content-admins` |

## 5. As deployed (account 797416043142, us-east-2)

| Resource | Value |
|---|---|
| Content bucket | `silvergroup-content` — versioning **on**, public access **fully blocked**, SSE-AES256 |
| Documents | `site/site.json` (~4 KB), `site/stays.json` (~47 KB, 19 properties) |
| Lambda role policy | inline `silver-group-content-store` → `s3:GetObject`, `s3:PutObject` on `arn:aws:s3:::silvergroup-content/site/*` |
| Lambda env | `CONTENT_BUCKET`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_ADMIN_GROUP` |
| Lambda limits | timeout raised **3 s → 15 s**, memory **128 → 256 MB** |
| Cognito user pool | `us-east-2_nOhDtLRyK` — "silver-group-admin", email sign-in, self-registration disabled, 12-char password minimum |
| App client | `ab9fi4672rm0ep4d24hs9qufg` — **public, no secret**, authorization-code grant only, scopes `openid email`, ID token 1 h |
| Hosted UI | `https://sgrweekly-admin.auth.us-east-2.amazoncognito.com` |
| Callback / logout URLs | `https://sgrweekly.net/`, `https://www.sgrweekly.net/`, `https://main.d3il76884xzdca.amplifyapp.com/`, `http://localhost:5173/` |
| Admin group | `content-admins` |
| Amplify build env | `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID` |

The four callback URLs matter: the app derives its redirect from `window.location.origin` plus a
trailing slash, so each origin the site is reachable on must be registered verbatim. The localhost
entry lets the editor be exercised against real Cognito during development.

### Adding another editor

```bash
aws cognito-idp admin-create-user --region us-east-2 \
  --user-pool-id us-east-2_nOhDtLRyK --username person@example.com \
  --user-attributes Name=email,Value=person@example.com Name=email_verified,Value=true \
  --desired-delivery-mediums EMAIL

aws cognito-idp admin-add-user-to-group --region us-east-2 \
  --user-pool-id us-east-2_nOhDtLRyK --username person@example.com --group-name content-admins
```

Without the group membership the sign-in succeeds but every publish is refused with 403 — the
Lambda checks `cognito:groups` on the ID token.

### Rolling back a bad publish

The bucket is versioned, so every publish keeps its predecessor:

```bash
aws s3api list-object-versions --bucket silvergroup-content --prefix site/site.json \
  --query 'Versions[].[LastModified,VersionId]' --output table

aws s3api copy-object --bucket silvergroup-content --key site/site.json \
  --copy-source 'silvergroup-content/site/site.json?versionId=<PREVIOUS_VERSION_ID>'
```

Changes appear within the 60-second cache window. Worst case, deleting the object entirely makes the
site fall back to the copy built into the bundle.

## 6. Verification

| Suite | Checks | Result |
|---|---|---|
| Content parser + overlay | 24 | Pass |
| Lambda routes, auth and S3 behaviour | 27 | Pass |
| Local end-to-end round trip via the dev server | publish → read back → validation rejects junk | Pass |

The Lambda suite mints **real RS256 tokens with a generated RSA keypair** and serves them through a
stubbed JWKS endpoint, so signature verification is genuinely exercised rather than mocked away. It
confirms tampered signatures, unknown key ids, expired tokens, wrong audience, wrong issuer, access
tokens used in place of id tokens, and non-admin group members are each rejected — and that
`/api/health`, `/api/properties` and `/api/inquiries` behave exactly as before.

Not automated: the browser rendering remote content end to end, because there is no browser in the
build environment. The parser, the service and the local round trip are each covered; the piece
between them is a context provider passing a value through.

## 7. Known limits, stated up front

1. **Static `<meta>` tags still need a rebuild.** `document.title` and the meta description update at
   runtime, which covers browser tabs. Social and search crawlers read the tags in the served
   `index.html`, and only a build changes those. Prerendering or a CloudFront Function would fix it.
2. **~60 s propagation.** A warm container holds its lease for `CONTENT_TTL_MS`. Lower it for faster
   feedback at the cost of more S3 reads (fractions of a cent).
3. **No preview or draft state.** Publishing is live. S3 versioning gives rollback, not staging. A
   `site.draft.json` plus `?preview=1` would add it.
4. **Single-writer assumption.** Two people publishing at once will overwrite each other. Fine for
   one or two operators; per-section objects or DynamoDB would fix it.
5. **Photos are still URLs.** The editor takes photo URLs; admin *uploads* would need presigned S3
   PUTs and a media library. That is the natural next content increment.
6. **The bundled copy can drift from the published copy.** The repo copy is the fallback and the
   seed, not a mirror. Re-running `npm run content:export` after major edits and committing the
   result keeps the offline fallback current — worth doing occasionally, not per edit.

## 8. Where this leaves SES

The contact form still composes a `mailto:` and says so. When you wire SES, the shape is the same as
the content write path: a new route on the same Lambda, `POST /api/contact`, with SES send
permission on the execution role and a verified sender identity. The frontend change is one service
function plus swapping the form's submit handler — the form, its validation and its states are
already built.
