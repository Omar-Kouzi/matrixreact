import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NormalRoutes from "./NormalRouter";
import DashboardRoutes from "./DashbaordRouter";
import SecureLS from "secure-ls";

const ls = new SecureLS({ encodingType: "aes" });

function Routes() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const loggedIn = ls.get("Loggedin") === "true";
    const uid = ls.get("uid");
    const storedRole = ls.get("role") || "customer";
    if (loggedIn && uid) {
      setRole(storedRole);
    } else {
      setRole("customer");
      console.log("No user info in storage");
    }

    setLoading(false);
  }, []);

  if (loading) return <div className="page">Loading...</div>;

  if (isDashboardRoute && role !== "admin") {
    return (
      <div>
        <h3>You're not supposed to be here</h3>
      </div>
    );
  }

  return <div>{isDashboardRoute ? <DashboardRoutes /> : <NormalRoutes />}</div>;
}

export default Routes;