import { db } from "../js/firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function dashboard(container){

container.innerHTML = `

<h1 class="text-2xl font-bold mb-6">
Dashboard TallerPRO360
</h1>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

<div class="bg-white p-4 rounded shadow">
<h3 class="text-gray-500">Órdenes activas</h3>
<p id="kpiOrdenes" class="text-2xl font-bold">0</p>
</div>

<div class="bg-white p-4 rounded shadow">
<h3 class="text-gray-500">Ingresos hoy</h3>
<p id="kpiIngresos" class="text-2xl font-bold">$0</p>
</div>

<div class="bg-white p-4 rounded shadow">
<h3 class="text-gray-500">Vehículos en proceso</h3>
<p id="kpiVehiculos" class="text-2xl font-bold">0</p>
</div>

<div class="bg-white p-4 rounded shadow">
<h3 class="text-gray-500">Clientes</h3>
<p id="kpiClientes" class="text-2xl font-bold">0</p>
</div>

</div>


<div class="bg-white p-4 rounded shadow">

<h2 class="font-bold mb-4">
Actividad reciente
</h2>

<div id="actividad">
Cargando actividad...
</div>

</div>

`;

cargarKPIs();

}

async function cargarKPIs(){

const empresaId = localStorage.getItem("empresaId");

if(!empresaId){
console.log("empresaId no encontrado");
return;
}

try{

const ordenesRef = collection(db,"empresas",empresaId,"ordenes");
const ordenesSnap = await getDocs(ordenesRef);

let ordenesActivas = 0;
let ingresosHoy = 0;
let vehiculos = 0;

const hoy = new Date().toDateString();

ordenesSnap.forEach(doc=>{

const data = doc.data();

if(data.estado !== "entregado"){
ordenesActivas++;
}

vehiculos++;

if(data.fecha){

const fecha = data.fecha.toDate?.() || new Date();

if(fecha.toDateString() === hoy){
ingresosHoy += data.total || 0;
}

}

});

document.getElementById("kpiOrdenes").innerText = ordenesActivas;

document.getElementById("kpiIngresos").innerText =
"$" + ingresosHoy.toLocaleString("es-CO");

document.getElementById("kpiVehiculos").innerText = vehiculos;

const clientesRef = collection(db,"empresas",empresaId,"clientes");
const clientesSnap = await getDocs(clientesRef);

document.getElementById("kpiClientes").innerText = clientesSnap.size;

}
catch(e){

console.error("Error dashboard",e);

}

}