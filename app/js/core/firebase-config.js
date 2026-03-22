/**
 * firebase-config.js - TallerPRO360 🚀
 * BYPASS TEMPORAL: Se desactiva App Check para evitar bloqueos de Google Cloud MFA.
 */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importación de App Check comentada para no generar peso innecesario
// import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.appspot.com",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

// Inicialización única y segura
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/* 🛡️ APP CHECK DESACTIVADO TEMPORALMENTE 
   Motivo: Bloqueo de acceso a Google Cloud Console (MFA Requerido).
   Esto permitirá que el sistema cargue sin esperar validaciones externas.
*/

const auth = getAuth(app);
const db = getFirestore(app);

// Exportación limpia (Sin appCheck)
export { app, auth, db };

console.log("🚀 TallerPRO360: Núcleo Firebase cargado en modo Rescate (Sin App Check).");
