/**
 * dashboard.js
 * Panel principal del ERP
 * TallerPRO360
 */

import { generarManualPDF } from "../manual/manual.js"; // Importa tu script de generación de PDF

export async function dashboard(container){

container.innerHTML = `

<h1 style="font-size:28px;margin-bottom:20px;">
🚗 Dashboard TallerPRO360
</h1>

<!-- Botón Manual -->
<button id="btnManual"
style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;margin-bottom:20px;">
📄 Descargar Manual de Usuario
</button>

<div style="
display:grid;
grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
gap:20px;
margin-bottom:25px;
">

<div class="card">
<h3>Órdenes activas</h3>
<p id="ordenesActivas" style="font-size:28px;">0</p>
</div>

<div class="card">
<h3>Clientes</h3>
<p id="clientesTotal" style="font-size:28px;">0</p>
</div>

<div class="card">
<h3>Ingresos hoy</h3>
<p id="ingresosHoy" style="font-size:28px;">$0</p>
</div>

<div class="card">
<h3>Vehículos en taller</h3>
<p id="vehiculosTaller" style="font-size:28px;">0</p>
</div>

</div>

<div class="card">
<h2>📋 Órdenes recientes</h2>
<div id="ordenesRecientes">
Cargando órdenes...
</div>
</div>

<div class="card">
<h2>🤖 Alertas IA</h2>
<div id="alertasIA">
No hay alertas por ahora.
</div>
</div>

<div class="card">
<h2>⚙ Estado del sistema</h2>
<div id="estadoSistema">
<p>Router: ✔</p>
<p>Auth: ✔</p>
<p>AI Core: ✔</p>
</div>
</div>

`;


/* ===========================
SIMULACIÓN DATOS
=========================== */

loadStats();
loadOrders();
loadAIAlerts();

/* ===========================
BOTÓN MANUAL
=========================== */
document.getElementById("btnManual").onclick = () => {
    generarManualPDF();
};



/* ===========================
CARGAR ESTADISTICAS
=========================== */
function loadStats(){
    document.getElementById("ordenesActivas").innerText = "5";
    document.getElementById("clientesTotal").innerText = "28";
    document.getElementById("ingresosHoy").innerText = "$1,250";
    document.getElementById("vehiculosTaller").innerText = "3";
}


/* ===========================
ORDENES RECIENTES
=========================== */
function loadOrders(){
    const container = document.getElementById("ordenesRecientes");
    container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
    <tr style="border-bottom:1px solid #1e293b;">
        <th align="left">Cliente</th>
        <th align="left">Vehículo</th>
        <th align="left">Estado</th>
    </tr>
    <tr>
        <td>Carlos Pérez</td>
        <td>Toyota Corolla</td>
        <td>Diagnóstico</td>
    </tr>
    <tr>
        <td>Ana Rodríguez</td>
        <td>Chevrolet Spark</td>
        <td>Reparación</td>
    </tr>
    <tr>
        <td>Luis Gómez</td>
        <td>Nissan Frontier</td>
        <td>Entrega hoy</td>
    </tr>
    </table>
    `;
}


/* ===========================
ALERTAS IA
=========================== */
function loadAIAlerts(){
    const container = document.getElementById("alertasIA");
    container.innerHTML = `
    <ul>
        <li>🔧 2 vehículos requieren cambio de aceite</li>
        <li>⚠ Pastillas de freno próximas a cambio</li>
        <li>📊 Ingresos 15% superiores al promedio semanal</li>
    </ul>
    `;
}