import { db } from "./firebase.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function crearRepuesto(data){

try{

const precioVenta =
Number(data.costoCompra) * (1 + Number(data.margen)/100);

await addDoc(
collection(db,"repuestos"),
{
nombre:data.nombre,
marca:data.marca,
categoria:data.categoria,

costoCompra:Number(data.costoCompra),
margen:Number(data.margen),

precioVenta:Math.round(precioVenta),

stock:Number(data.stock) || 0,
stockMinimo:Number(data.stockMinimo) || 1,

proveedor:data.proveedor || "N/A",

fechaCreacion:serverTimestamp()
});

console.log("Repuesto creado correctamente");

}catch(error){

console.error("Error creando repuesto",error);

}

}