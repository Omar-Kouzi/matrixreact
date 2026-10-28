import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../assets/firebase/config";
import { createSubscriptionRequest } from "../assets/firebase/secureApi";
import { FaArrowRight, FaCheck, FaWhatsapp } from "react-icons/fa6";
import SecureLS from "secure-ls";
import { getUser } from "../assets/firebase/firestore";
import { auth } from "../assets/firebase/config";

const ls = new SecureLS({ encodingType: "aes" });

// IMPORTANT: Replace this with your WhatsApp number in international format,
// digits only (no +, spaces, or dashes). Example format for Lebanon: 961XXXXXXXX.
const WHATSAPP_NUMBER = "96181284452";

const defaultPlans = [
  {
    id: "plus",
    name: "Plus",
    monthly: 3,
    annual: 25.2,
    allowance: "20 recipes each month",
    features: ["Private recipe collection", "No ads", "20 recipes per month", "Sub-recipes"],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 5,
    annual: 42,
    allowance: "50 recipes each month",
    features: ["Everything in Plus", "50 recipes per month", "AI recipe descriptions and steps", "Photo-to-recipe AI"],
  },
];

const Subscription = () => {
  const uid = ls.get("uid");
  const signedIn = Boolean(uid);
  const [plans, setPlans] = useState(defaultPlans);
  const [sendingPlan, setSendingPlan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { (async () => { try { const snap = await getDoc(doc(db, "settings", "subscriptionPlans")); if (!snap.exists()) return; const saved = snap.data().plans || {}; setPlans(defaultPlans.map(p => ({ ...p, name: saved[p.id]?.name || p.name, monthly: Number(saved[p.id]?.monthlyPrice ?? p.monthly), annual: Number(saved[p.id]?.yearlyPrice ?? p.annual), allowance: `${Number(saved[p.id]?.monthlyRecipeLimit ?? (p.id === "plus" ? 20 : 50))} recipes each month`, features: p.features.filter(f => !f.toLowerCase().includes("ai")), ...(saved[p.id]?.ai ? { features: [...p.features.filter(f => !f.toLowerCase().includes("ai")), "AI recipe descriptions and steps", "Photo-to-recipe AI"] } : {}) }))); } catch (e) { console.warn("Using default subscription pricing:", e); } })(); }, []);

  const requestSubscription = async (plan, billing) => {
    setError("");
    if (!uid) {
      setError("Please log in or create an account before requesting a subscription.");
      return;
    }

    if (!WHATSAPP_NUMBER || WHATSAPP_NUMBER.includes("X")) {
      setError("WhatsApp is not configured yet. Add your WhatsApp number to WHATSAPP_NUMBER in src/routes/Subscription.jsx.");
      return;
    }

    // Open a blank tab immediately during the click so browsers do not block
    // the WhatsApp tab while the profile is being loaded.
    const whatsappWindow = window.open("about:blank", "_blank");
    if (!whatsappWindow) {
      setError("Your browser blocked the WhatsApp tab. Please allow pop-ups for Matrix and try again.");
      return;
    }

    setSendingPlan(`${plan.id}-${billing}`);
    try {
      let profile = {};
      try {
        profile = (await getUser(uid)) || {};
      } catch (profileError) {
        console.warn("Could not load the full user profile for the WhatsApp request.", profileError);
      }

      let email = profile.email || auth.currentUser?.email || "Not available";
      let name = profile.name || profile.fullName || profile.displayName || auth.currentUser?.displayName || "Not provided";
      let price = billing === "yearly" ? plan.annual : plan.monthly;
      let planName = plan.name;
      const billingLabel = billing === "yearly" ? "Annual (12 months)" : "Monthly (30 days)";
      // The server validates the plan and calculates the authoritative price.
      // WhatsApp still opens as a fallback if saving the request fails.
      let requestSaved = false;
      try {
        const saveResponse = await createSubscriptionRequest({ plan: plan.id, billing });
        const savedRequest = await saveResponse.json().catch(() => ({}));
        if (!saveResponse.ok) throw new Error(savedRequest.error || "Could not save the subscription request.");
        requestSaved = true;
        name = savedRequest.name || name;
        email = savedRequest.email || email;
        price = Number(savedRequest.price ?? price);
        planName = savedRequest.planName || planName;
      } catch (saveError) {
        console.error("Subscription request could not be saved.", saveError);
      }

      const message = [
        "Hello Matrix! I would like to request a subscription.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Matrix user ID: ${uid}`,
        `Plan: ${planName}`,
        `Billing: ${billingLabel}`,
        `Price: $${price.toFixed(2)} USD`,
        "",
        "I understand that I must NOT send any money yet. Matrix will contact me first, within a maximum of 24 hours, with the payment instructions. I will wait for confirmation before paying.",
      ].join("\n");

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      whatsappWindow.location.href = whatsappUrl;
      if (!requestSaved) {
        setError("WhatsApp is opening, but Matrix could not save this request for dashboard tracking. Please try the request again later or contact Matrix directly.");
      }
    } catch (requestError) {
      console.error("Unable to prepare the WhatsApp subscription request.", requestError);
      try {
        const fallbackMessage = `Hello Matrix! I would like to request the ${plan.name} ${billing} plan for $${(billing === "yearly" ? plan.annual : plan.monthly).toFixed(2)} USD. My Matrix user ID is ${uid}. Please contact me with payment instructions. I will not send money before receiving your instructions.`;
        whatsappWindow.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fallbackMessage)}`;
      } catch (fallbackError) {
        whatsappWindow.close();
        setError("We couldn't open WhatsApp. Please allow pop-ups for Matrix and try again.");
      }
    } finally {
      setSendingPlan("");
    }
  };

  return (
    <main className="Matrix-Subscription page">
      <header className="Matrix-Subscription-Heading">
        <span className="Matrix-Eyebrow">SIMPLE, FLEXIBLE PLANS</span>
        <h1>Make room for more recipes.</h1>
        <p>Choose the plan that fits your kitchen. Yearly billing saves 30% compared with paying monthly.</p>
      </header>

      <aside className="Matrix-Payment-Notice" role="note" aria-label="Important payment instructions">
        <strong>Important — please do not send any money yet.</strong>
        <p>After you request a plan, we will contact you on WhatsApp with the payment instructions within a maximum of 24 hours. Please wait for us to contact you before sending any payment.</p>
      </aside>

      <div className="Matrix-Plan-Grid">
        {plans.map((plan) => (
          <article className={`Matrix-Plan-Card ${plan.id}`} key={plan.id}>
            <span className="Matrix-Eyebrow">MATRIX {plan.name.toUpperCase()}</span>
            <h2>{plan.name}</h2>
            <p className="Matrix-Plan-Price"><strong>${plan.monthly}</strong><span>/ month</span></p>
            <p className="Matrix-Plan-Annual">${plan.annual.toFixed(2)} / year <span>{plan.monthly > 0 ? `${Math.max(0, Math.round((1 - plan.annual / (plan.monthly * 12)) * 100))}% off` : "annual"}</span></p>
            <p className="Matrix-Plan-Allowance">{plan.allowance}</p>
            <ul>{plan.features.map((feature) => <li key={feature}><FaCheck /> {feature}</li>)}</ul>
            <div className="Matrix-Subscription-Buttons">
              <button
                type="button"
                className="Matrix-Button Matrix-Button-Primary"
                onClick={() => requestSubscription(plan, "monthly")}
                disabled={Boolean(sendingPlan)}
              >
                <FaWhatsapp /> {sendingPlan === `${plan.id}-monthly` ? "Preparing…" : signedIn ? "Request monthly" : "Log in to request"} <FaArrowRight />
              </button>
              <button
                type="button"
                className="Matrix-Button Matrix-Button-Secondary"
                onClick={() => requestSubscription(plan, "yearly")}
                disabled={Boolean(sendingPlan)}
              >
                <FaWhatsapp /> {sendingPlan === `${plan.id}-yearly` ? "Preparing…" : "Request annual"} <FaArrowRight />
              </button>
            </div>
          </article>
        ))}
      </div>

      {error && <p className="Matrix-Subscription-Error" role="alert">{error}</p>}
      <p className="Matrix-Subscription-Fineprint">Monthly and annual prices are shown above. No payment is taken on this page. Your subscription starts only after we confirm your payment and activate your plan.</p>
      {!signedIn && <p className="Matrix-Subscription-Login"><Link to="/login">Log in or create an account</Link> to request a plan.</p>}
    </main>
  );
};

export default Subscription;
