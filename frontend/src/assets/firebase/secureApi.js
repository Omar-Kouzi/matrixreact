import { auth } from "./config";

async function authenticatedRequest(path, options = {}) {
  if (typeof auth.authStateReady === "function") await auth.authStateReady();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please sign in again before using this feature.");
  }

  const token = await currentUser.getIdToken();
  return fetch(path, {
    ...options,
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

// Supports both a payload object and the older (url, fetchOptions) call shape.
// The supplied URL is intentionally ignored: API keys and direct Google calls
// must never be used by the browser.
export async function fetchGeminiAI(payloadOrUrl, options) {
  const payload = options ? options.body : payloadOrUrl;
  const body = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  return authenticatedRequest("/api/gemini", { method: "POST", body });
}

export async function createRecipeSecurely(recipe) {
  return authenticatedRequest("/api/recipes", {
    method: "POST",
    body: JSON.stringify(recipe || {}),
  });
}

export async function createSubscriptionRequest(request) {
  return authenticatedRequest("/api/subscription-requests", {
    method: "POST",
    body: JSON.stringify(request || {}),
  });
}
