# Matrix security rollout checklist

Use this list in order. Check items off only after completion and testing. The code and rule files in this ZIP have **not** been deployed automatically.

## A. Back up first

- [ ] Keep a backup of the current project ZIP.
- [ ] Copy the currently published Firestore rules somewhere safe for rollback.
- [ ] Do not include `.env`, `.env.local`, Gemini keys, Firebase service-account JSON, or other secrets in Git or ZIP uploads.

## B. Secure Gemini and configure Vercel

- [ ] Open Google AI Studio / the Google Cloud project that owns the current Gemini key.
- [ ] **Rotate/revoke the old Gemini key** if it was ever used as `REACT_APP_MATRIX_OPEN_AI` in a deployed frontend. Removing it from code does not make old published copies secret again.
- [ ] Create/select a server-only Gemini key and restrict it to the Generative Language API where supported.
- [ ] In Vercel → Matrix project → Settings → Environment Variables, add `GEMINI_API_KEY` with the new key.
- [ ] Add `FIREBASE_SERVICE_ACCOUNT_JSON` containing the private service-account JSON for the same Firebase project. Use a dedicated service account with only the Firestore access the server needs. Never commit or upload this JSON.
- [ ] Remove `REACT_APP_MATRIX_OPEN_AI` from Vercel and local frontend environment files.
- [ ] Apply the variables to the environments you use (Production; Preview/Development only if needed).

## C. Deploy the updated project

- [ ] Deploy `Matrix-security-audit-update.zip` to the Matrix Vercel project and wait for a successful deployment.
- [ ] Check Vercel function logs if `/api/gemini`, `/api/recipes`, or `/api/subscription-requests` reports a server configuration error.
- [ ] Do not restore direct browser-to-Gemini calls to fix local development. Use `npx vercel dev` with the server variables configured locally when you need to test API routes on your computer.

## D. Publish Firebase rules and indexes

- [ ] In Firebase Console → Firestore Database → Rules, publish the complete `firestore.rules` file from the ZIP. Publishing it before the new code is deployed can temporarily break old recipe-creation and subscription-request flows, so deploy the code first and publish these rules promptly afterward.
- [ ] Deploy `firestore.indexes.json`, or create the composite index for `recipes` fields `status` + `visibility` in Firebase Console if prompted by the public sub-recipe query.
- [ ] Confirm the administrator's document ID matches their Firebase Authentication UID and that it contains `role: "admin"` (or `isAdmin: true`). Do not set this on normal accounts.
- [ ] If Firebase Storage is currently enabled, review and publish `storage.rules` too. It keeps image reads public but limits uploads/replacements/deletions to admins; regular-user permanent image uploads remain deferred.
- [ ] Remember that older Firebase Storage download URLs may still be shareable even when their Firestore recipe is private. If an old image must be private, review/revoke its download token or remove it separately.

## E. Firebase Authentication — authorized domains

- [ ] Open Firebase Console → Authentication → Settings → Authorized domains.
- [ ] Confirm `matrixter.vercel.app` is listed, and keep `localhost` only if you use local development.
- [ ] Remove obsolete domains only after confirming they are no longer used for login.

## F. Production smoke tests

- [ ] Create a new account and confirm its profile starts on Free.
- [ ] Sign in as a normal user and create a recipe. Confirm it appears in that user's profile but is not readable by a signed-out visitor.
- [ ] Create recipes up to the Free monthly limit; confirm the next create is blocked server-side.
- [ ] Confirm normal users cannot create recipes directly through Firestore, edit another user's recipe, edit subscription/role fields, write settings, or manage shared categories.
- [ ] Confirm only recipes marked both `status: "approved"` and `visibility: "public"` open for signed-out visitors.
- [ ] Confirm an active Pro account can use text AI and temporary image analysis; selected images should not be saved to Storage by these flows.
- [ ] Confirm Free/Plus and expired Pro accounts are denied AI access even if the browser UI is bypassed.
- [ ] Confirm AI requests fail safely if unauthenticated, oversized, malformed, or repeated too quickly.
- [ ] Submit a Plus/Pro request, verify the server-calculated price appears in the admin dashboard, and confirm the plan does not activate until payment is marked received and you click the activation button.
- [ ] Test liking/unliking a recipe and confirm both the like count and user's liked list update together.
- [ ] As admin, test dashboard counts, users, payment requests, settings, demo recipes, pricing, and recipe management.
- [ ] Test the deployed domain after each rules or environment-variable change.

## G. Deliberately deferred / limitations

- [ ] **Storage / permanent recipe image uploads:** deferred as agreed. AI image analysis resizes/compresses the selected image and sends it transiently to the protected endpoint; the new Add Recipe flow does not save that image to Firebase Storage. Existing dashboard home-logo/background uploads and legacy admin recipe-image controls still depend on Storage if used.
- [ ] **Google billing changes:** deferred as requested. No billing-setting change is required just to make AI image analysis temporary, but Gemini usage may still incur charges under the existing Google AI project/key.
- [ ] **Persistent rate limiting:** AI and subscription-request rate limits are in-memory and best-effort across serverless instances, not a hard global quota. Add a persistent rate-limit store/gateway later if abuse becomes a concern.
- [ ] **Legacy subscriptions:** login/profile no longer automatically grant a new 30-day subscription term. If you have old `PUser` accounts, review `scripts/README-migration.txt` and back up Firestore before optionally running the one-time migration script.

## H. Test limitation in this package review

- [ ] A full Create React App production build still needs to be run after dependencies install. `npm ci` timed out twice in the review environment, although JavaScript/JSX syntax, relative imports, and project JSON files were checked successfully.
