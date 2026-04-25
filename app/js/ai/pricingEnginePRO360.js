/**
 * pricingEnginePRO360.js - NEXUS-X AI PRICING UNIT
 * Lógica de cálculo de precios dinámicos según gama, urgencia y mercado.
 * ESTADO: PERFECTO / LISTO PARA PRODUCCIÓN
 */

// 1. EL MOTOR DE CÁLCULO (Lógica pura)
export function calcularPrecioInteligentePRO360(data) {
  const {
    horasEstimadas = 1,
    tipoVehiculo = "MEDIO", 
    tipoTrabajo = "GENERAL", 
    urgencia = "NORMAL"
  } = data;

  const VALOR_HORA_BASE = 85000; // Ajustado a inflación 2026
  
  const multGama = {
    "ECONOMICO": 0.85,
    "MEDIO": 1.0,
    "PREMIUM": 1.65 // Mayor margen para gama alta por responsabilidad
  };

  const multTrabajo = {
    "DIAGNOSTICO": 1.25,
    "GENERAL": 1.0,
    "ESPECIALIZADO": 1.4
  };

  const multUrgencia = {
    "NORMAL": 1.0,
    "URGENTE": 1.3 // Recargo del 30% por saltar la cola
  };

  const factorFinal = (multGama[tipoVehiculo] || 1) * (multTrabajo[tipoTrabajo] || 1) * (multUrgencia[urgencia] || 1);
  const precioManoObraSugerido = Math.round(VALOR_HORA_BASE * horasEstimadas * factorFinal);

  // Generación de explicación técnica
  let explicacion = `VALOR SUGERIDO PARA ${horasEstimadas}H EN GAMA ${tipoVehiculo}. `;
  if (urgencia === "URGENTE") explicacion += "INCLUYE FACTOR DE PRIORIDAD ALTA. ";
  if (tipoTrabajo === "DIAGNOSTICO") explicacion += "AJUSTADO POR USO DE ESCÁNER Y PROTOCOLOS TÉCNICOS.";

  return {
    precioSugerido: precioManoObraSugerido,
    explicacion: explicacion,
    factor: factorFinal
  };
}

export const analizarPrecioSugerido = calcularPrecioInteligentePRO360;

// 2. LA INTERFAZ DE COMANDO PARA ordenes.js
export function renderModuloPricing(container) {
    if(!container) return;
    container.innerHTML = `
    <div class="bg-[#050a14] border border-cyan-500/20 p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.1)] mt-8 animate-in slide-in-from-right-5">
        <header class="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
            <div>
                <h2 class="orbitron text-xs font-black text-white tracking-[0.3em] uppercase">Pricing Engine <span class="text-cyan-500">PRO360</span></h2>
                <p class="text-[7px] text-slate-500 orbitron mt-1 italic">NEURAL MARKET ANALYSIS & LABOR TIME</p>
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="nexusRadar('autolab')" class="p-3 bg-black border border-white/10 rounded-xl hover:border-cyan-500 transition-all group">
                    <i class="fas fa-search-dollar text-cyan-500 group-hover:scale-110 transition-transform"></i>
                    <span class="text-[6px] text-slate-400 block orbitron mt-1">AUTOLAB</span>
                </button>
                <button type="button" onclick="nexusRadar('c3')" class="p-3 bg-black border border-white/10 rounded-xl hover:border-yellow-500 transition-all group">
                    <i class="fas fa-shield-alt text-yellow-500 group-hover:scale-110 transition-transform"></i>
                    <span class="text-[6px] text-slate-400 block orbitron mt-1">C3 CARE</span>
                </button>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-4">
                <div class="relative">
                    <input type="text" id="m_procedimiento" placeholder="PROCEDIMIENTO (EJ: SINCRONIZACIÓN)" 
                           class="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white orbitron text-[10px] focus:border-cyan-500 outline-none uppercase placeholder:text-slate-700">
                    <i class="fas fa-bolt absolute right-5 top-5 text-cyan-500/30"></i>
                </div>
                
                <div class="grid grid-cols-3 gap-3">
                    <div class="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
                        <label class="block text-[7px] text-slate-500 orbitron mb-2">TIEMPO (H)</label>
                        <input type="number" id="m_horas" value="1.5" step="0.5" class="bg-transparent text-center text-cyan-400 orbitron text-xl font-black w-full outline-none">
                    </div>
                    <div class="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
                        <label class="block text-[7px] text-slate-500 orbitron mb-2">GAMA</label>
                        <select id="m_gama" class="bg-transparent text-center text-white orbitron text-[9px] w-full outline-none uppercase font-bold">
                            <option value="ECONOMICO" class="bg-[#0d1117]">ECONÓMICO</option>
                            <option value="MEDIO" selected class="bg-[#0d1117]">GAMA MEDIA</option>
                            <option value="PREMIUM" class="bg-[#0d1117]">PREMIUM</option>
                        </select>
                    </div>
                    <div class="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
                        <label class="block text-[7px] text-slate-500 orbitron mb-2">PRIORIDAD</label>
                        <select id="m_urgencia" class="bg-transparent text-center text-white orbitron text-[9px] w-full outline-none uppercase font-bold">
                            <option value="NORMAL" class="bg-[#0d1117]">ESTÁNDAR</option>
                            <option value="URGENTE" class="bg-[#0d1117]">URGENTE</option>
                        </select>
                    </div>
                </div>
            </div>

            <div id="display_nexus" class="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 p-6 rounded-[2rem] flex flex-col justify-center items-center relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/5 rounded-full blur-3xl"></div>
                <p class="text-[8px] orbitron text-cyan-500 tracking-[0.2em] mb-2 font-black">PRECIO SUGERIDO</p>
                <h3 id="res_precio" class="text-4xl font-black text-white orbitron italic tracking-tighter shadow-cyan-500/20">$ 0</h3>
                <p id="res_explicacion" class="text-[7px] text-slate-500 orbitron mt-4 text-center uppercase leading-relaxed font-bold"></p>
            </div>
        </div>

        <button type="button" onclick="ejecutarCalculoTerminator()" class="w-full mt-6 py-6 bg-white text-black orbitron font-black text-[11px] rounded-[1.5rem] hover:bg-cyan-500 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_rgba(0,0,0,0.4)] uppercase tracking-widest">
            SINCRONIZAR CON ORDEN DE TRABAJO
        </button>
    </div>`;
}

// 3. FUNCIONES GLOBALES DE SOPORTE
window.nexusRadar = (sitio) => {
    const q = document.getElementById('m_procedimiento').value;
    if(!q) return Swal.fire({ icon: 'info', title: 'NEXUS INFO', text: 'Define el procedimiento primero.', background: '#0d1117', color: '#fff' });
    const url = sitio === 'autolab' ? `https://autolab.com.co/cotizar?s=${q}` : `https://c3carecenter.com/?s=${q}`;
    window.open(url, '_blank');
};

window.ejecutarCalculoTerminator = () => {
    const data = {
        horasEstimadas: parseFloat(document.getElementById('m_horas').value),
        tipoVehiculo: document.getElementById('m_gama').value,
        urgencia: document.getElementById('m_urgencia').value,
        tipoTrabajo: document.getElementById('m_procedimiento').value.toUpperCase().includes("DIAG") ? "DIAGNOSTICO" : "GENERAL"
    };

    const res = calcularPrecioInteligentePRO360(data);
    
    // Actualizar UI del motor
    document.getElementById('res_precio').innerText = `$ ${res.precioSugerido.toLocaleString()}`;
    document.getElementById('res_explicacion').innerText = res.explicacion;

    // Sincronizar con el resto de la Orden
    const bitacora = document.getElementById('ai-log-display'); // Selector corregido para tu ordenes.js
    
    if(bitacora) {
        bitacora.value += `\n[NEXUS-PRICING]: $${res.precioSugerido.toLocaleString()} por ${data.horasEstimadas}h (${data.tipoVehiculo}). ${res.explicacion}`;
    }
    
    // Intentar disparar el recalculo de finanzas en ordenes.js
    if (typeof window.actualizarFinanzasDirecto === 'function') {
        window.actualizarFinanzasDirecto();
    }

    Swal.fire({
        icon: 'success',
        title: 'NEXUS SYNC',
        text: `Labor valuada en $${res.precioSugerido.toLocaleString()}`,
        background: '#0d1117',
        color: '#06b6d4',
        timer: 2000,
        showConfirmButton: false
    });
};
