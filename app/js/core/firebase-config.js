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

// import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "...";

const app = initializeApp(firebaseConfig);

/* 🛡️ COMENTADO TEMPORALMENTE PARA BYPASS DE SEGURIDAD 
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6LdgH5ls...'),
  isTokenAutoRefreshEnabled: true 
});
*/

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; // Quita appCheck de aquí también


