/**
 * firebase-config.js
 * Configuración global Firebase v10 para TallerPRO360 PRO360
 * Global Firestore accesible en window.db
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔹 Configuración Firebase (PRO360 - Nexus-Starlink SAS)
const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.appspot.com",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

// Inicializar app Firebase
const app = initializeApp(firebaseConfig);

// Firestore global
const db = getFirestore(app);
window.db = db; // global para todos los módulos

console.log("✅ Firebase inicializado y db disponible globalmente");