/**
 * firebase-config.js
 * 🛡️ Núcleo Firebase + App Check Certificado
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

// Inicialización segura
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/* 🛡️ CONFIGURACIÓN DE APP CHECK PARA CELULAR */
// Activamos el modo debug para que Firebase nos genere un código en la consola
self.FIREBASE_APPCHECK_DEBUG_TOKEN ='f47ac10b-58cc-4372-a567-0e02b2c3d479'; 

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6LdgH5lsAAAAAHftoo-5Y6RKpQDrBpoA18IpGJuV'),
  isTokenAutoRefreshEnabled: true 
});

const auth = getAuth(app);
const db = getFirestore(app);

// Exportación para los servicios
export { app, auth, db, appCheck };

console.log("🛡️ TallerPRO360: Escudo App Check Activo.");
