import { db } from "../js/firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";

let charts = {};

export async function panelFinanciero(container){

const year = new Date().getFullYear();

container.innerHTML = `

<h1 class="text-2xl font-bold mb-6">
Panel Financiero Gerencial
</h1>

<div class="grid md:grid-cols-3 gap-4 mb-8">

<div class="bg-white p-4 rounded shadow">
<p class="text-gray-500">Ingresos</p>
<h2 id="kpiIngresos" class="text-xl font-bold">$0</h2>
</div>

<div class="bg-white p-4 rounded shadow">
<p class="text-gray-500">Costos</p>
<h2 id="kpiCostos" class="text-xl font-bold">$0</h2>
</div>

<div class="bg-white p-4 rounded shadow">
<p class="text-gray-500">Utilidad</p>
<h2 id="kpiUtilidad" class="text-xl font-bold">$0</h2>
</div>

</div>

<div class="grid md:grid-cols-2 gap-6">

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">Utilidad por mes</h2>
<canvas id="graficaUtilidad"></canvas>
</div>

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">Servicios más rentables</h2>
<canvas id="graficaServicios"></canvas>
</div>

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">Repuestos más vendidos</h2>
<canvas id="graficaRepuestos"></canvas>
</div>

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">Técnicos más productivos</h2>
<canvas id="graficaTecnicos"></canvas>
</div>

</div>
`;

await cargarDatosFinancieros(year);

}



async function cargarDatosFinancieros(year){

const ordenesSnap = await getDocs(collection(db,"ordenes"));

let utilidadMes = new Array(12).fill(0);

let servicios = {};
let repuestos = {};
let tecnicos = {};

let ingresos = 0;
let costos = 0;

ordenesSnap.forEach(doc=>{

const data = doc.data();

if(!data.fecha) return;

const fecha = data.fecha.toDate?.() || new Date();

if(fecha.getFullYear() !== year) return;

const mes = fecha.getMonth();

let utilidadOrden = 0;

if(data.acciones){

data.acciones.forEach(a=>{

const precio = Number(a.precio) || 0;
const costo = Number(a.costo) || 0;

const utilidad = precio - costo;

ingresos += precio;
costos += costo;

utilidadOrden += utilidad;


/* servicios */

if(!servicios[a.descripcion])
servicios[a.descripcion]=0;

servicios[a.descripcion]+=utilidad;


/* repuestos */

if(a.repuesto){

if(!repuestos[a.repuesto])
repuestos[a.repuesto]=0;

repuestos[a.repuesto]+=1;

}

});

}


/* técnicos */

if(data.tecnico){

if(!tecnicos[data.tecnico])
tecnicos[data.tecnico]=0;

tecnicos[data.tecnico]+=utilidadOrden;

}

utilidadMes[mes]+=utilidadOrden;

});

const utilidadTotal = ingresos - costos;

actualizarKPIs(ingresos,costos,utilidadTotal);

crearGraficaUtilidad(utilidadMes);

crearGraficaServicios(
ordenarTop(servicios)
);

crearGraficaRepuestos(
ordenarTop(repuestos)
);

crearGraficaTecnicos(
ordenarTop(tecnicos)
);

}



function actualizarKPIs(ingresos,costos,utilidad){

document.getElementById("kpiIngresos").innerText =
formatoMoneda(ingresos);

document.getElementById("kpiCostos").innerText =
formatoMoneda(costos);

document.getElementById("kpiUtilidad").innerText =
formatoMoneda(utilidad);

}



function formatoMoneda(valor){

return valor.toLocaleString("es-CO",{
style:"currency",
currency:"COP",
maximumFractionDigits:0
});

}



function ordenarTop(obj){

const entries = Object.entries(obj);

entries.sort((a,b)=>b[1]-a[1]);

return Object.fromEntries(
entries.slice(0,10)
);

}



function destruirGrafica(id){

if(charts[id]){

charts[id].destroy();

}

}



function crearGraficaUtilidad(data){

destruirGrafica("graficaUtilidad");

charts.graficaUtilidad = new Chart(
document.getElementById("graficaUtilidad"),
{
type:"line",
data:{
labels:[
"Ene","Feb","Mar","Abr","May","Jun",
"Jul","Ago","Sep","Oct","Nov","Dic"
],
datasets:[{
label:"Utilidad mensual",
data:data,
tension:0.3
}]
}
});

}



function crearGraficaServicios(servicios){

destruirGrafica("graficaServicios");

const labels = Object.keys(servicios);
const data = Object.values(servicios);

charts.graficaServicios = new Chart(
document.getElementById("graficaServicios"),
{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Utilidad",
data:data
}]
}
});

}



function crearGraficaRepuestos(repuestos){

destruirGrafica("graficaRepuestos");

const labels = Object.keys(repuestos);
const data = Object.values(repuestos);

charts.graficaRepuestos = new Chart(
document.getElementById("graficaRepuestos"),
{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Cantidad vendida",
data:data
}]
}
});

}



function crearGraficaTecnicos(tecnicos){

destruirGrafica("graficaTecnicos");

const labels = Object.keys(tecnicos);
const data = Object.values(tecnicos);

charts.graficaTecnicos = new Chart(
document.getElementById("graficaTecnicos"),
{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Utilidad generada",
data:data
}]
}
});

}