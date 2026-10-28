
export const SUBSCRIPTION_PLANS = {
  plus: { name: "Plus", monthlyPrice: 3, monthlyRecipeLimit: 20, ai: false },
  pro: { name: "Pro", monthlyPrice: 5, monthlyRecipeLimit: 50, ai: true },
};

export const getActiveSubscription = (userData = {}) => {
  const plan = String(userData.subscription || "free").toLowerCase();
  if (plan === "free") return "free";
  const endDate = userData.subscriptionEndDate?.toDate
    ? userData.subscriptionEndDate.toDate()
    : userData.subscriptionEndDate instanceof Date
      ? userData.subscriptionEndDate
      : userData.subscriptionEndDate
        ? new Date(userData.subscriptionEndDate)
        : null;
  return endDate && endDate.getTime() > Date.now() ? plan : "free";
};
