/**
 * reportes.js
 * Módulo de Reportes - Prueba Auto Discovery
 * TallerPRO360
 */

import { moduleLoader } from "../system/moduleLoader.js";

export async function reportes(container){

container.innerHTML = `

<h2>📊 Centro de Reportes</h2>

<p>Bienvenido al módulo de reportes del taller.</p>

<div style="margin-top:20px">

<button id="repVentas"
style="padding:10px;margin-right:10px;border:none;background:#2563eb;color:white;border-radius:6px;cursor:pointer">

Reporte de Ventas

</button>

<button id="repOrdenes"
style="padding:10px;border:none;background:#16a34a;color:white;border-radius:6px;cursor:pointer">

Reporte de Órdenes

</button>

</div>

<div id="resultadoReporte" style="margin-top:20px"></div>

`;

const resultado=document.getElementById("resultadoReporte");

/* Reporte ventas */

document.getElementById("repVentas").onclick=()=>{

resultado.innerHTML=`

<h3>Ventas del Mes</h3>

<p>Total ventas: $12.450.000</p>

<p>Órdenes completadas: 47</p>

`;

};

/* Reporte órdenes */

document.getElementById("repOrdenes").onclick=()=>{

resultado.innerHTML=`

<h3>Órdenes del Taller</h3>

<p>Órdenes abiertas: 5</p>

<p>Órdenes en proceso: 8</p>

<p>Órdenes finalizadas: 47</p>

`;

};

}

/* =========================
AUTO REGISTRO DEL MÓDULO
========================= */

moduleLoader.register("reportes",reportes);