/**
 * aiAdvisor.js
 * AI Service Advisor - TallerPRO360 ERP
 * Diagnóstico inteligente y generación de orden de trabajo
 */

export async function aiAdvisor(container) {

  container.innerHTML = `
    <div class="card">
      <h1 style="font-size:26px;margin-bottom:20px;">🤖 AI Service Advisor</h1>
      <p style="margin-bottom:20px;color:#94a3b8;">
        Describe el problema del vehículo y la IA generará un diagnóstico
        y una orden de trabajo inteligente.
      </p>

      <div style="margin-bottom:15px;">
        <label>Nombre del cliente</label>
        <input id="aiCliente" style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
      </div>

      <div style="margin-bottom:15px;">
        <label>Teléfono</label>
        <input id="aiTelefono" style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
      </div>

      <div style="margin-bottom:15px;">
        <label>Vehículo</label>
        <input id="aiVehiculo" placeholder="Ej: Mazda 3 2018" style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
      </div>

      <div style="margin-bottom:15px;">
        <label>Placa</label>
        <input id="aiPlaca" style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;">
      </div>

      <div style="margin-bottom:15px;">
        <label>Síntomas del vehículo</label>
        <textarea id="aiProblema" rows="4" placeholder="Ej: El carro vibra al frenar y hace ruido..." style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#020617;color:white;"></textarea>
      </div>

      <button id="btnDiagnostico" style="padding:12px 20px;background:#16a34a;border:none;border-radius:8px;color:white;cursor:pointer;font-weight:bold;">
        🔎 Ejecutar Diagnóstico IA
      </button>
    </div>

    <div id="aiResultado" style="margin-top:20px;"></div>
  `;

  initAIAdvisor();
}

/* ===========================
INICIALIZAR IA
=========================== */
function initAIAdvisor() {
  const btn = document.getElementById("btnDiagnostico");
  if (!btn) return;

  btn.onclick = async () => {
    const nombre = document.getElementById("aiCliente")?.value.trim();
    const telefono = document.getElementById("aiTelefono")?.value.trim();
    const vehiculo = document.getElementById("aiVehiculo")?.value.trim();
    const placa = document.getElementById("aiPlaca")?.value.trim();
    const problema = document.getElementById("aiProblema")?.value.trim();

    if (!problema) {
      alert("Describe el problema del vehículo");
      return;
    }

    const resultado = document.getElementById("aiResultado");
    resultado.innerHTML = `<div class="card">⏳ Analizando vehículo con IA...</div>`;

    const vehicleData = { vehicle: vehiculo || "", plate: placa || "", problem: problema, symptoms: [problema] };
    const customerData = { name: nombre || "Cliente", phone: telefono || "", vehicle: vehiculo || "", plate: placa || "" };

    try {
      if (!window.SuperAI) throw new Error("SuperAI no está inicializado");

      const orden = await window.SuperAI.processVehicleService(vehicleData, customerData);
      renderAIResult(orden);
    } catch (error) {
      console.error("Error ejecutando IA:", error);
      resultado.innerHTML = `<div class="card">❌ Error ejecutando IA<br><br>Verifica que el motor SuperAI esté activo.</div>`;
    }
  };
}

/* ===========================
RENDER RESULTADO
=========================== */
function renderAIResult(orden) {
  const container = document.getElementById("aiResultado");

  if (!orden) {
    container.innerHTML = `<div class="card">No se pudo generar diagnóstico</div>`;
    return;
  }

  // Repuestos necesarios
  let partsHTML = "";
  if (orden.partsStatus?.length) {
    orden.partsStatus.forEach(p => {
      partsHTML += `<li>${p.part} ${p.available ? "✅ Disponible" : "❌ No disponible"}</li>`;
    });
  } else {
    partsHTML = "<li>No se detectaron repuestos</li>";
  }

  const labor = orden.estimatedCost?.labor || 0;
  const parts = orden.estimatedCost?.parts || 0;
  const total = orden.estimatedCost?.total || (labor + parts);

  container.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:10px;">🧠 Diagnóstico IA</h2>
      <p>${orden.diagnosis?.diagnosis || "Diagnóstico no disponible"}</p>
    </div>

    <div class="card">
      <h2>🔩 Repuestos necesarios</h2>
      <ul>${partsHTML}</ul>
    </div>

    <div class="card">
      <h2>💰 Estimación</h2>
      <p>Mano de obra: $${labor}</p>
      <p>Repuestos: $${parts}</p>
      <h3>Total estimado: $${total}</h3>
    </div>

    <div class="card">
      <button id="crearOrden" style="padding:12px 20px;background:#3b82f6;border:none;border-radius:8px;color:white;cursor:pointer;font-weight:bold;">
        Crear Orden de Trabajo
      </button>
    </div>
  `;

  const btn = document.getElementById("crearOrden");
  if (btn) {
    btn.onclick = () => alert("✅ Orden generada con éxito 🚀");
  }
}