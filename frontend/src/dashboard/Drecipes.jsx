import { useEffect, useState } from "react";

import {
  getRecipes,
  addRecipe,
  deleteRecipe,
  getCategories,
} from "../assets/firebase/firestore";

import { NavLink } from "react-router-dom";

const Drecipes = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // categories
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);

  const [steps, setSteps] = useState([""]);

  const [recipes, setRecipes] = useState([]);

  // ================= FETCH RECIPES =================
  const fetchRecipes = async () => {
    try {
      const data = await getRecipes();
      setRecipes(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FETCH CATEGORIES =================
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Categories error:", err);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchCategories();
  }, []);

  // ================= CATEGORY TOGGLE =================
  const handleCategoryToggle = (name) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  // ================= INGREDIENTS =================
  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", quantity: "" }]);

  const removeIngredient = (index) =>
    setIngredients(ingredients.filter((_, i) => i !== index));

  // ================= STEPS =================
  const handleStepChange = (index, value) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const addStep = () => setSteps([...steps, ""]);

  const removeStep = (index) => setSteps(steps.filter((_, i) => i !== index));

  // ================= ADD =================
  const handleSubmit = async () => {
    if (!title || !description) {
      alert("Fill all fields");
      return;
    }

    const cleanedIngredients = ingredients.filter(
      (i) => i.name.trim() || i.quantity.trim(),
    );

    const cleanedSteps = steps.filter((s) => s.trim());

    try {
      await addRecipe({
        title,
        description,
        categories: selectedCategories,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
        images: [],
        createdAt: new Date(),
      });

      setTitle("");
      setDescription("");
      setSelectedCategories([]);
      setIngredients([{ name: "", quantity: "" }]);
      setSteps([""]);

      fetchRecipes();
    } catch (err) {
      console.error(err);
      alert("Error adding recipe");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (recipe) => {
    if (!window.confirm("Delete this recipe?")) return;

    try {
      await deleteRecipe(recipe.id);
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <h1>Dashboard - Recipes</h1>

      <details>
        <summary>Add Recipe</summary>

        <div className="Dashboard-Add-Recipe">
          <input
            type="text"
            placeholder="Recipe Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* ================= CATEGORIES (FIXED ONLY) ================= */}
          <div className="categories">
            <p>Categories:</p>

            {categories.map((cat) => (
              <label key={cat.id} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.name)}
                  onChange={() => handleCategoryToggle(cat.name)}
                />
                {cat.name}
              </label>
            ))}
          </div>

          {/* ================= INGREDIENTS (UNCHANGED) ================= */}
          <div className="ingredients">
            <p>Ingredients:</p>

            {ingredients.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="Ingredient"
                  value={item.name}
                  onChange={(e) =>
                    handleIngredientChange(index, "name", e.target.value)
                  }
                />

                <input
                  type="text"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleIngredientChange(index, "quantity", e.target.value)
                  }
                />

                <button onClick={() => removeIngredient(index)}>X</button>
              </div>
            ))}

            <button onClick={addIngredient}>Add Ingredient</button>
          </div>

          {/* ================= STEPS (UNCHANGED) ================= */}
          <div className="steps">
            <p>Steps:</p>

            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <textarea
                  placeholder={`Step ${index + 1}`}
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                />

                <button onClick={() => removeStep(index)}>X</button>
              </div>
            ))}

            <button onClick={addStep}>Add Step</button>
          </div>

          <button onClick={handleSubmit}>Add Recipe</button>
        </div>
      </details>

      <hr />

      {/* ================= LIST (UNCHANGED STYLE) ================= */}
      <div className="Recipes-Grid">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="Recipe-Card">
            <div className="Recipe-Image-Wrap">
              <img
                src="https://dummyimage.com/300x300/222/fff&text=Recipe"
                alt={recipe.title}
                className="Recipe-Card-img"
              />
            </div>

            <p>{recipe.title}</p>

            {recipe.categories?.length > 0 && (
              <p>{recipe.categories.join(", ")}</p>
            )}

            <div className="recipe-buttons">
              <NavLink to={`/dashboard/Drecipe/${recipe.id}`}>
                <button>View More</button>
              </NavLink>

              <button onClick={() => handleDelete(recipe)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drecipes;
