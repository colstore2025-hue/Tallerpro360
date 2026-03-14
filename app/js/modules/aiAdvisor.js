/**
 * aiAdvisor.js
 * AI Service Advisor
 * TallerPRO360 ERP
 * Diagnóstico inteligente y generación de orden
 */

export async function aiAdvisor(container){

container.innerHTML = `

<div class="card">

<h1 style="font-size:26px;margin-bottom:20px;">
🤖 AI Service Advisor
</h1>

<p style="margin-bottom:20px;color:#94a3b8;">
Describe el problema del vehículo y la IA generará un diagnóstico
y una orden de trabajo inteligente.
</p>


<div style="margin-bottom:15px;">
<label>Nombre del cliente</label>
<input id="aiCliente"
style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
</div>


<div style="margin-bottom:15px;">
<label>Teléfono</label>
<input id="aiTelefono"
style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
</div>


<div style="margin-bottom:15px;">
<label>Vehículo</label>
<input id="aiVehiculo"
placeholder="Ej: Mazda 3 2018"
style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
</div>


<div style="margin-bottom:15px;">
<label>Placa</label>
<input id="aiPlaca"
style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
</div>


<div style="margin-bottom:15px;">
<label>Síntomas del vehículo</label>

<textarea id="aiProblema"
rows="4"
placeholder="Ej: El carro vibra al frenar y hace ruido..."
style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
</textarea>

</div>


<button id="btnDiagnostico"
style="
padding:12px 20px;
background:#16a34a;
border:none;
border-radius:8px;
color:white;
cursor:pointer;
font-weight:bold;
">
🔎 Ejecutar Diagnóstico IA
</button>

</div>



<div id="aiResultado" style="margin-top:20px;"></div>

`;

initAIAdvisor();

}



/* ======================================
INICIALIZAR IA
====================================== */

function initAIAdvisor(){

const btn = document.getElementById("btnDiagnostico");

btn.onclick = async ()=>{

const nombre = document.getElementById("aiCliente").value;
const telefono = document.getElementById("aiTelefono").value;
const vehiculo = document.getElementById("aiVehiculo").value;
const placa = document.getElementById("aiPlaca").value;
const problema = document.getElementById("aiProblema").value;

if(!problema){

alert("Describe el problema del vehículo");
return;

}

const resultado = document.getElementById("aiResultado");

resultado.innerHTML = `
<div class="card">
⏳ Analizando vehículo con IA...
</div>
`;


/* ===============================
LLAMAR SUPER IA
=============================== */

try{

const vehicleData = {

vehicle:vehiculo,
plate:placa,
problem:problema,
symptoms:[problema]

};

const customerData = {

name:nombre,
phone:telefono,
vehicle:vehiculo,
plate:placa

};

const orden = await window.SuperAI.processVehicleService(
vehicleData,
customerData
);


/* ===============================
MOSTRAR RESULTADO
=============================== */

renderAIResult(orden);

}
catch(error){

console.error(error);

resultado.innerHTML=`
<div class="card">
❌ Error ejecutando IA
</div>
`;

}

};

}



/* ======================================
RENDER RESULTADO
====================================== */

function renderAIResult(orden){

const container = document.getElementById("aiResultado");

if(!orden){

container.innerHTML=`
<div class="card">
No se pudo generar diagnóstico
</div>
`;

return;

}


let partsHTML = "";

orden.partsStatus.forEach(p=>{

partsHTML += `
<li>
${p.part}
${p.available ? "✅ Disponible" : "❌ No disponible"}
</li>
`;

});


container.innerHTML = `

<div class="card">

<h2 style="margin-bottom:10px;">
🧠 Diagnóstico IA
</h2>

<p>${orden.diagnosis.diagnosis}</p>

</div>


<div class="card">

<h2>🔩 Repuestos necesarios</h2>

<ul>
${partsHTML}
</ul>

</div>


<div class="card">

<h2>💰 Estimación</h2>

<p>Mano de obra: $${orden.estimatedCost.labor}</p>
<p>Repuestos: $${orden.estimatedCost.parts}</p>

<h3>Total estimado: $${orden.estimatedCost.total}</h3>

</div>


<div class="card">

<button id="crearOrden"
style="
padding:12px 20px;
background:#3b82f6;
border:none;
border-radius:8px;
color:white;
cursor:pointer;
font-weight:bold;
">

Crear Orden de Trabajo

</button>

</div>

`;

document.getElementById("crearOrden").onclick = ()=>{

alert("Orden generada con éxito 🚀");

};

}