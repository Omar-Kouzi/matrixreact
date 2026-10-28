import { useLocation } from "react-router-dom";
import DashboardNavbar from "./DashbaordNavbar";
import NormalNavbar from "./NormalNavbar";
import SecureLS from "secure-ls";

const ls = new SecureLS({ encodingType: "aes" });

export default function Navbar() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const loggedIn = ls.get("Loggedin") === "true";
  const role = ls.get("role");

  if (isDashboardRoute && loggedIn && role === "admin") return <DashboardNavbar />;
  return <NormalNavbar />;
}
