/*
================================================
dashboard.js
Panel Gerente TallerPRO360 ERP SaaS
Versión Profesional Estable
================================================
*/

import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { configuracion } from "./configuracion.js";
import { pagosTaller } from "./pagosTaller.js";

import { db } from "../core/firebase-config.js";
import { obtenerEmpresaId } from "../core/empresa-context.js";

import {
collection,
getDocs,
query,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { calcularPredicciones } from "../ai/aiMetrics.js";


export async function dashboard(container){

try{

const empresaId = obtenerEmpresaId();

if(!empresaId){

container.innerHTML=`<h2>No hay empresa activa</h2>`;
return;

}

/* ===============================
UI
=============================== */

container.innerHTML=`
<h1 style="font-size:28px;margin-bottom:20px;">
🚀 Dashboard Gerente - TallerPRO360
</h1>

<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">

<button id="btnClientes" class="btn-primary">👥 Clientes</button>
<button id="btnOrdenes" class="btn-primary">🛠 Órdenes</button>
<button id="btnInventario" class="btn-primary">📦 Inventario</button>
<button id="btnPagos" class="btn-primary">💳 Pagos / Caja</button>
<button id="btnConfiguracion" class="btn-primary">⚙ Configuración</button>

</div>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:25px;">

<div class="card"><h3>Órdenes activas</h3><p id="ordenesActivas" style="font-size:28px;">0</p></div>
<div class="card"><h3>Órdenes completadas hoy</h3><p id="ordenesCompletadas" style="font-size:28px;">0</p></div>
<div class="card"><h3>Ingresos hoy</h3><p id="ingresosHoy" style="font-size:28px;">$0</p></div>
<div class="card"><h3>Margen promedio</h3><p id="margenUtilidad" style="font-size:28px;">0%</p></div>
<div class="card"><h3>Tiempo reparación</h3><p id="tiempoPromedio" style="font-size:28px;">0h</p></div>
<div class="card"><h3>Stock crítico</h3><p id="stockCritico" style="font-size:28px;">0</p></div>
<div class="card"><h3>Ingresos pagos hoy</h3><p id="resumenIngresosHoy" style="font-size:28px;">$0</p></div>

</div>

<div class="card">
<h2>📋 Órdenes recientes</h2>
<div id="ordenesRecientes">Cargando...</div>
</div>

<div class="card">
<h2>🤖 Recomendaciones IA</h2>
<div id="recomendacionesIA"
style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;">
Cargando sugerencias...
</div>
</div>
`;


/* ===============================
NAVEGACIÓN
=============================== */

const btnClientes=document.getElementById("btnClientes");
const btnOrdenes=document.getElementById("btnOrdenes");
const btnInventario=document.getElementById("btnInventario");
const btnPagos=document.getElementById("btnPagos");
const btnConfig=document.getElementById("btnConfiguracion");

if(btnClientes) btnClientes.onclick=()=>clientes(container);
if(btnOrdenes)