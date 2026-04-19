/**
 * 🌌 NEXUS-X REPORTES V28.5 - ANALÍTICA OPERATIVA
 * Enfoque: Productividad, Rentabilidad por Placa y Eficiencia IA
 * Alimenta el flujo estratégico para Finanzas Elite
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { calcularPrecioInteligente } from "../ai/pricingOptimizerAI.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenesData = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-white pb-32 selection:bg-cyan-500/30">
            
            <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/5 pb-8 gap-6">
                <div>
                    <h1 class="orbitron text-4xl font-black italic tracking-tighter uppercase">
                        OPERACIONES <span class="text-cyan-400">ANALÍTICA</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] orbitron font-black text-cyan-400 uppercase tracking-widest">Protocolo de Eficiencia</span>
                    </div>
                </div>
                <div class="flex gap-4">
                    <button id="btnExportExcel" class="px-6 py-3 bg-white/5 border border-white/10 rounded-xl orbitron text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all">
                        Descargar Excel
                    </button>
                </div>
            </header>

            <div id="opStats" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                </div>

            <div class="bg-gradient-to-r from-[#0d1117] to-transparent border-l-4 border-cyan-500 p-10 rounded-r-[3rem] flex items-center gap-8 mb-12 shadow-2xl">
                <div class="text-4xl">🤖</div>
                <div>
                    <h5 class="orbitron text-[10px] font-black text-cyan-400 uppercase mb-1 tracking-widest">IA Operational Advisor</h5>
                    <p id="iaTacticalMsg" class="text-[13px] text-slate-300 leading-relaxed italic">Analizando el flujo de trabajo en las rampas...</p>
                </div>
            </div>

            <div class="bg-[#0d1117] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div class="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 class="orbitron text-[11px] font-black text-white uppercase tracking-[0.4em]">Historial de Rentabilidad por Misión</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-black/20 orbitron text-[8px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th class="p-8">Identificación</th>
                                <th class="p-8">Venta Real</th>
                                <th class="p-8">Análisis IA</th>
                                <th class="p-8">Margen Neto</th>
                                <th class="p-8">Estado P&G</th>
                            </tr>
                        </thead>
                        <tbody id="opTableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>`;

        document.getElementById("btnExportExcel").onclick = exportarExcel;
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
        let totalVenta = 0;
        let totalSugerido = 0;
        let misionesBajaRentabilidad = 0;

        tbody.innerHTML = ordenesData.map(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
            const mo = Number(o.costos_totales?.mano_obra || 0);
            
            totalVenta += venta;

            const sugerido = calcularPrecioInteligente({
                costoRepuestos: repuestos,
                horasTrabajo: o.horas_reales || 1
            });
            totalSugerido += sugerido.total;

            const margen = venta > 0 ? ((venta - (repuestos + mo)) / venta) * 100 : 0;
            const esBaja = venta < sugerido.total;
            if (esBaja) misionesBajaRentabilidad++;

            return `
            <tr class="border-b border-white/5 hover:bg-white/[0.01] transition-all group">
                <td class="p-8">
                    <span class="orbitron text-lg font-black italic group-hover:text-cyan-400 transition-colors">${o.placa || 'PRO-360'}</span><br>
                    <span class="text-[9px] text-slate-500 uppercase font-bold">${o.cliente || 'CLIENTE FINAL'}</span>
                </td>
                <td class="p-8 font-bold text-sm">$ ${venta.toLocaleString()}</td>
                <td class="p-8 font-bold text-sm text-cyan-400/80">$ ${sugerido.total.toLocaleString()}</td>
                <td class="p-8">
                    <div class="flex flex-col">
                        <span class="text-[11px] font-black orbitron ${margen > 25 ? 'text-emerald-400' : 'text-red-500'}">${margen.toFixed(1)}%</span>
                        <div class="w-16 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                            <div class="h-full ${margen > 25 ? 'bg-emerald-500' : 'bg-red-500'}" style="width: ${Math.min(margen, 100)}%"></div>
                        </div>
                    </div>
                </td>
                <td class="p-8">
                    <span class="text-[9px] orbitron font-black uppercase px-4 py-1 rounded-full ${esBaja ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}">
                        ${esBaja ? 'Revisar Pricing' : 'Optimizado'}
                    </span>
                </td>
            </tr>`;
        }).join("");

        // KPI OPERATIVOS
        const ticketPromedio = ordenesData.length > 0 ? totalVenta / ordenesData.length : 0;
        const fugaTotal = totalSugerido > totalVenta ? totalSugerido - totalVenta : 0;

        document.getElementById("opStats").innerHTML = `
            ${renderStatBox("Ticket Promedio", ticketPromedio, "fa-tags")}
            ${renderStatBox("Fuga Operativa (Sub-cobro)", fugaTotal, "fa-faucet-drip", "text-red-500")}
            ${renderStatBox("Misiones Auditadas", ordenesData.length, "fa-clipboard-check")}
        `;

        document.getElementById("iaTacticalMsg").innerHTML = `
            He detectado que el <span class="text-white font-bold">${((misionesBajaRentabilidad/ordenesData.length)*100).toFixed(0)}%</span> de tus servicios están por debajo del precio sugerido IA. 
            Esto genera una fuga de <span class="text-red-500 font-bold">$${fugaTotal.toLocaleString()}</span>. 
            <b>Acción:</b> Ajusta los tabuladores de mano de obra en el módulo de Ajustes para nivelar el P&G.`;
    };

    const renderStatBox = (title, val, icon, color = "text-white") => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 shadow-xl hover:border-white/10 transition-all">
            <div class="flex items-center gap-3 mb-4">
                <i class="fas ${icon} text-[10px] text-slate-500"></i>
                <p class="orbitron text-[8px] text-slate-500 uppercase tracking-widest">${title}</p>
            </div>
            <p class="text-3xl font-black orbitron tracking-tighter ${color}">${typeof val === 'number' ? '$ ' + val.toLocaleString() : val}</p>
        </div>`;

    function exportarExcel() {
        const wsData = ordenesData.map(o => ({
            Placa: o.placa,
            Venta_Total: o.costos_totales?.total_general || 0,
            Repuestos: o.costos_totales?.costo_repuestos || 0,
            Mano_Obra: o.costos_totales?.mano_obra || 0,
            Rentabilidad: "Auditada por Nexus-X"
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit_Operativo");
        XLSX.writeFile(wb, "Reporte_Operaciones_PRO360.xlsx");
    }

    renderLayout();
}
