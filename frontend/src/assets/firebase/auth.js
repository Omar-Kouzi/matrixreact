import { auth } from "./config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { setUserWithId, getUser } from "./firestore";

const googleProvider = new GoogleAuthProvider();

// ✅ Create Firestore doc only if it doesn't exist
const createDefaultUserDoc = async (uid, email) => {
  const existingUser = await getUser(uid);
  if (!existingUser) {
    await setUserWithId(uid, {
      id: uid,
      email,
      role: "customer", // default role
      phone: "",
      location: "",
      purchases: {},
      createdAt: new Date(),
    });
  }
  return { uid }; // always return uid
};

// Signup
export const signup = async (email, password) => {
  if (!email || !password) throw new Error("Email and password required");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return createDefaultUserDoc(result.user.uid, email);
};

// Login
export const login = async (email, password) => {
  if (!email || !password) throw new Error("Email and password required");
  const result = await signInWithEmailAndPassword(auth, email, password);
  return { uid: result.user.uid }; // no Firestore write here
};

// Google Sign-In
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return createDefaultUserDoc(user.uid, user.email); // create only if not exists
};

// Logout
export const logout = async () => {
  await signOut(auth);
};