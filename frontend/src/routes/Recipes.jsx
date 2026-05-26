import { useEffect, useState } from "react";

import { getRecipes } from "../assets/firebase/firestore";

import { useNavigate } from "react-router-dom";

import SecureLS from "secure-ls";

import { collection, getDocs } from "firebase/firestore";

import { db } from "../assets/firebase/config";

const ls = new SecureLS({
  encodingType: "aes",
});

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);

  const [search, setSearch] = useState("");

  const [sort, setSort] = useState("");

  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const navigate = useNavigate();

  const uid = ls.get("uid");

  // ================= FETCH RECIPES =================
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const allRecipes = await getRecipes();

        // ================= GET USERS =================
        const usersSnapshot = await getDocs(collection(db, "users"));

        const users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ================= ONLY ADMIN RECIPES =================
        const adminRecipes = allRecipes.filter((recipe) => {
          const user = users.find((u) => u.id === recipe.authorId);

          return user?.role === "admin";
        });

        // ================= MY RECIPES =================
        const myRecipes = allRecipes.filter(
          (recipe) => recipe.authorId === uid,
        );

        // ================= SET =================
        if (showOnlyMine) {
          setRecipes(myRecipes);
        } else {
          setRecipes(adminRecipes);
        }
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    fetchRecipes();
  }, [showOnlyMine, uid]);

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

  return (
    <div className="Recipes-page page">
      {/* ================= FILTERS ================= */}
      <details className="Filter-Wraper">
        <summary>filter</summary>

        <div className="Filter">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* SORT */}
          <div className="Custom-Dropdown">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Sort By</option>

              <option value="name">Name (A-Z)</option>

              <option value="newest">Newest</option>
            </select>
          </div>

          {/* SHOW MY RECIPES */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#fff",
              marginTop: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={showOnlyMine}
              onChange={(e) => setShowOnlyMine(e.target.checked)}
            />
            Show Only My Recipes
          </label>
        </div>
      </details>

      <hr />

      {/* ================= TITLE ================= */}
      <h1>{showOnlyMine ? "My Recipes" : "Recipes"}</h1>

      {/* ================= EMPTY ================= */}
      {processedRecipes.length === 0 && (
        <p
          style={{
            opacity: 0.7,
            marginTop: "20px",
          }}
        >
          No recipes found.
        </p>
      )}

      {/* ================= GRID ================= */}
      <div className="Recipes-Grid">
        {processedRecipes.map((recipe) => (
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

            {/* TITLE */}
            <p
              style={{
                fontSize: "20px",
                fontWeight: "700",
                marginTop: "14px",
              }}
            >
              {recipe.title}
            </p>

            {/* BUTTON */}
            <div
              className="recipe-buttons"
              style={{
                marginTop: "18px",
              }}
            >
              <button
                className="Recipe-Card-Button"
                onClick={() => navigate(`/recipe/${recipe.id}`)}
              >
                View More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recipes;
