/**
 * 🦾 NEXUS-X TERMINATOR CORE V29.0 - ANALÍTICA OPERATIVA
 * Central de Inteligencia de Procesos // William Jeffry Urquijo Cubillos 
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { calcularPrecioInteligente } from "../ai/pricingOptimizerAI.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenesData = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white pb-40 selection:bg-cyan-500/30 font-sans">
            
            <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 border-b border-white/5 pb-10 gap-6">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1.5 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase leading-none">
                        OPERACIONES <span class="text-cyan-400">ANALÍTICA</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] orbitron font-black text-cyan-400 uppercase tracking-[0.4em]">Protocolo de Eficiencia Nexus-X</span>
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <button id="btnExportExcel" class="group px-8 py-5 bg-white text-black rounded-2xl flex items-center gap-4 hover:bg-cyan-500 hover:text-white transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-2xl">
                        <i class="fas fa-file-excel text-xl"></i>
                        <span class="orbitron text-[10px] font-black uppercase tracking-widest">Descargar Auditoría Excel</span>
                    </button>
                </div>
            </header>

            <div id="autoReportConfig" class="mb-12 hidden"></div>

            <div id="opStats" class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"></div>

            <div class="bg-[#0d1117] border-l-4 border-cyan-500 p-12 rounded-r-[3.5rem] flex items-center gap-10 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                <div class="absolute right-0 top-0 opacity-10 text-9xl group-hover:rotate-12 transition-transform duration-700">🤖</div>
                <div class="w-20 h-20 bg-white text-black rounded-3xl flex-shrink-0 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <i class="fas fa-brain"></i>
                </div>
                <div class="relative z-10">
                    <h5 class="text-[12px] font-black uppercase text-white mb-2 orbitron tracking-[0.3em] italic">IA Strategic <span class="text-cyan-400">Operational Advisor</span></h5>
                    <p id="iaTacticalMsg" class="text-lg text-slate-400 leading-relaxed font-medium italic">Sincronizando telemetría de rampas y flujos de trabajo...</p>
                </div>
            </div>

            <div class="bg-[#0d1117] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
                <div class="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h3 class="orbitron text-[12px] font-black text-white uppercase tracking-[0.5em] italic">Historial de Rentabilidad <span class="text-cyan-500">[Click para Deep Drill]</span></h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-black/40 orbitron text-[9px] text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th class="p-10">Identificación</th>
                                <th class="p-10">Venta Real</th>
                                <th class="p-10">Análisis IA</th>
                                <th class="p-10 text-center">Margen Neto</th>
                                <th class="p-10 text-right">Estatus P&G</th>
                            </tr>
                        </thead>
                        <tbody id="opTableBody" class="divide-y divide-white/[0.03]"></tbody>
                    </table>
                </div>
            </div>
        </div>`;

        document.getElementById("btnExportExcel").onclick = () => generarInformeDetallado(ordenesData, "global");
        fetchData();
    };

    const fetchData = async () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        ordenesData = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        procesarOperaciones();
    };

    const procesarOperaciones = () => {
    const tbody = document.getElementById("opTableBody");
    let totalVenta = 0; let totalSugerido = 0; let misionesBajaRentabilidad = 0;

    tbody.innerHTML = ordenesData.map(o => {
        // Venta Real es lo que el cliente realmente pagó o debe pagar (total_general)
        const venta = Number(o.costos_totales?.total_general || 0);
        const abonado = Number(o.finanzas?.anticipo_cliente || 0); // Lo que ya entró a caja
        const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
        const mo = Number(o.costos_totales?.mano_obra || 0);
        
        totalVenta += venta;

        const sugerido = calcularPrecioInteligente({ costoRepuestos: repuestos, horasTrabajo: o.horas_reales || 1 });
        o.sugeridoCalculado = sugerido.total; 
        totalSugerido += sugerido.total;

        // Margen basado en Venta Total vs Costos Directos
        const margen = venta > 0 ? ((venta - (repuestos + mo)) / venta) * 100 : 0;
        const esBaja = venta < sugerido.total;
        if (esBaja) misionesBajaRentabilidad++;

        return `
        <tr onclick="window.verDetalleMision('${o.id}')" class="hover:bg-cyan-500/[0.03] transition-all cursor-pointer group">
            <td class="p-10">
                <div class="flex flex-col">
                    <span class="orbitron text-xl font-black italic tracking-tighter group-hover:text-cyan-400 transition-colors uppercase">${o.placa || 'N/A'}</span>
                    <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">${o.cliente || 'CLIENTE'}</span>
                </div>
            </td>
            <td class="p-10">
                <div class="flex flex-col">
                    <span class="text-xl font-black orbitron tabular-nums">$ ${venta.toLocaleString()}</span>
                    <span class="text-[8px] text-emerald-500 font-black orbitron uppercase italic">Abonado: $${abonado.toLocaleString()}</span>
                </div>
            </td>
            <td class="p-10 font-bold text-cyan-400/80 orbitron tabular-nums text-sm">
                $ ${sugerido.total.toLocaleString()}
            </td>
            <td class="p-10">
                <div class="flex flex-col items-center">
                    <span class="text-[13px] font-black orbitron mb-2 ${margen > 25 ? 'text-emerald-400' : 'text-red-500'}">${margen.toFixed(1)}%</span>
                    <div class="w-24 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                        <div class="h-full ${margen > 25 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}" style="width: ${Math.min(margen, 100)}%"></div>
                    </div>
                </div>
            </td>
            <td class="p-10 text-right">
                <span class="px-5 py-2 rounded-xl text-[9px] orbitron font-black uppercase tracking-widest ${esBaja ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
                    ${esBaja ? 'Revisar Pricing' : 'Optimizado'}
                </span>
            </td>
        </tr>`;
    }).join("");
    
    // ... (resto de la función igual)
};
        const ticketPromedio = ordenesData.length > 0 ? totalVenta / ordenesData.length : 0;
        const fugaTotal = totalSugerido > totalVenta ? totalSugerido - totalVenta : 0;

        document.getElementById("opStats").innerHTML = `
            ${renderStatBox("Ticket Promedio", ticketPromedio, "fa-tags", "Formula: Ingreso Total / N° Misiones")}
            ${renderStatBox("Fuga Operativa (Sub-cobro)", fugaTotal, "fa-faucet-drip", "Formula: Sugerido IA - Facturado Real", "text-red-500")}
            ${renderStatBox("Misiones Auditadas", ordenesData.length, "fa-clipboard-check", "Total de órdenes procesadas en el periodo")}
        `;

        document.getElementById("iaTacticalMsg").innerHTML = `
            He detectado que el <span class="text-white font-black">${((misionesBajaRentabilidad/ordenesData.length)*100).toFixed(0)}%</span> de tus servicios presentan fuga de capital. 
            Acción Inmediata: Ajusta el valor de la hora hombre en el módulo de configuración para recuperar <span class="text-cyan-400 font-bold">$${fugaTotal.toLocaleString()}</span> de utilidad proyectada.`;
    };

    const renderStatBox = (title, val, icon, formula, color = "text-white") => `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-500">
            <div class="flex items-center gap-4 mb-6">
                <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <i class="fas ${icon} text-sm text-slate-400 group-hover:text-cyan-400 transition-colors"></i>
                </div>
                <p class="orbitron text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">${title}</p>
            </div>
            <p class="text-4xl font-black orbitron tracking-tighter tabular-nums ${color}">${typeof val === 'number' ? '$' + val.toLocaleString() : val}</p>
            <div class="mt-6 pt-6 border-t border-white/5">
                <p class="text-[8px] orbitron text-slate-600 font-black uppercase tracking-widest">${formula}</p>
            </div>
        </div>`;

    // FUNCIÓN DE DESCARGA DETALLADA (Global o por Misión)
    const generarInformeDetallado = (data, tipo = "global") => {
        try {
            if (tipo !== "global") {
                const venta = Number(data.costos_totales?.total_general || 0);
                const repuestos = Number(data.costos_totales?.costo_repuestos || 0);
                const mo = Number(data.costos_totales?.mano_obra || 0);
                const sugeridoIA = data.sugeridoCalculado || 0;
                
                const contenidoMision = [
                    ["NEXUS-X TERMINATOR CORE - CERTIFICADO DE MISIÓN"],
                    ["AUDITORÍA DE ACTIVOS PRO360 // WILLIAM JEFFRY URQUIJO CUBILLOS"],
                    [""],
                    ["PLACA", data.placa || 'N/A'],
                    ["CLIENTE", data.cliente || 'CLIENTE FINAL'],
                    ["ESTADO P&G", venta < sugeridoIA ? "BAJA RENTABILIDAD / CRÍTICO" : "OPTIMIZADO"],
                    ["-------------------------------------------"],
                    ["VALOR FACTURADO REAL", `$ ${venta.toLocaleString()}`],
                    ["COSTO DE REPUESTOS", `$ ${repuestos.toLocaleString()}`],
                    ["INVERSIÓN MANO DE OBRA", `$ ${mo.toLocaleString()}`],
                    ["UTILIDAD NETA", `$ ${(venta - (repuestos + mo)).toLocaleString()}`],
                    ["MARGEN OPERATIVO", `${venta > 0 ? (((venta - (repuestos + mo)) / venta) * 100).toFixed(2) : 0}%`],
                    ["ANALISIS IA (SUGERIDO)", `$ ${sugeridoIA.toLocaleString()}`],
                    ["-------------------------------------------"],
                    ["LOGARITMO GERENCIAL", "[(Facturación - (Costo Directo + Operativo)) / Facturación] x 100"]
                ];
                
                const ws = XLSX.utils.aoa_to_sheet(contenidoMision);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Detalle_Misión");
                XLSX.writeFile(wb, `NexusX_Mision_${data.placa || 'OT'}.xlsx`);
            } else {
                const wsData = data.map(o => {
                    const venta = Number(o.costos_totales?.total_general || 0);
                    const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
                    const mo = Number(o.costos_totales?.mano_obra || 0);
                    return {
                        "PLACA": o.placa,
                        "CLIENTE": o.cliente,
                        "VENTA TOTAL": venta,
                        "COSTO INSUMOS": repuestos,
                        "MANO OBRA": mo,
                        "MARGEN %": venta > 0 ? (((venta - (repuestos + mo)) / venta) * 100).toFixed(1) + "%" : "0%",
                        "ESTATUS": venta < (o.sugeridoCalculado || 158000) ? "REVISAR PRICING" : "OPTIMIZADO"
                    };
                });

                const wsGlobal = XLSX.utils.json_to_sheet(wsData);
                const wbGlobal = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wbGlobal, wsGlobal, "Auditoria_Periodo");
                XLSX.writeFile(wbGlobal, `NexusX_Auditoria_General_${new Date().toISOString().slice(0,10)}.xlsx`);
            }
            Swal.fire({ icon: 'success', title: 'Descarga Exitosa', background: '#0d1117', color: '#fff' });
        } catch (error) {
            console.error("Error en descarga:", error);
            Swal.fire({ icon: 'error', title: 'Falla en Protocolo', text: 'Verifica la librería SheetJS en index.html', background: '#0d1117', color: '#fff' });
        }
    };

    // FUNCIÓN DE DETALLE DE ORDEN (DEEP DRILL)
    window.verDetalleMision = (id) => {
        const o = ordenesData.find(x => x.id === id);
        const venta = Number(o.costos_totales?.total_general || 0);
        const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
        const mo = Number(o.costos_totales?.mano_obra || 0);
        const margenNeto = venta > 0 ? ((venta - (repuestos + mo)) / venta) * 100 : 0;

        Swal.fire({
            title: `<span class="orbitron font-black text-cyan-500 uppercase">Resumen Misión: ${o.placa}</span>`,
            background: '#0d1117',
            color: '#fff',
            width: '600px',
            html: `
            <div class="text-left orbitron p-4 space-y-6">
                <div class="bg-black/40 p-6 rounded-2xl border border-white/5">
                    <p class="text-[9px] text-slate-500 uppercase mb-4">Análisis de Rentabilidad</p>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs">Margen Bruto (Venta - Insumos):</span>
                        <span class="text-white font-black">$${(venta - repuestos).toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-xs">Utilidad Neta Operativa:</span>
                        <span class="${margenNeto > 25 ? 'text-emerald-400' : 'text-red-500'} font-black">$${(venta - (repuestos + mo)).toLocaleString()}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-black/40 p-6 rounded-2xl border border-white/5">
                        <p class="text-[9px] text-slate-500 uppercase mb-2">ROI Mano Obra</p>
                        <span class="text-xl font-black text-cyan-400">${venta > 0 ? ((mo / venta) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div class="bg-black/40 p-6 rounded-2xl border border-white/5">
                        <p class="text-[9px] text-slate-500 uppercase mb-2">Eficiencia Neta</p>
                        <span class="text-xl font-black text-white">${margenNeto.toFixed(1)}%</span>
                    </div>
                </div>

                <div class="bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20 mb-6">
                    <p class="text-[8px] text-cyan-500 uppercase font-black tracking-widest mb-2">Logaritmo Gerencial</p>
                    <p class="text-[10px] text-slate-400 leading-relaxed italic">Formula: [(Facturación - (Costo Directo + Operativo)) / Facturación] x 100. Un margen inferior al 25% indica sub-valoración del tiempo técnico.</p>
                </div>

                <button onclick="window.descargarMisionEspecifica('${o.id}')" class="w-full p-5 bg-emerald-500/20 border border-emerald-500 text-emerald-400 orbitron text-[10px] font-black rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg">
                    <i class="fas fa-file-invoice-dollar mr-2"></i> DESCARGAR CERTIFICADO DE MISIÓN (EXCEL)
                </button>
            </div>`,
            showConfirmButton: false,
            showCloseButton: true
        });
    };

    // Puentes globales para eventos en modales
    window.descargarMisionEspecifica = (id) => {
        const o = ordenesData.find(x => x.id === id);
        generarInformeDetallado(o, "individual");
    };

    renderLayout();
}
