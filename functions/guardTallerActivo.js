import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

/* ===============================
   GUARDIA DE TALLER ACTIVO
================================ */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  const ref = doc(db, "talleres", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    location.href = "billing.html";
    return;
  }

  const t = snap.data();
  const ahora = Timestamp.now();

  // 🚫 Plan vencido
  if (!t.venceEn || t.venceEn.toMillis() < ahora.toMillis()) {
    await auth.signOut();
    location.href = "billing.html?estado=vencido";
    return;
  }

  // ⚠️ Plan limitado
  if (t.estadoPlan === "LIMITADO") {
    mostrarBanner("⚠️ Tu plan vence pronto. Renueva para evitar suspensión.");
  }

  // 🚨 Plan suspendido
  if (t.estadoPlan === "SUSPENDIDO") {
    await auth.signOut();
    location.href = "billing.html?estado=suspendido";
    return;
  }

  console.log("✅ Taller activo:", t.estadoPlan);
});

/* ===============================
   UI ALERTA
================================ */
function mostrarBanner(texto) {
  const banner = document.createElement("div");
  banner.innerHTML = texto;
  banner.style.cssText = `
    position:fixed;
    bottom:0;
    left:0;
    width:100%;
    background:#f59e0b;
    color:#000;
    padding:10px;
    text-align:center;
    font-weight:bold;
    z-index:9999;
  `;
  document.body.appendChild(banner);
}