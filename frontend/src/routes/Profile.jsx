// ================= IMPORTS =================
import { useEffect, useState } from "react";
import SecureLS from "secure-ls";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { db } from "../assets/firebase/config";

import { getRecipes } from "../assets/firebase/firestore";

import { useNavigate } from "react-router-dom";

const ls = new SecureLS({
  encodingType: "aes",
});

const Profile = () => {
  const [user, setUser] = useState(null);

  const [recipes, setRecipes] = useState([]);

  const [likedRecipes, setLikedRecipes] = useState([]);

  const [showLiked, setShowLiked] = useState(false);

  const [editing, setEditing] = useState({
    name: false,
  });

  const [tempData, setTempData] = useState({});

  const [adLoading, setAdLoading] = useState(false);

  const navigate = useNavigate();

  const uid = ls.get("uid");

  // ================= FETCH USER =================
  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) return;

      const userRef = doc(db, "users", uid);

      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setUser(data);

        setTempData(data);
      }
    };

    fetchUser();
  }, [uid]);

  // ================= FETCH RECIPES =================
  useEffect(() => {
    const fetchRecipesData = async () => {
      try {
        const allRecipes = await getRecipes();

        // ================= MY RECIPES =================
        const myRecipes = allRecipes.filter((r) => r.authorId === uid);

        setRecipes(myRecipes);

        // ================= LIKED RECIPES =================
        const liked = allRecipes.filter((recipe) =>
          user?.likedRecipes?.includes(recipe.id),
        );

        setLikedRecipes(liked);
      } catch (err) {
        console.error(err);
      }
    };

    if (user) {
      fetchRecipesData();
    }
  }, [uid, user]);

  // ================= SAVE USER FIELD =================
  const handleSave = async (field, value) => {
    try {
      const userRef = doc(db, "users", uid);

      await updateDoc(userRef, {
        [field]: value,
      });

      setUser((prev) => ({
        ...prev,
        [field]: value,
      }));

      setTempData((prev) => ({
        ...prev,
        [field]: value,
      }));

      setEditing((prev) => ({
        ...prev,
        [field]: false,
      }));
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  // ================= WATCH AD =================
  const handleAddRecipe = async () => {
    // admins skip ads
    if (user?.role === "admin") {
      navigate("/add-recipe");

      return;
    }

    try {
      setAdLoading(true);

      alert("Watch ad to continue");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      alert("Ad completed ✅");

      navigate("/add-recipe");
    } catch (err) {
      console.error(err);

      alert("Ad failed to load");
    } finally {
      setAdLoading(false);
    }
  };

  if (!user) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <h1>Profile</h1>

      <hr />

      {/* ================= USER INFO ================= */}
      <div className="user-info">
        <div>
          <h3>Name:</h3>

          {editing.name ? (
            <>
              <input
                value={tempData.name || ""}
                onChange={(e) =>
                  setTempData({
                    ...tempData,
                    name: e.target.value,
                  })
                }
              />

              <button onClick={() => handleSave("name", tempData.name)}>
                Save
              </button>
            </>
          ) : (
            <>
              <p>{user.name}</p>

              <button
                onClick={() =>
                  setEditing({
                    name: true,
                  })
                }
              >
                Edit
              </button>
            </>
          )}
        </div>

        <div>
          <h3>Email:</h3>

          <p>{user.email}</p>
        </div>

        <div>
          <h3>Role:</h3>

          <p>{user.role}</p>
        </div>
      </div>

      {/* ================= ADD RECIPE ================= */}
      <button
        onClick={handleAddRecipe}
        disabled={adLoading}
        style={{
          padding: "14px 20px",
          borderRadius: "14px",
          border: "none",
          background: "var(--accent)",
          color: "#111",
          fontWeight: "700",
          cursor: "pointer",
          marginBottom: "20px",
          opacity: adLoading ? 0.7 : 1,
        }}
      >
        {adLoading
          ? "Loading Ad..."
          : user.role === "admin"
            ? "Add Recipe"
            : "Watch Ad & Add Recipe"}
      </button>

      <hr />

      {/* ================= TOGGLE ================= */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setShowLiked(false)}
          style={{
            padding: "10px 18px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            background: !showLiked ? "var(--accent)" : "#222",
            color: !showLiked ? "#111" : "#fff",
          }}
        >
          My Recipes
        </button>

        <button
          onClick={() => setShowLiked(true)}
          style={{
            padding: "10px 18px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            background: showLiked ? "var(--accent)" : "#222",
            color: showLiked ? "#111" : "#fff",
          }}
        >
          Liked Recipes
        </button>
      </div>

      {/* ================= TITLE ================= */}
      <h2>{showLiked ? "Liked Recipes" : "My Recipes"}</h2>

      {/* ================= GRID ================= */}
      <div className="Recipes-Grid">
        {(showLiked ? likedRecipes : recipes).length > 0 ? (
          (showLiked ? likedRecipes : recipes).map((recipe) => (
            <div key={recipe.id} className="Recipe-Card">
              {/* IMAGE */}
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

              {/* CONTENT */}
              <div className="Recipe-Card-Name">
                <p>{recipe.title}</p>
              </div>

              {/* BUTTONS */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {/* VIEW */}
                <button
                  className="Recipe-Card-Button"
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                >
                  View
                </button>

                {/* EDIT ONLY FOR MY RECIPES */}
                {!showLiked && (
                  <button
                    className="Recipe-Card-Button"
                    onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>{showLiked ? "No liked recipes yet" : "No recipes yet"}</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
