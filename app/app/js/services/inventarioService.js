import {
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { coleccionTaller } from "./dbTaller.js";


export async function crearRepuesto(data){

try{

/* =========================
VALIDACIONES
========================= */

if(!data.nombre){
throw new Error("El nombre del repuesto es obligatorio");
}

if(data.costoCompra === undefined){
throw new Error("El costo de compra es obligatorio");
}


/* =========================
NORMALIZACIÓN DE DATOS
========================= */

const costoCompra = Number(data.costoCompra);
const margen = Number(data.margen) || 30;

if(isNaN(costoCompra)){
throw new Error("Costo de compra inválido");
}


/* =========================
CÁLCULO DE PRECIO
========================= */

const precioVenta =
costoCompra * (1 + margen / 100);

const utilidadUnidad =
precioVenta - costoCompra;


/* =========================
CREACIÓN DOCUMENTO
========================= */

const docRef = await addDoc(
coleccionTaller("repuestos"),
{

/* info básica */

nombre: data.nombre,
codigo: data.codigo || "",

marca: data.marca || "",
categoria: data.categoria || "",


/* costos */

costoCompra: costoCompra,
margen: margen,

precioVenta: Math.round(precioVenta),
utilidadUnidad: Math.round(utilidadUnidad),


/* inventario */

stock: Number(data.stock) || 0,
stockMinimo: Number(data.stockMinimo) || 1,

rotacion: 0,


/* proveedor */

proveedor: data.proveedor || "No definido",


/* estado */

estado: "activo",


/* fechas */

fechaCreacion: serverTimestamp(),
fechaActualizacion: serverTimestamp()

}
);

return docRef.id;

}catch(error){

console.error("Error creando repuesto:", error);

throw error;

}

}