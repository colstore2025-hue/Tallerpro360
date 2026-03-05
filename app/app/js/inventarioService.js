import { db } from "./firebase.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function crearRepuesto(data){

try{

// Validaciones básicas

if(!data.nombre || !data.costoCompra){
throw new Error("Datos obligatorios faltantes");
}


// Cálculo de precio de venta

const margen = data.margen || 30;

const precioVenta =
Number(data.costoCompra) * (1 + margen / 100);


// Crear documento

const docRef = await addDoc(
collection(db,"repuestos"),
{

nombre: data.nombre,
codigo: data.codigo || "",

marca: data.marca || "",
categoria: data.categoria || "",


// costos

costoCompra: Number(data.costoCompra),
margen: margen,

precioVenta: Math.round(precioVenta),


// inventario

stock: Number(data.stock) || 0,
stockMinimo: Number(data.stockMinimo) || 1,


// proveedor

proveedor: data.proveedor || "No definido",


// fechas

fechaCreacion: serverTimestamp(),
fechaActualizacion: serverTimestamp()

});

return docRef.id;

}catch(error){

console.error("Error creando repuesto:", error);

throw error;

}

}