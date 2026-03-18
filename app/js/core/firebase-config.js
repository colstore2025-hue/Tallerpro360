/**
 * firebase-config.js
 * Núcleo Firebase centralizado - TallerPRO360
 * Compatible con módulos ES6 + fallback global opcional
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* 🔹 CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.appspot.com",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

/* 🔥 INIT SEGURO (evita doble inicialización) */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/* 🔥 SERVICIOS */
const auth = getAuth(app);
const db = getFirestore(app);

/* ✅ EXPORTS (CRÍTICO) */
export { app, auth, db };

/* 🧠 OPCIONAL (compatibilidad legacy) */
window.db = db;
window.auth = auth;

console.log("✅ Firebase PRO360 listo (auth + db)");