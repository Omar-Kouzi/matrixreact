# Matrix Firestore security rules

The complete proposed rules are in [`firestore.rules`](./firestore.rules). They are designed for the current Matrix pages:

- Public visitors can read only approved recipes explicitly marked public, plus public site settings/categories. Member recipes default to private, matching the homepage promise that personal recipes stay in the user's account.
- New member recipes must be created through the protected `/api/recipes` endpoint, which checks the authenticated user, active subscription, and monthly limit. Direct client-side recipe creation is blocked for non-admin users.
- Recipe owners can read/edit/delete their own recipes; only admins can create recipes directly from dashboard pages, feature recipes, or manage shared categories/settings.
- Likes update the like count and the signed-in user's `likedRecipes` in one Firestore batch.
- Users can read their own profile and edit only basic profile fields / their saved-recipe list. Subscription, role, expiry, and payment-method fields are admin-only.
- Subscription requests are created through `/api/subscription-requests`, which derives the UID and current plan price on the server. Users can read their own requests; only admins can read all requests, update payment tracking, or activate subscriptions.

## Before publishing

1. Open Firebase Console → Firestore Database → Rules.
2. Save a copy of the currently published rules for rollback.
3. Review `firestore.rules`, then publish it as the complete rules file (not as a partial fragment).
4. Confirm the admin's `users/{Firebase Auth UID}` document has `role: "admin"` (or `isAdmin: true`). Never set this on a regular user.
5. Test sign-up/login, recipe creation/edit/delete, likes, plans request, and all admin dashboard pages after publishing.

**Important:** only recipes with `status: "approved"` and `visibility: "public"` are publicly readable. Member recipes created through the normal Add Recipe page default to private. Admins can publish a recipe by setting its visibility to Public and saving it in the dashboard editor. Firestore rules cannot automatically filter collection queries, so the app uses owner-constrained queries for personal collections.
