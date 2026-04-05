/**
 * firebase-config.js - TallerPRO360 🚀
 * NÚCLEO SINCRONIZADO (ESM MODE)
 */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.appspot.com",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

// 1. Inicialización Única
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// 2. Instancias de Servicio
const auth = getAuth(app);
const db = getFirestore(app);

// 3. PUENTE CRÍTICO: Exponer a Global para nexus-demo.js y otros scripts
window.db = db;
window.auth = auth;
window.firebaseApp = app;

// Exportación para módulos modernos
export { app, auth, db };

console.log("🚀 TallerPRO360: Núcleo Firebase v10 activo y vinculado globalmente.");
