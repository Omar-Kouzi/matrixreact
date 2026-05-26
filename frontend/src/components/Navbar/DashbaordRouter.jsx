import { Routes, Route } from "react-router-dom";
import Dhome from "../../dashboard/Dhome";
import Drecipes from "../../dashboard/Drecipes";
import Drecipe from "../../dashboard/Drecipe";
// import Drequestedrecipes from "../../dashboard/Drequestedrecipes";
function DashboardRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/dashboard/" element={<Dhome />} />
        <Route path="/dashboard/Drecipes" element={<Drecipes />} />
        <Route path="/dashboard/Drecipe/:id" element={<Drecipe />} />
        {/* <Route path="/dashboard/Drequestedrecipes" element={<Drequestedrecipes />} /> */}
      </Routes>
    </div>
  );
}

export default DashboardRoutes;
