import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, login, signup } from "../assets/firebase/auth";
import { getUser } from "../assets/firebase/firestore";
import SecureLS from "secure-ls";

const ls = new SecureLS({ encodingType: "aes" });

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const saveLoginState = (uid, role) => {
    ls.set("Loggedin", "true"); // string
    ls.set("uid", uid);
    ls.set("role", role); // "customer" or "admin"
  };

  const handleEmailAuth = async () => {
    try {
      let authUser = isSignup
        ? await signup(email, password)
        : await login(email, password);

      const userDoc = await getUser(authUser.uid);
      const role = userDoc?.user || "customer";

      saveLoginState(authUser.uid, role);
      navigate("/");
    } catch (error) {
      console.error("Email auth error:", error.message);
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const authUser = await signInWithGoogle();
      const userDoc = await getUser(authUser.uid);
      const role = userDoc?.role || "customer";

      saveLoginState(authUser.uid, role);
      navigate("/");
    } catch (error) {
      console.error("Google Sign-In error:", error.message);
      alert(error.message);
    }
  };

  return (
    <div className="Login-Page page">
      <h1 className="Login-Title">{isSignup ? "Sign Up" : "Login"}</h1>
      <div className="Login-Data">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="Login-Input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="Login-Input"
        />
        <br />
        <button onClick={handleEmailAuth}>{isSignup ? "Sign Up" : "Login"}</button>
        <button onClick={handleGoogleSignIn} className="Login-Gmail">
          Sign In with Google
        </button>
        <br />
        <p
          style={{ cursor: "pointer", color: "var(--text)" }}
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup
            ? "Already have an account? Login"
            : "Don't have an account? Sign Up"}
        </p>
      </div>
    </div>
  );
};

export default Login;