import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NormalRoutes from "./NormalRouter";
import DashboardRoutes from "./DashbaordRouter";
import SecureLS from "secure-ls";
import { getUser } from "../../assets/firebase/firestore";
const ls = new SecureLS({ encodingType: "aes" });
export default function Routes(){const location=useLocation();const isDashboardRoute=location.pathname.startsWith("/dashboard");const [role,setRole]=useState("customer");const [loading,setLoading]=useState(true);
useEffect(()=>{let alive=true;(async()=>{try{const loggedIn=ls.get("Loggedin")==="true";const uid=ls.get("uid");if(loggedIn&&uid){const user=await getUser(uid);const verifiedRole=user?.role==="admin"||user?.isAdmin===true?"admin":"customer";if(alive){setRole(verifiedRole);if(verifiedRole!=="admin")ls.remove("role");else ls.set("role","admin");}}else if(alive)setRole("customer");}catch(e){console.error("Admin access check failed:",e);if(alive)setRole("customer");}finally{if(alive)setLoading(false);}})();return()=>{alive=false;};},[location.pathname]);
if(loading&&isDashboardRoute)return <div className="page">Checking admin access…</div>;
if(isDashboardRoute&&role!=="admin")return <div className="page admin-denied"><h2>Admin access required</h2><p>This area is only available to an account marked as an administrator in Firestore.</p></div>;
return <div>{isDashboardRoute?<DashboardRoutes/>:<NormalRoutes/>}</div>;}
