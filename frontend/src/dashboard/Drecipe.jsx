import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { db } from "../assets/firebase/config";

import {
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { getRecipe } from "../assets/firebase/firestore";

import {
  uploadMultipleImages,
  deleteMultipleImages,
} from "../assets/firebase/storage";

const Drecipe = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  // State
  const [recipe, setRecipe] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [category, setCategory] = useState("");

  const [ingredients, setIngredients] =
    useState([
      { name: "", quantity: "" },
    ]);

  const [steps, setSteps] = useState([""]);

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] =
    useState([]);

  // Fetch recipe
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const data = await getRecipe(id);

        setRecipe(data);

        // Fill form
        setTitle(data.title || "");
        setDescription(
          data.description || "",
        );

        setCategory(data.category || "");

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
      }
    };

    fetchRecipe();
  }, [id]);

  // Handle new images
  const handleImageChange = (e) => {
    const files = Array.from(
      e.target.files,
    ).slice(0, 2);

    setImages(files);
  };

  // Remove existing image
  const removeExistingImage = (index) => {
    const updated = existingImages.filter(
      (_, i) => i !== index,
    );

    setExistingImages(updated);
  };

  // ✅ Ingredients
  const handleIngredientChange = (
    index,
    field,
    value,
  ) => {
    const updated = [...ingredients];

    updated[index][field] = value;

    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: "", quantity: "" },
    ]);
  };

  const removeIngredient = (index) => {
    setIngredients(
      ingredients.filter(
        (_, i) => i !== index,
      ),
    );
  };

  // ✅ Steps
  const handleStepChange = (
    index,
    value,
  ) => {
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

  // ✅ UPDATE RECIPE
  const handleUpdate = async () => {
    if (
      title.trim() === "" ||
      description.trim() === ""
    ) {
      return alert("Fill all fields");
    }

    try {
      let finalImages = [...existingImages];

      if (images.length > 0) {
        if (existingImages.length) {
          await deleteMultipleImages(
            existingImages,
          );
        }

        const urls =
          await uploadMultipleImages(
            images,
            "recipes",
          );

        finalImages = urls;
      }

      const cleanedIngredients =
        ingredients.filter(
          (item) =>
            item.name.trim() !== "" ||
            item.quantity.trim() !== "",
        );

      const cleanedSteps = steps.filter(
        (step) => step.trim() !== "",
      );

      await updateDoc(
        doc(db, "recipes", id),
        {
          title,
          description,
          category,
          ingredients:
            cleanedIngredients,
          steps: cleanedSteps,
          images: finalImages,
        },
      );

      alert("Recipe updated ✅");

      navigate("/dashboard/Drecipes");
    } catch (error) {
      console.error(
        "Update error:",
        error,
      );
    }
  };

  // ❌ DELETE RECIPE
  const handleDelete = async () => {
    const confirmDelete =
      window.confirm(
        "Delete this recipe?",
      );

    if (!confirmDelete) return;

    try {
      if (existingImages.length) {
        await deleteMultipleImages(
          existingImages,
        );
      }

      await deleteDoc(
        doc(db, "recipes", id),
      );

      alert("Deleted ✅");

      navigate("/dashboard/Drecipes");
    } catch (error) {
      console.error(error);
    }
  };

  if (!recipe)
    return (
      <div className="page">
        Loading...
      </div>
    );

  return (
    <div className="page">
      <h1>Edit Recipe</h1>

      <div className="Dashboard-Add-Recipe">
        <label>Recipe Title:</label>

        <input
          type="text"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Recipe title"
        />

        <label>Description:</label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value,
            )
          }
          placeholder="Description"
        />

        <label>Category:</label>

        <input
          type="text"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          placeholder="Category"
        />

        {/* ✅ Ingredients */}
        <div className="ingredients">
          <p>Ingredients:</p>

          {ingredients.map(
            (item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom:
                    "10px",
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

        {/* ✅ Steps */}
        <div className="steps">
          <p>Steps:</p>

          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom:
                  "10px",
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
              />

              <button
                onClick={() =>
                  removeStep(index)
                }
              >
                X
              </button>
            </div>
          ))}

          <button onClick={addStep}>
            Add Step
          </button>
        </div>

        {/* Upload new images */}
        <input
          type="file"
          multiple
          onChange={handleImageChange}
        />

        {/* Existing images */}
        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          {existingImages.map(
            (img, i) => (
              <div
                key={i}
                style={{
                  position:
                    "relative",
                }}
              >
                <img
                  src={img}
                  alt="recipe"
                  style={{
                    width: "200px",
                    height: "200px",
                    objectFit:
                      "cover",
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
                    top: 0,
                    right: 0,
                    background:
                      "red",
                    color: "#fff",
                    border:
                      "none",
                  }}
                >
                  X
                </button>
              </div>
            ),
          )}
        </div>

        {/* Preview new images */}
        <div
          style={{
            display: "flex",
            gap: "10px",
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
              }}
            />
          ))}
        </div>

        <button onClick={handleUpdate}>
          Update Recipe
        </button>

        <button
          onClick={handleDelete}
          style={{
            background: "red",
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