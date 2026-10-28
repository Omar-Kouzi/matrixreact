import { Timestamp } from "firebase-admin/firestore";
import { authenticateRequest } from "../lib/firebaseAdmin.js";

const DEFAULT_LIMITS = { free: 3, plus: 20, pro: 50 };
const MAX_TITLE = 160;
const MAX_DESCRIPTION = 5000;

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function activePlanFromUser(user) {
  const plan = String(user.subscription || "free").toLowerCase();
  const expiry = user.subscriptionEndDate?.toDate
    ? user.subscriptionEndDate.toDate()
    : user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
  return plan !== "free" && expiry && expiry.getTime() > Date.now() ? plan : "free";
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

  const body = req.body || {};
  const title = cleanText(body.title, MAX_TITLE);
  const description = cleanText(body.description, MAX_DESCRIPTION);
  if (!title || !description) return fail(res, 400, "A recipe title and description are required.");

  const ingredients = Array.isArray(body.ingredients) ? body.ingredients.slice(0, 200) : [];
  const steps = Array.isArray(body.steps) ? body.steps.slice(0, 200) : [];
  const categories = Array.isArray(body.categories)
    ? [...new Set(body.categories.filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean))].slice(0, 20)
    : [];
  const cleanIngredients = ingredients
    .filter((item) => item && typeof item === "object")
    .map((item) => ({ name: cleanText(item.name, 200), quantity: cleanText(item.quantity, 120) }))
    .filter((item) => item.name || item.quantity);
  const cleanSteps = steps
    .filter((step) => typeof step === "string")
    .map((step) => step.trim().slice(0, 2000))
    .filter(Boolean);
  if (!cleanSteps.length) return fail(res, 400, "Please add at least one cooking step.");

  let limits = { ...DEFAULT_LIMITS };
  try {
    const planSnapshot = await identity.db.collection("settings").doc("subscriptionPlans").get();
    const savedPlans = planSnapshot.exists ? planSnapshot.data()?.plans || {} : {};
    for (const planName of ["plus", "pro"]) {
      const configured = Number(savedPlans[planName]?.monthlyRecipeLimit);
      if (Number.isInteger(configured) && configured >= 1 && configured <= 500) limits[planName] = configured;
    }
  } catch (error) {
    console.error("Could not read recipe plan limits:", error?.message || "unknown error");
    return fail(res, 503, "Could not verify your recipe limit. Please try again.");
  }

  const nowDate = new Date();
  const monthStart = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 1));
  const monthKey = `${nowDate.getUTCFullYear()}-${String(nowDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const now = Timestamp.fromDate(nowDate);
  const recipeRef = identity.db.collection("recipes").doc();
  const recipeData = {
    title,
    description,
    createdBy: identity.uid,
    authorId: identity.uid,
    status: "approved",
    visibility: identity.isAdmin ? (body.visibility === "private" ? "private" : "public") : "private",
    featured: identity.isAdmin && body.featured === true,
    categories,
    ingredients: cleanIngredients,
    steps: cleanSteps,
    difficulty: ["Easy", "Medium", "Hard"].includes(body.difficulty) ? body.difficulty : "Easy",
    prepTime: cleanText(body.prepTime, 80),
    cookTime: cleanText(body.cookTime, 80),
    servings: cleanText(body.servings, 80),
    // New recipe images remain transient; do not persist uploads here.
    images: [],
    saves: 0,
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (identity.isAdmin) {
      await recipeRef.create(recipeData);
      return res.status(201).json({ id: recipeRef.id });
    }

    const userRef = identity.db.collection("users").doc(identity.uid);
    await identity.db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      if (!userSnapshot.exists) {
        const error = new Error("Your Matrix profile could not be found.");
        error.statusCode = 403;
        throw error;
      }
      const currentUser = userSnapshot.data() || {};
      const currentPlan = activePlanFromUser(currentUser);
      const limit = limits[currentPlan] || limits.free;

      const byAuthorQuery = identity.db.collection("recipes").where("authorId", "==", identity.uid);
      const byCreatorQuery = identity.db.collection("recipes").where("createdBy", "==", identity.uid);
      const [byAuthor, byCreator] = await Promise.all([
        transaction.get(byAuthorQuery),
        transaction.get(byCreatorQuery),
      ]);
      const seen = new Set();
      let count = 0;
      for (const snapshot of [byAuthor, byCreator]) {
        for (const recipeDoc of snapshot.docs) {
          if (seen.has(recipeDoc.id)) continue;
          seen.add(recipeDoc.id);
          const recipe = recipeDoc.data();
          const createdAt = recipe.createdAt?.toDate
            ? recipe.createdAt.toDate()
            : recipe.createdAt ? new Date(recipe.createdAt) : null;
          if (createdAt && createdAt >= monthStart && createdAt <= nowDate) count += 1;
        }
      }
      if (count >= limit) {
        const error = new Error(`You've reached the ${limit}-recipe monthly limit for your ${currentPlan.toUpperCase()} plan.`);
        error.code = "RECIPE_LIMIT";
        error.limit = limit;
        error.plan = currentPlan;
        throw error;
      }

      // Serializing on the user's document makes simultaneous creates re-check the limit.
      transaction.create(recipeRef, recipeData);
      transaction.update(userRef, {
        recipeUsageMonth: monthKey,
        recipeUsageCount: count + 1,
        recipeUsageUpdatedAt: now,
      });
    });
    return res.status(201).json({ id: recipeRef.id });
  } catch (error) {
    if (error.code === "RECIPE_LIMIT") {
      return res.status(429).json({ error: error.message, limit: error.limit, plan: error.plan });
    }
    if (error.statusCode) return fail(res, error.statusCode, error.message);
    console.error("Recipe creation failed:", error?.message || "unknown error");
    return fail(res, 500, "Could not save the recipe. Please try again.");
  }
}
