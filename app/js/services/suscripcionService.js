import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 VERIFICAR SUSCRIPCIÓN
export async function verificarSuscripcion(empresaId) {

  const ref = doc(window.db, "suscripciones", empresaId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;

  const data = snap.data();

  return data.activa === true;
}

// 🔥 CREAR SUSCRIPCIÓN
export async function crearSuscripcion(empresaId) {

  await setDoc(doc(window.db, "suscripciones", empresaId), {
    activa: true,
    plan: "pro",
    creadoEn: new Date()
  });
}