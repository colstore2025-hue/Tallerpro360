/**
 * clientes.js
 * Gestión de clientes
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";

import {
collection,
addDoc,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function clientes(container){

container.innerHTML = `

<h1 style="font-size:26px;margin-bottom:20px;">
👥 Clientes
</h1>


<div class="card">

<h3>Nuevo Cliente</h3>

<input id="nombreCliente" placeholder="Nombre"
style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">

<input id="telefonoCliente" placeholder="Teléfono"
style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">

<input id="emailCliente" placeholder="Email"
style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">

<button id="guardarCliente"
style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">
Guardar Cliente
</button>

</div>


<div class="card">

<h3>Buscar</h3>

<input id="buscarCliente"
placeholder="Buscar cliente..."
style="width:100%;padding:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">

</div>


<div class="card">

<h3>Lista de Clientes</h3>

<div id="listaClientes">

Cargando clientes...

</div>

</div>

`;


/* ===========================
EVENTOS
=========================== */

document.getElementById("guardarCliente")
.onclick = guardarCliente;

document.getElementById("buscarCliente")
.oninput = filtrarClientes;


/* ===========================
CARGAR CLIENTES
=========================== */

cargarClientes();

}



/* ===========================
GUARDAR CLIENTE
=========================== */

async function guardarCliente(){

const nombre = document.getElementById("nombreCliente").value;
const telefono = document.getElementById("telefonoCliente").value;
const email = document.getElementById("emailCliente").value;

if(!nombre){

alert("Nombre requerido");
return;

}

try{

await addDoc(collection(db,"clientes"),{

nombre,
telefono,
email,
fecha:new Date()

});

alert("Cliente guardado");

limpiarFormulario();

cargarClientes();

}
catch(error){

console.error("Error guardando cliente",error);

alert("Error guardando cliente");

}

}



/* ===========================
CARGAR CLIENTES
=========================== */

async function cargarClientes(){

const lista = document.getElementById("listaClientes");

try{

const querySnapshot = await getDocs(collection(db,"clientes"));

let html = `
<table style="width:100%;border-collapse:collapse;">
<tr style="border-bottom:1px solid #1e293b;">
<th align="left">Nombre</th>
<th align="left">Teléfono</th>
<th align="left">Email</th>
</tr>
`;

querySnapshot.forEach(doc=>{

const c = doc.data();

html += `
<tr>
<td>${c.nombre || ""}</td>
<td>${c.telefono || ""}</td>
<td>${c.email || ""}</td>
</tr>
`;

});

html += "</table>";

lista.innerHTML = html;

}
catch(error){

console.error("Error cargando clientes",error);

lista.innerHTML="Error cargando clientes";

}

}



/* ===========================
BUSCAR CLIENTES
=========================== */

function filtrarClientes(){

const input = document.getElementById("buscarCliente").value.toLowerCase();

const rows = document.querySelectorAll("#listaClientes table tr");

rows.forEach((row,index)=>{

if(index===0) return;

const text = row.innerText.toLowerCase();

row.style.display = text.includes(input) ? "" : "none";

});

}



/* ===========================
LIMPIAR FORM
=========================== */

function limpiarFormulario(){

document.getElementById("nombreCliente").value="";
document.getElementById("telefonoCliente").value="";
document.getElementById("emailCliente").value="";

}