import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";
import { setTallerId } from "./tallerContext.js";

const auth = getAuth();

export async function login(email, password) {
  try {
    // Iniciar sesión con email y contraseña
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // Obtener datos del usuario en Firestore
    const userDoc = await getDoc(doc(db, "usuarios", uid));
    const data = userDoc.data();

    // Guardar el ID del taller en el contexto global
    setTallerId(data.tallerId);

    return true;
  } catch (error) {
    console.error("Error login:", error);
    return false;
  }
}