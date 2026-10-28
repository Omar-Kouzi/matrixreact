import { Routes, Route, Navigate } from "react-router-dom";
import Dhome from "../../dashboard/Dhome";
import Drecipes from "../../dashboard/Drecipes";
import Drecipe from "../../dashboard/Drecipe";
import DdemoRecipes from "../../dashboard/DdemoRecipes";
import Dpricing from "../../dashboard/Dpricing";
import Dusers from "../../dashboard/Dusers";
import DhomeSettings from "../../dashboard/DhomeSettings";
export default function DashboardRoutes(){return <div><Routes><Route path="/dashboard/" element={<Dhome/>}/><Route path="/dashboard/Drecipes" element={<Drecipes/>}/><Route path="/dashboard/Drecipe/:id" element={<Drecipe/>}/><Route path="/dashboard/home-settings" element={<DhomeSettings/>}/><Route path="/dashboard/demo-recipes" element={<DdemoRecipes/>}/><Route path="/dashboard/pricing" element={<Dpricing/>}/><Route path="/dashboard/users" element={<Dusers/>}/><Route path="*" element={<Navigate to="/dashboard/" replace/>}/></Routes></div>}
