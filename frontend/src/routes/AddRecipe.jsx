// ================= IMPORTS =================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SecureLS from "secure-ls";

import {
  addRecipe,
  getCategories,
  addCategory,
} from "../assets/firebase/firestore";

// ================= SECURE LOCAL STORAGE =================

const ls = new SecureLS({
  encodingType: "aes",
});

// ================= COMPONENT =================

const AddRecipe = () => {
  const navigate = useNavigate();

  const uid = ls.get("uid");

  // ================= BASIC INFO =================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // ================= EXTRA INFO =================

  const [difficulty, setDifficulty] = useState("Easy");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [featured, setFeatured] = useState(false);

  // ================= CATEGORIES =================

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [newCategory, setNewCategory] = useState("");

  // ================= INGREDIENTS =================

  const [ingredients, setIngredients] = useState([
    {
      name: "",
      quantity: "",
    },
  ]);

  // ================= STEPS =================

  const [steps, setSteps] = useState([""]);

  // ================= AI DESCRIPTION =================

  const [aiDescription, setAiDescription] = useState(null);
  const [loadingAIDesc, setLoadingAIDesc] = useState(false);

  // ================= AI STEPS =================

  const [aiSteps, setAiSteps] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // ================= SUBMIT =================

  const [saving, setSaving] = useState(false);

  // ============================================================
  // ================= FETCH CATEGORIES =========================
  // ============================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(data || []);
      } catch (error) {
        console.error("Categories error:", error);
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // ================= CATEGORY FUNCTIONS ======================
  // ============================================================

  const handleCategoryToggle = (name) => {
    setSelectedCategories((prev) => {
      if (prev.includes(name)) {
        return prev.filter((category) => category !== name);
      }

      return [...prev, name];
    });
  };

  const handleAddCategory = async () => {
    const categoryName = newCategory.trim();

    if (!categoryName) {
      return;
    }

    // Prevent duplicate categories locally
    const alreadyExists = categories.some(
      (category) => category.name?.toLowerCase() === categoryName.toLowerCase(),
    );

    if (alreadyExists) {
      alert("This category already exists.");
      return;
    }

    try {
      await addCategory({
        name: categoryName,
        createdAt: new Date(),
      });

      setNewCategory("");

      // Refresh categories
      const updatedCategories = await getCategories();

      setCategories(updatedCategories || []);

      // Automatically select the new category
      setSelectedCategories((prev) => {
        if (prev.includes(categoryName)) {
          return prev;
        }

        return [...prev, categoryName];
      });
    } catch (error) {
      console.error("Error adding category:", error);

      alert("Error adding category.");
    }
  };

  // ============================================================
  // ================= INGREDIENT FUNCTIONS ====================
  // ============================================================

  const handleIngredientChange = (index, field, value) => {
    setIngredients((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        name: "",
        quantity: "",
      },
    ]);
  };

  const removeIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // ================= STEP FUNCTIONS ===========================
  // ============================================================

  const handleStepChange = (index, value) => {
    setSteps((prev) => {
      const updated = [...prev];

      updated[index] = value;

      return updated;
    });
  };

  const addStep = () => {
    setSteps((prev) => [...prev, ""]);
  };

  const removeStep = (index) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // ================= AI DESCRIPTION ===========================
  // ============================================================

  const improveDescriptionWithAI = async () => {
    if (!description.trim()) {
      alert("Please enter a description first.");
      return;
    }

    if (!process.env.REACT_APP_MATRIX_OPEN_AI) {
      alert("AI API key is not configured.");
      console.error("Missing REACT_APP_MATRIX_OPEN_AI environment variable.");
      return;
    }

    try {
      setLoadingAIDesc(true);
      setAiDescription(null);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_MATRIX_OPEN_AI}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            contents: [
              {
                role: "user",

                parts: [
                  {
                    text: `You are an expert culinary writer.

Rewrite the following recipe description so that it is:
- appetizing
- natural
- professional
- engaging
- concise

Keep the description around 2-3 sentences.

Do not invent ingredients or cooking methods that are not mentioned.

Return ONLY a JSON object in this exact format:

{
  "rewrittenDescription": "your rewritten description"
}

Do not use markdown.

Current description:
${JSON.stringify(description)}`,
                  },
                ],
              },
            ],

            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );

      // ================= API ERROR =================

      if (!response.ok) {
        const errorText = await response.text();

        console.error(`Gemini API Error (${response.status}):`, errorText);

        alert(`AI request failed with status ${response.status}.`);

        return;
      }

      // ================= RESPONSE =================

      const data = await response.json();

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.error("No AI response:", data);

        alert("AI did not return a response.");

        return;
      }

      // ================= PARSE =================

      let parsed;

      try {
        parsed = JSON.parse(text.trim());
      } catch (parseError) {
        console.error("Could not parse AI description:", text);

        alert("AI returned an invalid response.");

        return;
      }

      if (
        parsed &&
        typeof parsed.rewrittenDescription === "string" &&
        parsed.rewrittenDescription.trim()
      ) {
        setAiDescription(parsed.rewrittenDescription.trim());
      } else {
        console.error("Unexpected AI description format:", parsed);

        alert("AI returned an unexpected response.");
      }
    } catch (error) {
      console.error("AI Description error:", error);

      alert("Something went wrong while improving the description.");
    } finally {
      setLoadingAIDesc(false);
    }
  };

  // ============================================================
  // ================= AI STEPS ================================
  // ============================================================

  const improveStepsWithAI = async () => {
    const cleanCurrentSteps = steps.map((step) => step.trim()).filter(Boolean);

    if (cleanCurrentSteps.length === 0) {
      alert("Please add some steps first.");
      return;
    }

    if (!process.env.REACT_APP_MATRIX_OPEN_AI) {
      alert("AI API key is not configured.");
      console.error("Missing REACT_APP_MATRIX_OPEN_AI environment variable.");
      return;
    }

    try {
      setLoadingAI(true);
      setAiSteps(null);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_MATRIX_OPEN_AI}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            contents: [
              {
                role: "user",

                parts: [
                  {
                    text: `You are an expert cooking assistant.

Rewrite the following cooking steps so they are:
- clear
- simple
- professional
- easy for a home cook to follow

Do not change the actual cooking instructions.
Do not invent ingredients, temperatures, times, or techniques.

CRITICAL FORMATTING RULES:

1. Return ONLY a JSON array of strings.
2. Do not number the steps.
3. Do not use bullet points.
4. Do not add prefixes such as "Step 1:".
5. Each array item must contain exactly one cooking step.
6. Keep the same number of steps whenever possible.

Example:

[
  "Preheat the oven to 180°C.",
  "Mix the ingredients until smooth.",
  "Bake for 25 minutes."
]

Steps to rewrite:
${JSON.stringify(cleanCurrentSteps)}`,
                  },
                ],
              },
            ],

            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );

      // ================= API ERROR =================

      if (!response.ok) {
        const errorText = await response.text();

        console.error(`Gemini API Error (${response.status}):`, errorText);

        alert(`AI request failed with status ${response.status}.`);

        return;
      }

      // ================= RESPONSE =================

      const data = await response.json();

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.error("No AI response:", data);

        alert("AI did not return a response.");

        return;
      }

      // ================= PARSE =================

      let parsed;

      try {
        parsed = JSON.parse(text.trim());
      } catch (parseError) {
        console.error("Could not parse AI steps:", text);

        alert("AI returned an invalid response.");

        return;
      }

      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(
          (step) => typeof step === "string" && step.trim().length > 0,
        )
      ) {
        setAiSteps(parsed.map((step) => step.trim()));
      } else {
        console.error("Unexpected AI steps format:", parsed);

        alert("AI returned an unexpected response.");
      }
    } catch (error) {
      console.error("AI Steps error:", error);

      alert("Something went wrong while cleaning the steps.");
    } finally {
      setLoadingAI(false);
    }
  };

  // ============================================================
  // ================= ADD RECIPE ==============================
  // ============================================================

  const handleSubmit = async () => {
    if (saving) {
      return;
    }

    // ================= VALIDATION =================

    if (!title.trim()) {
      alert("Please enter a recipe title.");
      return;
    }

    if (!description.trim()) {
      alert("Please enter a recipe description.");
      return;
    }

    const cleanedIngredients = ingredients
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity.trim(),
      }))
      .filter((ingredient) => ingredient.name || ingredient.quantity);

    const cleanedSteps = steps.map((step) => step.trim()).filter(Boolean);

    if (cleanedSteps.length === 0) {
      alert("Please add at least one cooking step.");
      return;
    }

    if (!uid) {
      alert("Unable to identify the current user.");
      console.error("No UID found in SecureLS.");

      return;
    }

    // ================= SAVE =================

    try {
      setSaving(true);

      await addRecipe({
        // BASIC
        title: title.trim(),
        description: description.trim(),

        // USER
        createdBy: uid,
        authorId: uid,

        // STATUS
        status: "approved",
        featured: featured,

        // CATEGORIES
        categories: selectedCategories,

        // INGREDIENTS
        ingredients: cleanedIngredients,

        // STEPS
        steps: cleanedSteps,

        // EXTRA INFO
        difficulty,
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        servings,

        // IMAGES
        images: [],

        // STATS
        saves: 0,

        // DATES
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ================= RESET FORM =================

      setTitle("");
      setDescription("");

      setDifficulty("Easy");

      setPrepTime("");
      setCookTime("");
      setServings("");

      setFeatured(false);

      setSelectedCategories([]);

      setIngredients([
        {
          name: "",
          quantity: "",
        },
      ]);

      setSteps([""]);

      setAiDescription(null);
      setAiSteps(null);

      alert("Recipe Added Successfully ✅");

      // Go back to dashboard recipes
      navigate("/dashboard/Drecipes");
    } catch (error) {
      console.error("Error adding recipe:", error);

      alert("Error adding recipe. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ================= RENDER ==================================
  // ============================================================

  return (
    <div className="page">
      <h1 style={{ marginBottom: "25px" }}>Add Recipe</h1>

      <div
        className="Dashboard-Add-Recipe"
        style={{
          background: "#161616",
          border: "1px solid #2a2a2a",
          borderRadius: "24px",
          padding: "25px",
          maxWidth: "1000px",
        }}
      >
        {/* ================================================== */}
        {/* BASIC INFORMATION */}
        {/* ================================================== */}

        <div>
          <p style={labelStyle}>Recipe Title</p>

          <input
            type="text"
            placeholder="Recipe Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);

              // New title means old AI suggestion may no longer
              // be relevant.
              setAiDescription(null);
            }}
            style={inputStyle}
          />
        </div>

        <div>
          <p style={labelStyle}>Description</p>

          <textarea
            placeholder="Describe your recipe..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setAiDescription(null);
            }}
            style={{
              ...inputStyle,
              minHeight: "120px",
              resize: "vertical",
            }}
          />
        </div>

        {/* ================================================== */}
        {/* AI DESCRIPTION */}
        {/* ================================================== */}

        <div style={{ marginBottom: "25px" }}>
          <button
            type="button"
            onClick={improveDescriptionWithAI}
            disabled={loadingAIDesc}
            style={{
              ...btnSecondary,
              opacity: loadingAIDesc ? 0.6 : 1,
              cursor: loadingAIDesc ? "not-allowed" : "pointer",
            }}
          >
            {loadingAIDesc ? "Improving..." : "✨ Optimize Description with AI"}
          </button>

          {aiDescription && (
            <div style={aiBoxStyle}>
              <h4
                style={{
                  margin: "0 0 10px",
                  color: "var(--accent)",
                }}
              >
                AI Suggestion
              </h4>

              <p
                style={{
                  color: "#ccc",
                  margin: "0 0 15px",
                  lineHeight: "1.5",
                  fontSize: "14px",
                }}
              >
                {aiDescription}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDescription(aiDescription);
                    setAiDescription(null);
                  }}
                  style={{
                    ...secondaryButton,
                    background: "var(--accent)",
                    color: "#111",
                    fontWeight: "700",
                    marginTop: 0,
                  }}
                >
                  Accept Changes
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiDescription(null);
                  }}
                  style={{
                    ...secondaryButton,
                    background: "#ff4d4d",
                    marginTop: 0,
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* EXTRA INFORMATION */}
        {/* ================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <div>
            <p style={labelStyle}>Difficulty</p>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={inputStyle}
            >
              <option value="Easy">Easy</option>

              <option value="Medium">Medium</option>

              <option value="Hard">Hard</option>
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
              min="1"
              placeholder="0"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* ================================================== */}
        {/* CATEGORIES */}
        {/* ================================================== */}

        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            borderRadius: "18px",
            background: "#1c1c1c",
            border: "1px solid #2a2a2a",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
              gap: "15px",
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

          {/* CATEGORY BUTTONS */}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {categories.map((category) => {
              const active = selectedCategories.includes(category.name);

              return (
                <button
                  key={category.id || category.name}
                  type="button"
                  onClick={() => handleCategoryToggle(category.name)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "999px",
                    border: active
                      ? "1px solid var(--accent)"
                      : "1px solid #333",
                    background: active ? "var(--accent)" : "#222",
                    color: active ? "#111" : "#fff",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* ADD CATEGORY */}

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
              alignItems: "stretch",
            }}
          >
            <input
              type="text"
              placeholder="New category..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              style={{
                ...inputStyle,
                flex: 1,
                marginBottom: 0,
              }}
            />

            <button
              type="button"
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
        </div>

        {/* ================================================== */}
        {/* INGREDIENTS */}
        {/* ================================================== */}

        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <p style={sectionTitle}>Ingredients</p>

          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "10px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Ingredient"
                value={ingredient.name}
                onChange={(e) =>
                  handleIngredientChange(index, "name", e.target.value)
                }
                style={{
                  ...inputStyle,
                  flex: 2,
                  marginBottom: 0,
                }}
              />

              <input
                type="text"
                placeholder="Quantity"
                value={ingredient.quantity}
                onChange={(e) =>
                  handleIngredientChange(index, "quantity", e.target.value)
                }
                style={{
                  ...inputStyle,
                  flex: 1,
                  marginBottom: 0,
                }}
              />

              <button
                type="button"
                onClick={() => removeIngredient(index)}
                style={deleteButtonStyle}
              >
                X
              </button>
            </div>
          ))}

          <button type="button" onClick={addIngredient} style={secondaryButton}>
            Add Ingredient
          </button>
        </div>

        {/* ================================================== */}
        {/* STEPS */}
        {/* ================================================== */}

        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <p style={sectionTitle}>Steps</p>

          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "10px",
                alignItems: "flex-start",
              }}
            >
              <textarea
                placeholder={`Step ${index + 1}`}
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                style={{
                  ...inputStyle,
                  flex: 1,
                  minHeight: "90px",
                  resize: "vertical",
                  marginBottom: 0,
                }}
              />

              <button
                type="button"
                onClick={() => removeStep(index)}
                style={deleteButtonStyle}
              >
                X
              </button>
            </div>
          ))}

          {/* STEP BUTTONS */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "10px",
            }}
          >
            <button type="button" onClick={addStep} style={secondaryButton}>
              Add Step
            </button>

            <button
              type="button"
              onClick={improveStepsWithAI}
              disabled={loadingAI}
              style={{
                ...btnSecondary,
                opacity: loadingAI ? 0.6 : 1,
                cursor: loadingAI ? "not-allowed" : "pointer",
              }}
            >
              {loadingAI ? "Cleaning..." : "✨ Clean Steps with AI"}
            </button>
          </div>

          {/* ================================================== */}
          {/* AI STEPS SUGGESTION */}
          {/* ================================================== */}

          {aiSteps && (
            <div style={aiBoxStyle}>
              <h4
                style={{
                  margin: "0 0 15px",
                  color: "var(--accent)",
                }}
              >
                AI Cleaned Steps
              </h4>

              <ol
                style={{
                  paddingLeft: "22px",
                  color: "#ccc",
                  margin: "0 0 15px",
                  fontSize: "14px",
                }}
              >
                {aiSteps.map((step, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "8px",
                      lineHeight: "1.5",
                    }}
                  >
                    {step}
                  </li>
                ))}
              </ol>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSteps([...aiSteps]);
                    setAiSteps(null);
                  }}
                  style={{
                    ...secondaryButton,
                    background: "var(--accent)",
                    color: "#111",
                    fontWeight: "700",
                    marginTop: 0,
                  }}
                >
                  Accept AI Steps
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiSteps(null);
                  }}
                  style={{
                    ...secondaryButton,
                    background: "#ff4d4d",
                    marginTop: 0,
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* SUBMIT */}
        {/* ================================================== */}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            marginTop: "10px",
            padding: "16px",
            width: "100%",
            borderRadius: "16px",
            border: "none",
            background: saving ? "#555" : "var(--accent)",
            color: "#111",
            fontWeight: "700",
            fontSize: "16px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Adding Recipe..." : "Add Recipe"}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// ================= STYLES ===================================
// ============================================================

const inputStyle = {
  width: "90%",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #333",
  background: "#222",
  color: "#fff",
  marginBottom: "15px",
  outline: "none",
  boxSizing: "border-box",
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

const btnSecondary = {
  padding: "10px 14px",
  borderRadius: "10px",
  background: "#333",
  color: "#fff",
  border: "1px solid #444",
  cursor: "pointer",
};

const deleteButtonStyle = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "none",
  background: "#ff4d4d",
  color: "#fff",
  cursor: "pointer",
};

const aiBoxStyle = {
  marginTop: "15px",
  background: "#222",
  padding: "15px",
  borderRadius: "14px",
  border: "1px dashed #444",
  width: "90%",
};

export default AddRecipe;
