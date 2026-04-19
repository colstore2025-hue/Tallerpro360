/**
 * 🌌 NEXUS-X AERO-LOGISTICS - AUDIT CENTER V23.0
 * 🧠 INTELIGENCIA FINANCIERA TOTAL (ORDENES + CONTABILIDAD)
 * 🏗️ SYSTEM: BUSINESS INTELLIGENCE PROTOCOL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// Motores de exportación integrados...
if (!window.XLSX) { const s = document.createElement('script'); s.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js"; document.head.appendChild(s); }
if (!window.jspdf) { const s2 = document.createElement('script'); s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; document.head.appendChild(s2); const s3 = document.createElement('script'); s3.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"; document.head.appendChild(s3); }

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    const nombreEmpresa = localStorage.getItem("nexus_nombreEmpresa") || "MI TALLER";
    
    let datosOrdenes = [];
    let datosContables = [];
    let vistaActual = 'BALANCE_GRAL'; // BALANCE_GRAL, P_G, STAFF, HISTORIAL

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-700 pb-40">
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        AUDIT <span class="text-cyan-400">CENTER</span>
                    </h1>
                    <select id="selectVista" class="mt-6 bg-[#0d1117] border border-white/10 p-4 rounded-2xl orbitron text-[10px] font-black uppercase text-cyan-400 focus:outline-none hover:border-cyan-500 transition-all">
                        <option value="BALANCE_GRAL">📊 Balance General (Caja vs CxC)</option>
                        <option value="P_G">💰 Estado de P&G (Ingresos vs Gastos)</option>
                        <option value="STAFF">👥 Productividad Operativa</option>
                        <option value="HISTORIAL">🚗 Historial de Misiones</option>
                    </select>
                </div>

                <div class="flex flex-wrap gap-4 p-4 bg-[#0d1117]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <input type="date" id="fI" class="bg-transparent border-none text-[11px] text-white orbitron font-black uppercase">
                    <span class="text-slate-700 font-black">>></span>
                    <input type="date" id="fF" class="bg-transparent border-none text-[11px] text-white orbitron font-black uppercase">
                    <button id="btnExport" class="px-8 h-12 bg-white text-black rounded-2xl orbitron text-[10px] font-black hover:bg-cyan-400 transition-all uppercase">
                        Exportar_Data
                    </button>
                </div>
            </header>

            <div id="kpiContainer" class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"></div>

            <div id="reportContent" class="bg-[#0d1117]/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 overflow-x-auto shadow-2xl">
                <table class="w-full text-left border-collapse" id="tableReport">
                    <thead id="headReporte"></thead>
                    <tbody id="bodyReportes" class="divide-y divide-white/5 font-bold text-xs"></tbody>
                </table>
            </div>
        </div>`;

        document.getElementById("selectVista").onchange = (e) => { vistaActual = e.target.value; procesarYRenderizar(); };
        document.getElementById("fI").onchange = procesarYRenderizar;
        document.getElementById("fF").onchange = procesarYRenderizar;
        document.getElementById("btnExport").onclick = ejecutarExportacion;

        initData();
    };

    const initData = async () => {
        try {
            // CARGA PARALELA: ORDENES + CONTABILIDAD
            const [snapO, snapC] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)))
            ]);
            
            datosOrdenes = snapO.docs.map(d => ({ ...d.data(), id: d.id }));
            datosContables = snapC.docs.map(d => ({ ...d.data(), id: d.id }));
            
            procesarYRenderizar();
        } catch (e) { console.error("Error Carga Nexus-X:", e); }
    };

    const procesarYRenderizar = () => {
        const fI = document.getElementById("fI").value;
        const fF = document.getElementById("fF").value;

        const filtrar = (arr) => arr.filter(item => {
            const fecha = item.creadoEn?.toDate ? item.creadoEn.toDate() : null;
            if (!fecha) return true;
            let ok = true;
            if (fI) ok = ok && fecha >= new Date(fI + "T00:00:00");
            if (fF) ok = ok && fecha <= new Date(fF + "T23:59:59");
            return ok;
        });

        actualizarUI(filtrar(datosOrdenes), filtrar(datosContables));
    };

    const actualizarUI = (ordenes, contabilidad) => {
        const h = document.getElementById("headReporte");
        const b = document.getElementById("bodyReportes");
        const k = document.getElementById("kpiContainer");

        // --- CÁLCULOS FINANCIEROS (P&G) ---
        const ingresosOT = ordenes.reduce((acc, o) => acc + (Number(o.costos_totales?.total_general || 0)), 0);
        const gastos = contabilidad.filter(c => c.tipo === 'gasto_operativo').reduce((acc, g) => acc + (Number(g.monto || 0)), 0);
        const recaudado = ordenes.reduce((acc, o) => acc + (Number(o.finanzas?.anticipo_cliente || 0)), 0);
        const cxc = ordenes.reduce((acc, o) => acc + (Number(o.costos_totales?.saldo_pendiente || 0)), 0);

        // KPIs
        k.innerHTML = `
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-cyan-500">
                <p class="orbitron text-[8px] text-slate-500 uppercase">Venta Bruta (OTs)</p>
                <h3 class="orbitron text-2xl font-black">$ ${ingresosOT.toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-red-500">
                <p class="orbitron text-[8px] text-slate-500 uppercase">Gastos Operativos</p>
                <h3 class="orbitron text-2xl font-black">$ ${gastos.toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-emerald-500">
                <p class="orbitron text-[8px] text-slate-500 uppercase">Utilidad Estimada</p>
                <h3 class="orbitron text-2xl font-black text-emerald-400">$ ${(ingresosOT - gastos).toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-orange-500">
                <p class="orbitron text-[8px] text-slate-500 uppercase">Cuentas por Cobrar</p>
                <h3 class="orbitron text-2xl font-black text-orange-400">$ ${cxc.toLocaleString()}</h3>
            </div>`;

        // TABLAS SEGÚN VISTA
        if (vistaActual === 'P_G') {
            h.innerHTML = `<tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase"><th class="p-8">Concepto</th><th class="p-8">Tipo</th><th class="p-8 text-right">Monto</th></tr>`;
            b.innerHTML = contabilidad.map(c => `
                <tr class="hover:bg-white/5">
                    <td class="p-8 uppercase text-slate-300 font-black">${c.concepto}</td>
                    <td class="p-8"><span class="px-3 py-1 rounded-full text-[8px] orbitron ${c.tipo === 'gasto_operativo' ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-400'}">${c.tipo}</span></td>
                    <td class="p-8 text-right font-black">$ ${Number(c.monto).toLocaleString()}</td>
                </tr>`).join("");
        } else {
            h.innerHTML = `<tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase"><th class="p-8">Fecha</th><th class="p-8">Activo</th><th class="p-8">Cliente</th><th class="p-8 text-right">Total OT</th></tr>`;
            b.innerHTML = ordenes.map(o => `
                <tr class="hover:bg-cyan-500/5">
                    <td class="p-8 text-slate-500">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : '---'}</td>
                    <td class="p-8 orbitron text-white uppercase">${o.placa}</td>
                    <td class="p-8 text-slate-400 uppercase font-black">${o.cliente}</td>
                    <td class="p-8 text-right text-cyan-400 font-black">$ ${(o.costos_totales?.total_general || 0).toLocaleString()}</td>
                </tr>`).join("");
        }
    };

    const ejecutarExportacion = () => {
        const table = document.getElementById("tableReport");
        const wb = XLSX.utils.table_to_book(table, { sheet: "NEXUS_AUDIT" });
        XLSX.writeFile(wb, `Reporte_NexusX_${nombreEmpresa}_${vistaActual}.xlsx`);
    };

    renderLayout();
}
