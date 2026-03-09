/**
 * firebase-config.js
 * TallerPRO360 ERP SaaS
 * Configuración central Firebase
 * SDK Modular v10+
 */

import { initializeApp, getApps, getApp } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAnalytics, 
  isSupported 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// ======================================================
// 🔐 CONFIGURACIÓN
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.firebasestorage.app",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

// ======================================================
// 🚀 INICIALIZACIÓN SEGURA (evita doble carga)
// ======================================================

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ======================================================
// 🔑 AUTH
// ======================================================

export const auth = getAuth(app);

// Persistencia local (usuario permanece logueado)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("🔐 Persistencia Auth activada");
  })
  .catch((error) => {
    console.warn("⚠️ Error persistencia Auth:", error);
  });

// ======================================================
// 🗄️ FIRESTORE
// ======================================================

export const db = getFirestore(app);

// Habilitar persistencia offline (PWA ready)
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("📦 Firestore modo offline activado");
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("⚠️ Persistencia ya activa en otra pestaña");
    } else if (err.code === "unimplemented") {
      console.warn("⚠️ Navegador no soporta persistencia offline");
    }
  });

// ======================================================
// 📊 ANALYTICS (opcional, solo si navegador soporta)
// ======================================================

let analytics = null;

isSupported().then((yes) => {
  if (yes) {
    analytics = getAnalytics(app);
    console.log("📊 Analytics activado");
  }
});

export { analytics };

// ======================================================
// 📌 EXPORT APP (por si se necesita)
// ======================================================

export default app;