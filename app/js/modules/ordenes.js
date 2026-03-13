/**
 * ordenes.js
 * Módulo de órdenes de trabajo
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";

import {
collection,
addDoc,
getDoc,
updateDoc,
doc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { detectarRepuestos } from "../ai/iaMecanica.js";
import { generarFactura } from "../core/facturacion.js";
import { enviarWhatsApp } from "../core/whatsappService.js";


/* ========================================
MODULO PRINCIPAL (LO USA EL ROUTER)
======================================== */

export async function ordenes(container){

if(!container){
console.error("❌ Contenedor no recibido en módulo ordenes");
return;
}

container.innerHTML = `

<div class="card">

<h1 class="text-2xl font-bold mb-4">
Órdenes de trabajo
</h1>

<p class="text-gray-400 mb-4">
Gestión de órdenes del taller.
</p>

<button id="btnNuevaOrden"
class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">

Nueva Orden

</button>

</div>

`;

}


/* ========================================
CREAR ORDEN
======================================== */

export async function crearOrden(orden){

try{

const empresaId = localStorage.getItem("empresaId");

const docRef = await addDoc(

collection(db,"empresas",empresaId,"ordenes"),

{
...orden,
empresaId,
estado:"activa",
acciones:[],
total:0,
fecha:serverTimestamp()
}

);

console.log("✅ Orden creada:",docRef.id);

return docRef.id;

}catch(error){

console.error("❌ Error creando orden:",error);

}

}


/* ========================================
AGREGAR ACCION A ORDEN
======================================== */

export async function agregarAccionOrden(ordenId,accion){

try{

const empresaId = localStorage.getItem("empresaId");

const ref = doc(db,"empresas",empresaId,"ordenes",ordenId);

const ordenSnap = await getDoc(ref);

if(!ordenSnap.exists()){

console.error("❌ Orden no existe");
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


console.log("✅ Acción agregada correctamente");


}catch(error){

console.error("❌ Error agregando acción:",error);

}

}