/**
 * empresas.js
 * TallerPRO360 SaaS
 * Gestión de empresas
 */

import { db } from "../core/firebase-config.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
   CREAR EMPRESA
=============================== */

export async function crearEmpresa(userId, nombreEmpresa){

  if(!userId || !nombreEmpresa){
    throw new Error("userId y nombreEmpresa son requeridos");
  }

  const empresaId = "empresa_" + userId;

  try{

    await setDoc(
      doc(db,"empresas",empresaId),
      {
        nombre: nombreEmpresa,
        plan: "trial",
        estado: "activa",
        owner: userId,
        fechaRegistro: serverTimestamp()
      }
    );

    // guardar empresa en sesión
    localStorage.setItem("empresaId", empresaId);

    console.log("Empresa creada:", empresaId);

    return empresaId;

  }
  catch(error){

    console.error("Error creando empresa:", error);
    throw error;

  }

}