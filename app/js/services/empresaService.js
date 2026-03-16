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

if(!data){
throw new Error("Datos de empresa no enviados");
}

if(!data.nombre || data.nombre.trim()===""){
throw new Error("Nombre del taller requerido");
}


/* ==============================
NORMALIZAR DATOS
============================== */

const nombre = data.nombre.trim();

const ciudad = data.ciudad ? data.ciudad.trim() : "";

const telefono = data.telefono ? data.telefono.trim() : "";

const plan = data.plan ? data.plan.toLowerCase() : "starter";


/* ==============================
CREAR EMPRESA
============================== */

const ref = await addDoc(
collection(db,"talleres"),
{
nombre,
ciudad,
telefono,

plan,
estado:"activo",

fechaCreacion: serverTimestamp()
}
);


console.log("🏭 Taller creado correctamente:", ref.id);

return ref.id;

}
catch(error){

console.error("❌ Error creando taller:", error);

throw new Error("No fue posible crear el taller");

}

}