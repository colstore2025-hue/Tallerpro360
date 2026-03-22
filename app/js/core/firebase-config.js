/**
 * firebase-config.js - Edición "Soberana" 🛡️
 */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.appspot.com",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/* 🛡️ CONFIGURACIÓN DE APP CHECK INTELIGENTE */
// Usamos tu Debug Token para que Firebase reconozca tu sesión de desarrollo
if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:") {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
}

let appCheck;
try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LdgH5lsAAAAAHftoo-5Y6RKpQDrBpoA18IpGJuV'),
      isTokenAutoRefreshEnabled: true 
    });
    console.log("🛡️ Escudo App Check Activo.");
} catch (err) {
    console.warn("⚠️ App Check no pudo inicializar, continuando en modo preventivo.");
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, appCheck };
