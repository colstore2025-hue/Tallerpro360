/**
 * reportes.js - TallerPRO360 NEXUS-X V18.0 📄
 * NÚCLEO DE INTELIGENCIA DE NEGOCIOS (BI)
 * Sistema de Auditoría Circular Integrado
 */
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportesModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenesRaw = [];
    let contabilidadRaw = [];
    let vehiculosRaw = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        NEXUS <span class="text-cyan-400">BI</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Business Intelligence & Operative Audit</p>
                </div>

                <div class="flex flex-wrap gap-4 p-4 bg-[#0d1117] rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div class="flex items-center gap-3 px-6 border-r border-white/5">
                        <input type="date" id="fechaInicio" class="bg-transparent border-none text-[11px] text-white orbitron font-black focus:outline-none">
                        <span class="text-slate-700 font-black">>></span>
                        <input type="date" id="fechaFin" class="bg-transparent border-none text-[11px] text-white orbitron font-black focus:outline-none">
                    </div>
                    <div class="flex gap-2">
                        <button id="btnRefresh" class="w-12 h-12 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-400 border border-white/5 transition-all">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button id="btnExportExcel" class="px-6 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all orbitron text-[10px] font-black uppercase tracking-widest">
                            <i class="fas fa-file-excel mr-2"></i> Exportar
                        </button>
                    </div>
                </div>
            </header>

            <div class="flex flex-wrap gap-4 mb-12">
                <button class="report-tab active px-8 py-4 rounded-2xl orbitron text-[10px] font-black border border-white/10 transition-all uppercase tracking-widest" data-type="OPERATIVO">
                    <i class="fas fa-tools mr-2"></i> Operaciones
                </button>
                <button class="report-tab px-8 py-4 rounded-2xl orbitron text-[10px] font-black border border-white/10 transition-all uppercase tracking-widest" data-type="FINANCIERO">
                    <i class="fas fa-chart-pie mr-2"></i> P&G / Balances
                </button>
                <button class="report-tab px-8 py-4 rounded-2xl orbitron text-[10px] font-black border border-white/10 transition-all uppercase tracking-widest" data-type="PRODUCTIVIDAD">
                    <i class="fas fa-user-clock mr-2"></i> Staff / KPIs
                </button>
                <button class="report-tab px-8 py-4 rounded-2xl orbitron text-[10px] font-black border border-white/10 transition-all uppercase tracking-widest" data-type="HISTORIAL">
                    <i class="fas fa-history mr-2"></i> Mantenimientos
                </button>
            </div>

            <div id="kpiContainer" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"></div>

            <div id="reportContent" class="bg-[#0d1117] rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl min-h-[400px]">
                <div class="p-20 text-center opacity-30 animate-pulse">
                    <i class="fas fa-satellite text-6xl mb-6"></i>
                    <p class="orbitron text-xs">Sincronizando con satélites Nexus...</p>
                </div>
            </div>
        </div>`;

        vincularEventos();
        inicializarData();
    };

    const vincularEventos = () => {
        document.querySelectorAll(".report-tab").forEach(tab => {
            tab.onclick = (e) => {
                document.querySelectorAll(".report-tab").forEach(t => t.classList.remove("active", "bg-cyan-500", "text-black"));
                tab.classList.add("active", "bg-cyan-500", "text-black");
                procesarReporte(tab.dataset.type);
            };
        });

        document.getElementById("fechaInicio").onchange = () => procesarReporte(document.querySelector(".report-tab.active").dataset.type);
        document.getElementById("fechaFin").onchange = () => procesarReporte(document.querySelector(".report-tab.active").dataset.type);
        document.getElementById("btnRefresh").onclick = inicializarData;
    };

    const inicializarData = async () => {
        try {
            // Carga Triple (Circular)
            const [snapOrd, snapCont, snapVeh] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "vehiculos"), where("empresaId", "==", empresaId)))
            ]);

            ordenesRaw = snapOrd.docs.map(d => ({ id: d.id, ...d.data() }));
            contabilidadRaw = snapCont.docs.map(d => ({ id: d.id, ...d.data() }));
            vehiculosRaw = snapVeh.docs.map(d => ({ id: d.id, ...d.data() }));

            procesarReporte("OPERATIVO"); // Default
        } catch (e) {
            console.error("DATA_ERR:", e);
        }
    };

    const procesarReporte = (tipo) => {
        const fI = document.getElementById("fechaInicio").value;
        const fF = document.getElementById("fechaFin").value;

        // Filtrado por fecha base
        const filtrarPorFecha = (arr) => arr.filter(item => {
            if (!fI || !fF) return true;
            const fecha = item.updatedAt?.toDate() || item.creadoEn?.toDate() || new Date();
            return fecha >= new Date(fI + "T00:00:00") && fecha <= new Date(fF + "T23:59:59");
        });

        const ordenes = filtrarPorFecha(ordenesRaw);
        const contabilidad = filtrarPorFecha(contabilidadRaw);

        switch (tipo) {
            case "OPERATIVO": renderOperativo(ordenes); break;
            case "FINANCIERO": renderFinanciero(contabilidad, ordenes); break;
            case "PRODUCTIVIDAD": renderProductividad(ordenes); break;
            case "HISTORIAL": renderHistorial(vehiculosRaw, ordenes); break;
        }
    };

    // --- RENDERIZADORES ESPECÍFICOS ---

    const renderOperativo = (data) => {
        const kpi = document.getElementById("kpiContainer");
        const totalVenta = data.reduce((acc, o) => acc + (o.costos_totales?.total_general || 0), 0);
        
        kpi.innerHTML = `
            ${kpiCard("Misiones", data.length, "fa-tasks", "cyan")}
            ${kpiCard("Venta Bruta", `$${totalVenta.toLocaleString()}`, "fa-wallet", "emerald")}
            ${kpiCard("Pendientes", data.filter(o => o.estado !== 'LISTO').length, "fa-clock", "orange")}
            ${kpiCard("Ticket Prom.", `$${Math.round(totalVenta / (data.length || 1)).toLocaleString()}`, "fa-receipt", "indigo")}
        `;

        document.getElementById("reportContent").innerHTML = `
            <table class="w-full text-left">
                <thead class="bg-white/5 orbitron text-[9px] text-slate-500 uppercase">
                    <tr><th class="p-8">OT ID</th><th>Unidad</th><th>Cliente</th><th>Total</th><th>Status</th></tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    ${data.map(o => `
                        <tr class="hover:bg-white/[0.02]">
                            <td class="p-8 orbitron text-[10px]">#${o.id.slice(-6)}</td>
                            <td class="font-black">${o.placa}</td>
                            <td class="text-xs text-slate-400">${o.cliente}</td>
                            <td class="orbitron text-cyan-400">$${(o.costos_totales?.total_general || 0).toLocaleString()}</td>
                            <td><span class="text-[8px] border border-white/10 px-3 py-1 rounded-full">${o.estado}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    };

    const renderFinanciero = (contabilidad, ordenes) => {
        const ingresos = contabilidad.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
        // Supongamos que los gastos son registros de contabilidad con tipo "EGRESO"
        const egresos = contabilidad.filter(c => c.tipo === "EGRESO").reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
        const utilidad = ingresos - egresos;

        const kpi = document.getElementById("kpiContainer");
        kpi.innerHTML = `
            ${kpiCard("Ingresos Reales", `$${ingresos.toLocaleString()}`, "fa-cash-register", "emerald")}
            ${kpiCard("Egresos/Compras", `$${egresos.toLocaleString()}`, "fa-shopping-cart", "red")}
            ${kpiCard("Utilidad Neta", `$${utilidad.toLocaleString()}`, "fa-balance-scale", "cyan")}
            ${kpiCard("Margen Bruto", `${Math.round((utilidad / (ingresos || 1)) * 100)}%`, "fa-percent", "orange")}
        `;

        document.getElementById("reportContent").innerHTML = `
            <div class="p-12">
                <h3 class="orbitron text-xl mb-8 italic">Balance de Caja (P&G Simplificado)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div class="bg-black/40 p-10 rounded-[2rem] border border-emerald-500/20">
                        <p class="orbitron text-xs text-emerald-500 mb-4">INGRESOS DETALLADOS</p>
                        ${contabilidad.filter(c => c.monto > 0).slice(0, 5).map(c => `
                            <div class="flex justify-between py-2 border-b border-white/5 text-[10px]">
                                <span>${c.concepto || 'Ingreso OT'}</span>
                                <span class="font-black text-emerald-400">+$${Number(c.monto).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="bg-black/40 p-10 rounded-[2rem] border border-red-500/20">
                        <p class="orbitron text-xs text-red-500 mb-4">GASTOS OPERATIVOS</p>
                        <p class="text-[10px] text-slate-500 italic">No se detectan egresos en este periodo.</p>
                    </div>
                </div>
            </div>
        `;
    };

    // --- HELPER UI ---
    const kpiCard = (tit, val, icon, col) => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
            <div class="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><i class="fas ${icon} text-5xl"></i></div>
            <p class="orbitron text-[8px] text-${col}-500 mb-2 font-black uppercase tracking-widest">${tit}</p>
            <h2 class="orbitron text-3xl font-black text-white italic tracking-tighter">${val}</h2>
        </div>
    `;

    renderLayout();
}
