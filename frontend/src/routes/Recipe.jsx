import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { getRecipe } from "../assets/firebase/firestore";

const Recipe = () => {
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const data = await getRecipe(id);

        setRecipe(data);
      } catch (error) {
        console.error(
          "Error fetching recipe:",
          error,
        );
      }
    };

    fetchRecipe();
  }, [id]);

  if (!recipe)
    return (
      <div className="page">
        Loading...
      </div>
    );

  return (
    <div className="Recipe-page page">
      <div className="Recipe-Data">
        <h1>{recipe.title}</h1>

        {recipe.category && (
          <p>
            <strong>
              Category:
            </strong>{" "}
            {recipe.category}
          </p>
        )}

        <p>{recipe.description}</p>

        {/* ✅ Ingredients */}
        {recipe.ingredients
          ?.length > 0 && (
          <div className="Recipe-Ingredients">
            <h2>Ingredients</h2>

            <ul>
              {recipe.ingredients.map(
                (
                  ingredient,
                  index,
                ) => (
                  <li key={index}>
                    <strong>
                      {
                        ingredient.name
                      }
                    </strong>{" "}
                    -{" "}
                    {
                      ingredient.quantity
                    }
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {/* ✅ Steps */}
        {recipe.steps?.length >
          0 && (
          <div className="Recipe-Steps">
            <h2>Steps</h2>

            <ol>
              {recipe.steps.map(
                (step, index) => (
                  <li key={index}>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </div>
        )}
      </div>

      {/* ✅ IMAGES */}
      <div className="Recipe-Image-Wrap">
        <img
          src={
            recipe.images?.[0] ||
            "placeholder-image.jpg"
          }
          alt={recipe.title}
          className="Recipe-img primary-img"
        />

        {recipe.images?.[1] && (
          <img
            src={recipe.images[1]}
            alt={recipe.title}
            className="Recipe-img hover-img"
          />
        )}
      </div>
    </div>
  );
};

export default Recipe;