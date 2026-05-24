import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SecureLS from "secure-ls";

import {
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

import { db } from "../assets/firebase/config";
import { getRecipe, getRecipes } from "../assets/firebase/firestore";

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

        // SECURITY
        const canView =
          (data.status === "approved" && data.visibility === "public") ||
          data.authorId === uid;

        if (!canView) {
          navigate("/recipes");
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

      if (liked) {
        await updateDoc(recipeRef, {
          likes: increment(-1),
        });

        await updateDoc(userRef, {
          likedRecipes: arrayRemove(id),
        });

        setRecipe((prev) => ({
          ...prev,
          likes: (prev.likes || 1) - 1,
        }));

        setLiked(false);
      } else {
        await updateDoc(recipeRef, {
          likes: increment(1),
        });

        await updateDoc(userRef, {
          likedRecipes: arrayUnion(id),
        });

        setRecipe((prev) => ({
          ...prev,
          likes: (prev.likes || 0) + 1,
        }));

        setLiked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= SUB RECIPE =================
  const handleSubRecipe = async (ingredientName) => {
    try {
      const recipes = await getRecipes();

      const foundRecipe = recipes.find(
        (r) =>
          r.title?.toLowerCase().trim() ===
            ingredientName.toLowerCase().trim() &&
          r.status === "approved" &&
          r.visibility === "public"
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
    (a.name || "").localeCompare(b.name || "")
  );

  return (
    <div className="Recipe-page page">
      {/* HERO */}
      <div className="Recipe-Hero">
        <div className="Recipe-Hero-Images">
          <div className="Recipe-Main-Image-Wrap">
            <img
              src={
                recipe.images?.[0] ||
                "https://dummyimage.com/1200x700/222/fff&text=Recipe"
              }
              alt={recipe.title}
              className="Recipe-Main-Image"
            />
          </div>
        </div>

        {/* INFO */}
        <div className="Recipe-Info">
          <h1 className="Recipe-Title">{recipe.title}</h1>

          <p className="Recipe-Description">{recipe.description}</p>

          {/* LIKE */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
            <button
              onClick={handleLike}
              style={{
                padding: "14px 22px",
                borderRadius: "14px",
                border: "none",
                background: liked ? "#ff4d6d" : "#222",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {liked ? "♥ Liked" : "♡ Like"}
            </button>

            <div
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                background: "#1f1f1f",
                border: "1px solid #2e2e2e",
              }}
            >
              {recipe.likes || 0} likes
            </div>
          </div>

          {/* META */}
          <div className="Recipe-Meta-Grid">
            <div className="Recipe-Meta-Card">
              <p>Prep Time</p>
              <h3>{recipe.prepTime || "Not calculated yet"}</h3>
            </div>

            <div className="Recipe-Meta-Card">
              <p>Cook Time</p>
              <h3>{recipe.cookTime || "Not calculated yet"}</h3>
            </div>

            <div className="Recipe-Meta-Card">
              <p>Servings</p>
              <h3>{recipe.servings || "Not specified"}</h3>
            </div>

            <div className="Recipe-Meta-Card">
              <p>Difficulty</p>
              <h3>{recipe.difficulty || "Unknown"}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="Recipe-Content">
        {/* INGREDIENTS */}
        <div className="Recipe-Ingredients-Card">
          <h2>Ingredients</h2>

          {sortedIngredients.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#1f1f1f",
                    padding: "16px",
                    borderRadius: "18px",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {ingredient.name}
                    </p>

                    {ingredient.quantity === "Sub Recipe" && (
                      <button
                        onClick={() => handleSubRecipe(ingredient.name)}
                        style={{
                          marginTop: "8px",
                          padding: "8px 14px",
                          borderRadius: "10px",
                          border: "1px solid #3a3a3a",
                          background: "#2a2a2a",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Open Sub Recipe
                      </button>
                    )}
                  </div>

                  <span style={{ opacity: 0.7 }}>
                    {ingredient.quantity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No ingredients added.</p>
          )}
        </div>

        {/* STEPS */}
        <div className="Recipe-Steps-Card">
          <h2>Instructions</h2>

          {recipe.steps?.length > 0 ? (
            <div className="Recipe-Steps-List">
              {recipe.steps.map((step, index) => (
                <div key={index} className="Recipe-Step">
                  <div className="Recipe-Step-Number">{index + 1}</div>
                  <div className="Recipe-Step-Text">{step}</div>
                </div>
              ))}
            </div>
          ) : (
            <p>No steps added.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recipe;