/**
 * pricingEnginePRO360.js - NEXUS-X AEGIS V60.0 🚀
 * SISTEMA DE VALUACIÓN INTELIGENTE Y KPI DE EFICIENCIA
 */

// 1. EL MOTOR DE CÁLCULO (Lógica pura)
export function calcularPrecioInteligentePRO360(data) {
  const {
    costoRepuestos = 0,
    horasEstimadas = 1,
    tipoVehiculo = "MEDIO",
    tipoTrabajo = "GENERAL",
    urgencia = "NORMAL",
    perfilCliente = "NORMAL"
  } = data;

  // Tarifas hora hombre según mercado real Colombia 2026
  const tarifas = { 'ECONOMICO': 48000, 'MEDIO': 78000, 'PREMIUM': 145000 };
  let valorHora = tarifas[tipoVehiculo] || tarifas['MEDIO'];

  // Base de costo: Repuestos + Tiempo (Mano de Obra)
  let costoManoObraBase = horasEstimadas * valorHora;
  let factor = 1;
  let justificantes = [`Base: $${valorHora.toLocaleString()} x ${horasEstimadas}h`];

  // Algoritmos de Ajuste Dinámico
  if(urgencia === "URGENTE") { factor += 0.25; justificantes.push("+25% Prioridad Alpha"); }
  if(tipoTrabajo === "DIAGNOSTICO") { factor += 0.15; justificantes.push("+15% Uso de Scanner/Tecnología"); }
  if(perfilCliente === "PREMIUM") { factor += 0.10; justificantes.push("+10% Garantía Extendida"); }

  const precioSugerido = Math.round(costoManoObraBase * factor);
  
  return {
    precioSugerido,
    costoManoObraBase,
    justificacion: justificantes.join(" | "),
    kpi: {
      horasAsignadas: horasEstimadas,
      eficienciaEsperada: "92%",
      impactoBahia: urgencia === "URGENTE" ? "ALTO" : "NORMAL"
    }
  };
}

// 2. LA INTERFAZ DE COMANDO PARA ordenes.js
export function renderModuloPricing(container) {
    container.innerHTML = `
    <div class="bg-[#050a14] border border-cyan-500/20 p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.1)]">
        <header class="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
            <div>
                <h2 class="orbitron text-xs font-black text-white tracking-[0.3em] uppercase">Pricing Engine <span class="text-cyan-500">PRO360</span></h2>
                <p class="text-[7px] text-slate-500 orbitron mt-1">SISTEMA DE ANÁLISIS DE MERCADO & TIEMPOS</p>
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="nexusRadar('autolab')" class="p-2 bg-black border border-white/10 rounded-lg hover:border-cyan-500 transition-all">
                    <img src="https://autolab.com.co/wp-content/uploads/2018/06/logo-autolab-retina.png" class="h-3 invert opacity-50 hover:opacity-100">
                </button>
                <button type="button" onclick="nexusRadar('c3')" class="p-2 bg-black border border-white/10 rounded-lg hover:border-yellow-500 transition-all">
                    <span class="text-[8px] orbitron text-yellow-500 font-bold">C3 CARE</span>
                </button>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-4">
                <div class="relative">
                    <input type="text" id="m_procedimiento" placeholder="BUSCAR PROCEDIMIENTO (EJ: CAMBIO EMBRAGUE)" 
                           class="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white orbitron text-[10px] focus:border-cyan-500 outline-none uppercase">
                    <i class="fas fa-search absolute right-4 top-4 text-slate-600"></i>
                </div>
                
                <div class="grid grid-cols-3 gap-3">
                    <div class="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                        <label class="block text-[6px] text-slate-500 orbitron mb-2">TIEMPO ESTIMADO (H)</label>
                        <input type="number" id="m_horas" value="1.5" step="0.5" class="bg-transparent text-center text-cyan-400 orbitron text-lg font-black w-full outline-none">
                    </div>
                    <div class="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                        <label class="block text-[6px] text-slate-500 orbitron mb-2">GAMA VEHÍCULO</label>
                        <select id="m_gama" class="bg-transparent text-center text-white orbitron text-[8px] w-full outline-none">
                            <option value="ECONOMICO">ECONÓMICO</option>
                            <option value="MEDIO" selected>MEDIO</option>
                            <option value="PREMIUM">PREMIUM</option>
                        </select>
                    </div>
                    <div class="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                        <label class="block text-[6px] text-slate-500 orbitron mb-2">URGENCIA</label>
                        <select id="m_urgencia" class="bg-transparent text-center text-white orbitron text-[8px] w-full outline-none">
                            <option value="NORMAL">NORMAL</option>
                            <option value="URGENTE">ALTA (SLA 2H)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div id="display_nexus" class="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 p-6 rounded-3xl flex flex-col justify-center items-center">
                <p class="text-[7px] orbitron text-cyan-500 tracking-widest mb-2">PRECIO SUGERIDO NEXUS</p>
                <h3 id="res_precio" class="text-3xl font-black text-white orbitron italic tracking-tighter">$ 0</h3>
                <p id="res_justificacion" class="text-[7px] text-slate-500 orbitron mt-4 text-center uppercase leading-relaxed"></p>
            </div>
        </div>

        <button type="button" onclick="ejecutarCalculoTerminator()" class="w-full mt-6 py-5 bg-white text-black orbitron font-black text-[10px] rounded-2xl hover:bg-cyan-500 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
            SINCRONIZAR CON BITÁCORA Y MANO DE OBRA
        </button>
    </div>`;
}

// 3. FUNCIONES GLOBALES DE SOPORTE
window.nexusRadar = (sitio) => {
    const q = document.getElementById('m_procedimiento').value;
    if(!q) return alert("Define el procedimiento primero.");
    const url = sitio === 'autolab' ? `https://autolab.com.co/cotizar?s=${q}` : `https://c3carecenter.com/?s=${q}`;
    window.open(url, '_blank');
};

window.ejecutarCalculoTerminator = () => {
    const data = {
        horasEstimadas: parseFloat(document.getElementById('m_horas').value),
        tipoVehiculo: document.getElementById('m_gama').value,
        urgencia: document.getElementById('m_urgencia').value,
        tipoTrabajo: document.getElementById('m_procedimiento').value.includes("DIAG") ? "DIAGNOSTICO" : "GENERAL"
    };

    const res = calcularPrecioInteligentePRO360(data);
    
    // Actualizar UI del motor
    document.getElementById('res_precio').innerText = `$ ${res.precioSugerido.toLocaleString()}`;
    document.getElementById('res_justificacion').innerText = res.justificacion;

    // Sincronizar con el resto de la Orden
    const inputManoObra = document.querySelector('[name="mano_obra_final"]');
    const bitacora = document.getElementById('orden_bitacora');
    
    if(inputManoObra) inputManoObra.value = res.precioSugerido;
    if(bitacora) {
        bitacora.value += `\n[NEXUS-IA]: Valuación sugerida $${res.precioSugerido.toLocaleString()} por ${data.horasEstimadas}h de labor (${data.tipoVehiculo}). Justificación: ${res.justificacion}`;
    }
    
    alert("Sincronización Exitosa. KPI de Tiempo asignado: " + data.horasEstimadas + " Horas.");
};
