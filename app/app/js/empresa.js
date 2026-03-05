import { db } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function crearEmpresa(userId, nombreEmpresa){

  const empresaId = "empresa_" + userId;

  await setDoc(doc(db,"empresas",empresaId),{
    nombre:nombreEmpresa,
    plan:"trial",
    fechaRegistro:new Date()
  });

  localStorage.setItem("empresaId",empresaId);

}