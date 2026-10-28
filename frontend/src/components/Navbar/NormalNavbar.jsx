import { NavLink } from "react-router-dom";
import { RiLoginBoxLine, RiLogoutBoxLine } from "react-icons/ri";
import { FaUserCircle } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { logout } from "../../assets/firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../assets/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import SecureLS from "secure-ls";
import savedlogo from "../../assets/Logo.png";
const ls = new SecureLS({ encodingType: "aes" });

const NormalNavbar = () => {
  const [user, setUser] = useState(null);
  const [uid, setUid] = useState(null);
  const [role, setRole] = useState("customer");
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState(""); // 🔥 dynamic logo

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUid(currentUser.uid);
        getDoc(doc(db, "users", currentUser.uid)).then((snap) => {
          const data = snap.exists() ? snap.data() : {};
          const nextRole = data.role === "admin" || data.isAdmin === true ? "admin" : "customer";
          setRole(nextRole);
          if (nextRole === "admin") ls.set("role", "admin");
          else ls.remove("role");
        }).catch((error) => {
          console.error("Role lookup failed:", error);
          setRole("customer");
        });
      } else {
        setUid(null);
        setRole("customer");
      }
    });

  //  const storedUid = ls.get("uid");
  //  const storedRole = ls.get("role");

  //if (storedUid) setUid(storedUid);
    // if (storedRole) setRole(storedRole);

    return () => unsubscribe();
  }, []);

  // 🔥 Fetch logo from Firestore
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const ref = doc(db, "settings", "home");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setLogo(data.logo || savedlogo);
        }
      } catch (error) {
        console.error("Logo fetch error:", error);
      }
    };

    fetchLogo();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      ls.set("Loggedin", false);
      ls.remove("uid");
      ls.remove("role");

      setUser(null);
      setUid(null);
      setRole("customer");
      setOpen(false);
      window.location.reload(); // 🔥 Refresh the page after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <section className="Navbar">
      {/* 🔥 Dynamic logo */}
      {logo && <img src={logo} alt="logo" className="Navbar-Icon" />}
      <img
        src={savedlogo}
        // src="https://cdn-icons-png.flaticon.com/512/6415/6415827.png"
        alt="icon"
        className="Navbar-Icon"
      />

      {/* Desktop nav */}
      <div className="Navigators">
        <NavLink to="/">Home</NavLink>
        {user && <NavLink to="/recipes">My Recipes</NavLink>}
        <NavLink to="/subscription">Plans</NavLink>

        {user && role === "admin" && <NavLink to="/dashboard/">Dashboard</NavLink>}

        {!user ? (
          <NavLink to="/login">
            login <RiLoginBoxLine />
          </NavLink>
        ) : (
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "white",
            }}
          >
            logout <RiLogoutBoxLine />
          </button>
        )}

        {user && uid && (
          <div className="Navigators-Icons">
            <NavLink to={`/profile/${uid}`}>
              <FaUserCircle />
            </NavLink>
          </div>
        )}
      </div>

      {/* Hamburger */}
      <div className="Navbar-Toggle" onClick={() => setOpen(true)}>
        <FiMenu size={28} />
      </div>

      {/* Overlay */}
      <div
        className={`Overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile sidebar */}
      <div className={`Navigators-Responsive ${open ? "open" : ""}`}>
        <div className="Close-Btn" onClick={() => setOpen(false)}>
          <FiX size={28} />
        </div>

        <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
        {user && <NavLink to="/recipes" onClick={() => setOpen(false)}>My Recipes</NavLink>}
        <NavLink to="/subscription" onClick={() => setOpen(false)}>Plans</NavLink>

        {user && role === "admin" && <NavLink to="/dashboard/" onClick={() => setOpen(false)}>Dashboard</NavLink>}

        {user && uid && (
          <div className="Navigators-Icons">
            <NavLink to={`/profile/${uid}`} onClick={() => setOpen(false)}>
              Profile <FaUserCircle />
            </NavLink>
          </div>
        )}

        {!user ? (
          <NavLink to="/login" onClick={() => setOpen(false)}>
            login <RiLoginBoxLine />
          </NavLink>
        ) : (
          <button onClick={handleLogout}>
            logout <RiLogoutBoxLine />
          </button>
        )}
      </div>
    </section>
  );
};

export default NormalNavbar;
