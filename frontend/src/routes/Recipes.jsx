import { useEffect, useState } from "react";

import { getUserRecipes } from "../assets/firebase/firestore";

import { useNavigate, Navigate } from "react-router-dom";

import SecureLS from "secure-ls";
import { FaArrowRight } from "react-icons/fa6";


const ls = new SecureLS({
  encodingType: "aes",
});

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);

  const [search, setSearch] = useState("");

  const [sort, setSort] = useState("");


  const navigate = useNavigate();

  const uid = ls.get("uid");

  // ================= FETCH RECIPES =================
  useEffect(() => {
    if (!uid) {
      setRecipes([]);
      return;
    }

    let cancelled = false;
    const fetchRecipes = async () => {
      try {
        const myRecipes = await getUserRecipes(uid);
        if (!cancelled) setRecipes(myRecipes);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    fetchRecipes();
    return () => { cancelled = true; };
  }, [uid]);

  // ================= FILTERS =================
  const processedRecipes = recipes
    .filter((recipe) => {
      const matchesSearch = recipe.title
        ?.toLowerCase()
        .includes(search.toLowerCase());

      return matchesSearch;
    })

    .sort((a, b) => {
      // ================= NAME =================
      if (sort === "name") {
        return a.title.localeCompare(b.title);
      }

      // ================= NEWEST =================
      if (sort === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }

      return 0;
    });

  if (!uid) return <Navigate to="/login" replace />;

  return (
    <div className="Recipes-page page">
      <section className="Recipes-Content">
        <div className="Matrix-Section-Heading Recipes-Heading">
          <span className="Matrix-Eyebrow">YOUR PERSONAL COLLECTION</span>
          <h1>My Recipes</h1>
          <p>All the recipes you have saved in your own kitchen notebook.</p>
        </div>

        <details className="Filter-Wraper Recipes-Filter">
          <summary>Search & sort recipes</summary>
          <div className="Filter">
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="Custom-Dropdown">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="">Sort By</option>
                <option value="name">Name (A-Z)</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </details>

        {processedRecipes.length === 0 ? (
          <p className="Recipes-Empty">No recipes found. Add a recipe to start building your collection.</p>
        ) : (
          <div className="Matrix-Demo-Grid Recipes-Grid">
            {processedRecipes.map((recipe, index) => {
              const category = Array.isArray(recipe.categories)
                ? recipe.categories[0] || "MY RECIPE"
                : recipe.category || "MY RECIPE";
              const prep = Number(recipe.prepTime) || 0;
              const cook = Number(recipe.cookTime) || 0;
              const totalTime = prep + cook;
              const time = recipe.time || (totalTime > 0 ? `${totalTime} min` : "Your collection");
              const description = recipe.description || "Your saved recipe, with ingredients and preparation details ready whenever you need them.";
              const image = recipe.images?.[0] || recipe.image || "https://dummyimage.com/900x650/21121b/f2b9ca&text=Matrix+Recipe";
              return (
                <article className="Matrix-Demo-Card" key={recipe.id}>
                  <button
                    type="button"
                    className="Matrix-Demo-Image-Link Recipes-Image-Button"
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                    aria-label={`View ${recipe.title || "recipe"}`}
                  >
                    <img src={image} alt={recipe.title || "Recipe"} loading="lazy" />
                    <span className="Matrix-Demo-Number">{String(index + 1).padStart(2, "0")}</span>
                  </button>
                  <div className="Matrix-Demo-Card-Body">
                    <div className="Matrix-Demo-Meta"><span>{category}</span><span>{time}</span></div>
                    <h3>{recipe.title || "Untitled recipe"}</h3>
                    <p>{description}</p>
                    <button className="Matrix-Recipe-Link Recipes-View-Link" type="button" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                      View recipe <FaArrowRight />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Recipes;
