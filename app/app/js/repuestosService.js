import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
doc,
updateDoc,
deleteDoc,
serverTimestamp,
query,
orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const repuestosRef = collection(db,"repuestos");


// CREAR REPUESTO
export async function crearRepuesto(data){

try{

const costoCompra = Number(data.costoCompra);
const margen = Number(data.margen);

const precioVenta = costoCompra * (1 + margen/100);

await addDoc(repuestosRef,{
    
nombre:data.nombre || "",
marca:data.marca || "",
categoria:data.categoria || "",

costoCompra:costoCompra,
margen:margen,

precioVenta:Math.round(precioVenta),

stock:Number(data.stock) || 0,
stockMinimo:Number(data.stockMinimo) || 1,

proveedor:data.proveedor || "",

fechaCreacion:serverTimestamp()

});

console.log("Repuesto creado correctamente");

}catch(error){

console.error("Error creando repuesto:",error);

}

}



// LISTAR REPUESTOS
export async function obtenerRepuestos(){

try{

const q = query(repuestosRef, orderBy("fechaCreacion","desc"));

const snapshot = await getDocs(q);

const repuestos = [];

snapshot.forEach(doc => {

repuestos.push({
id:doc.id,
...doc.data()
});

});

return repuestos;

}catch(error){

console.error("Error obteniendo repuestos:",error);
return [];
}

}



// ACTUALIZAR REPUESTO
export async function actualizarRepuesto(id,data){

try{

const costoCompra = Number(data.costoCompra);
const margen = Number(data.margen);

const precioVenta = costoCompra * (1 + margen/100);

await updateDoc(doc(db,"repuestos",id),{

nombre:data.nombre,
marca:data.marca,
categoria:data.categoria,

costoCompra:costoCompra,
margen:margen,

precioVenta:Math.round(precioVenta),

stock:Number(data.stock),
stockMinimo:Number(data.stockMinimo),

proveedor:data.proveedor

});

console.log("Repuesto actualizado");

}catch(error){

console.error("Error actualizando repuesto:",error);

}

}



// ELIMINAR REPUESTO
export async function eliminarRepuesto(id){

try{

await deleteDoc(doc(db,"repuestos",id));

console.log("Repuesto eliminado");

}catch(error){

console.error("Error eliminando repuesto:",error);

}

}