/*
 * One-time migration for the users collection.
 * Requires Firebase Admin SDK and GOOGLE_APPLICATION_CREDENTIALS pointing to
 * a private service-account JSON file. Never put that JSON in the frontend ZIP
 * or commit it to source control. Run: node scripts/migrateUserSubscriptions.cjs
 */
const admin = require("firebase-admin");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service-account JSON path first.");
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

async function main() {
  const snapshot = await db.collection("users").get();
  let batch = db.batch();
  let writes = 0;
  let migrated = 0;
  const now = new Date();

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const updates = {};
    const legacyRole = data.role;
    const subscription = String(data.subscription || (legacyRole === "PUser" ? "plus" : "free")).toLowerCase();
    if (!data.subscription) updates.subscription = subscription;

    // Preserve the admin role. Remove only legacy non-admin role labels after migration.
    if (legacyRole && legacyRole !== "admin") {
      updates.role = admin.firestore.FieldValue.delete();
    }

    const storedStart = data.subscriptionStartDate?.toDate?.()
      || data.createdAt?.toDate?.()
      || (data.createdAt ? new Date(data.createdAt) : null);
    if (!data.subscriptionStartDate) {
      // Missing historical dates must not silently create a fresh paid term.
      updates.subscriptionStartDate = storedStart || new Date(0);
    }

    if (subscription !== "free" && !data.subscriptionEndDate) {
      const end = new Date(storedStart || 0);
      if (subscription === "pro" || subscription === "plus") end.setDate(end.getDate() + 30);
      updates.subscriptionEndDate = end;
    } else if (subscription === "free" && data.subscriptionEndDate === undefined) {
      updates.subscriptionEndDate = null;
    }

    if (Object.keys(updates).length) {
      batch.update(userDoc.ref, updates);
      writes++;
      migrated++;
    }
    if (writes === 450) {
      await batch.commit();
      batch = db.batch();
      writes = 0;
    }
  }
  if (writes) await batch.commit();
  console.log(`Migration complete. Updated ${migrated} of ${snapshot.size} user documents.`);
}
main().then(() => process.exit(0)).catch((error) => { console.error("Migration failed:", error); process.exit(1); });
