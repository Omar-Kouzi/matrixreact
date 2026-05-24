import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import SecureLS from "secure-ls";

import { addRecipe, getCategories } from "../assets/firebase/firestore";

const ls = new SecureLS({
  encodingType: "aes",
});

const AddRecipe = () => {
  const navigate = useNavigate();

  const uid = ls.get("uid");

  // ================= STATE =================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");

  const [servings, setServings] = useState("");

  const [difficulty, setDifficulty] = useState("Easy");

  const [visibility, setVisibility] = useState("private");

  const [categories, setCategories] = useState([]);

  const [selectedCategories, setSelectedCategories] = useState([]);

  const [ingredients, setIngredients] = useState([
    {
      name: "",
      quantity: "",
    },
  ]);

  const [steps, setSteps] = useState([""]);

  // ================= FETCH CATEGORIES =================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, []);

  // ================= CATEGORY TOGGLE =================
  const handleCategoryToggle = (name) => {
    setSelectedCategories((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name],
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
    setIngredients(
      ingredients.filter((_, i) => i !== index),
    );
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
    setSteps(
      steps.filter((_, i) => i !== index),
    );
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (
      title.trim() === "" ||
      description.trim() === ""
    ) {
      alert("Fill all fields");

      return;
    }

    try {
      const cleanedIngredients = ingredients.filter(
        (item) =>
          item.name.trim() !== "" ||
          item.quantity.trim() !== "",
      );

      const cleanedSteps = steps.filter(
        (step) => step.trim() !== "",
      );

      await addRecipe({
        title,
        description,

        prepTime,
        cookTime,
        servings,
        difficulty,

        visibility,

        status: "draft",

        authorId: uid,
        createdBy: uid,

        categories: selectedCategories,

        ingredients: cleanedIngredients,

        steps: cleanedSteps,

        images: [],

        saves: 0,

        createdAt: new Date(),
        updatedAt: new Date(),
      });

      alert("Recipe created ✅");

      navigate(`/profile/${uid}`);
    } catch (error) {
      console.error(error);

      alert("Error creating recipe");
    }
  };

  return (
    <div className="page">
      <h1>Add Recipe</h1>

      <div
        className="Dashboard-Add-Recipe"
        style={{
          background: "#161616",
          border: "1px solid #2a2a2a",
          borderRadius: "24px",
          padding: "25px",
        }}
      >
        {/* TITLE */}
        <label>Recipe Title</label>

        <input
          type="text"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Recipe title"
          style={{
            padding: "14px",
            borderRadius: "14px",
            border: "1px solid #333",
            background: "#222",
            color: "#fff",
            marginBottom: "20px",
            outline: "none",
            width: "90%",
          }}
        />

        {/* DESCRIPTION */}
        <label>Description</label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Description"
          style={{
            minHeight: "120px",
            padding: "14px",
            borderRadius: "14px",
            border: "1px solid #333",
            background: "#222",
            color: "#fff",
            marginBottom: "20px",
            outline: "none",
            resize: "vertical",
            width: "90%",
          }}
        />

        {/* EXTRA FIELDS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <div>
            <label>Prep Time</label>

            <input
              type="text"
              placeholder="0 mins"
              value={prepTime}
              onChange={(e) =>
                setPrepTime(e.target.value)
              }
              style={{
                width: "90%",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid #333",
                background: "#222",
                color: "#fff",
                marginTop: "10px",
              }}
            />
          </div>

          <div>
            <label>Cook Time</label>

            <input
              type="text"
              placeholder="0 mins"
              value={cookTime}
              onChange={(e) =>
                setCookTime(e.target.value)
              }
              style={{
                width: "90%",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid #333",
                background: "#222",
                color: "#fff",
                marginTop: "10px",
              }}
            />
          </div>

          <div>
            <label>Servings</label>

            <input
              type="number"
              placeholder="0"
              value={servings}
              onChange={(e) =>
                setServings(e.target.value)
              }
              style={{
                width: "90%",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid #333",
                background: "#222",
                color: "#fff",
                marginTop: "10px",
              }}
            />
          </div>

          <div>
            <label>Difficulty</label>

            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value)
              }
              style={{
                width: "90%",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid #333",
                background: "#222",
                color: "#fff",
                marginTop: "10px",
              }}
            >
              <option value="Easy">
                Easy
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Hard">
                Hard
              </option>
            </select>
          </div>
        </div>

        {/* VISIBILITY */}
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <label>Visibility</label>

          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value)
            }
            style={{
              width: "90%",
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid #333",
              background: "#222",
              color: "#fff",
              marginTop: "10px",
            }}
          >
            <option value="private">
              Private
            </option>

            <option value="public">
              Public
            </option>
          </select>
        </div>

        {/* CATEGORIES */}
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            borderRadius: "18px",
            background: "#1c1c1c",
            border: "1px solid #2a2a2a",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Categories
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {categories.map((cat) => {
              const active =
                selectedCategories.includes(
                  cat.name,
                );

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    handleCategoryToggle(
                      cat.name,
                    )
                  }
                  style={{
                    padding: "10px 16px",
                    borderRadius: "999px",
                    border: active
                      ? "1px solid var(--accent)"
                      : "1px solid #333",
                    background: active
                      ? "var(--accent)"
                      : "#222",
                    color: active
                      ? "#111"
                      : "#fff",
                    cursor: "pointer",
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
          style={{
            marginBottom: "25px",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Ingredients
          </p>

          {ingredients.map(
            (item, index) => (
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
                    handleIngredientChange(
                      index,
                      "name",
                      e.target.value,
                    )
                  }
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border:
                      "1px solid #333",
                    background: "#222",
                    color: "#fff",
                  }}
                />

                <input
                  type="text"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleIngredientChange(
                      index,
                      "quantity",
                      e.target.value,
                    )
                  }
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border:
                      "1px solid #333",
                    background: "#222",
                    color: "#fff",
                  }}
                />

                <button
                  onClick={() =>
                    removeIngredient(
                      index,
                    )
                  }
                >
                  X
                </button>
              </div>
            ),
          )}

          <button
            onClick={addIngredient}
          >
            Add Ingredient
          </button>
        </div>

        {/* STEPS */}
        <div>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Steps
          </p>

          {steps.map(
            (step, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <textarea
                  placeholder={`Step ${
                    index + 1
                  }`}
                  value={step}
                  onChange={(e) =>
                    handleStepChange(
                      index,
                      e.target.value,
                    )
                  }
                  style={{
                    flex: 1,
                    minHeight: "90px",
                    padding: "12px",
                    borderRadius: "12px",
                    border:
                      "1px solid #333",
                    background: "#222",
                    color: "#fff",
                  }}
                />

                <button
                  onClick={() =>
                    removeStep(index)
                  }
                >
                  X
                </button>
              </div>
            ),
          )}

          <button onClick={addStep}>
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
          }}
        >
          Create Recipe
        </button>
      </div>
    </div>
  );
};

export default AddRecipe;