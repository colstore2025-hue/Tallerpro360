import { db } from "./firebase.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function crearRepuesto(data){

try{

const precioVenta =
data.costoCompra * (1 + data.margen/100);

await addDoc(
collection(db,"repuestos"),
{
nombre:data.nombre,
marca:data.marca,
categoria:data.categoria,

costoCompra:data.costoCompra,
margen:data.margen,

precioVenta:Math.round(precioVenta),

stock:data.stock || 0,
stockMinimo:data.stockMinimo || 1,

proveedor:data.proveedor,

fechaCreacion:serverTimestamp()
});

}catch(error){

console.error("Error creando repuesto",error);

}

}