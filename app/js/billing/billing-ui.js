// billing-ui.js
import { getAuth, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore, doc, getDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const userSnap = await getDoc(doc(db, "usuarios", user.uid));
    if (!userSnap.exists()) return;

    const { empresaId } = userSnap.data();
    if (!empresaId) return;

    const empresaSnap = await getDoc(doc(db, "empresas", empresaId));
    if (!empresaSnap.exists()) return;

    const empresa = empresaSnap.data();
    const ahora = new Date();
    const vence = empresa.venceEn?.toDate?.();

    if (!vence) return;

    const dias = Math.ceil((vence - ahora) / (1000 * 60 * 60 * 24));

    if (empresa.estadoPlan !== "ACTIVO" || dias < 0) {
      mostrarBloqueo(
        "🔒 Tu plan está vencido",
        "Debes realizar el pago para continuar usando TallerPRO360."
      );
      return;
    }

    if (dias <= 7) {
      mostrarAviso(`⏳ Tu plan vence en ${dias} día${dias === 1 ? "" : "s"}`);
    }

  } catch (error) {
    console.error("Error validando plan:", error);
  }
});

function mostrarAviso(msg) {
  const div = document.createElement("div");
  div.innerHTML = `
    <div style="
      position:fixed;
      bottom:20px;
      right:20px;
      background:#f59e0b;
      color:black;
      padding:14px 18px;
      border-radius:14px;
      font-weight:bold;
      z-index:9998;
      box-shadow:0 10px 30px rgba(0,0,0,.4);
    ">
      ${msg}
    </div>
  `;
  document.body.appendChild(div);
}

function mostrarBloqueo(titulo, texto) {
  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      background:#020617;
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-family:system-ui;
      padding:20px;
      text-align:center;
    ">
      <div style="
        max-width:420px;
        background:#020617;
        border:1px solid #334155;
        border-radius:20px;
        padding:30px;
      ">
        <h1 style="font-size:22px;color:#f59e0b;font-weight:900;margin-bottom:12px">
          ${titulo}
        </h1>
        <p style="color:#cbd5f5;margin-bottom:20px">
          ${texto}
        </p>
        <a href="pagos.html"
          style="
            display:block;
            background:#f59e0b;
            color:black;
            font-weight:900;
            padding:12px;
            border-radius:12px;
            text-decoration:none;
          ">
          💳 Ir a pagar
        </a>
      </div>
    </div>
  `;
}