/**
 * login.js
 * Servicio de autenticación
 * TallerPRO360
 */

import { 
  getAuth, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { setTallerId } from "../core/tallerContext.js";

const auth = getAuth();

/**
 * Iniciar sesión
 */
export async function login(email, password) {

  try {

    const cred = await signInWithEmailAndPassword(auth, email, password);

    const uid = cred.user.uid;

    const userRef = doc(db, "usuarios", uid);

    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("Usuario no registrado en Firestore");
    }

    const data = userDoc.data();

    const empresaId = data.empresaId;

    if (!empresaId) {
      throw new Error("Usuario sin empresa asignada");
    }

    // guardar empresa en contexto global
    setTallerId(empresaId);

    return {
      success: true,
      empresaId: empresaId,
      uid: uid
    };

  } catch (error) {

    console.error("Error login:", error);

    return {
      success: false,
      error: error.message
    };

  }

}