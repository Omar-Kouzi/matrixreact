import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../assets/firebase/config";
import { FaArrowRight, FaBookOpen, FaRegImage, FaWandMagicSparkles, FaLink, FaLock } from "react-icons/fa6";
import { demoRecipes } from "./demoRecipes";

const features = [
  {
    icon: <FaBookOpen />,
    title: "Your own recipe book",
    text: "Keep your recipes together with ingredients, quantities, preparation times, and clear instructions.",
  },
  {
    icon: <FaLink />,
    title: "Recipes inside recipes",
    text: "Link a recipe to a sub-recipe, like homemade tomato sauce inside a pasta recipe, so your building blocks stay organized.",
  },
  {
    icon: <FaWandMagicSparkles />,
    title: "AI cooking helpers",
    text: "Use AI tools to help write recipe descriptions and steps, or turn a picture of a written recipe into structured recipe details. Available with a subscription.",
  },
  {
    icon: <FaRegImage />,
    title: "Photos are optional",
    text: "A recipe is still a recipe without a picture. Save sauces, dressings, doughs, and other basics with or without an image.",
  },
];

const Home = () => {
  const [samples, setSamples] = useState(demoRecipes);
  useEffect(() => { (async () => { try { const snap = await getDoc(doc(db, "settings", "demoRecipes")); if (snap.exists() && Array.isArray(snap.data().recipes) && snap.data().recipes.length) setSamples(snap.data().recipes); } catch (e) { console.warn("Using built-in demo recipes:", e); } })(); }, []);
  return (
  <main className="Matrix-Home page">
    <section className="Matrix-Hero">
      <div className="Matrix-Hero-Content">
        <span className="Matrix-Eyebrow">YOUR RECIPES, BETTER ORGANIZED</span>
        <h1>A recipe book that works <em>the way you cook.</em></h1>
        <p>
          Save the recipes you love, organize the little details, and build a personal collection you can come back to whenever you cook.
        </p>
        <div className="Matrix-Hero-Actions">
          <Link className="Matrix-Button Matrix-Button-Primary" to="/login">Create your free account <FaArrowRight /></Link>
          <a className="Matrix-Text-Link" href="#demo-recipes">Explore demo recipes</a>
        </div>
        <div className="Matrix-Hero-Note"><FaLock /> Your personal recipes are for your account.</div>
      </div>
      <div className="Matrix-Hero-Art" aria-label="A selection of freshly prepared food" role="img">
        <div className="Matrix-Hero-Photo Matrix-Hero-Photo-Main" />
        <div className="Matrix-Hero-Photo Matrix-Hero-Photo-Small" />
        <div className="Matrix-Hero-Stamp"><span>MADE FOR</span><strong>real kitchens</strong></div>
      </div>
    </section>

    <section className="Matrix-Feature-Section">
      <div className="Matrix-Section-Heading">
        <span className="Matrix-Eyebrow">A LITTLE MORE THAN A LIST</span>
        <h2>Everything your recipes need.</h2>
        <p>Simple tools to keep your cooking knowledge in one place.</p>
      </div>
      <div className="Matrix-Features-Grid">
        {features.map((feature) => (
          <article className="Matrix-Feature-Card" key={feature.title}>
            <div className="Matrix-Feature-Icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="Matrix-Demo-Section" id="demo-recipes">
      <div className="Matrix-Section-Heading Matrix-Demo-Heading">
        <span className="Matrix-Eyebrow">TAKE A LOOK AROUND</span>
        <h2>Start with a taste.</h2>
        <p>Open these sample recipes and explore the format before creating your own account.</p>
      </div>
      <div className="Matrix-Demo-Grid">
        {samples.map((recipe, index) => (
          <article className="Matrix-Demo-Card" key={recipe.id}>
            <Link to={`/demo/${recipe.id}`} className="Matrix-Demo-Image-Link" aria-label={`View ${recipe.title}`}>
              <img src={recipe.image} alt={recipe.title} loading="lazy" />
              <span className="Matrix-Demo-Number">0{index + 1}</span>
            </Link>
            <div className="Matrix-Demo-Card-Body">
              <div className="Matrix-Demo-Meta"><span>{recipe.category}</span><span>{recipe.time}</span></div>
              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>
              <Link className="Matrix-Recipe-Link" to={`/demo/${recipe.id}`}>View sample recipe <FaArrowRight /></Link>
            </div>
          </article>
        ))}
      </div>
      <div className="Matrix-Demo-Footer">
        <p>Ready to keep your own recipes organized?</p>
        <Link className="Matrix-Button Matrix-Button-Primary" to="/login">Join Matrix <FaArrowRight /></Link>
      </div>
    </section>

    <section className="Matrix-Bottom-CTA">
      <div>
        <span className="Matrix-Eyebrow">YOUR NEXT FAVOURITE RECIPE STARTS HERE</span>
        <h2>Build a recipe book that is yours.</h2>
        <p>Start with the free plan, then upgrade whenever you want more room or AI tools.</p>
      </div>
      <Link className="Matrix-Button Matrix-Button-Light" to="/login">Get started <FaArrowRight /></Link>
    </section>
  </main>
  );
};

export default Home;
