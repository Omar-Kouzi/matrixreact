import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

import { db } from "../assets/firebase/config";

const DrequestedRecipes = () => {
  const [recipes, setRecipes] = useState([]);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ================= FETCH REQUESTED RECIPES =================
  useEffect(() => {
    const fetchRequestedRecipes = async () => {
      try {
        setLoading(true);

        const querySnapshot = await getDocs(collection(db, "recipes"));

        const allRecipes = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ONLY PENDING RECIPES
        const requestedRecipes = allRecipes.filter(
          (recipe) => recipe.status === "pending",
        );

        setRecipes(requestedRecipes);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestedRecipes();
  }, []);

  // ================= APPROVE RECIPE =================
  const handleApprove = async (recipeId) => {
    const confirmApprove = window.confirm("Approve this recipe?");

    if (!confirmApprove) return;

    try {
      const recipeRef = doc(db, "recipes", recipeId);

      await updateDoc(recipeRef, {
        status: "approved",
        visibility: "public",
        approvedAt: new Date(),
      });

      // REMOVE FROM UI
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));

      alert("Recipe approved ✅");
    } catch (error) {
      console.error("Approve error:", error);

      alert("Error approving recipe");
    }
  };

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  return (
    <div className="page">
      <h1
        style={{
          marginBottom: "30px",
        }}
      >
        Requested Recipes
      </h1>

      {recipes.length === 0 ? (
        <p>No requested recipes</p>
      ) : (
        <div className="Recipes-Grid">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="Recipe-Card">
              {/* IMAGE */}
              <div className="Recipe-Image-Wrap">
                <img
                  src={
                    recipe.images?.[0] ||
                    "https://dummyimage.com/300x300/222/fff&text=Recipe"
                  }
                  alt={recipe.title}
                  className="Recipe-Card-img"
                />
              </div>

              {/* CONTENT */}
              <div
                style={{
                  padding: "15px",
                }}
              >
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    marginBottom: "10px",
                  }}
                >
                  {recipe.title}
                </p>

                {/* DESCRIPTION */}
                <p
                  style={{
                    opacity: 0.7,
                    marginBottom: "15px",
                    fontSize: "14px",
                  }}
                >
                  {recipe.description?.slice(0, 100)}
                  ...
                </p>

                {/* CATEGORIES */}
                {recipe.categories?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    {recipe.categories.map((category, index) => (
                      <span
                        key={index}
                        style={{
                          background: "#222",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                        }}
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {/* META */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {recipe.prepTime && (
                    <span
                      style={{
                        background: "#1d1d1d",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                      }}
                    >
                      Prep: {recipe.prepTime}
                    </span>
                  )}

                  {recipe.cookTime && (
                    <span
                      style={{
                        background: "#1d1d1d",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                      }}
                    >
                      Cook: {recipe.cookTime}
                    </span>
                  )}

                  {recipe.servings && (
                    <span
                      style={{
                        background: "#1d1d1d",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                      }}
                    >
                      Serves {recipe.servings}
                    </span>
                  )}

                  {recipe.difficulty && (
                    <span
                      style={{
                        background: "#1d1d1d",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                      }}
                    >
                      {recipe.difficulty}
                    </span>
                  )}
                </div>

                {/* BUTTONS */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  {/* VIEW */}
                  <button
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: "14px",
                      border: "none",
                      background: "#222",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    View More
                  </button>

                  {/* APPROVE */}
                  <button
                    onClick={() => handleApprove(recipe.id)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: "14px",
                      border: "none",
                      background: "var(--accent)",
                      color: "#111",
                      cursor: "pointer",
                      fontWeight: "700",
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DrequestedRecipes;
