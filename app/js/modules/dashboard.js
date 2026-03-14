import { db } from "../core/firebase-config.js";
import { diagnosticoIA } from "../ai/iaMecanica.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";


export async function dashboard(container){

container.innerHTML = `
<div class="card">
<h2>Dashboard</h2>
<p>Panel principal del sistema.</p>
</div>
`;

}

<button id="btnVoz"
class="bg-green-600 text-white px-4 py-2 rounded mb-6">
🎙️ Diagnóstico por voz
</button>

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
<h3 class="text-gray-500">Vehículos</h3>
<p id="kpiVehiculos" class="text-2xl font-bold">0</p>
</div>

<div class="bg-white p-4 rounded shadow">
<h3 class="text-gray-500">Clientes</h3>
<p id="kpiClientes" class="text-2xl font-bold">0</p>
</div>

</div>

<div class="grid md:grid-cols-2 gap-6">

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">
Ingresos últimos 7 días
</h2>
<canvas id="graficaIngresos"></canvas>
</div>

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">
Órdenes por estado
</h2>
<canvas id="graficaEstados"></canvas>
</div>

</div>

`;


const btn = document.getElementById("btnVoz");

if(btn){

btn.addEventListener("click", escucharProblema);

}

await cargarKPIs();
await cargarGraficas();

}


/* ===============================
VOZ
=============================== */

async function escucharProblema(){

if(!("webkitSpeechRecognition" in window)){

alert("Tu navegador no soporta reconocimiento de voz");

return;

}

const recognition = new webkitSpeechRecognition();

recognition.lang = "es-ES";

recognition.start();

recognition.onresult = async function(event){

const texto = event.results[0][0].transcript;

alert("Problema detectado: "+texto);

const respuestaIA = await diagnosticoIA(texto);

mostrarDiagnostico(respuestaIA);

};

}


/* ===============================
MOSTRAR DIAGNOSTICO
=============================== */

function mostrarDiagnostico(respuesta){

const container = document.getElementById("appContent");

const div = document.createElement("div");

div.className = "bg-yellow-100 p-4 rounded shadow mt-6";

div.innerHTML = `
<h3 class="font-bold mb-2">Diagnóstico IA</h3>
<p>${respuesta}</p>
`;

container.appendChild(div);

}


/* ===============================
KPIs
=============================== */

async function cargarKPIs(){

const empresaId = localStorage.getItem("empresaId");

if(!empresaId) return;

const ordenesRef = collection(db,"empresas",empresaId,"ordenes");

const snapshot = await getDocs(ordenesRef);

let ordenesActivas=0;
let ingresosHoy=0;
let vehiculos=0;

const hoy = new Date().toDateString();

snapshot.forEach(doc=>{

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

document.getElementById("kpiIngresos").innerText =
"$"+ingresosHoy.toLocaleString("es-CO");

document.getElementById("kpiVehiculos").innerText = vehiculos;

const clientesSnap = await getDocs(
collection(db,"empresas",empresaId,"clientes")
);

document.getElementById("kpiClientes").innerText = clientesSnap.size;

}


/* ===============================
GRAFICAS
=============================== */

async function cargarGraficas(){

const empresaId = localStorage.getItem("empresaId");

if(!empresaId) return;

const snapshot = await getDocs(
collection(db,"empresas",empresaId,"ordenes")
);

let estados={activa:0,proceso:0,entregado:0};

let ingresosSemana=[0,0,0,0,0,0,0];
let labels=[];

for(let i=6;i>=0;i--){

const d=new Date();
d.setDate(d.getDate()-i);

labels.push(
d.toLocaleDateString("es-CO",{weekday:"short"})
);

}

snapshot.forEach(doc=>{

const data=doc.data();

if(estados[data.estado]!==undefined){
estados[data.estado]++;
}

if(data.fecha){

const fecha=data.fecha.toDate?.();

if(fecha){

const diff=Math.floor(
(new Date()-fecha)/(1000*60*60*24)
);

if(diff>=0 && diff<=6){
ingresosSemana[6-diff]+=data.total||0;
}

}

}

});


new Chart(document.getElementById("graficaEstados"),{

type:"doughnut",

data:{
labels:["Activas","En proceso","Entregadas"],
datasets:[{data:[
estados.activa,
estados.proceso,
estados.entregado
]}]
}

});


new Chart(document.getElementById("graficaIngresos"),{

type:"bar",

data:{
labels:labels,
datasets:[{
label:"Ingresos",
data:ingresosSemana
}]
}

});

}