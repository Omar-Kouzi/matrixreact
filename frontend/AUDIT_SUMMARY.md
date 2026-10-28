# Matrix security audit — change summary

This package contains a reviewed security update for the current Matrix React/Firebase project. It does not deploy itself or change the rules already published in Firebase.

## Code changes

- Added protected server endpoints:
  - `/api/gemini`: verifies Firebase ID tokens, checks active Pro/admin access, validates prompt/image payloads, caps output, and applies a basic per-user rate limit.
  - `/api/recipes`: creates member recipes server-side, derives ownership from the verified token, enforces the monthly recipe limit in a transaction, and defaults member recipes to private.
  - `/api/subscription-requests`: derives the account UID and current plan price server-side rather than trusting browser-supplied request metadata.
- Added a server-only Firebase Admin SDK initializer. Required server secrets are read from environment variables and are not embedded in the frontend.
- Removed direct browser-to-Gemini requests and the frontend `REACT_APP_MATRIX_OPEN_AI` dependency. Images selected for AI are resized/compressed in the browser and sent transiently; the new recipe flow does not save them to Firebase Storage.
- Changed personal recipe pages to query only the signed-in user's recipes. Public recipe lookups are limited to approved recipes marked public.
- Protected profile subscription/role fields, shared settings, categories, and subscription-request writes in the proposed rules.
- Made subscription activation update the user subscription and request status in one atomic batch, and require payment to be marked received first.
- Removed automatic login/profile migration that could grant a fresh subscription term, and corrected the optional one-time migration script so it preserves admins and does not grant a new term from the migration date.
- Added `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json`, and `SECURITY_CHECKLIST.md`.

## Required Vercel environment variables

- `GEMINI_API_KEY` — server-only Gemini API key.
- `FIREBASE_SERVICE_ACCOUNT_JSON` — private service-account JSON for the same Firebase project.

Do not prefix either variable with `REACT_APP_`. The React frontend must not contain the Gemini key. See `SECURITY_CHECKLIST.md` for the deployment order.

## Security choices

- Member recipes are private by default. Admins can publish a recipe by setting `visibility` to `public` in the admin recipe editor; it must also have `status: "approved"`.
- Firestore settings and categories remain publicly readable so the site can display demo content/pricing, but only admins can write them.
- If Storage is enabled, `storage.rules` allows public reads of existing image URLs and admin-only uploads/replacements/deletes. Legacy Firebase Storage download URLs may still be shareable; review them separately if they must be private.
- AI rate limiting is in-memory and therefore best-effort across serverless instances. It is not a global hard quota; the checklist calls this out for future strengthening if needed.

## Validation performed

- Parsed all 40 JavaScript/JSX/CommonJS source files for syntax errors: none found.
- Checked relative imports: none missing.
- Validated `package.json`, `firebase.json`, and `firestore.indexes.json` as JSON.
- Full Create React App production build was **not** completed: dependency installation (`npm ci`) timed out in this environment. The app still needs a real deployment smoke test after the external checklist items are completed.

## Important

The rules and environment variables in this ZIP are proposed files/configuration. You still need to publish the Firestore rules, configure Vercel secrets, rotate the old exposed Gemini key, redeploy, and test using the checklist. Do not deploy secrets or service-account JSON from your local machine into the frontend.
