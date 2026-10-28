import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../assets/firebase/config";
import { FaArrowLeft, FaArrowRight, FaClock, FaUtensils } from "react-icons/fa6";
import { demoRecipes } from "./demoRecipes";

const DemoRecipe = () => {
  const { id } = useParams();
  const [samples, setSamples] = useState(demoRecipes);
  useEffect(() => { (async () => { try { const snap = await getDoc(doc(db, "settings", "demoRecipes")); if (snap.exists() && Array.isArray(snap.data().recipes) && snap.data().recipes.length) setSamples(snap.data().recipes); } catch (e) { console.warn("Using built-in demo recipes:", e); } })(); }, []);
  const recipe = samples.find((item) => item.id === id);

  if (!recipe) {
    return (
      <main className="Matrix-Demo-Detail page">
        <h1>Sample recipe not found</h1>
        <Link className="Matrix-Recipe-Link" to="/">Return to the homepage <FaArrowRight /></Link>
      </main>
    );
  }

  return (
    <main className="Matrix-Demo-Detail page">
      <Link to="/#demo-recipes" className="Matrix-Back-Link"><FaArrowLeft /> All demo recipes</Link>
      <section className="Matrix-Detail-Hero">
        <div className="Matrix-Detail-Image"><img src={recipe.image} alt={recipe.title} /></div>
        <div className="Matrix-Detail-Intro">
          <span className="Matrix-Eyebrow">MATRIX SAMPLE RECIPE · {recipe.category.toUpperCase()}</span>
          <h1>{recipe.title}</h1>
          <p>{recipe.description}</p>
          <div className="Matrix-Detail-Meta"><span><FaClock /> {recipe.time}</span><span><FaUtensils /> {recipe.difficulty}</span></div>
          <p className="Matrix-Sample-Notice">This is a public sample. Your own recipes stay in your private collection.</p>
          <Link className="Matrix-Button Matrix-Button-Primary" to="/login">Make your own recipe book <FaArrowRight /></Link>
        </div>
      </section>
      <section className="Matrix-Recipe-Body">
        <div className="Matrix-Ingredients">
          <span className="Matrix-Eyebrow">GET EVERYTHING READY</span>
          <h2>Ingredients</h2>
          <ul>{recipe.ingredients.map((item) => <li key={item.name}><span>{item.name}</span><strong>{item.quantity}</strong></li>)}</ul>
        </div>
        <div className="Matrix-Instructions">
          <span className="Matrix-Eyebrow">LET'S COOK</span>
          <h2>Instructions</h2>
          <ol>{recipe.steps.map((step, index) => <li key={step}><span className="Matrix-Step-Number">{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
        </div>
      </section>
      <section className="Matrix-Detail-CTA">
        <div><h2>Keep your own version.</h2><p>Save your adjustments, notes, and recipes in your personal Matrix collection.</p></div>
        <Link className="Matrix-Button Matrix-Button-Light" to="/login">Create an account <FaArrowRight /></Link>
      </section>
    </main>
  );
};

export default DemoRecipe;
