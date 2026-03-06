/**
 * marketplaceRepuestosAI.js
 * TallerPRO360
 * Marketplace inteligente de repuestos
 */

import { db } from "./firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
BUSCAR PROVEEDORES
=============================== */

export async function buscarProveedores(repuesto){

try{

const proveedoresRef = collection(db,"proveedores");

const snapshot = await getDocs(proveedoresRef);

let resultados = [];

snapshot.forEach(doc=>{

const data = doc.data();

if(!data.repuestos) return;

if(data.repuestos.includes(repuesto)){

resultados.push({

id:doc.id,
nombre:data.nombre || "Proveedor",
precio:data.precios?.[repuesto] || null,
tiempoEntrega:data.tiempoEntrega || "24h",
ciudad:data.ciudad || "N/A"

});

}

});

return resultados;

}
catch(e){

console.error("Error buscando proveedores:",e);

return [];

}

}


/* ===============================
MEJOR PROVEEDOR
=============================== */

export function mejorProveedor(lista){

if(!lista.length) return null;

return lista.sort((a,b)=>{

const precioA = a.precio || 9999999;
const precioB = b.precio || 9999999;

return precioA - precioB;

})[0];

}


/* ===============================
RECOMENDAR COMPRA
=============================== */

export async function recomendarCompra(repuestos){

let recomendaciones = [];

for(const repuesto of repuestos){

const proveedores = await buscarProveedores(repuesto);

const mejor = mejorProveedor(proveedores);

if(mejor){

recomendaciones.push({

repuesto,
proveedor:mejor.nombre,
precio:mejor.precio,
entrega:mejor.tiempoEntrega,
ciudad:mejor.ciudad

});

}

}

return recomendaciones;

}