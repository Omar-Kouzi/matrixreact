import { Timestamp } from "firebase-admin/firestore";
import { authenticateRequest } from "../lib/firebaseAdmin.js";

const DEFAULT_PLANS = {
  plus: { name: "Plus", monthlyPrice: 3, yearlyPrice: 25.2 },
  pro: { name: "Pro", monthlyPrice: 5, yearlyPrice: 42 },
};
const recentRequests = new Map();
const REQUEST_WINDOW_MS = 60 * 1000;

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(res, 405, "Method not allowed.");
  }

  let identity;
  try {
    identity = await authenticateRequest(req);
  } catch (error) {
    return fail(res, error.statusCode || 500, error.statusCode ? error.message : "Authentication service unavailable.");
  }

  const planId = req.body?.plan;
  const billing = req.body?.billing;
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_PLANS, planId) || !["monthly", "yearly"].includes(billing)) {
    return fail(res, 400, "Choose a valid subscription plan and billing period.");
  }

  const nowMs = Date.now();
  const previousRequest = recentRequests.get(identity.uid);
  if (previousRequest && nowMs - previousRequest < REQUEST_WINDOW_MS) {
    return fail(res, 429, "Please wait a minute before submitting another subscription request.");
  }

  let plans = DEFAULT_PLANS;
  try {
    const snapshot = await identity.db.collection("settings").doc("subscriptionPlans").get();
    if (snapshot.exists) {
      const saved = snapshot.data()?.plans || {};
      plans = Object.fromEntries(Object.keys(DEFAULT_PLANS).map((key) => {
        const configured = saved[key] || {};
        const defaultPlan = DEFAULT_PLANS[key];
        const monthlyPrice = Number(configured.monthlyPrice);
        const yearlyPrice = Number(configured.yearlyPrice);
        return [key, {
          name: typeof configured.name === "string" && configured.name.trim() ? configured.name.trim().slice(0, 60) : defaultPlan.name,
          monthlyPrice: Number.isFinite(monthlyPrice) && monthlyPrice >= 0 ? monthlyPrice : defaultPlan.monthlyPrice,
          yearlyPrice: Number.isFinite(yearlyPrice) && yearlyPrice >= 0 ? yearlyPrice : defaultPlan.yearlyPrice,
        }];
      }));
    }
  } catch (error) {
    console.error("Could not load subscription pricing:", error?.message || "unknown error");
    return fail(res, 503, "Could not verify current plan pricing. Please try again.");
  }

  const selectedPlan = plans[planId];
  const price = billing === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
  const name = String(identity.user.name || identity.user.fullName || identity.user.displayName || "Matrix customer").trim().slice(0, 100);
  const email = String(identity.user.email || "Not available").trim().slice(0, 200);
  const now = Timestamp.now();
  try {
    const ref = await identity.db.collection("subscriptionRequests").add({
      uid: identity.uid,
      name,
      email,
      plan: planId,
      planName: selectedPlan.name,
      billing,
      price,
      status: "requested",
      messageReceived: false,
      paymentReceived: false,
      paymentMethod: "whatsapp_manual",
      createdAt: now,
      updatedAt: now,
    });
    recentRequests.set(identity.uid, nowMs);
    return res.status(201).json({ id: ref.id, name, email, plan: planId, planName: selectedPlan.name, billing, price });
  } catch (error) {
    console.error("Subscription request creation failed:", error?.message || "unknown error");
    return fail(res, 500, "Could not save your request. Please try again.");
  }
}
