import { db } from "../js/firebase.js";
import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container){

container.innerHTML = `
<div class="p-6">

<h1 class="text-3xl font-bold mb-6">
📊 Dashboard TallerPRO360
</h1>

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

<div class="bg-white rounded-xl shadow p-5">
<h3 class="text-gray-500 text-sm">Órdenes activas</h3>
<p id="kpiOrdenes" class="text-3xl font-bold">0</p>
</div>

<div class="bg-white rounded-xl shadow p-5">
<h3 class="text-gray-500 text-sm">Ingresos hoy</h3>
<p id="kpiIngresos" class="text-3xl font-bold">$0</p>
</div>

<div class="bg-white rounded-xl shadow p-5">
<h3 class="text-gray-500 text-sm">Vehículos en taller</h3>
<p id="kpiVehiculos" class="text-3xl font-bold">0</p>
</div>

<div class="bg-white rounded-xl shadow p-5">
<h3 class="text-gray-500 text-sm">Inventario bajo</h3>
<p id="kpiInventario" class="text-3xl font-bold">0</p>
</div>

</div>


<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

<div class="bg-white rounded-xl shadow p-5">

<h2 class="text-xl font-semibold mb-4">
🧾 Últimas órdenes
</h2>

<div id="listaOrdenes">
Cargando órdenes...
</div>

</div>


<div class="bg-white rounded-xl shadow p-5">

<h2 class="text-xl font-semibold mb-4">
⚡ Acciones rápidas
</h2>

<div class="flex flex-col gap-3">

<button id="btnNuevaOrden" class="bg-blue-600 text-white p-3 rounded">
+ Crear nueva orden
</button>

<button id="btnNuevoCliente" class="bg-green-600 text-white p-3 rounded">
+ Registrar cliente
</button>

<button id="btnInventario" class="bg-purple-600 text-white p-3 rounded">
Ver inventario
</button>

</div>

</div>

</div>

</div>
`;

cargarKPIs();
cargarUltimasOrdenes();

}



async function cargarKPIs(){

try{

const ordenesSnap = await getDocs(collection(db,"ordenes"));

let ordenesActivas = 0;
let ingresosHoy = 0;
let vehiculos = 0;

const hoy = new Date().toDateString();

ordenesSnap.forEach(doc=>{

const data = doc.data();

vehiculos++;

if(data.estado !== "entregado"){
ordenesActivas++;
}

if(data.fecha){

const fecha = data.fecha.toDate?.() || new Date();

if(fecha.toDateString() === hoy){
ingresosHoy += data.total || 0;
}

}

});

document.getElementById("kpiOrdenes").innerText = ordenesActivas;
document.getElementById("kpiVehiculos").innerText = vehiculos;
document.getElementById("kpiIngresos").innerText =
"$"+ingresosHoy.toLocaleString();

}catch(e){

console.error("Error KPIs",e);

}

}



async function cargarUltimasOrdenes(){

const cont = document.getElementById("listaOrdenes");

try{

const snap = await getDocs(collection(db,"ordenes"));

let html = "";

snap.forEach(doc=>{

const o = doc.data();

html += `
<div class="border-b py-2 flex justify-between">

<span>
${o.cliente || "Cliente"}
</span>

<span class="text-gray-500">
${o.placa || ""}
</span>

</div>
`;

});

if(html === ""){
html = "No hay órdenes registradas";
}

cont.innerHTML = html;

}catch(e){

cont.innerHTML = "Error cargando órdenes";

}

}