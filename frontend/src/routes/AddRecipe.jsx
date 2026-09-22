
// ================= IMPORTS =================

import { useEffect, useRef, useState } from "react";
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

// ============================================================
// ================= CROP HANDLE COMPONENT ====================
// ============================================================

const CropHandle = ({ position, onPointerDown }) => {
  const getPositionStyle = () => {
    const base = {
      position: "absolute",
      width: "18px",
      height: "18px",
      background: "var(--accent)",
      border: "2px solid #111",
      borderRadius: "50%",
      boxSizing: "border-box",
      zIndex: 50,
      touchAction: "none",
      userSelect: "none",
    };

    if (position === "top-left") {
      return {
        ...base,
        left: "-9px",
        top: "-9px",
        cursor: "nwse-resize",
      };
    }

    if (position === "top") {
      return {
        ...base,
        left: "50%",
        top: "-9px",
        transform: "translateX(-50%)",
        cursor: "ns-resize",
      };
    }

    if (position === "top-right") {
      return {
        ...base,
        right: "-9px",
        top: "-9px",
        cursor: "nesw-resize",
      };
    }

    if (position === "left") {
      return {
        ...base,
        left: "-9px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "ew-resize",
      };
    }

    if (position === "right") {
      return {
        ...base,
        right: "-9px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "ew-resize",
      };
    }

    if (position === "bottom-left") {
      return {
        ...base,
        left: "-9px",
        bottom: "-9px",
        cursor: "nesw-resize",
      };
    }

    if (position === "bottom") {
      return {
        ...base,
        left: "50%",
        bottom: "-9px",
        transform: "translateX(-50%)",
        cursor: "ns-resize",
      };
    }

    return {
      ...base,
      right: "-9px",
      bottom: "-9px",
      cursor: "nwse-resize",
    };
  };

  return (
    <div
      onPointerDown={onPointerDown}
      style={getPositionStyle()}
    />
  );
};

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

  // ================= IMAGE =================

  const [recipeImage, setRecipeImage] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState("");
  const [loadingImageAI, setLoadingImageAI] = useState(false);

  // ================= CROP =================

  const [showCropper, setShowCropper] = useState(false);

  const cropImageRef = useRef(null);
  const cropContainerRef = useRef(null);

  const [cropImageSize, setCropImageSize] = useState({
    width: 0,
    height: 0,
  });

  const [cropBox, setCropBox] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [cropInteraction, setCropInteraction] = useState(null);

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
  // ================= CATEGORY FUNCTIONS =======================
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

    const alreadyExists = categories.some(
      (category) =>
        category.name?.toLowerCase() ===
        categoryName.toLowerCase(),
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

      const updatedCategories = await getCategories();

      setCategories(updatedCategories || []);

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
    setIngredients((prev) =>
      prev.filter((_, i) => i !== index),
    );
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
    setSteps((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  // ============================================================
  // ================= IMAGE FILE ===============================
  // ============================================================

  const handleRecipeImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (recipeImagePreview) {
      URL.revokeObjectURL(recipeImagePreview);
    }

    setRecipeImage(file);

    const previewUrl = URL.createObjectURL(file);

    setRecipeImagePreview(previewUrl);

    setShowCropper(false);
    setCropInteraction(null);
  };

  const removeRecipeImage = () => {
    if (recipeImagePreview) {
      URL.revokeObjectURL(recipeImagePreview);
    }

    setRecipeImage(null);
    setRecipeImagePreview("");

    setShowCropper(false);
    setCropInteraction(null);

    setCropImageSize({
      width: 0,
      height: 0,
    });

    setCropBox({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  };

  // ============================================================
  // ================= OPEN CROPPER ==============================
  // ============================================================

  const openCropper = () => {
    if (!recipeImagePreview) {
      alert("Please select an image first.");
      return;
    }

    setCropInteraction(null);
    setShowCropper(true);
  };

  // ============================================================
  // ================= INITIALIZE CROP ===========================
  // ============================================================

  const handleCropImageLoad = (event) => {
    const image = event.currentTarget;

    /*
      IMPORTANT:

      We use the actual displayed image dimensions.

      The crop container now wraps the image exactly,
      so these coordinates are directly over the image.
    */

    const displayedWidth = image.clientWidth;
    const displayedHeight = image.clientHeight;

    if (!displayedWidth || !displayedHeight) {
      return;
    }

    setCropImageSize({
      width: displayedWidth,
      height: displayedHeight,
    });

    // Start with 80% of the image.
    const cropWidth = displayedWidth * 0.8;
    const cropHeight = displayedHeight * 0.8;

    setCropBox({
      x: (displayedWidth - cropWidth) / 2,
      y: (displayedHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };

  // ============================================================
  // ================= CROP POINTER START =======================
  // ============================================================

  const startCropInteraction = (event, type) => {
    event.preventDefault();
    event.stopPropagation();

    if (!cropContainerRef.current) {
      return;
    }

    setCropInteraction({
      type,
      startX: event.clientX,
      startY: event.clientY,
      initialCrop: {
        ...cropBox,
      },
    });

    /*
      Capture the pointer so dragging continues even
      if the mouse moves outside the crop handle.
    */
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      // Some browsers may not support pointer capture here.
    }
  };

  // ============================================================
  // ================= CROP POINTER MOVE ========================
  // ============================================================

  useEffect(() => {
    if (!cropInteraction) {
      return;
    }

    const handlePointerMove = (event) => {
      const dx = event.clientX - cropInteraction.startX;
      const dy = event.clientY - cropInteraction.startY;

      const initial = cropInteraction.initialCrop;

      let newX = initial.x;
      let newY = initial.y;
      let newWidth = initial.width;
      let newHeight = initial.height;

      const minSize = 40;

      // ========================================================
      // MOVE
      // ========================================================

      if (cropInteraction.type === "move") {
        newX = initial.x + dx;
        newY = initial.y + dy;

        newX = Math.max(
          0,
          Math.min(
            newX,
            cropImageSize.width - initial.width,
          ),
        );

        newY = Math.max(
          0,
          Math.min(
            newY,
            cropImageSize.height - initial.height,
          ),
        );

        setCropBox({
          x: newX,
          y: newY,
          width: initial.width,
          height: initial.height,
        });

        return;
      }

      // ========================================================
      // LEFT
      // ========================================================

      if (cropInteraction.type.includes("left")) {
        newX = initial.x + dx;

        newX = Math.max(
          0,
          Math.min(
            newX,
            initial.x + initial.width - minSize,
          ),
        );

        newWidth =
          initial.width -
          (newX - initial.x);
      }

      // ========================================================
      // RIGHT
      // ========================================================

      if (cropInteraction.type.includes("right")) {
        newWidth = initial.width + dx;

        newWidth = Math.max(
          minSize,
          Math.min(
            newWidth,
            cropImageSize.width - initial.x,
          ),
        );
      }

      // ========================================================
      // TOP
      // ========================================================

      if (cropInteraction.type.includes("top")) {
        newY = initial.y + dy;

        newY = Math.max(
          0,
          Math.min(
            newY,
            initial.y + initial.height - minSize,
          ),
        );

        newHeight =
          initial.height -
          (newY - initial.y);
      }

      // ========================================================
      // BOTTOM
      // ========================================================

      if (cropInteraction.type.includes("bottom")) {
        newHeight = initial.height + dy;

        newHeight = Math.max(
          minSize,
          Math.min(
            newHeight,
            cropImageSize.height - initial.y,
          ),
        );
      }

      // ========================================================
      // FINAL SAFETY
      // ========================================================

      newX = Math.max(
        0,
        Math.min(
          newX,
          cropImageSize.width - minSize,
        ),
      );

      newY = Math.max(
        0,
        Math.min(
          newY,
          cropImageSize.height - minSize,
        ),
      );

      newWidth = Math.max(
        minSize,
        Math.min(
          newWidth,
          cropImageSize.width - newX,
        ),
      );

      newHeight = Math.max(
        minSize,
        Math.min(
          newHeight,
          cropImageSize.height - newY,
        ),
      );

      setCropBox({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };

    const handlePointerUp = () => {
      setCropInteraction(null);
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp,
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp,
      );
    };
  }, [cropInteraction, cropImageSize]);

  // ============================================================
  // ================= CONFIRM CROP ==============================
  // ============================================================

  const confirmCrop = () => {
    const image = cropImageRef.current;

    if (!image) {
      alert("Crop image is not available.");
      return;
    }

    if (!recipeImage) {
      alert("No recipe image selected.");
      return;
    }

    if (
      !cropImageSize.width ||
      !cropImageSize.height ||
      !cropBox.width ||
      !cropBox.height
    ) {
      alert("Unable to crop this image.");
      return;
    }

    try {
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;

      /*
        Because cropImageSize is now the exact displayed
        image size, the scale calculation is accurate.
      */

      const scaleX =
        naturalWidth / cropImageSize.width;

      const scaleY =
        naturalHeight / cropImageSize.height;

      const sourceX =
        cropBox.x * scaleX;

      const sourceY =
        cropBox.y * scaleY;

      const sourceWidth =
        cropBox.width * scaleX;

      const sourceHeight =
        cropBox.height * scaleY;

      const canvas =
        document.createElement("canvas");

      canvas.width = Math.round(sourceWidth);
      canvas.height = Math.round(sourceHeight);

      const context =
        canvas.getContext("2d");

      if (!context) {
        alert("Could not create crop.");
        return;
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const outputType =
        recipeImage.type === "image/png"
          ? "image/png"
          : "image/jpeg";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert(
              "Could not create cropped image.",
            );

            return;
          }

          const extension =
            outputType === "image/png"
              ? "png"
              : "jpg";

          const croppedFile = new File(
            [blob],
            `cropped-recipe.${extension}`,
            {
              type: outputType,
              lastModified: Date.now(),
            },
          );

          const newPreviewUrl =
            URL.createObjectURL(croppedFile);

          /*
            Remove the old preview URL only after
            the new cropped image has been created.
          */

          if (recipeImagePreview) {
            URL.revokeObjectURL(
              recipeImagePreview,
            );
          }

          setRecipeImage(croppedFile);

          setRecipeImagePreview(
            newPreviewUrl,
          );

          setShowCropper(false);
          setCropInteraction(null);

          alert(
            "Image cropped successfully! ✅",
          );
        },
        outputType,
        0.95,
      );
    } catch (error) {
      console.error(
        "Crop error:",
        error,
      );

      alert(
        "Something went wrong while cropping the image.",
      );
    }
  };

  // ============================================================
  // ================= IMAGE TO BASE64 ==========================
  // ============================================================

  const fileToBase64 = (file) => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const result =
            reader.result;

          if (
            typeof result !==
            "string"
          ) {
            reject(
              new Error(
                "Could not read image.",
              ),
            );

            return;
          }

          const base64 =
            result.split(",")[1];

          resolve(base64);
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Could not read image.",
            ),
          );
        };

        reader.readAsDataURL(file);
      },
    );
  };

  // ============================================================
  // ================= AI IMAGE RECIPE ==========================
  // ============================================================

  const analyzeRecipeImageWithAI =
    async () => {
      if (!recipeImage) {
        alert(
          "Please select a recipe image first.",
        );

        return;
      }

      if (
        !process.env
          .REACT_APP_MATRIX_OPEN_AI
      ) {
        alert(
          "AI API key is not configured.",
        );

        console.error(
          "Missing REACT_APP_MATRIX_OPEN_AI environment variable.",
        );

        return;
      }

      try {
        setLoadingImageAI(true);

        const base64Image =
          await fileToBase64(
            recipeImage,
          );

        const response =
          await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_MATRIX_OPEN_AI}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                contents: [
                  {
                    role: "user",

                    parts: [
                      {
                        text: `
You are an expert recipe extraction assistant.

You are looking at a photograph of a handwritten or printed recipe.

Your job is to READ ONLY the information that is actually present in the image and convert it into structured recipe data.

IMPORTANT RULES:

1. Do NOT invent information.
2. Do NOT guess missing quantities.
3. Do NOT guess cooking times.
4. Do NOT guess preparation times.
5. Do NOT create cooking steps that are not present.
6. Do NOT create ingredients that are not visible.
7. If a field is missing or cannot be determined from the image, return exactly:
"N/A"

8. Preserve the meaning of the original recipe.
9. Fix obvious spelling mistakes when the intended word is clear.
10. Keep quantities exactly as written whenever possible.
11. If an ingredient has no quantity written, use "N/A" for its quantity.
12. If an ingredient name cannot be read, use "N/A".
13. If there are no visible cooking steps, return ["N/A"].
14. If there is no description, return "N/A".
15. If prep time is missing, return "N/A".
16. If cook time is missing, return "N/A".
17. If servings are missing, return "N/A".
18. If difficulty is missing, return "N/A".
19. If categories cannot be determined from the recipe, return [].
20. Do not use markdown.
21. Return ONLY valid JSON.

Return this EXACT structure:

{
  "title": "Recipe title or N/A",
  "description": "Recipe description or N/A",
  "difficulty": "Easy, Medium, Hard, or N/A",
  "prepTime": "Preparation time or N/A",
  "cookTime": "Cooking time or N/A",
  "servings": "Number of servings or N/A",
  "categories": [],
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": "Quantity"
    }
  ],
  "steps": [
    "Cooking step"
  ]
}

For categories, only suggest simple categories that are directly supported by the recipe, such as:

Breakfast
Lunch
Dinner
Dessert
Snack
Soup
Salad
Pasta
Chicken
Beef
Vegetarian
Baking
Drinks
Sauce

Do not invent a category if it is not supported by the recipe.

Remember:

The purpose is transcription and organization, NOT recipe invention.
`,
                      },

                      {
                        inlineData: {
                          mimeType:
                            recipeImage.type,
                          data: base64Image,
                        },
                      },
                    ],
                  },
                ],

                generationConfig: {
                  responseMimeType:
                    "application/json",
                },
              }),
            },
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            `Gemini Image API Error (${response.status}):`,
            errorText,
          );

          alert(
            `AI image request failed with status ${response.status}.`,
          );

          return;
        }

        const data =
          await response.json();

        const text =
          data?.candidates?.[0]
            ?.content?.parts?.[0]?.text;

        if (!text) {
          console.error(
            "No AI image response:",
            data,
          );

          alert(
            "AI did not return a response.",
          );

          return;
        }

        let parsed;

        try {
          parsed =
            JSON.parse(text.trim());
        } catch (parseError) {
          console.error(
            "Could not parse AI recipe:",
            text,
          );

          alert(
            "AI returned an invalid recipe response.",
          );

          return;
        }

        if (
          !parsed ||
          typeof parsed !== "object"
        ) {
          alert(
            "AI returned an invalid recipe.",
          );

          return;
        }

        // ================= BASIC INFO =================

        setTitle(
          typeof parsed.title ===
            "string" &&
            parsed.title.trim()
            ? parsed.title.trim()
            : "N/A",
        );

        setDescription(
          typeof parsed.description ===
            "string" &&
            parsed.description.trim()
            ? parsed.description.trim()
            : "N/A",
        );

        // ================= EXTRA INFO =================

        const aiDifficulty =
          typeof parsed.difficulty ===
          "string"
            ? parsed.difficulty.trim()
            : "N/A";

        if (
          [
            "Easy",
            "Medium",
            "Hard",
            "N/A",
          ].includes(aiDifficulty)
        ) {
          setDifficulty(
            aiDifficulty,
          );
        } else {
          setDifficulty("N/A");
        }

        setPrepTime(
          typeof parsed.prepTime ===
            "string" &&
            parsed.prepTime.trim()
            ? parsed.prepTime.trim()
            : "N/A",
        );

        setCookTime(
          typeof parsed.cookTime ===
            "string" &&
            parsed.cookTime.trim()
            ? parsed.cookTime.trim()
            : "N/A",
        );

        setServings(
          parsed.servings !==
            undefined &&
            parsed.servings !== null &&
            String(
              parsed.servings,
            ).trim()
            ? String(
                parsed.servings,
              ).trim()
            : "N/A",
        );

        // ================= INGREDIENTS =================

        if (
          Array.isArray(
            parsed.ingredients,
          ) &&
          parsed.ingredients.length
        ) {
          const cleanedIngredients =
            parsed.ingredients
              .map(
                (ingredient) => ({
                  name:
                    typeof ingredient?.name ===
                      "string" &&
                    ingredient.name.trim()
                      ? ingredient.name.trim()
                      : "N/A",

                  quantity:
                    typeof ingredient?.quantity ===
                      "string" &&
                    ingredient.quantity.trim()
                      ? ingredient.quantity.trim()
                      : "N/A",
                }),
              )
              .filter(
                (ingredient) =>
                  ingredient.name ||
                  ingredient.quantity,
              );

          if (
            cleanedIngredients.length >
            0
          ) {
            setIngredients(
              cleanedIngredients,
            );
          } else {
            setIngredients([
              {
                name: "N/A",
                quantity: "N/A",
              },
            ]);
          }
        } else {
          setIngredients([
            {
              name: "N/A",
              quantity: "N/A",
            },
          ]);
        }

        // ================= STEPS =================

        if (
          Array.isArray(
            parsed.steps,
          ) &&
          parsed.steps.length
        ) {
          const cleanedSteps =
            parsed.steps
              .map(
                (step) =>
                  typeof step ===
                  "string"
                    ? step.trim()
                    : "",
              )
              .filter(Boolean);

          setSteps(
            cleanedSteps.length
              ? cleanedSteps
              : ["N/A"],
          );
        } else {
          setSteps(["N/A"]);
        }

        // ================= CATEGORIES =================

        if (
          Array.isArray(
            parsed.categories,
          )
        ) {
          const aiCategories =
            parsed.categories
              .filter(
                (category) =>
                  typeof category ===
                    "string" &&
                  category.trim(),
              )
              .map(
                (category) =>
                  category.trim(),
              );

          const matchedCategories =
            categories
              .filter(
                (existingCategory) =>
                  aiCategories.some(
                    (aiCategory) =>
                      existingCategory.name?.toLowerCase() ===
                      aiCategory.toLowerCase(),
                  ),
              )
              .map(
                (category) =>
                  category.name,
              );

          setSelectedCategories(
            matchedCategories,
          );
        } else {
          setSelectedCategories(
            [],
          );
        }

        setAiDescription(null);
        setAiSteps(null);

        alert(
          "Recipe extracted successfully! Please review the fields before saving.",
        );
      } catch (error) {
        console.error(
          "AI Image Recipe error:",
          error,
        );

        alert(
          "Something went wrong while reading the recipe image.",
        );
      } finally {
        setLoadingImageAI(false);
      }
    };

  // ============================================================
  // ================= AI DESCRIPTION ===========================
  // ============================================================

  const improveDescriptionWithAI =
    async () => {
      if (!description.trim()) {
        alert(
          "Please enter a description first.",
        );

        return;
      }

      if (
        !process.env
          .REACT_APP_MATRIX_OPEN_AI
      ) {
        alert(
          "AI API key is not configured.",
        );

        console.error(
          "Missing REACT_APP_MATRIX_OPEN_AI environment variable.",
        );

        return;
      }

      try {
        setLoadingAIDesc(true);
        setAiDescription(null);

        const response =
          await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_MATRIX_OPEN_AI}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
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
${JSON.stringify(
  description,
)}`,
                      },
                    ],
                  },
                ],

                generationConfig: {
                  responseMimeType:
                    "application/json",
                },
              }),
            },
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            `Gemini API Error (${response.status}):`,
            errorText,
          );

          alert(
            `AI request failed with status ${response.status}.`,
          );

          return;
        }

        const data =
          await response.json();

        const text =
          data?.candidates?.[0]
            ?.content?.parts?.[0]?.text;

        if (!text) {
          console.error(
            "No AI response:",
            data,
          );

          alert(
            "AI did not return a response.",
          );

          return;
        }

        let parsed;

        try {
          parsed =
            JSON.parse(text.trim());
        } catch (parseError) {
          console.error(
            "Could not parse AI description:",
            text,
          );

          alert(
            "AI returned an invalid response.",
          );

          return;
        }

        if (
          parsed &&
          typeof parsed.rewrittenDescription ===
            "string" &&
          parsed.rewrittenDescription.trim()
        ) {
          setAiDescription(
            parsed.rewrittenDescription.trim(),
          );
        } else {
          console.error(
            "Unexpected AI description format:",
            parsed,
          );

          alert(
            "AI returned an unexpected response.",
          );
        }
      } catch (error) {
        console.error(
          "AI Description error:",
          error,
        );

        alert(
          "Something went wrong while improving the description.",
        );
      } finally {
        setLoadingAIDesc(false);
      }
    };

  // ============================================================
  // ================= AI STEPS =================================
  // ============================================================

  const improveStepsWithAI =
    async () => {
      const cleanCurrentSteps =
        steps
          .map((step) => step.trim())
          .filter(Boolean);

      if (
        cleanCurrentSteps.length ===
        0
      ) {
        alert(
          "Please add some steps first.",
        );

        return;
      }

      if (
        !process.env
          .REACT_APP_MATRIX_OPEN_AI
      ) {
        alert(
          "AI API key is not configured.",
        );

        console.error(
          "Missing REACT_APP_MATRIX_OPEN_AI environment variable.",
        );

        return;
      }

      try {
        setLoadingAI(true);
        setAiSteps(null);

        const response =
          await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_MATRIX_OPEN_AI}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
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
${JSON.stringify(
  cleanCurrentSteps,
)}`,
                      },
                    ],
                  },
                ],

                generationConfig: {
                  responseMimeType:
                    "application/json",
                },
              }),
            },
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            `Gemini API Error (${response.status}):`,
            errorText,
          );

          alert(
            `AI request failed with status ${response.status}.`,
          );

          return;
        }

        const data =
          await response.json();

        const text =
          data?.candidates?.[0]
            ?.content?.parts?.[0]?.text;

        if (!text) {
          console.error(
            "No AI response:",
            data,
          );

          alert(
            "AI did not return a response.",
          );

          return;
        }

        let parsed;

        try {
          parsed =
            JSON.parse(text.trim());
        } catch (parseError) {
          console.error(
            "Could not parse AI steps:",
            text,
          );

          alert(
            "AI returned an invalid response.",
          );

          return;
        }

        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (step) =>
              typeof step ===
                "string" &&
              step.trim().length > 0,
          )
        ) {
          setAiSteps(
            parsed.map((step) =>
              step.trim(),
            ),
          );
        } else {
          console.error(
            "Unexpected AI steps format:",
            parsed,
          );

          alert(
            "AI returned an unexpected response.",
          );
        }
      } catch (error) {
        console.error(
          "AI Steps error:",
          error,
        );

        alert(
          "Something went wrong while cleaning the steps.",
        );
      } finally {
        setLoadingAI(false);
      }
    };

  // ============================================================
  // ================= ADD RECIPE ===============================
  // ============================================================

  const handleSubmit = async () => {
    if (saving) {
      return;
    }

    if (!title.trim()) {
      alert(
        "Please enter a recipe title.",
      );

      return;
    }

    if (!description.trim()) {
      alert(
        "Please enter a recipe description.",
      );

      return;
    }

    const cleanedIngredients =
      ingredients
        .map((ingredient) => ({
          name: ingredient.name.trim(),
          quantity:
            ingredient.quantity.trim(),
        }))
        .filter(
          (ingredient) =>
            ingredient.name ||
            ingredient.quantity,
        );

    const cleanedSteps =
      steps
        .map((step) => step.trim())
        .filter(Boolean);

    if (
      cleanedSteps.length ===
      0
    ) {
      alert(
        "Please add at least one cooking step.",
      );

      return;
    }

    if (!uid) {
      alert(
        "Unable to identify the current user.",
      );

      console.error(
        "No UID found in SecureLS.",
      );

      return;
    }

    try {
      setSaving(true);

      await addRecipe({
        title: title.trim(),
        description:
          description.trim(),

        createdBy: uid,
        authorId: uid,

        status: "approved",
        featured,

        categories:
          selectedCategories,

        ingredients:
          cleanedIngredients,

        steps: cleanedSteps,

        difficulty,
        prepTime:
          prepTime.trim(),
        cookTime:
          cookTime.trim(),
        servings,

        images: [],

        saves: 0,

        createdAt: new Date(),
        updatedAt: new Date(),
      });

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

      removeRecipeImage();

      alert(
        "Recipe Added Successfully ✅",
      );

      navigate(
        "/dashboard/Drecipes",
      );
    } catch (error) {
      console.error(
        "Error adding recipe:",
        error,
      );

      alert(
        "Error adding recipe. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ================= RENDER ===================================
  // ============================================================

  return (
    <div className="page">
      <h1
        style={{
          marginBottom: "25px",
        }}
      >
        Add Recipe
      </h1>

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
        {/* AI IMAGE RECIPE IMPORT */}
        {/* ================================================== */}

        <div
          style={{
            marginBottom: "30px",
            padding: "20px",
            borderRadius: "18px",
            background: "#1c1c1c",
            border: "1px solid #2a2a2a",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            🤖 Import Recipe from Image
          </p>

          <p
            style={{
              margin: "0 0 15px",
              color: "#aaa",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            Upload a photo of a handwritten
            or printed recipe. AI will read
            it and fill the form for you.
          </p>

          <input
            id="recipe-image-input"
            type="file"
            accept="image/*"
            onChange={
              handleRecipeImageChange
            }
          />

          <label
            htmlFor="recipe-image-input"
            className="custom-file-button"
            style={{
              background: "var(--accent)",
              color: "#111",
              fontWeight: "700",
            }}
          >
            📷 Choose Recipe Image
          </label>

          {/* IMAGE PREVIEW */}

          {recipeImagePreview && (
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection:
                  "column",
                gap: "12px",
              }}
            >
              <img
                src={recipeImagePreview}
                alt="Recipe preview"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  width: "400px",
                  maxHeight: "500px",
                  objectFit: "contain",
                  borderRadius: "14px",
                  border: "1px solid #333",
                  background: "#111",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={openCropper}
                  disabled={loadingImageAI}
                  style={{
                    ...secondaryButton,
                    background: "#333",
                    color: "#fff",
                    fontWeight: "700",
                    marginTop: 0,
                    cursor:
                      loadingImageAI
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  ✂️ Crop Image
                </button>

                <button
                  type="button"
                  onClick={
                    analyzeRecipeImageWithAI
                  }
                  disabled={
                    loadingImageAI
                  }
                  style={{
                    ...secondaryButton,
                    background:
                      loadingImageAI
                        ? "#555"
                        : "var(--accent)",
                    color: "#111",
                    fontWeight: "700",
                    marginTop: 0,
                    cursor:
                      loadingImageAI
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {loadingImageAI
                    ? "🤖 Reading Recipe..."
                    : "✨ Analyze Recipe with AI"}
                </button>

                <button
                  type="button"
                  onClick={
                    removeRecipeImage
                  }
                  disabled={
                    loadingImageAI
                  }
                  style={{
                    ...deleteButtonStyle,
                    marginTop: 0,
                    cursor:
                      loadingImageAI
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Remove Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* BASIC INFORMATION */}
        {/* ================================================== */}

        <div>
          <p style={labelStyle}>
            Recipe Title
          </p>

          <input
            type="text"
            placeholder="Recipe Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setAiDescription(null);
            }}
            style={inputStyle}
          />
        </div>

        <div>
          <p style={labelStyle}>
            Description
          </p>

          <textarea
            placeholder="Describe your recipe..."
            value={description}
            onChange={(e) => {
              setDescription(
                e.target.value,
              );

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

        <div
          style={{
            marginBottom: "25px",
          }}
        >
          <button
            type="button"
            onClick={
              improveDescriptionWithAI
            }
            disabled={
              loadingAIDesc
            }
            style={{
              ...btnSecondary,
              opacity:
                loadingAIDesc
                  ? 0.6
                  : 1,
              cursor:
                loadingAIDesc
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loadingAIDesc
              ? "Improving..."
              : "✨ Optimize Description with AI"}
          </button>

          {aiDescription && (
            <div
              style={aiBoxStyle}
            >
              <h4
                style={{
                  margin:
                    "0 0 10px",
                  color:
                    "var(--accent)",
                }}
              >
                AI Suggestion
              </h4>

              <p
                style={{
                  color: "#ccc",
                  margin:
                    "0 0 15px",
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
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDescription(
                      aiDescription,
                    );

                    setAiDescription(
                      null,
                    );
                  }}
                  style={{
                    ...secondaryButton,
                    background:
                      "var(--accent)",
                    color: "#111",
                    fontWeight:
                      "700",
                    marginTop: 0,
                  }}
                >
                  Accept Changes
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiDescription(
                      null,
                    );
                  }}
                  style={{
                    ...secondaryButton,
                    background:
                      "#ff4d4d",
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
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <div>
            <p style={labelStyle}>
              Difficulty
            </p>

            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(
                  e.target.value,
                )
              }
              style={inputStyle}
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

              <option value="N/A">
                N/A
              </option>
            </select>
          </div>

          <div>
            <p style={labelStyle}>
              Prep Time
            </p>

            <input
              type="text"
              placeholder="0 mins"
              value={prepTime}
              onChange={(e) =>
                setPrepTime(
                  e.target.value,
                )
              }
              style={inputStyle}
            />
          </div>

          <div>
            <p style={labelStyle}>
              Cook Time
            </p>

            <input
              type="text"
              placeholder="0 mins"
              value={cookTime}
              onChange={(e) =>
                setCookTime(
                  e.target.value,
                )
              }
              style={inputStyle}
            />
          </div>

          <div>
            <p style={labelStyle}>
              Servings
            </p>

            <input
              type="text"
              placeholder="0"
              value={servings}
              onChange={(e) =>
                setServings(
                  e.target.value,
                )
              }
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
            border:
              "1px solid #2a2a2a",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom:
                "15px",
              gap: "15px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight:
                  "600",
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
              {
                selectedCategories.length
              }{" "}
              selected
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap:
                "wrap",
              gap: "10px",
            }}
          >
            {categories.map(
              (category) => {
                const active =
                  selectedCategories.includes(
                    category.name,
                  );

                return (
                  <button
                    key={
                      category.id ||
                      category.name
                    }
                    type="button"
                    onClick={() =>
                      handleCategoryToggle(
                        category.name,
                      )
                    }
                    style={{
                      padding:
                        "10px 16px",
                      borderRadius:
                        "999px",
                      border: active
                        ? "1px solid var(--accent)"
                        : "1px solid #333",
                      background:
                        active
                          ? "var(--accent)"
                          : "#222",
                      color: active
                        ? "#111"
                        : "#fff",
                      cursor:
                        "pointer",
                      fontWeight:
                        "600",
                      fontSize:
                        "14px",
                    }}
                  >
                    {category.name}
                  </button>
                );
              },
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop:
                "20px",
              alignItems:
                "stretch",
            }}
          >
            <input
              type="text"
              placeholder="New category..."
              value={newCategory}
              onChange={(e) =>
                setNewCategory(
                  e.target.value,
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                  "Enter"
                ) {
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
              onClick={
                handleAddCategory
              }
              style={{
                padding:
                  "12px 18px",
                borderRadius:
                  "12px",
                border: "none",
                background:
                  "var(--accent)",
                color: "#111",
                fontWeight:
                  "700",
                cursor:
                  "pointer",
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
            marginBottom:
              "30px",
          }}
        >
          <p style={sectionTitle}>
            Ingredients
          </p>

          {ingredients.map(
            (
              ingredient,
              index,
            ) => (
              <div
                key={index}
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  marginBottom:
                    "10px",
                  alignItems:
                    "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Ingredient"
                  value={
                    ingredient.name
                  }
                  onChange={(e) =>
                    handleIngredientChange(
                      index,
                      "name",
                      e.target
                        .value,
                    )
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
                  value={
                    ingredient.quantity
                  }
                  onChange={(e) =>
                    handleIngredientChange(
                      index,
                      "quantity",
                      e.target
                        .value,
                    )
                  }
                  style={{
                    ...inputStyle,
                    flex: 1,
                    marginBottom: 0,
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    removeIngredient(
                      index,
                    )
                  }
                  style={
                    deleteButtonStyle
                  }
                >
                  X
                </button>
              </div>
            ),
          )}

          <button
            type="button"
            onClick={
              addIngredient
            }
            style={
              secondaryButton
            }
          >
            Add Ingredient
          </button>
        </div>

        {/* ================================================== */}
        {/* STEPS */}
        {/* ================================================== */}

        <div
          style={{
            marginBottom:
              "30px",
          }}
        >
          <p style={sectionTitle}>
            Steps
          </p>

          {steps.map(
            (step, index) => (
              <div
                key={index}
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  marginBottom:
                    "10px",
                  alignItems:
                    "flex-start",
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
                      e.target
                        .value,
                    )
                  }
                  style={{
                    ...inputStyle,
                    flex: 1,
                    minHeight:
                      "90px",
                    resize:
                      "vertical",
                    marginBottom: 0,
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    removeStep(
                      index,
                    )
                  }
                  style={
                    deleteButtonStyle
                  }
                >
                  X
                </button>
              </div>
            ),
          )}

          <div
            style={{
              display:
                "flex",
              gap: "12px",
              flexWrap:
                "wrap",
              marginTop:
                "10px",
            }}
          >
            <button
              type="button"
              onClick={
                addStep
              }
              style={
                secondaryButton
              }
            >
              Add Step
            </button>

            <button
              type="button"
              onClick={
                improveStepsWithAI
              }
              disabled={
                loadingAI
              }
              style={{
                ...btnSecondary,
                opacity:
                  loadingAI
                    ? 0.6
                    : 1,
                cursor:
                  loadingAI
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loadingAI
                ? "Cleaning..."
                : "✨ Clean Steps with AI"}
            </button>
          </div>

          {aiSteps && (
            <div
              style={aiBoxStyle}
            >
              <h4
                style={{
                  margin:
                    "0 0 15px",
                  color:
                    "var(--accent)",
                }}
              >
                AI Cleaned Steps
              </h4>

              <ol
                style={{
                  paddingLeft:
                    "22px",
                  color:
                    "#ccc",
                  margin:
                    "0 0 15px",
                  fontSize:
                    "14px",
                }}
              >
                {aiSteps.map(
                  (
                    step,
                    index,
                  ) => (
                    <li
                      key={
                        index
                      }
                      style={{
                        marginBottom:
                          "8px",
                        lineHeight:
                          "1.5",
                      }}
                    >
                      {step}
                    </li>
                  ),
                )}
              </ol>

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSteps([
                      ...aiSteps,
                    ]);

                    setAiSteps(
                      null,
                    );
                  }}
                  style={{
                    ...secondaryButton,
                    background:
                      "var(--accent)",
                    color: "#111",
                    fontWeight:
                      "700",
                    marginTop: 0,
                  }}
                >
                  Accept AI Steps
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAiSteps(
                      null,
                    )
                  }
                  style={{
                    ...secondaryButton,
                    background:
                      "#ff4d4d",
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
          onClick={
            handleSubmit
          }
          disabled={saving}
          style={{
            marginTop:
              "10px",
            padding:
              "16px",
            width:
              "100%",
            borderRadius:
              "16px",
            border:
              "none",
            background:
              saving
                ? "#555"
                : "var(--accent)",
            color:
              "#111",
            fontWeight:
              "700",
            fontSize:
              "16px",
            cursor:
              saving
                ? "not-allowed"
                : "pointer",
          }}
        >
          {saving
            ? "Adding Recipe..."
            : "Add Recipe"}
        </button>
      </div>

      {/* ====================================================== */}
      {/* ================= CROP MODAL ========================== */}
      {/* ====================================================== */}

      {showCropper &&
        recipeImagePreview && (
          <div
            style={{
              position:
                "fixed",
              inset: 0,
              zIndex:
                9999,
              background:
                "rgba(0,0,0,0.90)",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding:
                "20px",
              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                width:
                  "100%",
                maxWidth:
                  "950px",
                maxHeight:
                  "95vh",
                overflow:
                  "auto",
                background:
                  "#161616",
                border:
                  "1px solid #333",
                borderRadius:
                  "20px",
                padding:
                  "20px",
                boxSizing:
                  "border-box",
              }}
            >
              {/* HEADER */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap:
                    "15px",
                  marginBottom:
                    "15px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        "22px",
                    }}
                  >
                    ✂️ Crop Recipe Image
                  </h2>

                  <p
                    style={{
                      margin:
                        "6px 0 0",
                      color:
                        "#999",
                      fontSize:
                        "14px",
                    }}
                  >
                    Drag inside the box
                    to move it. Drag
                    the corners or
                    edges to resize it.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCropper(
                      false,
                    );

                    setCropInteraction(
                      null,
                    );
                  }}
                  style={{
                    background:
                      "#333",
                    color:
                      "#fff",
                    border:
                      "none",
                    borderRadius:
                      "10px",
                    padding:
                      "10px 14px",
                    cursor:
                      "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* ================================================= */}
              {/* IMPORTANT FIXED CROP STAGE */}
              {/* ================================================= */}

              <div
                style={{
                  width:
                    "100%",
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  background:
                    "#080808",
                  borderRadius:
                    "14px",
                  padding:
                    "15px",
                  boxSizing:
                    "border-box",
                  overflow:
                    "auto",
                }}
              >
                {/*
                  THIS WRAPPER IS THE IMPORTANT FIX.

                  It is inline-block, so its dimensions
                  match the displayed image.

                  The crop box is therefore positioned
                  directly over the image instead of
                  being positioned relative to the entire
                  modal/container.
                */}

                <div
                  ref={
                    cropContainerRef
                  }
                  style={{
                    position:
                      "relative",
                    display:
                      "inline-block",
                    lineHeight:
                      0,
                    maxWidth:
                      "100%",
                    maxHeight:
                      "65vh",
                    userSelect:
                      "none",
                    touchAction:
                      "none",
                    flexShrink: 0,
                  }}
                >
                  <img
                    ref={
                      cropImageRef
                    }
                    src={
                      recipeImagePreview
                    }
                    alt="Crop preview"
                    onLoad={
                      handleCropImageLoad
                    }
                    draggable={
                      false
                    }
                    style={{
                      display:
                        "block",
                      maxWidth:
                        "100%",
                      maxHeight:
                        "65vh",
                      width:
                        "auto",
                      height:
                        "auto",
                      objectFit:
                        "contain",
                      userSelect:
                        "none",
                      pointerEvents:
                        "none",
                    }}
                  />

                  {/* ================================================= */}
                  {/* DARK OVERLAY */}
                  {/* ================================================= */}

                  {cropImageSize.width >
                    0 &&
                    cropImageSize.height >
                      0 && (
                      <>
                        {/* TOP DARK AREA */}

                        <div
                          style={{
                            position:
                              "absolute",
                            left: 0,
                            top: 0,
                            width:
                              "100%",
                            height:
                              cropBox.y,
                            background:
                              "rgba(0,0,0,0.60)",
                            pointerEvents:
                              "none",
                          }}
                        />

                        {/* BOTTOM DARK AREA */}

                        <div
                          style={{
                            position:
                              "absolute",
                            left: 0,
                            top:
                              cropBox.y +
                              cropBox.height,
                            width:
                              "100%",
                            height:
                              Math.max(
                                0,
                                cropImageSize.height -
                                  (cropBox.y +
                                    cropBox.height),
                              ),
                            background:
                              "rgba(0,0,0,0.60)",
                            pointerEvents:
                              "none",
                          }}
                        />

                        {/* LEFT DARK AREA */}

                        <div
                          style={{
                            position:
                              "absolute",
                            left: 0,
                            top:
                              cropBox.y,
                            width:
                              cropBox.x,
                            height:
                              cropBox.height,
                            background:
                              "rgba(0,0,0,0.60)",
                            pointerEvents:
                              "none",
                          }}
                        />

                        {/* RIGHT DARK AREA */}

                        <div
                          style={{
                            position:
                              "absolute",
                            left:
                              cropBox.x +
                              cropBox.width,
                            top:
                              cropBox.y,
                            width:
                              Math.max(
                                0,
                                cropImageSize.width -
                                  (cropBox.x +
                                    cropBox.width),
                              ),
                            height:
                              cropBox.height,
                            background:
                              "rgba(0,0,0,0.60)",
                            pointerEvents:
                              "none",
                          }}
                        />

                        {/* ================================================= */}
                        {/* CROP BOX */}
                        {/* ================================================= */}

                        <div
                          onPointerDown={(
                            e,
                          ) =>
                            startCropInteraction(
                              e,
                              "move",
                            )
                          }
                          style={{
                            position:
                              "absolute",
                            left:
                              cropBox.x,
                            top:
                              cropBox.y,
                            width:
                              cropBox.width,
                            height:
                              cropBox.height,
                            border:
                              "2px solid var(--accent)",
                            boxSizing:
                              "border-box",
                            cursor:
                              "move",
                            touchAction:
                              "none",
                            zIndex:
                              10,
                          }}
                        >
                          {/* ================================================= */}
                          {/* 3x3 GRID */}
                          {/* ================================================= */}

                          <div
                            style={{
                              position:
                                "absolute",
                              left:
                                "33.333%",
                              top: 0,
                              bottom: 0,
                              width:
                                "1px",
                              background:
                                "rgba(255,255,255,0.45)",
                              pointerEvents:
                                "none",
                            }}
                          />

                          <div
                            style={{
                              position:
                                "absolute",
                              left:
                                "66.666%",
                              top: 0,
                              bottom: 0,
                              width:
                                "1px",
                              background:
                                "rgba(255,255,255,0.45)",
                              pointerEvents:
                                "none",
                            }}
                          />

                          <div
                            style={{
                              position:
                                "absolute",
                              top:
                                "33.333%",
                              left: 0,
                              right: 0,
                              height:
                                "1px",
                              background:
                                "rgba(255,255,255,0.45)",
                              pointerEvents:
                                "none",
                            }}
                          />

                          <div
                            style={{
                              position:
                                "absolute",
                              top:
                                "66.666%",
                              left: 0,
                              right: 0,
                              height:
                                "1px",
                              background:
                                "rgba(255,255,255,0.45)",
                              pointerEvents:
                                "none",
                            }}
                          />

                          {/* ================================================= */}
                          {/* HANDLES */}
                          {/* ================================================= */}

                          <CropHandle
                            position="top-left"
                            onPointerDown={(
                              e,
                            ) =>
                              startCropInteraction(
                                e,
                                "top-left",
                              )
                            }
                          />

                          <CropHandle
                            position="top"
                            onPointerDown={(
                              e,
                            ) =>
                              startCropInteraction(
                                e,
                                "top",
                              )
                            }
                          />

                          <CropHandle
                            position="top-right"
                            onPointerDown={(
                              e,
                            ) =>
                              startCropInteraction(
                                e,
                                "top-right",
                              )
                            }
                          />

                          <CropHandle
                            position="left"
                            onPointerDown={(
                              e,
                            ) =>
                              startCropInteraction(
                                e,
                                "left",
                              )
                            }
                          />

                          <CropHandle
                            position="right"
                            onPointerDown={(
                              e,
                            ) =>
                              startCropInteraction(
                                e,
                                "right",
                              )
                            }
                          />

                          <CropHandle
                            position="bottom-left"
                            onPointerDown={(
                              e,
                            ) =>
                              startCropInteraction(
                                e,
                                "bottom-left",
                              )
                            }
                          />

                          <CropHandle
                            position="bottom"
                            onPointerDown={(
                              e,
                            ) =>
                              startCropInteraction(
                                e,
                                "bottom",
                              )
                            }
                          />

                          <CropHandle
                            position="bottom-right"
                            onPointerDown={(
                              e,
                            ) =>
                              startCropInteraction(
                                e,
                                "bottom-right",
                              )
                            }
                          />
                        </div>
                      </>
                    )}
                </div>
              </div>

              {/* ================================================= */}
              {/* BUTTONS */}
              {/* ================================================= */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "10px",
                  flexWrap:
                    "wrap",
                  marginTop:
                    "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowCropper(
                      false,
                    );

                    setCropInteraction(
                      null,
                    );
                  }}
                  style={{
                    padding:
                      "13px 20px",
                    borderRadius:
                      "12px",
                    border:
                      "1px solid #444",
                    background:
                      "#292929",
                    color:
                      "#fff",
                    cursor:
                      "pointer",
                    fontWeight:
                      "600",
                  }}
                >
                  Cancel Crop
                </button>

                <button
                  type="button"
                  onClick={
                    confirmCrop
                  }
                  style={{
                    padding:
                      "13px 22px",
                    borderRadius:
                      "12px",
                    border:
                      "none",
                    background:
                      "var(--accent)",
                    color:
                      "#111",
                    cursor:
                      "pointer",
                    fontWeight:
                      "700",
                  }}
                >
                  ✓ Confirm Crop
                </button>
              </div>
            </div>
          </div>
        )}
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