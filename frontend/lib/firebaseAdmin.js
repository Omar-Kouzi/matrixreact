import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedServices;

export function getFirebaseAdmin() {
  if (cachedServices) return cachedServices;

  let app = getApps()[0];
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
      throw new Error("Server configuration is missing FIREBASE_SERVICE_ACCOUNT_JSON.");
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    app = initializeApp({ credential: cert(serviceAccount) });
  }

  cachedServices = { auth: getAuth(app), db: getFirestore(app) };
  return cachedServices;
}

export async function authenticateRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    const error = new Error("Sign in to use this feature.");
    error.statusCode = 401;
    throw error;
  }

  const { auth, db } = getFirebaseAdmin();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(match[1]);
  } catch {
    const error = new Error("Your session is invalid or expired. Please sign in again.");
    error.statusCode = 401;
    throw error;
  }

  const userSnapshot = await db.collection("users").doc(decoded.uid).get();
  if (!userSnapshot.exists) {
    const error = new Error("Your Matrix profile could not be found.");
    error.statusCode = 403;
    throw error;
  }

  const user = userSnapshot.data() || {};
  const isAdmin = user.role === "admin" || user.isAdmin === true;
  const plan = String(user.subscription || "free").toLowerCase();
  const expiry = user.subscriptionEndDate?.toDate
    ? user.subscriptionEndDate.toDate()
    : user.subscriptionEndDate
      ? new Date(user.subscriptionEndDate)
      : null;
  const activePlan = plan !== "free" && expiry && expiry.getTime() > Date.now() ? plan : "free";

  return { uid: decoded.uid, user, isAdmin, activePlan, db };
}
