/**
 * 🌌 NEXUS-X AUDIT CENTER V26.8 - PROTOCOLO DE ESTABILIDAD
 * 🛠️ INTEGRACIÓN BLINDADA CON FIRESTORE Y AI
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// MANTENIENDO RUTAS ORIGINALES PARA EVITAR REBOTES
import { calcularPrecioInteligente } from "./ai/pricingOptimizerAI.js";
import repairEstimator from "./ai/repairEstimator.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("empresaId");
    let datosOrdenes = [];

    // CONSTANTES DE COSTO OPERATIVO (Basado en tus capturas de pantalla)
    const COSTO_BAHIA_HORA = 16026; 

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white pb-40">
            <header class="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 class="orbitron text-4xl font-black italic uppercase text-white tracking-tighter">
                        NEXUS-X <span class="text-cyan-400">AI AUDIT</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="bg-emerald-500/20 text-emerald-500 text-[8px] orbitron px-3 py-1 rounded-full border border-emerald-500/30 font-bold">PROTOCOL_STABLE</span>
                        <p class="text-slate-500 orbitron text-[9px] tracking-[0.2em]">SISTEMA DE ANÁLISIS PROFUNDO FIRESTORE-LINKED</p>
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <button id="exportGlobal" class="px-8 py-3 bg-cyan-500 text-black rounded-2xl orbitron text-[10px] font-black uppercase">
                        📥 EXPORTAR XLSX
                    </button>
                </div>
            </header>

            <div id="aiStatus" class="bg-cyan-500/5 border border-cyan-500/20 p-8 rounded-[2.5rem] mb-12 flex items-start gap-6">
                <div class="text-3xl">🧠</div>
                <div id="iaMessage">
                    <h4 class="orbitron text-xs font-black text-cyan-400 mb-2 uppercase">AI Mechanic Assistant</h4>
                    <p class="text-[11px] text-slate-300">Sincronizando misiones con la base de datos...</p>
                </div>
            </div>

            <div id="gridAnalisis" class="grid grid-cols-1 gap-8">
                </div>
        </div>`;

        document.getElementById("exportGlobal").onclick = exportarGlobal;
        fetchData();
    };

    const fetchData = async () => {
        try {
            // USANDO LOS NOMBRES DE COLECCIÓN Y CAMPOS EXACTOS DE TU FIRESTORE
            const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            datosOrdenes = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            
            if(datosOrdenes.length === 0) {
                document.getElementById("iaMessage").innerHTML = "<p class='text-amber-400'>No se encontraron misiones activas en Firestore para esta empresa.</p>";
            } else {
                renderMisiones();
            }
        } catch (error) {
            console.error("Error crítico de enlace:", error);
            // Esto evita que la pantalla se quede en negro si falla el link
            container.innerHTML = `<div class="p-20 text-center"><h2 class="text-red-500 orbitron">FALLO DE PROTOCOLO: REVISE FIREBASE-CONFIG</h2><p class="text-xs text-slate-500 mt-4">${error.message}</p></div>`;
        }
    };

    const renderMisiones = () => {
        const grid = document.getElementById("gridAnalisis");
        let perdidaMargenTotal = 0;

        grid.innerHTML = datosOrdenes.map(o => {
            // EXTRACCIÓN DE DATOS RESPETANDO TUS NOMBRES DE CAMPO
            const ventaActual = Number(o.costos_totales?.total_general || 0);
            const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
            const mo = Number(o.costos_totales?.mano_obra || 0);
            const horas = Number(o.horas_reales || 1);

            // LLAMADA A TUS SCRIPTS DE ÚLTIMA GENERACIÓN
            const optimizacion = calcularPrecioInteligente({
                costoRepuestos: repuestos,
                horasTrabajo: horas,
                tipoCliente: o.cliente_tipo || "normal"
            });

            const brecha = optimizacion.total - ventaActual;
            if (brecha > 0) perdidaMargenTotal += brecha;

            return `
            <div class="bg-[#0d1117] border border-white/5 rounded-[3rem] p-10 hover:border-cyan-500/30 transition-all">
                <div class="flex flex-col xl:flex-row justify-between gap-10">
                    <div class="flex-1">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="text-3xl font-black orbitron text-white italic">${o.placa || 'N/A'}</span>
                            <span class="text-[9px] orbitron px-4 py-1 bg-white/5 rounded-full text-slate-500">${o.id.substring(0,8)}</span>
                        </div>
                        <p class="text-slate-500 orbitron text-[10px] mb-8 uppercase">${o.cliente || 'SIN NOMBRE'} | ${o.marca || ''} ${o.linea || ''}</p>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Total Facturado</p>
                                <p class="text-sm font-bold">$ ${ventaActual.toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Sugerido IA 2026</p>
                                <p class="text-sm font-bold text-cyan-400">$ ${optimizacion.total.toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Mano de Obra</p>
                                <p class="text-sm font-bold">$ ${mo.toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Estatus</p>
                                <p class="text-[10px] font-black ${brecha <= 0 ? 'text-emerald-400' : 'text-amber-500'} orbitron">
                                    ${brecha <= 0 ? 'OPTIMO' : 'REVISAR PRICING'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="xl:w-80 bg-white/[0.02] rounded-3xl p-6 border border-white/5">
                        <p class="orbitron text-[9px] text-cyan-500 mb-2 uppercase font-black">AI Insight</p>
                        <p class="text-[10px] leading-relaxed text-slate-400 italic">
                            ${brecha > 0 ? 
                                `Detectamos una fuga de <b>$${brecha.toLocaleString()}</b> en esta orden comparado con el mercado 2026.` : 
                                `Felicidades, esta misión está alineada con los márgenes de rentabilidad Nexus-X.`}
                        </p>
                    </div>
                </div>
            </div>`;
        }).join("");

        document.getElementById("iaMessage").innerHTML = `
            <h4 class="orbitron text-xs font-black text-cyan-400 mb-2 uppercase">Auditoría Finalizada</h4>
            <p class="text-[11px] text-slate-300">
                Se detectó una oportunidad de mejora en facturación por <b>$${perdidaMargenTotal.toLocaleString()}</b>. 
                Sincronice el <i>Pricing Optimizer</i> para evitar fugas de capital.
            </p>`;
    };

    const exportarGlobal = () => {
        const wsData = datosOrdenes.map(o => ({
            "Placa": o.placa,
            "Total Facturado": o.costos_totales?.total_general || 0,
            "Utilidad Real": Number(o.costos_totales?.total_general || 0) - (Number(o.costos_totales?.costo_repuestos || 0) + Number(o.costos_totales?.mano_obra || 0) + ((o.horas_reales || 1) * COSTO_BAHIA_HORA))
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "NexusX_Audit");
        XLSX.writeFile(wb, `Audit_Pro360_${empresaId}.xlsx`);
    };

    renderLayout();
}
