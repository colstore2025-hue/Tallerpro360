import {
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { coleccionTaller } from "./dbTaller.js";


/* ========================================
CREAR ORDEN
======================================== */

export async function crearOrden(data){

try{

/* ===============================
VALIDACIÓN BÁSICA
=============================== */

if(!data){
throw new Error("Datos de orden no enviados");
}

if(!data.cliente){
throw new Error("El cliente es obligatorio");
}

if(!data.vehiculo){
throw new Error("El vehículo es obligatorio");
}

if(!data.placa){
throw new Error("La placa es obligatoria");
}


/* ===============================
NORMALIZAR DATOS
=============================== */

const orden = {

cliente: data.cliente.trim(),

telefono: data.telefono || "",

vehiculo: data.vehiculo.trim(),

placa: data.placa.trim().toUpperCase(),

tecnico: data.tecnico || "Sin asignar",

estado: "activa",

descripcionProblema: data.descripcionProblema || "",

diagnosticoIA: null,

repuestosIA: [],

acciones: [],

total: 0,

creadoPor: data.usuario || "sistema",

fecha: serverTimestamp()

};


/* ===============================
CREAR ORDEN EN FIRESTORE
=============================== */

const docRef = await addDoc(
coleccionTaller("ordenes"),
orden
);

console.log("Orden creada:",docRef.id);

return docRef.id;


/* ===============================
ERRORES
=============================== */

}catch(error){

console.error(
"Error creando orden:",
error
);

alert(
"No fue posible crear la orden"
);

return null;

}

}