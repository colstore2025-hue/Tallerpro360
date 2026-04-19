/**
 * 🌌 NEXUS-X AUDIT CENTER V26.5 - ESTABILIZACIÓN ELITE
 * 🛠️ INTEGRACIÓN PROFUNDA: pricingOptimizerAI & repairEstimator
 * 🇨🇴 FOCO: RENTABILIDAD REAL COLOMBIA 2026
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// Importación de los scripts de última generación fusionados
import { calcularPrecioInteligente } from "./ai/pricingOptimizerAI.js";
import repairEstimator from "./ai/repairEstimator.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("empresaId");
    let datosOrdenes = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white pb-40">
            <header class="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 class="orbitron text-4xl font-black italic uppercase text-white tracking-tighter">
                        NEXUS-X <span class="text-cyan-400">AI AUDIT</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="bg-emerald-500/20 text-emerald-500 text-[8px] orbitron px-3 py-1 rounded-full border border-emerald-500/30">INTEL_CORE_ACTIVE</span>
                        <p class="text-slate-500 orbitron text-[9px] tracking-[0.2em]">ANÁLISIS OPERATIVO DE ÚLTIMA GENERACIÓN</p>
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <button id="btnVerMetricas" class="px-6 py-3 border border-white/10 rounded-2xl orbitron text-[9px] hover:bg-white/5 transition-all text-slate-400">
                        🔍 MÉTRICAS DE MERCADO 2026
                    </button>
                    <div class="relative group">
                        <button class="px-8 py-3 bg-cyan-500 text-black rounded-2xl orbitron text-[10px] font-black uppercase shadow-lg shadow-cyan-500/20">
                            📥 EXPORTAR_DATA
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-[#0d1117] border border-white/10 rounded-xl hidden group-hover:block z-50 shadow-2xl">
                            <button id="exportGlobal" class="w-full p-4 text-[10px] orbitron text-left hover:bg-white/5">GLOBAL (P&G)</button>
                            <button id="exportDetallado" class="w-full p-4 text-[10px] orbitron text-left border-t border-white/5 hover:bg-white/5">REPORTES POR ORDEN</button>
                        </div>
                    </div>
                </div>
            </header>

            <div id="aiSummary" class="bg-cyan-500/5 border border-cyan-500/20 p-8 rounded-[2.5rem] mb-12 flex items-start gap-6 animate-pulse">
                <div class="text-3xl">🧠</div>
                <div>
                    <h4 class="orbitron text-xs font-black text-cyan-400 mb-2 uppercase italic">Estatus del Ecosistema</h4>
                    <p id="iaGeneralMsg" class="text-[11px] text-slate-300 leading-relaxed max-w-4xl">
                        Sincronizando con algoritmos de Pricing y Estimación... Analizando comportamiento de mercado en Colombia (Alza 7.48%).
                    </p>
                </div>
            </div>

            <div id="gridAnalisis" class="grid grid-cols-1 gap-8">
                </div>
        </div>`;

        document.getElementById("exportGlobal").onclick = () => exportarGlobal();
        document.getElementById("exportDetallado").onclick = () => exportarPorOrden();
        document.getElementById("btnVerMetricas").onclick = verPreciosSugeridos;

        fetchData();
    };

    const fetchData = async () => {
        try {
            const snap = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
            datosOrdenes = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            renderMisiones();
        } catch (error) {
            console.error("Error en Audit Protocol:", error);
            document.getElementById("iaGeneralMsg").innerText = "ERROR DE CONEXIÓN AL PROTOCOLO NEXUS-X.";
        }
    };

    const renderMisiones = () => {
        const grid = document.getElementById("gridAnalisis");
        let perdidasTotales = 0;

        grid.innerHTML = datosOrdenes.map(o => {
            // 1. Ejecutar Estimador de Reparación (IA)
            const diagnosticoBase = o.servicios_realizados || ["General"];
            const estimacionIA = repairEstimator.estimate(diagnosticoBase, o.kilometraje || 0);

            // 2. Ejecutar Optimizador de Precios (IA)
            const analiticaPrecio = calcularPrecioInteligente({
                costoRepuestos: Number(o.costos_totales?.costo_repuestos || 0),
                horasTrabajo: Number(o.horas_reales || estimacionIA.totalHours),
                tipoCliente: o.cliente_tipo || "normal",
                tipoTrabajo: o.trabajo_tipo || "general"
            });

            const ventaReal = Number(o.costos_totales?.total_general || 0);
            const utilidadReal = analiticaPrecio.analisis.utilidadEstimada;
            const brechaPrecio = analiticaPrecio.total - ventaReal;

            if (brechaPrecio > 0) perdidasTotales += brechaPrecio;

            return `
            <div class="bg-[#0d1117] border border-white/5 rounded-[3rem] p-10 hover:border-cyan-500/30 transition-all group">
                <div class="flex flex-col xl:flex-row justify-between gap-10">
                    <div class="flex-1">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="text-3xl font-black orbitron text-white italic group-hover:text-cyan-400 transition-colors">${o.placa || 'SIN_PLACA'}</span>
                            <span class="text-[9px] orbitron px-4 py-1 bg-white/5 rounded-full text-slate-500 border border-white/5">${o.id.substring(0,8)}</span>
                        </div>
                        <p class="text-slate-500 orbitron text-[10px] mb-8 uppercase tracking-widest">${o.cliente || 'CLIENTE FINAL'} | ${o.marca || 'UNKNOWN'} ${o.linea || ''}</p>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Cobro Real</p>
                                <p class="text-sm font-bold">$ ${ventaReal.toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Precio Sugerido IA</p>
                                <p class="text-sm font-bold text-cyan-400">$ ${analiticaPrecio.total.toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Tiempo Estándar</p>
                                <p class="text-sm font-bold">${estimacionIA.totalHours}H SUGERIDAS</p>
                            </div>
                            <div>
                                <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Rentabilidad Neta</p>
                                <p class="text-sm font-bold ${utilidadReal > 0 ? 'text-emerald-400' : 'text-red-500'} italic">$ ${Math.round(utilidadReal).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div class="xl:w-96 bg-white/[0.02] rounded-[2rem] p-8 border border-white/5 relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-4 opacity-10">🧠</div>
                        <p class="orbitron text-[9px] text-cyan-500 mb-4 uppercase tracking-tighter font-black">AI Audit Insight</p>
                        <div class="space-y-4">
                            <p class="text-[10px] leading-relaxed text-slate-300">
                                ${brechaPrecio > 0 ? 
                                    `🚨 <b class="text-red-400">PÉRDIDA DE MARGEN:</b> Estás cobrando $${brechaPrecio.toLocaleString()} menos que el mercado de 2026.` : 
                                    `✅ <b class="text-emerald-400">VALOR ÓPTIMO:</b> El precio está alineado con la rentabilidad estratégica.`}
                            </p>
                            ${estimacionIA.preventiveAlerts.length > 0 ? 
                                `<p class="text-[9px] text-amber-400 border-t border-white/5 pt-3 italic">⚠️ ${estimacionIA.preventiveAlerts[0]}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>`;
        }).join("");

        document.getElementById("iaGeneralMsg").innerHTML = `
            Análisis completado. Se detectó una <b>brecha de facturación de $${perdidasTotales.toLocaleString()}</b> en este periodo. 
            Ajustar tarifas de mano de obra según el <i>Pricing Optimizer</i> para recuperar margen operativo.`;
    };

    const exportarGlobal = () => {
        const wsData = datosOrdenes.map(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            const mo = Number(o.costos_totales?.mano_obra || 0);
            const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
            const costoBahia = (o.horas_reales || 2) * 16026;
            
            return {
                "PLACA": o.placa,
                "CLIENTE": o.cliente,
                "INGRESO BRUTO": venta,
                "MANO OBRA": mo,
                "REPUESTOS": repuestos,
                "COSTO BAHIA": costoBahia,
                "UTILIDAD NETA": venta - (mo + repuestos + costoBahia),
                "STATUS": venta < (mo + repuestos + costoBahia) ? "PERDIDA" : "RENTABLE"
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Auditoria_NexusX");
        XLSX.writeFile(wb, `Audit_Report_2026.xlsx`);
    };

    const verPreciosSugeridos = () => {
        alert("ESTÁNDARES COLOMBIA 2026:\n\n- Distribución 16V: $310.000\n- Frenos Delanteros: $150.000\n- Hora Técnico Senior: $150.000\n- Diagnóstico Scanner: $85.000\n\n*Datos basados en IPC 2026 + 7.48% sector mecánico.");
    };

    renderLayout();
}
