/**
 * 🌌 NEXUS-X AUDIT CENTER V25.0 - ESTRATEGIA DE TALLER GRANDE
 * 🧠 FOCO: PRODUCTIVIDAD, PUNTO DE EQUILIBRIO Y RENTABILIDAD POR MISIÓN
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("empresaId");
    let datosOrdenes = [];

    // --- CONFIGURACIÓN DE GESTIÓN (PUNTO DE EQUILIBRIO) ---
    const config = {
        gastosFijos: 6500000, // Arriendo, Nómina Admin, Servicios
        bahias: 5,            // Puestos de trabajo
        horasDia: 9,
        diasMes: 26
    };

    const render = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white pb-40 animate-in fade-in duration-500">
            <header class="mb-12 border-b border-white/5 pb-8 flex justify-between items-end">
                <div>
                    <h1 class="orbitron text-5xl font-black tracking-tighter italic uppercase text-white">
                        INTEL <span class="text-cyan-400">CORE</span>
                    </h1>
                    <p class="text-slate-500 orbitron text-[9px] mt-2 tracking-[0.3em]">ANÁLISIS DE PRODUCTIVIDAD Y RENTABILIDAD POR UNIDAD</p>
                </div>
                <div class="flex gap-4">
                     <button id="btnCalculos" class="px-6 py-2 border border-cyan-500/30 rounded-xl orbitron text-[9px] text-cyan-400 hover:bg-cyan-500/10 transition-all">
                        VER FÓRMULAS DE CÁLCULO
                    </button>
                    <button id="btnExport" class="px-8 py-2 bg-white text-black rounded-xl orbitron text-[10px] font-black uppercase">
                        Exportar_BI
                    </button>
                </div>
            </header>

            <div id="statsGlobal" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"></div>

            <div class="bg-[#0d1117] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div class="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h2 class="orbitron text-xs font-black uppercase">Auditoría de Misiones (Ordenes de Trabajo)</h2>
                    <input type="text" id="filterOT" placeholder="BUSCAR PLACA O CLIENTE..." class="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-[10px] orbitron focus:outline-none focus:border-cyan-500 w-1/3">
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase">
                            <tr>
                                <th class="p-8">Misión / Placa</th>
                                <th class="p-8">Tiempo Ocupado</th>
                                <th class="p-8 text-right">Rentabilidad Neta</th>
                                <th class="p-8 text-center">IA Insight</th>
                                <th class="p-8 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="listaOTs" class="divide-y divide-white/5 text-[11px] font-bold uppercase"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="modalAI" class="fixed inset-0 bg-black/90 backdrop-blur-xl hidden z-[100] flex items-center justify-center p-6">
            <div class="bg-[#0d1117] border border-white/10 p-12 rounded-[3rem] max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300">
                <div id="contentAI"></div>
                <button onclick="document.getElementById('modalAI').classList.add('hidden')" class="mt-10 w-full py-4 bg-cyan-500 text-black orbitron font-black rounded-2xl">ENTENDIDO</button>
            </div>
        </div>`;

        document.getElementById("btnCalculos").onclick = verFormulas;
        document.getElementById("filterOT").oninput = (e) => filtrar(e.target.value);
        init();
    };

    const init = async () => {
        const snap = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
        datosOrdenes = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        procesarUI();
    };

    const procesarUI = () => {
        const costoHoraBahia = (config.gastosFijos / config.bahias) / (config.diasMes * config.horasDia);
        const container = document.getElementById("listaOTs");
        
        container.innerHTML = datosOrdenes.map(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            const tiempoH = o.horas_reales || 2; // Simulación si no existe
            const costoB = tiempoH * costoHoraBahia;
            const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
            const neto = venta - (repuestos + costoB);
            
            return `
            <tr class="hover:bg-white/[0.02] group transition-all">
                <td class="p-8">
                    <div class="text-white orbitron font-black text-xs">${o.placa}</div>
                    <div class="text-slate-500 text-[9px]">${o.cliente}</div>
                </td>
                <td class="p-8 text-slate-400">${tiempoH} Horas de Bahía</td>
                <td class="p-8 text-right ${neto > 0 ? 'text-emerald-400' : 'text-red-500'} font-black italic">
                    $ ${Math.round(neto).toLocaleString()}
                </td>
                <td class="p-8 text-center">
                    <span class="px-4 py-1 rounded-full text-[8px] orbitron ${neto > (venta * 0.2) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}">
                        ${neto > (venta * 0.2) ? 'OPTIMO' : 'FUGA DE CAPITAL'}
                    </span>
                </td>
                <td class="p-8 text-right">
                    <button onclick="verDetalleIA('${o.id}')" class="text-cyan-400 hover:underline orbitron text-[9px]">ANALIZAR_POR_QUE</button>
                </td>
            </tr>`;
        }).join("");

        actualizarKPIs(costoHoraBahia);
    };

    window.verDetalleIA = (id) => {
        const o = datosOrdenes.find(x => x.id === id);
        const costoHoraBahia = (config.gastosFijos / config.bahias) / (config.diasMes * config.horasDia);
        const venta = Number(o.costos_totales?.total_general || 0);
        const tiempoH = o.horas_reales || 2;
        const costoB = tiempoH * costoHoraBahia;
        const neto = venta - (Number(o.costos_totales?.costo_repuestos || 0) + costoB);

        const modal = document.getElementById("modalAI");
        const content = document.getElementById("contentAI");
        modal.classList.remove("hidden");

        content.innerHTML = `
            <h3 class="orbitron text-2xl font-black text-cyan-400 mb-6 uppercase italic">Análisis de Misión: ${o.placa}</h3>
            <div class="space-y-6 text-slate-300 font-medium leading-relaxed">
                <p>Esta orden generó una <b class="${neto > 0 ? 'text-emerald-400' : 'text-red-500'} uppercase">${neto > 0 ? 'Utilidad' : 'Pérdida'} de $${Math.round(neto).toLocaleString()}</b>.</p>
                <div class="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-3">
                    <div class="flex justify-between text-[10px] orbitron"><p>INGRESO TOTAL:</p> <p class="text-white">$ ${venta.toLocaleString()}</p></div>
                    <div class="flex justify-between text-[10px] orbitron"><p>COSTO BAHÍA (TIEMPO):</p> <p class="text-red-400">-$ ${Math.round(costoB).toLocaleString()}</p></div>
                    <div class="flex justify-between text-[10px] orbitron"><p>COSTO INSUMOS:</p> <p class="text-red-400">-$ ${Number(o.costos_totales?.costo_repuestos || 0).toLocaleString()}</p></div>
                </div>
                <p class="text-xs italic text-slate-500 border-l-2 border-cyan-500 pl-4">
                    ${neto < 0 ? 
                        "Sugerencia Gerencial: El tiempo de ocupación excedió el margen de venta. Se recomienda estandarizar este servicio o aumentar la tarifa de mano de obra." : 
                        "Sugerencia Gerencial: Operación eficiente. El flujo de trabajo permitió liberar la bahía en tiempo récord maximizando el margen."}
                </p>
            </div>`;
    };

    const verFormulas = () => {
        alert(`ESTÁNDAR DE CÁLCULO EMPRESARIAL:\n\n1. Costo Hora Bahía = (Gastos Fijos / Bahías) / (Días * Horas)\n2. Rentabilidad = Venta - (Insumos + Costo Bahía)\n3. Punto de Equilibrio = Volumen de ventas necesario para que Utilidad sea $0.`);
    };

    render();
}
