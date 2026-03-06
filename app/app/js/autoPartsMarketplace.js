/**
 * autoPartsMarketplace.js
 * TallerPRO360 Global Marketplace
 * Marketplace de autopartes tipo Amazon
 */

import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
getDoc,
doc,
query,
where,
updateDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =====================================================
CONFIGURACIÓN
===================================================== */

const COMISION_PLATAFORMA = 0.08; // 8%


/* =====================================================
PUBLICAR REPUESTO (PROVEEDORES)
===================================================== */

export async function publicarRepuesto(repuesto){

try{

const data = {
nombre: repuesto.nombre,
marca: repuesto.marca || "",
modeloCompatible: repuesto.modeloCompatible || "",
categoria: repuesto.categoria || "",
precio: Number(repuesto.precio || 0),
stock: Number(repuesto.stock || 0),
proveedorId: repuesto.proveedorId,
descripcion: repuesto.descripcion || "",
fecha: serverTimestamp()
}

const ref = await addDoc(
collection(db,"marketplaceRepuestos"),
data
)

console.log("📦 Repuesto publicado:",ref.id)

return ref.id

}catch(e){

console.error("Error publicando repuesto:",e)
return null

}

}


/* =====================================================
BUSCAR REPUESTOS
===================================================== */

export async function buscarRepuestos(filtro){

try{

let q

if(filtro){

q = query(
collection(db,"marketplaceRepuestos"),
where("nombre","==",filtro)
)

}else{

q = query(collection(db,"marketplaceRepuestos"))

}

const snap = await getDocs(q)

const resultados = []

snap.forEach(doc=>{

resultados.push({
id:doc.id,
...doc.data()
})

})

return resultados

}catch(e){

console.error("Error buscando repuestos:",e)
return []

}

}


/* =====================================================
CREAR PEDIDO DE REPUESTOS
===================================================== */

export async function crearPedido(data){

try{

const precioTotal = Number(data.precioTotal || 0)

const comision = precioTotal * COMISION_PLATAFORMA

const pedido = {
empresaId: data.empresaId,
proveedorId: data.proveedorId,
items: data.items || [],
precioTotal: precioTotal,
comisionPlataforma: comision,
estado: "pendiente",
fecha: serverTimestamp()
}

const ref = await addDoc(
collection(db,"marketplacePedidos"),
pedido
)

console.log("🛒 Pedido creado:",ref.id)

return ref.id

}catch(e){

console.error("Error creando pedido:",e)
return null

}

}


/* =====================================================
ACTUALIZAR ESTADO PEDIDO
===================================================== */

export async function actualizarEstadoPedido(pedidoId,estado){

try{

await updateDoc(
doc(db,"marketplacePedidos",pedidoId),
{
estado:estado
}
)

console.log("📦 Estado pedido actualizado:",estado)

}catch(e){

console.error("Error actualizando pedido:",e)

}

}


/* =====================================================
OBTENER PEDIDOS DE UNA EMPRESA
===================================================== */

export async function obtenerPedidosEmpresa(empresaId){

try{

const q = query(
collection(db,"marketplacePedidos"),
where("empresaId","==",empresaId)
)

const snap = await getDocs(q)

const pedidos = []

snap.forEach(doc=>{

pedidos.push({
id:doc.id,
...doc.data()
})

})

return pedidos

}catch(e){

console.error("Error obteniendo pedidos:",e)
return []

}

}


/* =====================================================
CALCULAR COMISIÓN PLATAFORMA
===================================================== */

export function calcularComision(total){

return Math.round(total * COMISION_PLATAFORMA)

}