<script type="module">
import { getAuth, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const userRef = doc(db, "usuarios", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.rol !== "taller") return;
    if (!data.vence) return;

    const hoy = new Date();
    const vence = data.vence.toDate();
    const dias = Math.ceil((vence - hoy) / 86400000);

    // Estado vencido → bloqueo inmediato
    if (dias < 0) {
      await updateDoc(userRef, {
        status: "SUSPENDIDO"
      });

      mostrarAlerta("🚫 Tu plan ha vencido. Realiza el pago para continuar.", "error");
      return;
    }

    // Control de alertas (una sola vez)
    const alertas = data.alertas || {
      d7: false,
      d3: false,
      d1: false
    };

    if (dias <= 7 && dias > 3 && !alertas.d7) {
      mostrarAlerta(`⏳ Tu plan vence en ${dias} días`, "warn");
      await marcarAlerta(userRef, "d7");
    }

    if (dias <= 3 && dias > 1 && !alertas.d3) {
      mostrarAlerta(`⚠️ Tu plan vence en ${dias} días`, "warn");
      await marcarAlerta(userRef, "d3");
    }

    if (dias === 1 && !alertas.d1) {
      mostrarAlerta(`🚨 Tu plan vence MAÑANA`, "error");
      await marcarAlerta(userRef, "d1");
    }

  } catch (err) {
    console.error("Billing Guard Error:", err);
  }
});

// 🔁 Marca alerta como enviada
async function marcarAlerta(ref, campo) {
  await updateDoc(ref, {
    [`alertas.${campo}`]: true
  });
}

// 🔔 UI de alerta
function mostrarAlerta(msg, tipo = "warn") {
  const colores = {
    warn: "#f59e0b",
    error: "#ef4444",
    ok: "#10b981"
  };

  const div = document.createElement("div");
  div.innerHTML = `
    <div style="
      position:fixed;
      top:20px;
      right:20px;
      background:${colores[tipo]};
      color:#0f172a;
      padding:16px 22px;
      border-radius:14px;
      font-weight:900;
      z-index:9999;
      box-shadow:0 15px 40px rgba(0,0,0,.5);
      animation: slideIn .4s ease-out;
    ">
      ${msg}
    </div>
  `;

  document.body.appendChild(div);
  setTimeout(() => div.remove(), 7000);
}
</script>