/**
 * empresaService.js
 * TallerPRO360 SaaS
 * Manejo de creación de talleres / empresas
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/**
 * Crear nuevo taller (empresa)
 * @param {Object} data
 * @returns {String} tallerId
 */

export async function crearTaller(data){

  try{

    if(!data?.nombre){
      throw new Error("Nombre del taller requerido");
    }

    const ref = await addDoc(
      collection(db,"talleres"),
      {
        nombre: data.nombre,
        ciudad: data.ciudad || "",
        telefono: data.telefono || "",

        plan: "starter",
        estado: "activo",

        fechaCreacion: serverTimestamp()
      }
    );

    console.log("Taller creado:", ref.id);

    return ref.id;

  }
  catch(error){

    console.error("Error creando taller:", error);

    throw error;

  }

}