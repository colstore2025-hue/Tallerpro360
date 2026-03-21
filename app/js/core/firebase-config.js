/**
 * firebase-config.js
 * 🛡️ Núcleo Firebase centralizado + App Check (reCAPTCHA Enterprise)
 * Proyecto: TallerPRO360
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

/* 🔹 CONFIGURACIÓN OFICIAL */
const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.appspot.com",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

/* 🔥 INICIALIZACIÓN DEL NÚCLEO */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/* 🛡️ ACTIVACIÓN DE APP CHECK (ESCUDO ANTI-BOTS) */
// Esto usa la Site Key de reCAPTCHA Enterprise que generamos en Google Cloud
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6LdgH5lsAAAAAHftoo-5Y6RKpQDrBpoA18IpGJuV'),
  isTokenAutoRefreshEnabled: true // Mantiene la sesión segura automáticamente
});

/* 🔥 SERVICIOS */
const auth = getAuth(app);
const db = getFirestore(app);

/* ✅ EXPORTACIONES DINÁMICAS */
export { app, auth, db, appCheck };

/* 🧠 COMPATIBILIDAD LEGACY (Solo si es estrictamente necesario) */
window.db = db;
window.auth = auth;

console.log("🚀 TallerPRO360: Firebase + App Check Protegido.");
