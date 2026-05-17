import { useEffect, useState } from "react";
import { getRecipes } from "../assets/firebase/firestore";
import { useNavigate } from "react-router-dom";

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const allRecipes = await getRecipes();
        setRecipes(allRecipes);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    fetchRecipes();
  }, []);

  const processedRecipes = recipes
    .filter((recipe) =>
      recipe.title?.toLowerCase().includes(search.toLowerCase())
    )

    .sort((a, b) => {
      if (sort === "name") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "newest") {
        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      }

      return 0;
    });

  return (
    <div className="Recipes-page page">
      <details className="Filter-Wraper">
        <summary>filter</summary>

        <div className="Filter">
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="Custom-Dropdown">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">Sort By</option>
              <option value="name">Name (A-Z)</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </details>

      <hr />

      <h1>Recipes</h1>

      <div className="Recipes-Grid">
        {processedRecipes.map((recipe) => {
          return (
            <div key={recipe.id} className="Recipe-Card">
              <div className="Recipe-Image-Wrap">
                <img
                  src={
                    recipe.image ||
                    "placeholder-image.jpg"
                  }
                  alt={recipe.title}
                  className="Recipe-Card-img"
                />
              </div>

              <div className="Recipe-Card-Name">
                <p>{recipe.title}</p>

                {recipe.category && (
                  <p>{recipe.category}</p>
                )}
              </div>

              <button
                className="Recipe-Card-Button"
                onClick={() =>
                  navigate(`/recipe/${recipe.id}`)
                }
              >
                view more
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Recipes;