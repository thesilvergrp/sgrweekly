# Silver Group — AWS Amplify Deployment Guide

End-to-end steps to ship this site to AWS, with the OwnerRez proxy running on Lambda. Target: live at `https://<random>.amplifyapp.com` within a couple of hours.

**Architecture being built:**

```
Browser  ──►  Amplify Hosting (React SPA from dist/)
              │
              └── /api/* ──► Lambda Function URL ──► OwnerRez API
                              (creds from Secrets Manager / env vars)
```

---

## Prerequisites

- [ ] AWS account with billing set up (Amplify + Lambda are pay-per-use; expect a few cents/month at this traffic level).
- [ ] Code committed and pushed to GitHub (or GitLab/Bitbucket/CodeCommit).
- [ ] OwnerRez username (email) + Personal Access Token in hand.

---

## Step 1 — Store credentials in Secrets Manager (5 min)

The Lambda will read these at startup so the PAT is never in code or in plain config.

1. **AWS Console → Secrets Manager → Store a new secret.**
2. **Secret type:** "Other type of secret."
3. **Key/value pairs:**
   - Key `OWNERREZ_USERNAME`, value = your OwnerRez login email
   - Key `OWNERREZ_PAT`, value = the PAT
4. **Secret name:** `silver-group/ownerrez` (anything works; remember it).
5. Pick a region you'll use for everything — **us-east-1** is fine.
6. Skip rotation. Create.
7. **Note the secret's ARN** (visible on the secret detail page) — you'll need it.

> Quicker alternative if you want to skip Secrets Manager today: skip this step and set the values directly as Lambda environment variables in step 2. Less ideal but faster. You can migrate to Secrets Manager later.

---

## Step 2 — Create the Lambda (10 min)

1. **AWS Console → Lambda → Create function.**
2. **Author from scratch.**
3. **Function name:** `silver-group-ownerrez-proxy`
4. **Runtime:** Node.js 20.x (or 22.x).
5. **Architecture:** arm64 (cheaper, faster).
6. **Execution role:** "Create a new role with basic Lambda permissions."
7. Create function.

### Paste the code

1. In the **Code** tab, you'll see a `index.mjs` file. Open it.
2. Replace its entire contents with the contents of [`silver-group/lambda/handler.mjs`](lambda/handler.mjs).
3. Click **Deploy**.

> **Keep the console and repo in sync.** The deployed `index.mjs` and the repo's [`lambda/handler.mjs`](lambda/handler.mjs) are meant to be the *same file* — the repo copy is the source of truth. If you ever edit the function directly in the Lambda console (e.g. a quick fix), paste the change back into `lambda/handler.mjs` and commit it. Likewise, after changing `lambda/handler.mjs` in the repo, re-paste it into the console and **Deploy** — Amplify only builds the frontend (`dist/`), so Lambda changes are **not** deployed automatically. The two drifting apart has bitten us before (env-vars vs Secrets Manager auth).

### Wire credentials

**Option A — Direct env vars (fastest):**

1. **Configuration → Environment variables → Edit → Add environment variable.**
2. Add `OWNERREZ_USERNAME` and `OWNERREZ_PAT` with the real values. Save.

**Option B — Secrets Manager (more secure, +10 min):**

1. **Configuration → Permissions → click the execution role.** This opens IAM.
2. **Add permissions → Attach policies → Create policy** with this JSON (replace `<SECRET_ARN>`):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": "secretsmanager:GetSecretValue",
       "Resource": "<SECRET_ARN>"
     }]
   }
   ```
   Attach the policy to the role.
3. Back in the Lambda code editor, change the `authHeader()` function in `index.mjs` to load from Secrets Manager on first call:
   ```js
   import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
   const sm = new SecretsManagerClient({});
   let cached;
   async function loadCreds() {
     if (cached) return cached;
     const out = await sm.send(new GetSecretValueCommand({ SecretId: 'silver-group/ownerrez' }));
     cached = JSON.parse(out.SecretString ?? '{}');
     return cached;
   }
   ```
   Then `authHeader()` becomes async and awaits `loadCreds()`. Pass it through to the OwnerRez calls.
   *(Skip this for today — direct env vars work fine.)*

### Expose via Function URL

1. **Configuration → Function URL → Create function URL.**
2. **Auth type:** NONE (we'll lock down via CORS + Amplify routing).
3. **CORS:** check "Configure cross-origin resource sharing."
   - **Allow origin:** `*` for now (narrow to your Amplify domain after step 4).
   - **Allow methods:** `GET, POST, OPTIONS`
   - **Allow headers:** `Content-Type`
4. Save.
5. **Copy the Function URL** (looks like `https://abcd1234.lambda-url.us-east-1.on.aws/`). You'll paste it into Amplify next.

### Quick smoke test

Open in your browser (or curl):
```
https://<your-function-url>/api/health
```
Should return `{"ok":true,"hasCredentials":true}`. Then:
```
https://<your-function-url>/api/properties
```
Should return the OwnerRez properties JSON. If health is fine but `/api/properties` returns auth errors, double-check env var values.

---

## Step 3 — Amplify Hosting (15 min)

1. **AWS Console → Amplify → New app → Host web app.**
2. **GitHub** (or your provider) → Continue → authorize Amplify → pick your repo.
3. **Branch:** `main` (or whichever branch).
4. **App root directory:** if `silver-group/` is at the repo root, leave blank. If your repo has it nested (e.g. `website/silver-group/`), set this to `silver-group` (or `website/silver-group`).
5. **Build settings:** Amplify will detect Vite. Replace with this `amplify.yml`:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
6. **Advanced settings → Environment variables:** nothing needed (the SPA has no env vars; OwnerRez creds live in Lambda).
7. Save and deploy. First build takes ~3 minutes.

When it finishes, you'll have a URL like `https://main.d3xyz123.amplifyapp.com`. Open it — you should see the site with the static fallback content (the `/api/*` calls will be failing because we haven't wired Amplify → Lambda yet).

---

## Step 4 — Route /api/* from Amplify to the Lambda (5 min)

This is the magic that makes `/api/properties` on your Amplify domain hit your Lambda. No CORS needed because it's a same-origin rewrite.

1. **Amplify app → Hosting → Rewrites and redirects.**
2. **Add rule:**
   - **Source address:** `/api/<*>`
   - **Target address:** `https://<YOUR-FUNCTION-URL>/api/<*>` (paste the Function URL from step 2, append `/api/<*>`)
   - **Type:** `200 (Rewrite)` — not Redirect.
3. Save.

Now hit `https://main.d3xyz123.amplifyapp.com/api/health` — should return the JSON.

Reload the site root. The properties grid should now show **live OwnerRez data** (correct addresses, OwnerRez thumbnails).

---

## Step 5 — Smoke test the booking flow

1. Open a property detail page.
2. Pick a Saturday in the weekly calendar.
3. Click "Book this week."
4. Fill the inquiry form, submit.
5. Log into OwnerRez → check Inquiries — the new inquiry should be there.

If submit fails: check the Lambda's CloudWatch Logs (Lambda → Monitor → View logs). Most likely culprits:
- Inquiry payload shape doesn't match OwnerRez's expectations — adjust the body shape in [`server/ownerrez-client.ts`](server/ownerrez-client.ts) `InquiryPayload` interface and `lambda/handler.mjs` accordingly.
- Wrong content type or missing required field.

---

## After launch

- [ ] **Lock down CORS** on the Lambda Function URL — set Allow Origin to your Amplify domain (or just the custom domain later).
- [ ] **Move creds to Secrets Manager** (step 2 Option B) if you skipped it.
- [ ] **Set up a custom domain** (Amplify → Domain Management). DNS + SSL takes a few hours; plan for tomorrow.
- [ ] **CloudWatch alarms** on Lambda errors so you know if OwnerRez ever rejects requests.
- [ ] **Cache `/api/properties` at CloudFront** (or via Lambda response Cache-Control header) — saves OwnerRez calls and speeds up the home page.
- [ ] **Wire ContactSection** to a real backend (SES email or OwnerRez guest creation) — currently still stubbed.

---

## Useful URLs after deploy

- Amplify app: `https://main.<id>.amplifyapp.com`
- Lambda Function URL: `https://<id>.lambda-url.<region>.on.aws/`
- Lambda logs: CloudWatch → Log groups → `/aws/lambda/silver-group-ownerrez-proxy`
- OwnerRez admin: `https://app.ownerrez.com`
