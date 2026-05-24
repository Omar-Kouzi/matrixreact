import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SecureLS from "secure-ls";

import { db } from "../assets/firebase/config";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

import { getRecipe, getCategories } from "../assets/firebase/firestore";

import {
  uploadMultipleImages,
  deleteMultipleImages,
} from "../assets/firebase/storage";

const ls = new SecureLS({ encodingType: "aes" });

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const uid = ls.get("uid");

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");

  const [status, setStatus] = useState("draft");

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);

  const [steps, setSteps] = useState([""]);

  // ================= AI ADDITIONS =================
  const [aiSteps, setAiSteps] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // 🪄 NEW AI DESCRIPTION STATES
  const [aiDescription, setAiDescription] = useState(null);
  const [loadingAIDesc, setLoadingAIDesc] = useState(false);

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // ================= AI DESCRIPTION FUNCTION =================
  const improveDescriptionWithAI = async () => {
    if (!description.trim()) return alert("Please enter a description first.");

    try {
      setLoadingAIDesc(true);

      const res = await fetch(
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
                    text: `
You are an expert culinary writer. 

Rewrite this recipe description to be highly engaging, appetizing, and brief (around 2-3 sentences max). Make readers want to cook this dish.

Return a JSON object containing a single string property called "rewrittenDescription". Do not include markdown code block syntax.

Current description:
"${description}"
                    `,
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

      if (!res.ok) {
        const errText = await res.text();
        console.error(`API Error (${res.status}):`, errText);
        alert(`AI Request failed with status ${res.status}`);
        return;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.error("No AI response structure:", data);
        return;
      }

      const parsed = JSON.parse(text.trim());

      if (parsed?.rewrittenDescription) {
        setAiDescription(parsed.rewrittenDescription);
      } else {
        console.error("AI object did not match expectations:", parsed);
      }
    } catch (err) {
      console.error("AI Description error:", err);
    } finally {
      setLoadingAIDesc(false);
    }
  };

  // ================= AI STEPS FUNCTION =================
  const improveStepsWithAI = async () => {
    try {
      setLoadingAI(true);

      const res = await fetch(
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
                    text: `
You are a cooking assistant.

Rewrite these cooking steps to be:
- clearer
- simpler
- easy to follow

CRITICAL FORMATTING RULES:
1. Return a JSON array of strings.
2. DO NOT include numbers, bullet points, dashes, or prefixes (e.g., do NOT write "1. Mix ingredients", just write "Mix ingredients").
3. Each item in the array must be exactly one isolated step.

Steps to rewrite:
${JSON.stringify(steps)}
                    `,
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

      if (!res.ok) {
        const errText = await res.text();
        console.error(`API Error (${res.status}):`, errText);
        alert(`AI Request failed with status ${res.status}`);
        return;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.error("No AI response structure:", data);
        return;
      }

      const parsed = JSON.parse(text.trim());

      if (Array.isArray(parsed)) {
        setAiSteps(parsed);
      } else {
        console.error("AI did not return an array:", parsed);
      }
    } catch (err) {
      console.error("AI error:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  // ================= FETCH =================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const data = await getRecipe(id);

      if (!data) {
        navigate(`/profile/${uid}`);
        return;
      }

      // 🔒 ONLY OWNER
      if (data.authorId !== uid) {
        alert("Not allowed");
        navigate(`/profile/${uid}`);
        return;
      }

      setRecipe(data);

      setTitle(data.title || "");
      setDescription(data.description || "");

      setPrepTime(data.prepTime || "");
      setCookTime(data.cookTime || "");
      setServings(data.servings || "");
      setDifficulty(data.difficulty || "Easy");

      setStatus(data.status || "draft");

      setSelectedCategories(data.categories || []);
      setIngredients(data.ingredients || [{ name: "", quantity: "" }]);
      setSteps(data.steps || [""]);

      setExistingImages(data.images || []);

      const cats = await getCategories();
      setCategories(cats);

      setLoading(false);
    };

    fetchData();
  }, [id, uid, navigate]);

  // ================= HELPERS =================
  const toggleCategory = (name) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  // ================= UPDATE =================
  const handleUpdate = async () => {
    let finalImages = [...existingImages];

    if (images.length > 0) {
      if (existingImages.length > 0) {
        await deleteMultipleImages(existingImages);
      }

      finalImages = await uploadMultipleImages(images, "recipes");
    }

    const cleanIngredients = ingredients.filter(
      (i) => i.name.trim() || i.quantity.trim(),
    );

    const cleanSteps = steps.filter((s) => s.trim());

    await updateDoc(doc(db, "recipes", id), {
      title,
      description,
      prepTime,
      cookTime,
      servings,
      difficulty,
      status,
      categories: selectedCategories,
      ingredients: cleanIngredients,
      steps: cleanSteps,
      images: finalImages,
      updatedAt: new Date(),
    });

    alert("Updated ✅");
    navigate(`/profile/${uid}`);
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    const confirm = window.confirm("Delete this recipe?");
    if (!confirm) return;

    if (existingImages.length > 0) {
      await deleteMultipleImages(existingImages);
    }

    await deleteDoc(doc(db, "recipes", id));

    alert("Deleted ✅");
    navigate(`/profile/${uid}`);
  };

  if (loading) return <div className="page">Loading...</div>;
  if (!recipe) return <div className="page">Not found</div>;

  return (
    <div className="page">
      <h1>Edit Recipe</h1>

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
        <label>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "90%",
            padding: "14px",
            borderRadius: "14px",
            border: "1px solid #333",
            background: "#222",
            color: "#fff",
            marginBottom: "15px",
          }}
        />

        {/* DESCRIPTION */}
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: "90%",
            minHeight: "120px",
            padding: "14px",
            borderRadius: "14px",
            border: "1px solid #333",
            background: "#222",
            color: "#fff",
            marginBottom: "10px",
          }}
        />

        {/* AI DESCRIPTION INTERFACE */}
        <div style={{ marginBottom: "20px" }}>
          <button onClick={improveDescriptionWithAI} style={btnSecondary}>
            {loadingAIDesc ? "Improving..." : "✨ Improve Description with AI"}
          </button>

          {aiDescription && (
            <div
              style={{
                marginTop: "15px",
                background: "#222",
                padding: "15px",
                borderRadius: "14px",
                border: "1px dashed #444",
                width: "90%",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", color: "var(--accent)" }}>
                AI Suggestion:
              </h4>
              <p
                style={{
                  color: "#ccc",
                  margin: "0 0 15px 0",
                  lineHeight: "1.5",
                }}
              >
                {aiDescription}
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    setDescription(aiDescription);
                    setAiDescription(null);
                  }}
                  style={{ ...btnPrimary, marginTop: 0 }}
                >
                  Accept Changes
                </button>
                <button
                  onClick={() => setAiDescription(null)}
                  style={{ ...btnDanger, marginTop: 0 }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* META */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <input
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="Prep"
            style={inputStyle}
          />
          <input
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="Cook"
            style={inputStyle}
          />
          <input
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="Servings"
            style={inputStyle}
          />

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

        {/* CATEGORIES */}
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          {categories.map((c) => {
            const active = selectedCategories.includes(c.name);

            return (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.name)}
                style={{
                  padding: "10px 16px",
                  margin: "5px",
                  borderRadius: "999px",
                  border: active ? "1px solid var(--accent)" : "1px solid #333",
                  background: active ? "var(--accent)" : "#222",
                  color: active ? "#111" : "#fff",
                  cursor: "pointer",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* INGREDIENTS */}
        {ingredients.map((i, idx) => (
          <div
            key={idx}
            style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
          >
            <input
              value={i.name}
              onChange={(e) => {
                const copy = [...ingredients];
                copy[idx].name = e.target.value;
                setIngredients(copy);
              }}
              style={inputStyle}
            />
            <input
              value={i.quantity}
              onChange={(e) => {
                const copy = [...ingredients];
                copy[idx].quantity = e.target.value;
                setIngredients(copy);
              }}
              style={inputStyle}
            />
          </div>
        ))}

        {/* STEPS */}
        {steps.map((s, idx) => (
          <textarea
            key={idx}
            value={s}
            onChange={(e) => {
              const copy = [...steps];
              copy[idx] = e.target.value;
              setSteps(copy);
            }}
            style={{ ...inputStyle, minHeight: "90px", marginBottom: "10px" }}
          />
        ))}

        {/* ✅ AI BUTTON */}
        <button onClick={improveStepsWithAI} style={btnPrimary}>
          {loadingAI ? "Improving..." : "Improve Steps with AI"}
        </button>

        {/* AI RESULT */}
        {aiSteps && (
          <div style={{ marginTop: "15px" }}>
            <h4>AI Suggestion</h4>

            {aiSteps.map((s, i) => (
              <p
                key={i}
                style={{
                  background: "#222",
                  padding: "10px",
                  borderRadius: "10px",
                }}
              >
                {s}
              </p>
            ))}

            <button
              onClick={() => {
                setSteps(aiSteps);
                setAiSteps(null);
              }}
              style={btnPrimary}
            >
              Accept AI Changes
            </button>
          </div>
        )}

        {/* IMAGES */}
        <input
          type="file"
          multiple
          onChange={(e) => setImages([...e.target.files])}
        />

        {/* EXISTING IMAGES */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "20px",
          }}
        >
          {existingImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          ))}
        </div>

        {/* BUTTONS */}
        <button onClick={handleUpdate} style={btnPrimary}>
          Save Changes
        </button>

        <button onClick={handleDelete} style={btnDanger}>
          Delete Recipe
        </button>
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
};

const btnPrimary = {
  marginTop: "20px",
  padding: "14px",
  borderRadius: "14px",
  background: "var(--accent)",
  border: "none",
  cursor: "pointer",
};

const btnSecondary = {
  padding: "10px 14px",
  borderRadius: "10px",
  background: "#333",
  color: "#fff",
  border: "1px solid #444",
  cursor: "pointer",
};

const btnDanger = {
  marginTop: "10px",
  padding: "14px",
  borderRadius: "14px",
  background: "#ff4d4d",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

export default EditRecipe;
