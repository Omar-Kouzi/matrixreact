import { useLocation } from "react-router-dom";
import DashboardNavbar from "./DashbaordNavbar";
import NormalNavbar from "./NormalNavbar";
import SecureLS from "secure-ls";

const ls = new SecureLS({ encodingType: "aes" });

function Navbar() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");

  // Get user info from SecureLS
  const loggedIn = ls.get("Loggedin") === "true";
  const role = ls.get("role") || "customer";

  // Dashboard navbar only for admin users
  if (isDashboardRoute && loggedIn && role === "admin") {
    return <DashboardNavbar />;
  }

  // Default to normal navbar for all other cases
  return <NormalNavbar />;
}

export default Navbar;
