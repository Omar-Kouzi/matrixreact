import { useEffect, useState } from "react";
import { getUsers, getRecipes, getAllDocuments } from "../assets/firebase/firestore";
import { Link } from "react-router-dom";
import "../styles/dashboard/AdminPanel.css";

export default function Dhome() {
  const [stats, setStats] = useState({ users: 0, recipes: 0, requests: 0, pending: 0 });
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const [users, recipes, requests] = await Promise.all([getUsers(), getRecipes(), getAllDocuments("subscriptionRequests")]);
        setStats({ users: users.length, recipes: recipes.length, requests: requests.length, pending: requests.filter(r => !["active", "cancelled"].includes(r.status)).length });
      } catch (e) { setError(e.message || "Could not load dashboard data. Check Firestore permissions."); }
    })();
  }, []);
  return <main className="admin-page page"><div className="admin-heading"><span>CONTROL CENTER</span><h1>Admin dashboard</h1><p>Manage Matrix recipes, plans, users, and subscription requests.</p></div>
    {error && <p className="admin-error">{error}</p>}
    <div className="admin-stats">{[["Users", stats.users], ["Member recipes", stats.recipes], ["Payment requests", stats.requests], ["Needs attention", stats.pending]].map(([label, value]) => <article className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <div className="admin-link-grid"><Link to="/dashboard/home-settings"><strong>Home page settings</strong><span>Edit the existing homepage title, logo, and background.</span></Link><Link to="/dashboard/demo-recipes"><strong>Demo recipes</strong><span>Edit the public sample recipes.</span></Link><Link to="/dashboard/pricing"><strong>Subscription pricing</strong><span>Update Plus and Pro prices and allowances.</span></Link><Link to="/dashboard/users"><strong>Users & payments</strong><span>Track requests, mark messages received, manage payment methods, and activate subscriptions.</span></Link></div>
    <p className="admin-security-note">Payment activation is a manual admin action. Only activate a subscription after verifying that payment has actually arrived.</p>
  </main>;
}
