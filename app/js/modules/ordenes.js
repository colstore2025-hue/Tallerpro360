/**
 * ordenes.js
 * Órdenes de trabajo
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";

import {
collection,
addDoc,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function ordenes(container){

container.innerHTML = `

<h1 style="font-size:26px;margin-bottom:20px;">
🛠 Órdenes de Trabajo
</h1>


<div class="card">

<h3>Nueva Orden</h3>

<input id="clienteOrden" placeholder="Cliente"
style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">

<input id="vehiculoOrden" placeholder="Vehículo"
style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">

<textarea id="diagnosticoOrden"
placeholder="Diagnóstico"
style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;"></textarea>

<select id="estadoOrden"
style="width:100%;padding:10px;margin:6px 0;border-radius:6px;background:#020617;color:white;border:1px solid #333;">

<option value="Diagnóstico">Diagnóstico</option>
<option value="Reparación">Reparación</option>
<option value="Esperando repuestos">Esperando repuestos</option>
<option value="Listo para entrega">Listo para entrega</option>

</select>

<button id="guardarOrden"
style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">
Crear Orden
</button>

</div>



<div class="card">

<h3>Órdenes del Taller</h3>

<div id="listaOrdenes">

Cargando órdenes...

</div>

</div>

`;


/* ===========================
EVENTOS
=========================== */

document.getElementById("guardarOrden")
.onclick = guardarOrden;


/* ===========================
CARGAR ORDENES
=========================== */

cargarOrdenes();

}



/* ===========================
GUARDAR ORDEN
=========================== */

async function guardarOrden(){

const cliente = document.getElementById("clienteOrden").value;
const vehiculo = document.getElementById("vehiculoOrden").value;
const diagnostico = document.getElementById("diagnosticoOrden").value;
const estado = document.getElementById("estadoOrden").value;

if(!cliente){

alert("Cliente requerido");
return;

}

try{

await addDoc(collection(db,"ordenes"),{

cliente,
vehiculo,
diagnostico,
estado,
fecha:new Date()

});

alert("Orden creada");

limpiarFormulario();

cargarOrdenes();

}
catch(error){

console.error("Error creando orden",error);

alert("Error creando orden");

}

}



/* ===========================
CARGAR ORDENES
=========================== */

async function cargarOrdenes(){

const lista = document.getElementById("listaOrdenes");

try{

const querySnapshot = await getDocs(collection(db,"ordenes"));

let html = `
<table style="width:100%;border-collapse:collapse;">

<tr style="border-bottom:1px solid #1e293b;">
<th align="left">Cliente</th>
<th align="left">Vehículo</th>
<th align="left">Estado</th>
<th align="left">Fecha</th>
</tr>
`;

querySnapshot.forEach(doc=>{

const o = doc.data();

html += `
<tr>
<td>${o.cliente || ""}</td>
<td>${o.vehiculo || ""}</td>
<td>${o.estado || ""}</td>
<td>${new Date(o.fecha.seconds*1000).toLocaleDateString()}</td>
</tr>
`;

});

html += "</table>";

lista.innerHTML = html;

}
catch(error){

console.error("Error cargando ordenes",error);

lista.innerHTML="Error cargando órdenes";

}

}



/* ===========================
LIMPIAR FORM
=========================== */

function limpiarFormulario(){

document.getElementById("clienteOrden").value="";
document.getElementById("vehiculoOrden").value="";
document.getElementById("diagnosticoOrden").value="";

}