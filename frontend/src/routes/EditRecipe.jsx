import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import SecureLS from "secure-ls";

import { db } from "../assets/firebase/config";
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

import { getRecipe, getCategories } from "../assets/firebase/firestore";
import { getActiveSubscription } from "../assets/firebase/subscriptions";

import { deleteMultipleImages } from "../assets/firebase/storage";
import { fetchGeminiAI } from "../assets/firebase/secureApi";
import { imageFileToJpegBase64 } from "../assets/firebase/imageToBase64";

const ls = new SecureLS({ encodingType: "aes" });

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const uid = ls.get("uid");

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState("free");
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const imageInputRef = useRef(null);

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
  const [originalImages, setOriginalImages] = useState([]);
  const [loadingImageAI, setLoadingImageAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [cropTargetIndex, setCropTargetIndex] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  // ================= HELPER FOR AI PERMISSIONS =================
  const hasAiAccess = subscriptionLoaded && userSubscription === "pro";

  // ================= AI DESCRIPTION FUNCTION =================
  const improveDescriptionWithAI = async () => {
    if (!hasAiAccess) return alert("You don't have access to AI features.");
    if (!description.trim()) return alert("Please enter a description first.");

    try {
      setLoadingAIDesc(true);

      const payload = {
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
      };

      const res = await fetchGeminiAI(payload);
      if (!res) return;

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
    if (!hasAiAccess) return alert("AI tools are available on the Pro plan only.");
    try {
      setLoadingAI(true);

      const payload = {
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
      };

      const res = await fetchGeminiAI(payload);
      if (!res) return;

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

  // ================= IMAGE CROPPING =================
  const onCropComplete = (_area, pixels) => setCroppedAreaPixels(pixels);

  const cropSelectedImage = async () => {
    if (cropTargetIndex === null || !croppedAreaPixels) return;
    const file = images[cropTargetIndex];
    try {
      const sourceUrl = URL.createObjectURL(file);
      const imageElement = new Image();
      imageElement.src = sourceUrl;
      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(croppedAreaPixels.width);
      canvas.height = Math.round(croppedAreaPixels.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not crop this image.");
      context.drawImage(imageElement, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(sourceUrl);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, file.type === "image/png" ? "image/png" : "image/jpeg", 0.94));
      if (!blob) throw new Error("Could not create the cropped image.");
      const extension = file.type === "image/png" ? "png" : "jpg";
      const croppedFile = new File([blob], `cropped-${file.name.replace(/\.[^.]+$/, "")}.${extension}`, { type: blob.type, lastModified: Date.now() });
      setImages((previous) => previous.map((item, index) => index === cropTargetIndex ? croppedFile : item));
      setCropTargetIndex(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error("Image crop error:", error);
      alert(error.message || "Could not crop the image.");
    }
  };

  // ================= AI IMAGE IMPORT =================


  const analyzeRecipeImageWithAI = async () => {
    if (!hasAiAccess) return alert("AI tools are available on the Pro plan only.");
    const file = images[0];
    if (!file) return alert("Choose a recipe photo first. The first selected image will be analyzed.");
    if (!file.type.startsWith("image/")) return alert("Please select an image file.");

    try {
      setLoadingImageAI(true);
      const base64 = await imageFileToJpegBase64(file);
      const response = await fetchGeminiAI({
        contents: [{ role: "user", parts: [
          { text: `Read this handwritten or printed recipe image and transcribe only what is visible. Do not invent missing information. Use "N/A" for missing title, description, times, servings, difficulty, ingredient name/quantity, or steps. Categories must be an array. Return ONLY JSON in this structure: {"title":"N/A","description":"N/A","difficulty":"Easy","prepTime":"N/A","cookTime":"N/A","servings":"N/A","categories":[],"ingredients":[{"name":"N/A","quantity":"N/A"}],"steps":["N/A"]}. Difficulty must be Easy, Medium, Hard, or N/A.` },
          { inlineData: { mimeType: "image/jpeg", data: base64 } },
        ] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      if (!response) return;
      if (!response.ok) throw new Error(`AI request failed (${response.status}).`);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("AI did not return recipe data.");
      const parsed = JSON.parse(text.trim());
      setTitle(typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "N/A");
      setDescription(typeof parsed.description === "string" && parsed.description.trim() ? parsed.description.trim() : "N/A");
      setPrepTime(parsed.prepTime || "N/A");
      setCookTime(parsed.cookTime || "N/A");
      setServings(String(parsed.servings ?? "N/A"));
      setDifficulty(["Easy", "Medium", "Hard", "N/A"].includes(parsed.difficulty) ? parsed.difficulty : "N/A");
      setIngredients(Array.isArray(parsed.ingredients) && parsed.ingredients.length ? parsed.ingredients.map((item) => ({ name: item?.name || "N/A", quantity: item?.quantity || "N/A" })) : [{ name: "N/A", quantity: "N/A" }]);
      setSteps(Array.isArray(parsed.steps) && parsed.steps.length ? parsed.steps.map((step) => String(step || "N/A")) : ["N/A"]);
      const aiCategories = Array.isArray(parsed.categories) ? parsed.categories : [];
      setSelectedCategories(categories.filter((category) => aiCategories.some((name) => String(name).toLowerCase() === String(category.name).toLowerCase())).map((category) => category.name));
      alert("Recipe details imported. Review the fields before saving.");
    } catch (error) {
      console.error("Recipe image analysis failed:", error);
      alert(error.message || "Could not read the recipe image.");
    } finally {
      setLoadingImageAI(false);
    }
  };

  // ================= FETCH =================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        if (uid) {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            setUserSubscription(getActiveSubscription(userDoc.data()));
          } else {
            setUserSubscription("free");
          }
        } else {
          setUserSubscription("free");
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setUserSubscription("free");
      } finally {
        setSubscriptionLoaded(true);
      }

      const data = await getRecipe(id);

      if (!data) {
        navigate(`/profile/${uid}`);
        return;
      }

      if ((data.authorId || data.createdBy) !== uid) {
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
      setOriginalImages(data.images || []);

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
    if (saving) return;
    if (!title.trim()) return alert("Please enter a recipe title.");
    if (!description.trim()) return alert("Please enter a recipe description.");
    const cleanIngredients = ingredients.filter((item) => item.name.trim() || item.quantity.trim());
    const cleanSteps = steps.filter((step) => step.trim());
    if (!cleanSteps.length) return alert("Please add at least one cooking step.");

    setSaving(true);
    try {
      // Do not upload new images until Firebase Storage is enabled.
      // Keep only previously saved images that the user chose to retain.
      const finalImages = [...existingImages];
      await updateDoc(doc(db, "recipes", id), {
        title: title.trim(),
        description: description.trim(),
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

      const removedImages = originalImages.filter((url) => !existingImages.includes(url));
      if (removedImages.length) {
        try { await deleteMultipleImages(removedImages); }
        catch (deleteError) { console.error("Recipe updated, but an old image could not be deleted:", deleteError); }
      }
      alert("Updated successfully.");
      navigate(`/profile/${uid}`);
    } catch (error) {
      console.error("Error updating recipe:", error);
      alert("Could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    const confirm = window.confirm("Delete this recipe?");
    if (!confirm) return;

    if (existingImages.length > 0) {
      try {
        await deleteMultipleImages(existingImages);
      } catch (storageError) {
        // Storage may be unavailable; still allow deleting the Firestore recipe.
        console.warn("Could not delete stored recipe images:", storageError);
      }
    }

    await deleteDoc(doc(db, "recipes", id));

    alert("Deleted ✅");
    navigate(`/profile/${uid}`);
  };

  if (loading) return <div className="page">Loading...</div>;
  if (!recipe) return <div className="page">Not found</div>;

  return (
    <div className="page">
      <h1 style={{ marginBottom: "10px" }}>Edit Recipe</h1>
      <p style={{ color: "#c9b9c0", margin: "0 0 22px" }}>
        Plan: <strong style={{ color: "var(--accent)" }}>{userSubscription.toUpperCase()}</strong>
        {hasAiAccess ? " · AI tools are enabled for your Pro subscription." : " · AI tools are available on Pro. Image uploads and editing remain available on all plans."}
      </p>

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
        {hasAiAccess && (
          <div style={{ marginBottom: "20px" }}>
            <button onClick={improveDescriptionWithAI} style={btnSecondary}>
              {loadingAIDesc
                ? "Improving..."
                : "✨ Improve Description with AI"}
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
        )}

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

        {/* AI STEPS SECTION */}
        {hasAiAccess && (
          <>
            <button onClick={improveStepsWithAI} style={btnPrimary}>
              {loadingAI ? "Improving..." : "Improve Steps with AI"}
            </button>

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
          </>
        )}

        {/* RECIPE IMAGES: existing images can be removed and new ones added */}
        <section style={{ marginTop: "24px", padding: "18px", border: "1px solid #3a2931", borderRadius: "16px", background: "#21171c" }}>
          <h3 style={{ marginTop: 0 }}>Recipe images</h3>
          <p style={{ color: "#c9b9c0" }}>For now, selected images are temporary and can be used by Pro AI to read a handwritten or printed recipe. New images will not be saved to Firebase Storage until storage is enabled. Existing saved images remain attached unless you remove them.</p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              const selected = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
              if (selected.length !== (event.target.files || []).length) alert("Only image files can be added.");
              setImages((previous) => [...previous, ...selected]);
              event.target.value = "";
            }}
            style={{ display: "none" }}
          />
          <button type="button" onClick={() => imageInputRef.current?.click()} style={{ ...btnPrimary, marginTop: "4px" }}>
            ➕ Add Image
          </button>
          {hasAiAccess ? (
            <button type="button" onClick={analyzeRecipeImageWithAI} disabled={loadingImageAI || images.length === 0} style={{ ...btnSecondary, display: "block", marginTop: "14px", opacity: loadingImageAI || images.length === 0 ? 0.55 : 1 }}>
              {loadingImageAI ? "Reading recipe image…" : "✨ Import recipe details from first new image"}
            </button>
          ) : (
            <p style={{ color: "#d8a8bd", marginBottom: 0 }}>AI recipe import is available on the Pro plan. You can select an image temporarily, but new images are not saved yet.</p>
          )}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
            {existingImages.map((imageUrl, index) => (
              <div key={`${imageUrl}-${index}`} style={{ width: "150px" }}>
                <img src={imageUrl} alt={`Recipe ${index + 1}`} style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "12px", display: "block" }} />
                <button type="button" onClick={() => setExistingImages((previous) => previous.filter((_, i) => i !== index))} style={{ ...btnDanger, width: "100%", marginTop: "6px" }}>Remove image</button>
              </div>
            ))}
            {images.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} style={{ width: "150px" }}>
                <img src={imagePreviews[index]} alt={file.name} style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "12px", display: "block" }} />
                <button type="button" onClick={() => { setCropTargetIndex(index); setCrop({ x: 0, y: 0 }); setZoom(1); }} style={{ ...btnSecondary, width: "100%", marginTop: "6px" }}>Crop image</button>
                <button type="button" onClick={() => setImages((previous) => previous.filter((_, i) => i !== index))} style={{ ...btnDanger, width: "100%", marginTop: "6px" }}>Remove new image</button>
              </div>
            ))}
          </div>
          {cropTargetIndex !== null && images[cropTargetIndex] && (
            <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: "18px" }}>
              <div style={{ width: "min(720px, 100%)", background: "#21171c", border: "1px solid #5b3948", borderRadius: "18px", padding: "18px" }}>
                <h3 style={{ marginTop: 0 }}>Crop image</h3>
                <div style={{ position: "relative", height: "min(55vh, 440px)", background: "#111" }}>
                  <Cropper image={imagePreviews[cropTargetIndex]} crop={crop} zoom={zoom} aspect={4 / 3} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                </div>
                <label style={{ display: "block", marginTop: "14px", color: "#fff" }}>Zoom
                  <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} style={{ width: "100%" }} />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                  <button type="button" onClick={() => setCropTargetIndex(null)} style={btnSecondary}>Cancel</button>
                  <button type="button" onClick={cropSelectedImage} style={btnPrimary}>Apply crop</button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* BUTTONS */}
        <button onClick={handleUpdate} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save Changes"}
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
