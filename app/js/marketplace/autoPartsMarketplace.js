/**
 * autoPartsMarketplace.js
 * TallerPRO360 Global Marketplace
 * Marketplace de autopartes estilo Amazon
 * Integración LATAM con MercadoPago
 */

import { db } from "../core/firebase-config.js"

import {
collection,
addDoc,
getDocs,
doc,
query,
where,
updateDoc,
serverTimestamp,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"


/* =====================================================
CONFIGURACIÓN GLOBAL
===================================================== */

const COMISION_PLATAFORMA = 0.08
const MARKETPLACE_VERSION = "1.0.0"


/* =====================================================
PUBLICAR REPUESTO (PROVEEDORES)
===================================================== */

export async function publicarRepuesto(repuesto){

try{

const data = {

nombre: repuesto.nombre || "",
marca: repuesto.marca || "",
modeloCompatible: repuesto.modeloCompatible || "",
categoria: repuesto.categoria || "",
descripcion: repuesto.descripcion || "",

precio: Number(repuesto.precio || 0),
stock: Number(repuesto.stock || 0),

imagenes: repuesto.imagenes || [],

proveedorId: repuesto.proveedorId,
proveedorNombre: repuesto.proveedorNombre || "",

pais: repuesto.pais || "Colombia",

rating: 0,
ventas: 0,

activo: true,

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
where("nombre","==",filtro),
limit(50)
)

}else{

q = query(
collection(db,"marketplaceRepuestos"),
orderBy("ventas","desc"),
limit(50)
)

}

const snap = await getDocs(q)

const resultados = []

snap.forEach(d=>{

resultados.push({
id:d.id,
...d.data()
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

const comision = calcularComision(precioTotal)

const pedido = {

empresaId: data.empresaId,
proveedorId: data.proveedorId,

items: data.items || [],

precioTotal: precioTotal,
comisionPlataforma: comision,

estado: "pendiente",

metodoPago: data.metodoPago || "mercadopago",

pagoId: null,

pais: data.pais || "Colombia",

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
CREAR PAGO MERCADOPAGO
===================================================== */

export async function crearPagoMercadoPago(pedidoId,monto){

try{

const body = {

pedidoId: pedidoId,
monto: monto,
descripcion: "Compra de autopartes TallerPRO360"

}

const res = await fetch("/api/mercadopago/create-payment",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(body)

})

const data = await res.json()

return data

}catch(e){

console.error("Error creando pago MercadoPago:",e)
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
where("empresaId","==",empresaId),
limit(100)
)

const snap = await getDocs(q)

const pedidos = []

snap.forEach(d=>{

pedidos.push({
id:d.id,
...d.data()
})

})

return pedidos

}catch(e){

console.error("Error obteniendo pedidos:",e)
return []

}

}


/* =====================================================
CALCULAR COMISIÓN
===================================================== */

export function calcularComision(total){

return Math.round(total * COMISION_PLATAFORMA)

}


/* =====================================================
TOP REPUESTOS MÁS VENDIDOS
===================================================== */

export async function topRepuestos(){

try{

const q = query(
collection(db,"marketplaceRepuestos"),
orderBy("ventas","desc"),
limit(20)
)

const snap = await getDocs(q)

const productos = []

snap.forEach(d=>{

productos.push({
id:d.id,
...d.data()
})

})

return productos

}catch(e){

console.error("Error obteniendo top repuestos:",e)
return []

}

}