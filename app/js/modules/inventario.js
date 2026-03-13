/**
 * inventario.js
 * Módulo de Inventario
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";

import {
collection,
addDoc,
getDocs,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ======================================
MODULO PRINCIPAL
====================================== */

export async function inventario(container){

if(!container){
console.error("❌ Contenedor no recibido en módulo inventario");
return;
}

container.innerHTML = `

<div class="card">

<h1 class="text-2xl font-bold mb-6">
Inventario
</h1>

<div class="card">

<input id="productoNombre" placeholder="Nombre del producto" style="padding:8px;margin-right:10px">

<input id="productoPrecio" placeholder="Precio" type="number" style="padding:8px;margin-right:10px">

<input id="productoStock" placeholder="Stock" type="number" style="padding:8px;margin-right:10px">

<button id="btnNuevoProducto"
style="
background:#16a34a;
color:white;
padding:10px 16px;
border:none;
border-radius:8px;
cursor:pointer;
">

Guardar Producto

</button>

</div>

<div class="card">

<h2 style="margin-bottom:10px;">
Productos Registrados
</h2>

<div id="listaInventario">

<p style="color:#94a3b8;">
Cargando inventario...
</p>

</div>

</div>

</div>

`;

document
.getElementById("btnNuevoProducto")
.onclick = guardarProducto;


/* cargar inventario */

cargarInventario();

}


/* ======================================
GUARDAR PRODUCTO
====================================== */

async function guardarProducto(){

const nombre =
document.getElementById("productoNombre").value;

const precio =
Number(document.getElementById("productoPrecio").value);

const stock =
Number(document.getElementById("productoStock").value);

if(!nombre){
alert("Ingrese nombre del producto");
return;
}

try{

const empresaId =
localStorage.getItem("empresaId");

await addDoc(

collection(db,"empresas",empresaId,"inventario"),

{
nombre,
precio,
stock,
fecha:serverTimestamp()
}

);

alert("Producto guardado");

location.reload();

}
catch(error){

console.error("❌ Error guardando producto:",error);

}

}


/* ======================================
CARGAR INVENTARIO
====================================== */

async function cargarInventario(){

const lista =
document.getElementById("listaInventario");

try{

const empresaId =
localStorage.getItem("empresaId");

const snapshot = await getDocs(

collection(db,"empresas",empresaId,"inventario")

);

if(snapshot.empty){

lista.innerHTML =
"<p style='color:#94a3b8'>Inventario vacío</p>";

return;

}

let html = "";

snapshot.forEach(doc=>{

const p = doc.data();

html += `

<div class="card">

<b>${p.nombre}</b><br>

Precio: $${p.precio}<br>

Stock: ${p.stock}

</div>

`;

});

lista.innerHTML = html;

}
catch(error){

console.error("❌ Error cargando inventario:",error);

}

}