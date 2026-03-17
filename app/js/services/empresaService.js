import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function crearEmpresa(empresaId, data) {

  await setDoc(doc(window.db, "empresas", empresaId), {
    nombre: data.nombre || "Taller",
    plan: "pro",
    creadoEn: new Date()
  });
}