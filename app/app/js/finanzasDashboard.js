import { db } from "../js/firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";


export async function panelFinanciero(container){

container.innerHTML = `

<h1 class="text-2xl font-bold mb-6">
Panel Financiero Gerencial
</h1>

<div class="grid md:grid-cols-2 gap-6">

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">
Utilidad por mes
</h2>
<canvas id="graficaUtilidad"></canvas>
</div>

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">
Servicios más rentables
</h2>
<canvas id="graficaServicios"></canvas>
</div>

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">
Repuestos más vendidos
</h2>
<canvas id="graficaRepuestos"></canvas>
</div>

<div class="bg-white p-4 rounded shadow">
<h2 class="font-bold mb-4">
Técnicos más productivos
</h2>
<canvas id="graficaTecnicos"></canvas>
</div>

</div>

`;

await cargarDatosFinancieros();

}



async function cargarDatosFinancieros(){

const ordenesSnap = await getDocs(collection(db,"ordenes"));

let utilidadMes = new Array(12).fill(0);

let servicios = {};
let repuestos = {};
let tecnicos = {};

ordenesSnap.forEach(doc=>{

const data = doc.data();

if(!data.fecha) return;

const fecha = data.fecha.toDate?.() || new Date();
const mes = fecha.getMonth();


let utilidadOrden = 0;


if(data.acciones){

data.acciones.forEach(a=>{

const precio = a.precio || 0;
const costo = a.costo || 0;

const utilidad = precio - costo;

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


crearGraficaUtilidad(utilidadMes);
crearGraficaServicios(servicios);
crearGraficaRepuestos(repuestos);
crearGraficaTecnicos(tecnicos);

}



function crearGraficaUtilidad(data){

new Chart(
document.getElementById("graficaUtilidad"),
{
type:"line",
data:{
labels:[
"Ene","Feb","Mar","Abr","May","Jun",
"Jul","Ago","Sep","Oct","Nov","Dic"
],
datasets:[{
label:"Utilidad",
data:data
}]
}
});

}



function crearGraficaServicios(servicios){

const labels = Object.keys(servicios);
const data = Object.values(servicios);

new Chart(
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

const labels = Object.keys(repuestos);
const data = Object.values(repuestos);

new Chart(
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

const labels = Object.keys(tecnicos);
const data = Object.values(tecnicos);

new Chart(
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