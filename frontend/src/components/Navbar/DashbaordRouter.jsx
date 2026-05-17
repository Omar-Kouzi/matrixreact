import { Routes, Route } from "react-router-dom";
import Dhome from "../../dashboard/Dhome";
import Drecipes from "../../dashboard/Drecipes";
import Drecipe from "../../dashboard/Drecipe";
function DashboardRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/dashboard/" element={<Dhome />} />
        <Route path="/dashboard/Drecipes" element={<Drecipes />} />
        <Route path="/dashboard/Drecipe/:id" element={<Drecipe />} />
      </Routes>
    </div>
  );
}

export default DashboardRoutes;
