import { NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../assets/firebase/config";

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
      <img src="" alt="icon" className="Navbar-Icon" />
      {/* Desktop Nav */}
      <div className="Navigators">
        <NavLink to="/">Home</NavLink>
        {/* <NavLink to="/dashboard/">HomeDash</NavLink> */}
        <NavLink to="/dashboard/Drecipes">Recipes</NavLink>
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
        <NavLink to="/dashboard/Drecipes" onClick={() => setOpen(false)}>
          Recipes
        </NavLink>{" "}
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
