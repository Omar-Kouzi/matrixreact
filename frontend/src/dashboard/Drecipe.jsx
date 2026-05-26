import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import SecureLS from "secure-ls";

import { db } from "../assets/firebase/config";

import {
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  getRecipe,
  getCategories,
} from "../assets/firebase/firestore";

import {
  uploadMultipleImages,
  deleteMultipleImages,
} from "../assets/firebase/storage";

const ls = new SecureLS({
  encodingType: "aes",
});

const Drecipe = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const uid = ls.get("uid");

  const isAdmin = ls.get("role") === "admin";

  // ================= STATE =================
  const [recipe, setRecipe] = useState(null);

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  // ================= NEW FIELDS =================
  const [prepTime, setPrepTime] = useState("");

  const [cookTime, setCookTime] = useState("");

  const [servings, setServings] = useState("");

  const [difficulty, setDifficulty] = useState("Easy");

  // visibility
  const [visibility, setVisibility] = useState("private");

  const [status, setStatus] = useState("draft");

  // categories
  const [categories, setCategories] = useState([]);

  const [selectedCategories, setSelectedCategories] = useState([]);

  // ingredients
  const [ingredients, setIngredients] = useState([
    {
      name: "",
      quantity: "",
    },
  ]);

  // steps
  const [steps, setSteps] = useState([""]);

  // images
  const [images, setImages] = useState([]);

  const [existingImages, setExistingImages] = useState([]);

  // ================= FETCH CATEGORIES =================
  const fetchCategories = async () => {
    try {
      const data = await getCategories();

      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FETCH RECIPE =================
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);

        const data = await getRecipe(id);

        if (!data) {
          alert("Recipe not found");

          navigate("/dashboard/Drecipes");

          return;
        }

        // ================= SECURITY =================
        if (data.authorId !== uid && !isAdmin) {
          alert("Unauthorized");

          navigate("/");

          return;
        }

        setRecipe(data);

        setTitle(data.title || "");

        setDescription(data.description || "");

        setPrepTime(data.prepTime || "");

        setCookTime(data.cookTime || "");

        setServings(data.servings || "");

        setDifficulty(data.difficulty || "Easy");

        setVisibility(data.visibility || "private");

        setStatus(data.status || "draft");

        setSelectedCategories(data.categories || []);

        setIngredients(
          data.ingredients || [
            {
              name: "",
              quantity: "",
            },
          ],
        );

        setSteps(data.steps || [""]);

        setExistingImages(data.images || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();

    fetchCategories();
  }, [id, uid, isAdmin, navigate]);

  // ================= CATEGORY TOGGLE =================
  const handleCategoryToggle = (name) => {
    setSelectedCategories((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name],
    );
  };

  // ================= HANDLE IMAGES =================
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);

    setImages(files);
  };

  const removeExistingImage = (index) => {
    const updated = existingImages.filter((_, i) => i !== index);

    setExistingImages(updated);
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

  // ================= UPDATE RECIPE =================
  const handleUpdate = async () => {
    if (
      title.trim() === "" ||
      description.trim() === ""
    ) {
      alert("Fill all fields");

      return;
    }

    try {
      let finalImages = [...existingImages];

      // ================= NEW IMAGES =================
      if (images.length > 0) {
        if (existingImages.length > 0) {
          await deleteMultipleImages(existingImages);
        }

        const urls = await uploadMultipleImages(
          images,
          "recipes",
        );

        finalImages = urls;
      }

      // ================= CLEAN DATA =================
      const cleanedIngredients = ingredients.filter(
        (item) =>
          item.name.trim() !== "" ||
          item.quantity.trim() !== "",
      );

      const cleanedSteps = steps.filter(
        (step) => step.trim() !== "",
      );

      // ================= UPDATE =================
      const recipeRef = doc(db, "recipes", id);

      await updateDoc(recipeRef, {
        title,
        description,

        prepTime,
        cookTime,
        servings,
        difficulty,

        visibility,
        status,

        categories: selectedCategories,

        ingredients: cleanedIngredients,

        steps: cleanedSteps,

        images: finalImages,

        updatedAt: new Date(),
      });

      alert("Recipe updated ✅");

      navigate("/dashboard/Drecipes");
    } catch (error) {
      console.error("Update error:", error);

      alert("Error updating recipe");
    }
  };

  // ================= REQUEST PUBLISH =================
  const handleRequestPublish = async () => {
    try {
      // WATCH 2 ADS HERE

      const recipeRef = doc(db, "recipes", id);

      await updateDoc(recipeRef, {
        status: "pending",
        updatedAt: new Date(),
      });

      setStatus("pending");

      alert("Recipe submitted for review ✅");
    } catch (err) {
      console.error(err);
    }
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Delete this recipe?",
    );

    if (!confirmDelete) return;

    try {
      if (existingImages.length > 0) {
        await deleteMultipleImages(existingImages);
      }

      await deleteDoc(doc(db, "recipes", id));

      alert("Deleted ✅");

      navigate("/dashboard/Drecipes");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  if (!recipe) {
    return <div className="page">Recipe not found</div>;
  }

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

        {/* ================= NEW FIELDS ================= */}

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
          
          </select>
        </div>

        {/* STATUS */}
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <p>
            Status:{" "}
            <strong>{status}</strong>
          </p>
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

        {/* IMAGES */}
        <input
          type="file"
          multiple
          onChange={handleImageChange}
          style={{
            marginTop: "25px",
          }}
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
          {existingImages.map(
            (img, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                }}
              >
                <img
                  src={img}
                  alt="recipe"
                  style={{
                    width: "200px",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "16px",
                  }}
                />

                <button
                  onClick={() =>
                    removeExistingImage(
                      i,
                    )
                  }
                  style={{
                    position:
                      "absolute",
                    top: "10px",
                    right: "10px",
                  }}
                >
                  X
                </button>
              </div>
            ),
          )}
        </div>

        {/* NEW IMAGE PREVIEW */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "20px",
          }}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={URL.createObjectURL(
                img,
              )}
              alt="preview"
              style={{
                width: "200px",
                height: "200px",
                objectFit: "cover",
                borderRadius: "16px",
              }}
            />
          ))}
        </div>

        {/* UPDATE */}
        <button
          onClick={handleUpdate}
          style={{
            marginTop: "30px",
            padding: "16px",
            borderRadius: "16px",
          }}
        >
          Update Recipe
        </button>

        {/* REQUEST PUBLISH */}
        {status !== "approved" && (
          <button
            onClick={
              handleRequestPublish
            }
            style={{
              marginTop: "15px",
              marginLeft: "10px",
              padding: "16px",
              borderRadius: "16px",
            }}
          >
            Request Publish
          </button>
        )}

        {/* DELETE */}
        <button
          onClick={handleDelete}
          style={{
            marginTop: "15px",
            marginLeft: "10px",
            padding: "16px",
            borderRadius: "16px",
            background: "#ff4d4d",
            color: "#fff",
          }}
        >
          Delete Recipe
        </button>
      </div>
    </div>
  );
};

export default Drecipe;