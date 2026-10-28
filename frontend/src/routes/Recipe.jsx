import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SecureLS from "secure-ls";

import {
  doc,
  getDoc,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";

import { db } from "../assets/firebase/config";
import { getRecipe, getUserRecipes, getPublicRecipes } from "../assets/firebase/firestore";

const ls = new SecureLS({
  encodingType: "aes",
});

const Recipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const uid = ls.get("uid");

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  // ================= FETCH RECIPE =================
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);

        const data = await getRecipe(id);

        if (!data) {
          setRecipe(null);
          return;
        }

        setRecipe(data);

        // CHECK LIKE
        if (uid) {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();

            if (userData.likedRecipes?.includes(id)) {
              setLiked(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, uid, navigate]);

  // ================= LIKE =================
  const handleLike = async () => {
    if (!uid) {
      alert("Login first");
      return;
    }

    try {
      const recipeRef = doc(db, "recipes", id);
      const userRef = doc(db, "users", uid);

      const batch = writeBatch(db);
      if (liked) {
        if ((recipe.likes || 0) > 0) batch.update(recipeRef, { likes: increment(-1) });
        batch.update(userRef, { likedRecipes: arrayRemove(id) });
        await batch.commit();

        setRecipe((prev) => ({ ...prev, likes: Math.max(0, (prev.likes || 1) - 1) }));
        setLiked(false);
      } else {
        batch.update(recipeRef, { likes: increment(1) });
        batch.update(userRef, { likedRecipes: arrayUnion(id) });
        await batch.commit();

        setRecipe((prev) => ({ ...prev, likes: (prev.likes || 0) + 1 }));
        setLiked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= SUB RECIPE =================
  const handleSubRecipe = async (ingredientName) => {
    try {
      const [ownRecipes, publicRecipes] = await Promise.all([
        uid ? getUserRecipes(uid) : Promise.resolve([]),
        getPublicRecipes(),
      ]);
      const recipesById = new Map([...ownRecipes, ...publicRecipes].map((item) => [item.id, item]));
      const recipes = [...recipesById.values()];

      const foundRecipe = recipes.find(
        (r) =>
          r.title?.toLowerCase().trim() === ingredientName.toLowerCase().trim(),
      );

      if (foundRecipe) {
        navigate(`/recipe/${foundRecipe.id}`);
      } else {
        alert("No matching recipe found");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= LOADING =================
  if (loading) return <div className="page">Loading...</div>;

  if (!recipe) return <div className="page">Recipe not found</div>;

  // ================= SORTED INGREDIENTS =================
  const sortedIngredients = [...(recipe.ingredients || [])].sort((a, b) =>
    (a.name || "").localeCompare(b.name || ""),
  );

  return (
    <main className="Matrix-Demo-Detail page Matrix-Private-Recipe">
      <button type="button" className="Matrix-Back-Link Matrix-Back-Button" onClick={() => navigate(-1)}>← Back to recipes</button>
      <section className="Matrix-Detail-Hero">
        <div className="Matrix-Detail-Image">
          <img src={recipe.images?.[0] || "https://dummyimage.com/1200x700/21121b/f2b9ca&text=Recipe"} alt={recipe.title || "Recipe"} />
        </div>
        <div className="Matrix-Detail-Intro">
          <span className="Matrix-Eyebrow">YOUR MATRIX RECIPE{recipe.categories?.length ? ` · ${recipe.categories.join(" · ").toUpperCase()}` : ""}</span>
          <h1>{recipe.title}</h1>
          <p>{recipe.description || "Your saved recipe, ready whenever you need it."}</p>
          <div className="Matrix-Detail-Meta">
            <span><strong>Prep:</strong> {recipe.prepTime || "Not set"}</span>
            <span><strong>Cook:</strong> {recipe.cookTime || "Not set"}</span>
            <span><strong>Difficulty:</strong> {recipe.difficulty || "Not set"}</span>
            <span><strong>Servings:</strong> {recipe.servings || "Not set"}</span>
          </div>
          <div className="Matrix-Recipe-Actions">
            <button type="button" className={`Matrix-Button ${liked ? "Matrix-Button-Light" : "Matrix-Button-Primary"}`} onClick={handleLike}>{liked ? "♥ Liked" : "♡ Like"}</button>
            <span className="Matrix-Like-Count">{recipe.likes || 0} likes</span>
          </div>
        </div>
      </section>
      <section className="Matrix-Recipe-Body">
        <div className="Matrix-Ingredients">
          <span className="Matrix-Eyebrow">GET EVERYTHING READY</span>
          <h2>Ingredients</h2>
          {sortedIngredients.length ? <ul>{sortedIngredients.map((ingredient, index) => (
            <li key={`${ingredient.name}-${index}`}>
              <span>{ingredient.name}{ingredient.quantity === "Sub Recipe" && <button type="button" className="Matrix-Subrecipe-Button" onClick={() => handleSubRecipe(ingredient.name)}>Open sub-recipe ↗</button>}</span>
              <strong>{ingredient.quantity || "As needed"}</strong>
            </li>
          ))}</ul> : <p>No ingredients added yet.</p>}
        </div>
        <div className="Matrix-Instructions">
          <span className="Matrix-Eyebrow">LET'S COOK</span>
          <h2>Instructions</h2>
          {recipe.steps?.length ? <ol>{recipe.steps.map((step, index) => <li key={`${index}-${step}`}><span className="Matrix-Step-Number">{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol> : <p>No instructions added yet.</p>}
        </div>
      </section>
    </main>
  );
};

export default Recipe;
