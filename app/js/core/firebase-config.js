/**
 * firebase-config.js
 * TallerPRO360 ERP SaaS
 * CONFIG PRO ESTABLE (Vercel + PWA + MultiTab Safe)
 */


/* ======================================================
IMPORTS FIREBASE
====================================================== */

import { initializeApp, getApps, getApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  enableIndexedDbPersistence
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAnalytics,
  isSupported
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

import { getStorage }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


/* ======================================================
CONFIGURACIÓN FIREBASE
====================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.appspot.com",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};


/* ======================================================
INICIALIZACIÓN SEGURA
====================================================== */

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);


/* ======================================================
AUTH
====================================================== */

export const auth = getAuth(app);

// ⚡ Persistencia segura
await setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("🔐 Auth persistente OK"))
  .catch(err => console.warn("⚠️ Auth persistencia error:", err));


/* ======================================================
FIRESTORE
====================================================== */

export const db = getFirestore(app);


/* ======================================================
STORAGE
====================================================== */

export const storage = getStorage(app);


/* ======================================================
OFFLINE MODE (SAFE)
====================================================== */

// 🔥 SOLO activar en entorno seguro (evita errores en Vercel)
async function activarOfflineSeguro() {
  try {

    // Evitar múltiples pestañas rompiendo la app
    await enableIndexedDbPersistence(db);

    console.log("📦 Offline habilitado");

  } catch (err) {

    if (err.code === "failed-precondition") {
      console.warn("⚠️ Offline desactivado (multi-tab)");
    } 
    else if (err.code === "unimplemented") {
      console.warn("⚠️ Navegador sin soporte offline");
    } 
    else {
      console.warn("⚠️ Offline error:", err);
    }

  }
}

// ⚠️ Ejecutar SIN bloquear app
setTimeout(() => activarOfflineSeguro(), 500);


/* ======================================================
ANALYTICS (NO BLOQUEANTE)
====================================================== */

let analytics = null;

(async () => {
  try {
    if (await isSupported()) {
      analytics = getAnalytics(app);
      console.log("📊 Analytics activo");
    }
  } catch (e) {
    console.warn("⚠️ Analytics no disponible");
  }
})();

export { analytics };


/* ======================================================
EXPORT APP
====================================================== */

export default app;