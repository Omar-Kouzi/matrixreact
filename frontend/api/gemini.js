import { authenticateRequest } from "../lib/firebaseAdmin.js";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 12;
const requestBuckets = new Map();
const MAX_BODY_BYTES = 4 * 1024 * 1024;

function consumeRateLimit(uid) {
  const now = Date.now();
  if (requestBuckets.size > 5000) {
    for (const [key, value] of requestBuckets) {
      if (now - value.startedAt > WINDOW_MS * 2) requestBuckets.delete(key);
    }
  }
  const current = requestBuckets.get(uid);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestBuckets.set(uid, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return sendError(res, 503, "AI is not configured on the server yet.");

  let identity;
  try {
    identity = await authenticateRequest(req);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.statusCode ? error.message : "Authentication service unavailable.");
  }

  if (!identity.isAdmin && identity.activePlan !== "pro") {
    return sendError(res, 403, "AI tools require an active Pro subscription.");
  }
  if (!identity.isAdmin) {
    try {
      const planSnapshot = await identity.db.collection("settings").doc("subscriptionPlans").get();
      if (planSnapshot.exists && planSnapshot.data()?.plans?.pro?.ai === false) {
        return sendError(res, 403, "AI tools are currently disabled for the Pro plan.");
      }
    } catch (error) {
      console.error("Could not read AI plan configuration:", error?.message || "unknown error");
      return sendError(res, 503, "Could not verify AI plan access. Please try again.");
    }
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  let serialized;
  try {
    serialized = JSON.stringify(req.body || {});
  } catch {
    return sendError(res, 400, "Invalid request body.");
  }
  if (contentLength > MAX_BODY_BYTES || Buffer.byteLength(serialized, "utf8") > MAX_BODY_BYTES) {
    return sendError(res, 413, "The request is too large. Please use a smaller image.");
  }

  const body = req.body;
  if (!body || !Array.isArray(body.contents) || body.contents.length !== 1) {
    return sendError(res, 400, "Invalid AI request format.");
  }
  const parts = body.contents[0]?.parts;
  if (!Array.isArray(parts) || parts.length < 1 || parts.length > 2) {
    return sendError(res, 400, "Invalid AI request content.");
  }
  const textParts = parts.filter((part) => typeof part?.text === "string");
  const imageParts = parts.filter((part) => part?.inlineData);
  if (textParts.length !== 1 || textParts[0].text.length > 30000 || imageParts.length > 1) {
    return sendError(res, 400, "The AI prompt is missing, too long, or has invalid content.");
  }
  const validParts = parts.every((part) => {
    if (typeof part?.text === "string") return Object.keys(part).every((key) => key === "text");
    if (part?.inlineData && typeof part.inlineData === "object") {
      return Object.keys(part).every((key) => key === "inlineData")
        && Object.keys(part.inlineData).every((key) => ["mimeType", "data"].includes(key));
    }
    return false;
  });
  if (!validParts) return sendError(res, 400, "Unsupported AI request content.");
  const imagePart = imageParts[0];
  if (imagePart) {
    const mimeType = imagePart.inlineData?.mimeType;
    const imageData = imagePart.inlineData?.data;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(mimeType || "") || typeof imageData !== "string" || imageData.length > 3_700_000) {
      return sendError(res, 400, "Unsupported or oversized image. Use a smaller JPG, PNG, or WebP image.");
    }
  }

  if (!consumeRateLimit(identity.uid)) {
    return sendError(res, 429, "You've made too many AI requests. Please wait a minute and try again.");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: body.contents,
          generationConfig: {
            responseMimeType: body.generationConfig?.responseMimeType === "application/json" ? "application/json" : undefined,
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      },
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Gemini upstream error:", response.status, data?.error?.status || "unknown");
      return sendError(res, response.status === 429 ? 429 : 502, "The AI service could not complete this request. Please try again.");
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Gemini proxy failed:", error?.message || "unknown error");
    return sendError(res, 502, "The AI service is temporarily unavailable.");
  }
}
