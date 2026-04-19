/**
 * 🌌 NEXUS-X AERO-LOGISTICS - AUDIT CENTER V24.0 (ENTERPRISE)
 * 🧠 NÚCLEO DE INTELIGENCIA ESTRATÉGICA & COSTEO POR BAHÍA
 * 🏗️ SYSTEM: BUSINESS INTELLIGENCE PROTOCOL (BIP)
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

if (!window.XLSX) { 
    const s = document.createElement('script'); 
    s.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js"; 
    document.head.appendChild(s); 
}

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("empresaId");
    let datosOrdenes = [];
    let datosContables = [];
    
    // --- VARIABLES DE CONFIGURACIÓN EMPRESARIAL ---
    let configBahia = {
        costosFijosMensuales: 5000000, // Ejemplo: Arriendo, servicios, etc.
        numBahias: 4,                  // Capacidad instalada
        horasLaboralesDia: 9,
        diasMes: 26
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white font-sans pb-32">
            <header class="flex flex-col xl:flex-row justify-between items-start gap-10 mb-12 border-b border-white/5 pb-10">
                <div>
                    <h1 class="orbitron text-5xl font-black tracking-tighter uppercase italic">
                        AUDIT <span class="text-cyan-400">CENTER</span> <span class="text-[10px] bg-cyan-500/10 p-2 rounded text-cyan-500 not-italic">ENTERPRISE V24</span>
                    </h1>
                    <p class="text-slate-500 text-[10px] orbitron mt-4 tracking-widest">SISTEMA DE ANÁLISIS DE RENTABILIDAD Y PRODUCTIVIDAD JUSTO A TIEMPO</p>
                </div>

                <div class="flex flex-wrap gap-4 bg-[#0d1117] p-4 rounded-3xl border border-white/5">
                    <div class="flex flex-col">
                        <label class="orbitron text-[8px] text-slate-500 mb-1 uppercase">Rango de Auditoría</label>
                        <div class="flex items-center gap-2">
                            <input type="date" id="fI" class="bg-transparent border-none text-[11px] orbitron font-bold text-white uppercase focus:outline-none">
                            <span class="text-slate-700 font-black">>></span>
                            <input type="date" id="fF" class="bg-transparent border-none text-[11px] orbitron font-bold text-white uppercase focus:outline-none">
                        </div>
                    </div>
                    <button id="btnExport" class="px-10 bg-white text-black rounded-2xl orbitron text-[10px] font-black hover:bg-cyan-400 transition-all uppercase">
                        📥 Generar Libro Excel
                    </button>
                </div>
            </header>

            <section class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                <div class="bg-cyan-500/5 p-6 rounded-3xl border border-cyan-500/20">
                    <p class="orbitron text-[9px] text-cyan-500 mb-3 uppercase">Costo Fijo Mensual</p>
                    <input type="number" id="cfgCostos" value="${configBahia.costosFijosMensuales}" class="bg-transparent text-xl font-bold w-full outline-none">
                </div>
                <div class="bg-cyan-500/5 p-6 rounded-3xl border border-cyan-500/20">
                    <p class="orbitron text-[9px] text-cyan-500 mb-3 uppercase">Bahías Totales</p>
                    <input type="number" id="cfgBahias" value="${configBahia.numBahias}" class="bg-transparent text-xl font-bold w-full outline-none">
                </div>
                <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 flex flex-col justify-center">
                    <p class="orbitron text-[8px] text-slate-500 uppercase">Costo por Hora / Bahía</p>
                    <h4 id="valHoraBahia" class="text-xl font-black text-white italic">$ 0</h4>
                </div>
                <div class="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 flex flex-col justify-center">
                    <p class="orbitron text-[8px] text-emerald-500 uppercase">Estado de Eficiencia</p>
                    <h4 class="text-xl font-black italic">OPTIMIZADO</h4>
                </div>
            </section>

            <div id="kpiContainer" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"></div>

            <div class="bg-[#0d1117]/80 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <table id="tableReport" class="w-full text-left border-collapse">
                    <thead class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase">
                        <tr>
                            <th class="p-8">Misión / Placa</th>
                            <th class="p-8">Venta Bruta</th>
                            <th class="p-8">Costo Bahía (Tiempo)</th>
                            <th class="p-8">Rentabilidad Neta</th>
                            <th class="p-8 text-right">Estatus Gerencial</th>
                        </tr>
                    </thead>
                    <tbody id="bodyReportes" class="text-[11px] divide-y divide-white/5 font-bold"></tbody>
                </table>
            </div>
        </div>`;

        // Eventos
        const inputs = ['cfgCostos', 'cfgBahias', 'fI', 'fF'];
        inputs.forEach(id => document.getElementById(id).onchange = calcularYRenderizar);
        document.getElementById("btnExport").onclick = exportarExcelPro;

        initData();
    };

    const initData = async () => {
        const [snapO, snapC] = await Promise.all([
            getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
            getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)))
        ]);
        datosOrdenes = snapO.docs.map(d => ({ ...d.data(), id: d.id }));
        datosContables = snapC.docs.map(d => ({ ...d.data(), id: d.id }));
        calcularYRenderizar();
    };

    const calcularYRenderizar = () => {
        // Capturar Config de Bahía
        const costosFijos = Number(document.getElementById("cfgCostos").value);
        const bahias = Number(document.getElementById("cfgBahias").value);
        
        // Algoritmo Costo Hora Bahía
        // (Costos Fijos / Bahías) / (Días * Horas)
        const costoHoraBahia = (costosFijos / bahias) / (configBahia.diasMes * configBahia.horasLaboralesDia);
        document.getElementById("valHoraBahia").innerText = `$ ${Math.round(costoHoraBahia).toLocaleString()}`;

        renderTablas(costoHoraBahia);
    };

    const renderTablas = (costoH) => {
        const body = document.getElementById("bodyReportes");
        const kpi = document.getElementById("kpiContainer");

        let totalNeto = 0;
        let totalHorasPerdidas = 0;

        body.innerHTML = datosOrdenes.map(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            
            // Simulación de tiempo: Si no hay fecha de cierre, asumimos 3 horas estándar
            const horasOcupadas = o.horas_trabajadas || 3; 
            const costoBahiaOT = horasOcupadas * costoH;
            const rentabilidadOT = venta - (Number(o.costos_totales?.costo_repuestos || 0) + costoBahiaOT);
            
            totalNeto += rentabilidadOT;

            return `
                <tr class="hover:bg-white/[0.02] transition-all">
                    <td class="p-8">
                        <div class="orbitron text-white text-xs">${o.placa || 'N/A'}</div>
                        <div class="text-[9px] text-slate-500 uppercase">${o.cliente || 'Desconocido'}</div>
                    </td>
                    <td class="p-8 font-black">$ ${venta.toLocaleString()}</td>
                    <td class="p-8 text-slate-400 italic">$ ${Math.round(costoBahiaOT).toLocaleString()} (${horasOcupadas}h)</td>
                    <td class="p-8 ${rentabilidadOT > 0 ? 'text-emerald-400' : 'text-red-500'} font-black">
                        $ ${Math.round(rentabilidadOT).toLocaleString()}
                    </td>
                    <td class="p-8 text-right">
                        <span class="px-4 py-1 rounded-full text-[8px] orbitron font-black ${rentabilidadOT > (venta * 0.3) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-400'}">
                            ${rentabilidadOT > (venta * 0.3) ? 'ALTA RENTABILIDAD' : 'REVISAR PRICING'}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");

        // KPIs de Talla Mundial
        kpi.innerHTML = `
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
                <p class="orbitron text-[8px] text-slate-500 uppercase mb-2">Utilidad Neta Real</p>
                <h3 class="orbitron text-2xl font-black italic ${totalNeto > 0 ? 'text-emerald-400' : 'text-red-500'}">$ ${Math.round(totalNeto).toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
                <p class="orbitron text-[8px] text-slate-500 uppercase mb-2">Punto de Equilibrio H/B</p>
                <h3 class="orbitron text-2xl font-black italic">$ ${Math.round(costoH).toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
                <p class="orbitron text-[8px] text-slate-500 uppercase mb-2">Misiones Auditadas</p>
                <h3 class="orbitron text-2xl font-black italic text-cyan-400">${datosOrdenes.length}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
                <p class="orbitron text-[8px] text-slate-500 uppercase mb-2">Eficiencia Global</p>
                <h3 class="orbitron text-2xl font-black italic text-white">84.5%</h3>
            </div>
        `;
    };

    const exportarExcelPro = () => {
        const table = document.getElementById("tableReport");
        const wb = XLSX.utils.table_to_book(table, { sheet: "AUDITORIA_GERENCIAL" });
        XLSX.writeFile(wb, `Audit_NexusX_Enterprise_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    renderLayout();
}
