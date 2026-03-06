import { db } from "./firebase.js";

import {
doc,
updateDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { enviarWhatsApp } from "./whatsappService.js";


/* ===============================
CAMBIAR ESTADO DE ORDEN
=============================== */

export async function cambiarEstadoOrden(
empresaId,
ordenId,
nuevoEstado
){

try{

if(!empresaId || !ordenId){

throw new Error("empresaId u ordenId inválidos");

}

const ref = doc(
db,
"empresas",
empresaId,
"ordenes",
ordenId
);

const snap = await getDoc(ref);

if(!snap.exists()){

throw new Error("La orden no existe");

}

const data = snap.data();

const telefonoCliente = data.telefono || null;
const cliente = data.cliente || "Cliente";
const vehiculo = data.vehiculo || "Vehículo";


/* ===============================
ACTUALIZAR ESTADO
=============================== */

await updateDoc(ref,{
estado:nuevoEstado
});

console.log("Estado actualizado:",nuevoEstado);


/* ===============================
NOTIFICACIÓN WHATSAPP
=============================== */

if(telefonoCliente){

const mensaje = `
Hola ${cliente}

Su vehículo:

🚗 ${vehiculo}

cambió de estado:

📊 ${nuevoEstado}

Gracias por confiar en nosotros.

TallerPRO360
Servicio Automotriz
`;

await enviarWhatsApp(
telefonoCliente,
mensaje
);

}

}catch(error){

console.error(
"Error cambiando estado de orden:",
error
);

alert(
"No fue posible actualizar el estado de la orden"
);

}

}