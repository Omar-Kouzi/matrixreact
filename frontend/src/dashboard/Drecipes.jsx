// ================= IMPORTS =================
import { useEffect, useState } from "react";
import SecureLS from "secure-ls";
import {
  getRecipes,
  addRecipe,
  deleteRecipe,
  getCategories,
  addCategory,
} from "../assets/firebase/firestore";

import { NavLink } from "react-router-dom";

const ls = new SecureLS({
  encodingType: "aes",
});

const Drecipes = () => {
  const uid = ls.get("uid");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // categories
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // new category
  const [newCategory, setNewCategory] = useState("");

  // ingredients
  const [ingredients, setIngredients] = useState([
    {
      name: "",
      quantity: "",
    },
  ]);

  // steps
  const [steps, setSteps] = useState([""]);

  // recipes
  const [recipes, setRecipes] = useState([]);

  // EXTRA INFO
  const [difficulty, setDifficulty] = useState("Easy");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [featured, setFeatured] = useState(false);

  // ================= FETCH RECIPES =================
  const fetchRecipes = async () => {
    try {
      const data = await getRecipes();

      // ONLY APPROVED RECIPES
      const approvedRecipes = data.filter(
        (recipe) =>
          recipe.status === "approved" && recipe.visibility === "public",
      );

      setRecipes(approvedRecipes);
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

  // ================= ADD CATEGORY =================
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await addCategory({
        name: newCategory,
        createdAt: new Date(),
      });
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      console.error(err);

      alert("Error adding category");
    }
  };

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

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        name: "",
        quantity: "",
      },
    ]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // ================= STEPS =================
  const handleStepChange = (index, value) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // ================= ADD RECIPE =================
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
        // BASIC
        title,
        description,

        // USER
        createdBy: uid,
        authorId: uid,

        // STATUS
        visibility: "public",

        // IMPORTANT
        status: "approved",
        featured,

        // RECIPE DATA
        categories: selectedCategories,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,

        // EXTRA INFO
        difficulty,
        prepTime,
        cookTime,
        servings,

        // IMAGES
        images: [],

        // DATES
        createdAt: new Date(),
        updatedAt: new Date(),

        // STATS
        saves: 0,
      });

      // RESET
      setTitle("");
      setDescription("");
      setSelectedCategories([]);
      setIngredients([
        {
          name: "",
          quantity: "",
        },
      ]);

      setSteps([""]);
      setDifficulty("Easy");
      setPrepTime("");
      setCookTime("");
      setServings("");
      setFeatured(false);
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
      <h1
        style={{
          marginBottom: "25px",
        }}
      >
        Dashboard - Recipes
      </h1>

      <details>
        <summary
          style={{
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "20px",
          }}
        >
          Add Recipe
        </summary>

        {/* ================= FLEX WRAPPER ================= */}
        <div
          style={{
            display: "flex",
            gap: "30px",
            alignItems: "flex-start",
            marginTop: "20px",
          }}
        >
          {/* ================= RECIPE FORM ================= */}
          <div
            className="Dashboard-Add-Recipe"
            style={{
              flex: 1,
              background: "#161616",
              border: "1px solid #2a2a2a",
              borderRadius: "24px",
              padding: "25px",
            }}
          >
            {/* BASIC */}

            <input
              type="text"
              placeholder="Recipe Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: "120px",
                resize: "vertical",
              }}
            />

            {/* EXTRA INFO */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <div>
                <p style={labelStyle}>Difficulty</p>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={inputStyle}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <div>
                <p style={labelStyle}>Prep Time</p>

                <input
                  type="text"
                  placeholder="0 mins"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <p style={labelStyle}>Cook Time</p>

                <input
                  type="text"
                  placeholder="0 mins"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <p style={labelStyle}>Servings</p>

                <input
                  type="number"
                  placeholder="0"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* FEATURED */}

            <div
              style={{
                background: "#1d1d1d",
                border: "1px solid #2e2e2e",
                padding: "18px",
                borderRadius: "16px",
                marginBottom: "25px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Featured Recipe
              </label>

              <p
                style={{
                  opacity: 0.6,
                  marginTop: "10px",
                  fontSize: "14px",
                }}
              >
                Featured recipes can appear on homepage sliders and special
                sections.
              </p>
            </div>

            {/* CATEGORIES */}

            <div
              className="categories"
              style={{
                marginTop: "20px",
                padding: "20px",
                borderRadius: "18px",
                background: "#1c1c1c",
                border: "1px solid #2a2a2a",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "600",
                  }}
                >
                  Categories
                </p>

                <span
                  style={{
                    fontSize: "13px",
                    opacity: 0.6,
                  }}
                >
                  {selectedCategories.length} selected
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                {categories.map((cat) => {
                  const active = selectedCategories.includes(cat.name);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.name)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "999px",
                        border: active
                          ? "1px solid var(--accent)"
                          : "1px solid #333",
                        background: active ? "var(--accent)" : "#222",
                        color: active ? "#111" : "#fff",
                        cursor: "pointer",
                        transition: "0.2s",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INGREDIENTS */}

            <div
              className="ingredients"
              style={{
                marginBottom: "25px",
              }}
            >
              <p style={sectionTitle}>Ingredients</p>

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
                    style={inputStyle}
                  />

                  <input
                    type="text"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) =>
                      handleIngredientChange(index, "quantity", e.target.value)
                    }
                    style={inputStyle}
                  />

                  <button
                    onClick={() => removeIngredient(index)}
                    style={deleteButtonStyle}
                  >
                    X
                  </button>
                </div>
              ))}

              <button onClick={addIngredient} style={secondaryButton}>
                Add Ingredient
              </button>
            </div>

            {/* STEPS */}

            <div className="steps">
              <p style={sectionTitle}>Steps</p>

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
                    style={{
                      ...inputStyle,
                      minHeight: "90px",
                      resize: "vertical",
                    }}
                  />

                  <button
                    onClick={() => removeStep(index)}
                    style={deleteButtonStyle}
                  >
                    X
                  </button>
                </div>
              ))}

              <button onClick={addStep} style={secondaryButton}>
                Add Step
              </button>
            </div>

            {/* SUBMIT */}

            <button
              onClick={handleSubmit}
              style={{
                marginTop: "30px",
                padding: "16px",
                borderRadius: "16px",
                border: "none",
                background: "var(--accent)",
                color: "#111",
                fontWeight: "700",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Add Public Recipe
            </button>
          </div>

          {/* CATEGORY MANAGER */}

          <div
            style={{
              width: "320px",
              padding: "24px",
              borderRadius: "24px",
              background: "#161616",
              border: "1px solid #2b2b2b",
              height: "fit-content",
              position: "sticky",
              top: "20px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
                fontSize: "22px",
              }}
            >
              Category Manager
            </h3>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <input
                type="text"
                placeholder="New category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={inputStyle}
              />

              <button
                onClick={handleAddCategory}
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "var(--accent)",
                  color: "#111",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    background: "#222",
                    border: "1px solid #333",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      <hr
        style={{
          margin: "40px 0",
          borderColor: "#2a2a2a",
        }}
      />

      {/* RECIPES */}

      <div className="Recipes-Grid">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="Recipe-Card">
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

            <p>{recipe.title}</p>

        

        

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

// ================= STYLES =================

const inputStyle = {
  width: "90%",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #333",
  background: "#222",
  color: "#fff",
  marginBottom: "15px",
  outline: "none",
};

const labelStyle = {
  marginBottom: "8px",
  fontSize: "14px",
  opacity: 0.7,
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "15px",
};

const secondaryButton = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#333",
  color: "#fff",
  cursor: "pointer",
  marginTop: "10px",
};

const deleteButtonStyle = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "none",
  background: "#ff4d4d",
  color: "#fff",
  cursor: "pointer",
};
export default Drecipes;
