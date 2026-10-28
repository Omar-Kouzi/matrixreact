// ================= IMPORTS =================
import { useEffect, useState } from "react";
import SecureLS from "secure-ls";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getActiveSubscription } from "../assets/firebase/subscriptions";

import { db } from "../assets/firebase/config";

import { getUserRecipes, getRecipe } from "../assets/firebase/firestore";

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
        const myRecipes = await getUserRecipes(uid);
        setRecipes(myRecipes);

        // Private recipes belonging to other users are intentionally not readable.
        // Keep any public recipes the user liked, and skip inaccessible old entries.
        const likedIds = Array.isArray(user?.likedRecipes) ? user.likedRecipes : [];
        const liked = await Promise.all(likedIds.map(async (recipeId) => {
          try { return await getRecipe(recipeId); }
          catch { return null; }
        }));
        setLikedRecipes(liked.filter(Boolean));
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
    const currentSubscription = getActiveSubscription(user || {});
    if (currentSubscription !== "free") {
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

  const subscription = getActiveSubscription(user);
  const isPlus = subscription === "plus" || subscription === "pro";
  const subscriptionEnd = user.subscriptionEndDate?.toDate ? user.subscriptionEndDate.toDate() : user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;

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

        <div className="profile-subscription-row">
          <h3>Plan:</h3>
          <p className={`profile-subscription-badge ${isPlus ? "plus" : "free"}`}>
            {subscription === "pro" ? "Pro" : isPlus ? "Plus" : "Free"}
          </p>
        </div>
      </div>

      <p className={`profile-subscription-message ${isPlus ? "plus" : "free"}`}>
        {subscription === "pro"
          ? "You’re on Matrix Pro, including AI tools and a 50-recipe monthly allowance."
          : subscription === "plus"
            ? "You’re on Matrix Plus, including a 20-recipe monthly allowance."
            : "You’re on the Free plan. Upgrade to Plus or Pro for more room and features."}
      </p>
      <div className="profile-subscription-dates">
        <p><strong>Subscription starts:</strong> {user.subscriptionStartDate?.toDate ? user.subscriptionStartDate.toDate().toLocaleDateString() : user.subscriptionStartDate ? new Date(user.subscriptionStartDate).toLocaleDateString() : "Not subscribed"}</p>
        <p><strong>Renews / expires:</strong> {subscriptionEnd && isPlus ? subscriptionEnd.toLocaleDateString() : "—"}</p>
        <button type="button" onClick={() => navigate("/subscription")}>View plans</button>
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
          : isPlus
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
