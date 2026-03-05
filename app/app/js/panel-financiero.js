import { db } from "../js/firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";

import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

let charts = {};

export async function panelFinanciero(container){

const year = new Date().getFullYear();

container.innerHTML = `

<h1 class="text-2xl font-bold mb-6">
Panel Financiero Gerencial
</h1>

<div class="mb-6">

<label class="font-semibold">
Año
</label>

<select id="selectorYear"
class="border p-2 rounded ml-2">

<option>2023</option>
<option>2024</option>
<option selected>2025</option>
<option>2026</option>

</select>

<button
id="exportarPDF"
class="ml-4 bg-green-600 text-white px-4 py-2 rounded"
>
Exportar reporte PDF
</button>

</div>


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


<div id="alertas"
class="mb-6 text-red-600 font-semibold">
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

<div class="bg-white p-4 rounded shadow mt-6">

<h2 class="font-bold mb-4">
Predicción financiera IA
</h2>

<div id="prediccionIA">
Calculando predicción...
</div>

</div>
`;

document
.getElementById("selectorYear")
.onchange = e=>{
cargarDatosFinancieros(e.target.value);
};

document
.getElementById("exportarPDF")
.onclick = exportarReportePDF;

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

if(fecha.getFullYear() != year) return;

const mes = fecha.getMonth();

let utilidadOrden = 0;

if(data.acciones){

data.acciones.forEach(a=>{

const precio = a.precio || 0;
const costo = a.costo || 0;

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

crearGraficaServicios(servicios);

crearGraficaRepuestos(repuestos);

crearGraficaTecnicos(tecnicos);

generarAlertas(servicios,repuestos,tecnicos);

prediccionFinancieraIA(utilidadMes);

}



function actualizarKPIs(ingresos,costos,utilidad){

document.getElementById("kpiIngresos")
.innerText = formato(ingresos);

document.getElementById("kpiCostos")
.innerText = formato(costos);

document.getElementById("kpiUtilidad")
.innerText = formato(utilidad);

}



function formato(valor){

return valor.toLocaleString("es-CO",{
style:"currency",
currency:"COP"
});

}



function crearGraficaUtilidad(data){

charts.utilidad = new Chart(
document.getElementById("graficaUtilidad"),
{
type:"line",
data:{
labels:["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
datasets:[{label:"Utilidad",data:data}]
}
});

}



function crearGraficaServicios(servicios){

const labels = Object.keys(servicios);
const data = Object.values(servicios);

charts.servicios = new Chart(
document.getElementById("graficaServicios"),
{
type:"bar",
data:{
labels:labels,
datasets:[{label:"Utilidad",data:data}]
}
});

}



function crearGraficaRepuestos(repuestos){

const labels = Object.keys(repuestos);
const data = Object.values(repuestos);

charts.repuestos = new Chart(
document.getElementById("graficaRepuestos"),
{
type:"bar",
data:{
labels:labels,
datasets:[{label:"Cantidad",data:data}]
}
});

}



function crearGraficaTecnicos(tecnicos){

const labels = Object.keys(tecnicos);
const data = Object.values(tecnicos);

charts.tecnicos = new Chart(
document.getElementById("graficaTecnicos"),
{
type:"bar",
data:{
labels:labels,
datasets:[{label:"Utilidad",data:data}]
}
});

}



function generarAlertas(servicios,repuestos,tecnicos){

let html = "";

Object.entries(servicios).forEach(([serv,util])=>{

if(util < 50000){

html += `⚠ Servicio poco rentable: ${serv}<br>`;

}

});

Object.entries(repuestos).forEach(([rep,cant])=>{

if(cant < 2){

html += `⚠ Repuesto con baja rotación: ${rep}<br>`;

}

});

document.getElementById("alertas").innerHTML = html;

}



async function prediccionFinancieraIA(utilidadMes){

const promedio =
utilidadMes.reduce((a,b)=>a+b,0) / 12;

const prediccion =
Math.round(promedio * 1.1);

document.getElementById("prediccionIA").innerHTML = `

Utilidad promedio mensual:
<strong>${formato(promedio)}</strong>

<br><br>

Predicción próximo mes:
<strong>${formato(prediccion)}</strong>

`;

}



function exportarReportePDF(){

const doc = new jsPDF();

doc.setFontSize(18);

doc.text("Reporte Financiero Taller",20,20);

doc.setFontSize(12);

doc.text(
document.getElementById("kpiIngresos").innerText,
20,
40
);

doc.text(
document.getElementById("kpiCostos").innerText,
20,
50
);

doc.text(
document.getElementById("kpiUtilidad").innerText,
20,
60
);

doc.save("reporte_financiero.pdf");

}