import { Routes, Route } from "react-router-dom";
import Home from "../../routes/Home.jsx";
import Recipes from "../../routes/Recipes.jsx";
import Recipe from "../../routes/Recipe.jsx";
import Login from "../../routes/Login.jsx";
import Profile from "../../routes/Profile.jsx";
import EditRecipe from "../../routes/EditRecipe.jsx";
function NormalRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />{" "}
        <Route path="/recipes" element={<Recipes />} />{" "}
        <Route path="/recipe/:id" element={<Recipe />} />{" "}
        <Route path="/login" element={<Login />} />{" "}
        <Route path="/profile/:id" element={<Profile />} />{" "}
        <Route path="/edit-recipe/:id" element={<EditRecipe />} />{" "}
        
      </Routes>
    </div>
  );
}

export default NormalRoutes;
