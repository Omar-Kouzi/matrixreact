import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import SecureLS from "secure-ls";

import { getRecipe } from "../assets/firebase/firestore";

const ls = new SecureLS({
  encodingType: "aes",
});

const Recipe = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const uid = ls.get("uid");

  const [recipe, setRecipe] = useState(null);

  const [loading, setLoading] = useState(true);

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

        // ================= SECURITY =================
        const canView =
          (data.status === "approved" && data.visibility === "public") ||
          data.authorId === uid;

        if (!canView) {
          navigate("/recipes");

          return;
        }

        setRecipe(data);
      } catch (error) {
        console.error("Error fetching recipe:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, uid, navigate]);

  // ================= LOADING =================
  if (loading) {
    return <div className="page">Loading...</div>;
  }

  // ================= NOT FOUND =================
  if (!recipe) {
    return <div className="page">Recipe not found</div>;
  }

  return (
    <div className="Recipe-page page">
      {/* ================= HERO ================= */}
      <div className="Recipe-Hero">
        {/* ================= IMAGES ================= */}
        <div className="Recipe-Hero-Images">
          {/* MAIN IMAGE */}
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

          {/* GALLERY */}
          {recipe.images?.length > 1 && (
            <div className="Recipe-Gallery">
              {recipe.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${recipe.title}-${index}`}
                  className="Recipe-Gallery-Image"
                />
              ))}
            </div>
          )}
        </div>

        {/* ================= INFO ================= */}
        <div className="Recipe-Info">
          {/* TITLE */}
          <h1 className="Recipe-Title">{recipe.title}</h1>

          {/* DESCRIPTION */}
          <p className="Recipe-Description">{recipe.description}</p>

          {/* CATEGORIES */}
          {recipe.categories?.length > 0 && (
            <div className="Recipe-Categories">
              {recipe.categories.map((cat, index) => (
                <span key={index} className="Recipe-Category">
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* META */}
          <div className="Recipe-Meta-Grid">
            {recipe.prepTime && (
              <div className="Recipe-Meta-Card">
                <p className="Recipe-Meta-Title">Prep Time</p>

                <h3 className="Recipe-Meta-Value">{recipe.prepTime}</h3>
              </div>
            )}

            {recipe.cookTime && (
              <div className="Recipe-Meta-Card">
                <p className="Recipe-Meta-Title">Cook Time</p>

                <h3 className="Recipe-Meta-Value">{recipe.cookTime}</h3>
              </div>
            )}

            {recipe.servings && (
              <div className="Recipe-Meta-Card">
                <p className="Recipe-Meta-Title">Servings</p>

                <h3 className="Recipe-Meta-Value">{recipe.servings}</h3>
              </div>
            )}

            {recipe.difficulty && (
              <div className="Recipe-Meta-Card">
                <p className="Recipe-Meta-Title">Difficulty</p>

                <h3 className="Recipe-Meta-Value">{recipe.difficulty}</h3>
              </div>
            )}
          </div>

          {/* STATUS */}
          {recipe.status && (
            <div className="Recipe-Status-Wrap">
              <span className={`Recipe-Status Recipe-Status-${recipe.status}`}>
                {recipe.status}
              </span>
            </div>
          )}

          {/* FEATURED */}
          {recipe.featured && (
            <div className="Recipe-Featured-Wrap">
              <span className="Recipe-Featured">Featured Recipe</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="Recipe-Content">
        {/* ================= INGREDIENTS ================= */}
        <div className="Recipe-Ingredients-Card">
          <h2 className="Recipe-Section-Title">Ingredients</h2>

          {recipe.ingredients?.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#1f1f1f",
                    border: "1px solid #2e2e2e",
                    padding: "16px",
                    borderRadius: "18px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "600",
                    }}
                  >
                    {ingredient.name}
                  </p>

                  <span
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    {ingredient.quantity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                opacity: 0.7,
              }}
            >
              No ingredients added.
            </p>
          )}
        </div>

        {/* ================= STEPS ================= */}
        <div className="Recipe-Steps-Card">
          <h2 className="Recipe-Section-Title">Instructions</h2>

          {recipe.steps?.length > 0 ? (
            <div className="Recipe-Steps-List">
              {recipe.steps.map((step, index) => (
                <div key={index} className="Recipe-Step">
                  {/* NUMBER */}
                  <div className="Recipe-Step-Number">{index + 1}</div>

                  {/* STEP */}
                  <div className="Recipe-Step-Text">{step}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="Recipe-Empty">No steps added.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recipe;
