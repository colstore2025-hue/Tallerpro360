import { db } from "./firebase.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =============================
// CREAR REPUESTO
// =============================

export async function crearRepuesto(data){

try{

// =============================
// VALIDACIONES
// =============================

if(!data.nombre || !data.costoCompra){
throw new Error("Nombre y costo de compra son obligatorios");
}


// =============================
// NORMALIZAR DATOS NUMÉRICOS
// =============================

const costoCompra = Number(data.costoCompra);
const margen = Number(data.margen) || 30;


// =============================
// CÁLCULO PRECIO VENTA
// =============================

let precioVenta = costoCompra * (1 + margen / 100);

// redondeo comercial COP
precioVenta = Math.round(precioVenta);


// =============================
// CREAR DOCUMENTO
// =============================

const docRef = await addDoc(
collection(db,"repuestos"),
{

// información base

nombre: data.nombre.trim(),
codigo: data.codigo || "",
marca: data.marca || "",
categoria: data.categoria || "",


// precios (COP)

costoCompra: costoCompra,
margen: margen,
precioVenta: precioVenta,


// inventario

stock: Number(data.stock) || 0,
stockMinimo: Number(data.stockMinimo) || 1,


// proveedor

proveedor: data.proveedor || "No definido",


// métricas comerciales

vecesVendido: 0,
ingresosGenerados: 0,
utilidadGenerada: 0,


// estado

activo: true,


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