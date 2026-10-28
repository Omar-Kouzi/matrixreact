ONE-TIME USER SUBSCRIPTION MIGRATION (OPTIONAL)

Use this only if your Firestore users collection still contains legacy `role: "PUser"` records that should be migrated to the `subscription` field. New logins no longer rewrite subscription fields or automatically grant a fresh 30-day term.

The migration script preserves `role: "admin"`, removes other legacy role labels, maps `PUser` to `subscription: "plus"`, and derives a missing expiry from the historical subscription start / account creation date. If there is no historical date, the migration expires the legacy term rather than granting a new paid period.

1. Back up Firestore first.
2. Create/download a private service-account JSON for the correct Firebase project. Keep it private and never place it in the frontend folder, ZIP, or Git.
3. In a terminal, set `GOOGLE_APPLICATION_CREDENTIALS` to the full path of that JSON. On Windows PowerShell:
   `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\firebase-service-account.json"`
4. Verify the service account belongs to the intended Firebase project.
5. Run: `node scripts/migrateUserSubscriptions.cjs`
6. Inspect the result and verify the admin account still has `role: "admin"`.

Do not run this script if you do not have legacy `PUser` accounts to migrate. It is a one-time data migration, not part of normal deployment.
