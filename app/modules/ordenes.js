import { db } from "../js/core/firebase-config.js";

import {
collection,
addDoc,
getDoc,
updateDoc,
doc,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { detectarRepuestos } from "../js/ai/iaMecanica.js";
import { generarFactura } from "../js/facturacion.js";
import { enviarWhatsApp } from "../js/whatsappService.js";


/* ========================================
CREAR ORDEN
======================================== */

export async function crearOrden(orden){

try{

const empresaId = localStorage.getItem("empresaId");

const docRef = await addDoc(collection(db,"ordenes"),{

...orden,
empresaId,
estado:"activa",
acciones:[],
total:0,
fecha:serverTimestamp()

});

console.log("Orden creada:",docRef.id);

return docRef.id;

}catch(error){

console.error("Error creando orden:",error);

}

}


/* ========================================
AGREGAR ACCION A ORDEN
======================================== */

export async function agregarAccionOrden(ordenId,accion){

try{

const ref = doc(db,"ordenes",ordenId);

const ordenSnap = await getDoc(ref);

if(!ordenSnap.exists()){

console.error("Orden no existe");
return;

}

const ordenData = ordenSnap.data();


/* ======================
IA DETECTAR REPUESTOS
====================== */

const ia = await detectarRepuestos(accion.descripcion);

accion.repuestosIA = ia?.repuestos || [];


/* ======================
ACCIONES ACTUALES
====================== */

const accionesActuales = ordenData.acciones || [];

const nuevasAcciones = [...accionesActuales,accion];


/* ======================
TOTAL
====================== */

const totalActual = ordenData.total || 0;

const totalNuevo = totalActual + (accion.costo || 0);


/* ======================
ACTUALIZAR FIRESTORE
====================== */

await updateDoc(ref,{
acciones:nuevasAcciones,
total:totalNuevo
});


/* ======================
NOTIFICACION CLIENTE
====================== */

if(ordenData.telefonoCliente){

await enviarWhatsApp(
ordenData.telefonoCliente,
`🔧 TallerPRO360

Nueva acción registrada:
${accion.descripcion}`
);

}


/* ======================
GENERAR FACTURA
====================== */

await generarFactura({

...ordenData,
acciones:nuevasAcciones,
total:totalNuevo

});


console.log("Acción agregada correctamente");


}catch(error){

console.error("Error agregando acción:",error);

}

}