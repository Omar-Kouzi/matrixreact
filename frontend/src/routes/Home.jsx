import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { getRecipes } from "../assets/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../assets/firebase/config";

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const [aboutText, setAboutText] = useState("");
  const [aboutImg, setAboutImg] = useState("");

  const [logo, setLogo] = useState("");
  const [background, setBackground] = useState("");
  const [title, setHomeTitle] = useState("");

  const navigate = useNavigate();

  // 🔹 Fetch recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const allRecipes = await getRecipes();

        const shuffled = allRecipes.sort(
          () => 0.5 - Math.random(),
        );

        setRecipes(shuffled.slice(0, 4));
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    fetchRecipes();
  }, []);

  // 🔹 Fetch About data
  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const refDoc = doc(db, "settings", "about");
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          const data = snap.data();

          setAboutText(data.homeText || "");
          setAboutImg(data.img1 || "");
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
      }
    };

    fetchAbout();
  }, []);

  // 🔹 Fetch Home settings
  useEffect(() => {
    const fetchHome = async () => {
      try {
        const refDoc = doc(db, "settings", "home");
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          const data = snap.data();

          setLogo(data.logo || "");
          setBackground(data.background || "");
          setHomeTitle(data.title || "");
        }
      } catch (error) {
        console.error("Error fetching home settings:", error);
      }
    };

    fetchHome();
  }, []);

  // 🔥 Carousel animation
  useEffect(() => {
    if (recipes.length === 0) return;

    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentIndex(
          (prev) => (prev + 1) % recipes.length,
        );

        setFade(true);
      }, 800);
    }, 3000);

    return () => clearInterval(interval);
  }, [recipes]);

  return (
    <div className="Home-Page page">
      {/* ===== Carousel ===== */}
      <section
        className="Home-Carousel"
        style={{
          backgroundImage: background
            ? `url(${background})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="Home-Carousel-Data">
          <div>
            {logo && (
              <img
                className="Home-Carousel-img"
                src={logo}
                alt="Logo"
              />
            )}

            <h1 style={{ fontSize: "50px" }}>
              {title}
            </h1>
          </div>

          <p
            className={`Home-Carousel-Categories ${
              fade ? "fade-in" : "fade-out"
            }`}
          >
            {recipes[currentIndex]?.title ||
              "Loading..."}
          </p>

          <div className="Home-Carousel-Buttens">
            <button
              onClick={() => navigate("/recipes")}
            >
              more
            </button>

            <button
              onClick={() => navigate("/about")}
            >
              about
            </button>
          </div>
        </div>
      </section>

      {/* ===== About ===== */}
      <section className="Home-About">
        {aboutImg && (
          <img
            src={aboutImg}
            alt="About"
            className="Home-About-img"
          />
        )}

        <div className="Home-About-Data">
          <h1>About</h1>

          <p>
            {aboutText || "Loading about text..."}
          </p>
        </div>
      </section>

      {/* ===== Recipes ===== */}
      <section className="Home-Recipes">
        <h1>Recipes</h1>

        <div className="Home-Recipes-Grid">
          <div className="Home-Recipes-Cards">
            {recipes.map((recipe) => {
              return (
                <div
                  key={recipe.id}
                  className="Recipe-Card"
                >
                  <div className="Recipe-Image-Wrap">
                    <img
                      src={
                        recipe.image ||
                        "placeholder-image.jpg"
                      }
                      alt={recipe.title}
                      className="Recipe-Card-img"
                    />
                  </div>

                  <p>{recipe.title}</p>

                  <button
                    className="Recipe-Card-Button"
                    onClick={() =>
                      navigate(`/recipe/${recipe.id}`)
                    }
                  >
                    view more
                  </button>
                </div>
              );
            })}
          </div>

          <button
            style={{
              height: "40px",
              width: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => navigate("/recipes")}
          >
            <FaArrowRight />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;