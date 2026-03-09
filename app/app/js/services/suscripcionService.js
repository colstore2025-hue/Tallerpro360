/**
 * suscripcionService.js
 * Servicio de verificación de suscripción
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";
import { getTallerId } from "../core/tallerContext.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ========================================
   VERIFICAR SUSCRIPCIÓN
======================================== */

export async function verificarSuscripcion(){

  try{

    const tallerId = getTallerId();

    if(!tallerId){
      throw new Error("No hay taller activo en el contexto");
    }

    const ref = doc(db,"empresas",tallerId);

    const snap = await getDoc(ref);

    if(!snap.exists()){
      console.warn("Empresa no encontrada");
      return false;
    }

    const data = snap.data();

    if(data.estado !== "activo"){
      console.warn("Suscripción inactiva");
      return false;
    }

    return true;

  }catch(error){

    console.error("Error verificando suscripción:",error);

    return false;

  }

}