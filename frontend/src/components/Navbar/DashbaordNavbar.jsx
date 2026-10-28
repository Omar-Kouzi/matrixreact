import { NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../assets/firebase/config";
import savedlogo from "../../assets/Logo.png";
const DashboardNavbar = () => {
  const [logo, setLogo] = useState("");
  const [open, setOpen] = useState(false);

  // 🔥 Fetch logo from Firestore
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const ref = doc(db, "settings", "home");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setLogo(data.logo || "");
        }
      } catch (error) {
        console.error("Logo fetch error:", error);
      }
    };

    fetchLogo();
  }, []);

  return (
    <section className="Navbar">
      {/* 🔥 Logo */}
      {logo && <img src={logo} alt="icon" className="Navbar-Icon" />}
      <img src={savedlogo} alt="icon" className="Navbar-Icon" />
      {/* Desktop Nav */}
      <div className="Navigators">
        <NavLink to="/">Home</NavLink>
        {/* <NavLink to="/dashboard/">HomeDash</NavLink> */}
        <NavLink to="/dashboard/">Overview</NavLink>
        <NavLink to="/dashboard/home-settings">Home settings</NavLink>
        <NavLink to="/dashboard/demo-recipes">Demo recipes</NavLink>
        <NavLink to="/dashboard/pricing">Pricing</NavLink>
        <NavLink to="/dashboard/users">Users & payments</NavLink>
        {/* <NavLink to="/dashboard/Drequestedrecipes">Requested Recipes</NavLink> */}
      </div>

      {/* ☰ Hamburger */}
      <div className="Navbar-Toggle" onClick={() => setOpen(true)}>
        <FiMenu size={28} />
      </div>

      {/* Overlay */}
      <div
        className={`Overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* 📱 Responsive Sidebar */}
      <div className={`Navigators-Responsive ${open ? "open" : ""}`}>
        <div className="Close-Btn" onClick={() => setOpen(false)}>
          <FiX size={28} />
        </div>
        <NavLink to="/" onClick={() => setOpen(false)}>
          Home
        </NavLink>
        {/* <NavLink to="/dashboard/" onClick={() => setOpen(false)}>
          HomeDash
        </NavLink> */}
        <NavLink to="/dashboard/" onClick={() => setOpen(false)}>Overview</NavLink>
        <NavLink to="/dashboard/home-settings" onClick={() => setOpen(false)}>Home settings</NavLink>
        <NavLink to="/dashboard/demo-recipes" onClick={() => setOpen(false)}>Demo recipes</NavLink>
        <NavLink to="/dashboard/pricing" onClick={() => setOpen(false)}>Pricing</NavLink>
        <NavLink to="/dashboard/users" onClick={() => setOpen(false)}>Users & payments</NavLink>
        {/* <NavLink
          to="/dashboard/Drequestedrecipes"
          onClick={() => setOpen(false)}
        >
          Requested Recipes
        </NavLink> */}
      </div>
    </section>
  );
};

export default DashboardNavbar;
