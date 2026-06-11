/**
 * 🏛️ finanzas_elite.js - NEXUS-X TERMINATOR CORE V23.6.2
 * Calibrado para mapeos dinámicos en app/js/core/
 */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Decisión: Importaciones relativas ajustadas al mismo directorio core
import { db } from "../core/firebase-config.js";

export default async function finanzasElite(container) {
    container.innerHTML = `<div class="p-10 text-center orbitron text-xs text-slate-400 animate-pulse">CARGANDO MATRICES FINANZAS ELITE...</div>`;

    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR DE IDENTIDAD EN RAMPAS FINANCIERAS</div>`;
        return;
    }

    let balancePUC = { ingresos_mo: 0, ingresos_rep: 0, ingresos_ant: 0, costos_rep: 0, costos_nomina: 0, gastos_fijos: 0, gastos_diver: 0, cartera_rampa: 0, stock_bodega: 0 };

    const safeNumber = (v) => {
        if (!v) return 0;
        let n = Number(String(v).replace(/[\$\s\.]/g, '').replace(',', '.'));
        return isNaN(n) ? 0 : n;
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-white font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-center mb-8 border-b border-white/10 pb-6 gap-4">
                <div>
                    <h1 class="orbitron text-4xl font-black uppercase">FINANZAS <span class="text-cyan-400">ELITE</span></h1>
                    <p class="text-[8px] text-slate-500 font-mono tracking-widest mt-1">HANA Engine Integration V2</p>
                </div>
                <div class="flex gap-2 items-center bg-[#0d1117] p-3 rounded-xl border border-white/5">
                    <input type="date" id="fInicio" class="bg-black text-white text-xs p-1 rounded border border-white/10">
                    <input type="date" id="fFin" class="bg-black text-white text-xs p-1 rounded border border-white/10">
                    <button id="btnProcesarSincro" class="px-3 py-1 bg-cyan-600 text-black text-[10px] font-bold rounded">CALCULAR</button>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5">
                    <span class="text-[8px] uppercase block text-slate-400">EBITDA CONSOLIDADO</span>
                    <h2 id="txtUtilidad" class="text-xl font-bold orbitron text-white">$ 0</h2>
                </div>
                <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5">
                    <span class="text-[8px] uppercase block text-slate-400">INGRESOS BRUTOS</span>
                    <h2 id="kpi-ingreso" class="text-xl font-bold text-emerald-400">$ 0</h2>
                </div>
                <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5">
                    <span class="text-[8px] uppercase block text-slate-400">EGRESOS TOTALES</span>
                    <h2 id="kpi-gasto" class="text-xl font-bold text-red-400">$ 0</h2>
                </div>
                <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5">
                    <span class="text-[8px] uppercase block text-slate-400">RAMPA DE TRABAJO (1305)</span>
                    <h2 id="kpi-rampa" class="text-xl font-bold text-cyan-400">$ 0</h2>
                </div>
            </div>

            <div class="bg-[#0d1117] p-6 rounded-xl border border-white/5">
                <h3 class="text-xs font-bold uppercase mb-4 text-slate-200">Personal en Rampa / Comisiones</h3>
                <div id="gridNomina" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
            </div>
        </div>`;

        const hoy = new Date();
        document.getElementById("fInicio").value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        document.getElementById("fFin").value = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
        
        document.getElementById("btnProcesarSincro").onclick = sincronizarNucleo;
    };

    const sincronizarNucleo = async () => {
        const strInicio = document.getElementById("fInicio").value;
        const strFin = document.getElementById("fFin").value;

        Object.keys(balancePUC).forEach(k => balancePUC[k] = 0);

        if (window.NEXUS_ACCOUNTING_CONSOLIDATED) {
            Object.entries(window.NEXUS_ACCOUNTING_CONSOLIDATED).forEach(([per, data]) => {
                if (per >= strInicio.substring(0,7) && per <= strFin.substring(0,7)) {
                    Object.entries(data.cuentas).forEach(([puc, val]) => {
                        if (puc.startsWith("413505")) balancePUC.ingresos_mo += val;
                        else if (puc.startsWith("413510")) balancePUC.ingresos_rep += val;
                        else if (puc.startsWith("6135")) balancePUC.costos_rep += val;
                        else if (puc.startsWith("5105")) balancePUC.costos_nomina += val;
                        else if (puc.startsWith("5120")) balancePUC.gastos_fijos += val;
                        else balancePUC.gastos_diver += val;
                    });
                }
            });
        }

        try {
            const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
            const snapOrd = await getDocs(qOrd);
            const nominaMap = {};

            snapOrd.docs.forEach(d => {
                const o = d.data();
                const total = safeNumber(o.total || 0);
                const est = String(o.estado || "").toUpperCase();

                if (['INGRESO', 'PROCESO', 'REPARACION'].includes(est)) balancePUC.cartera_rampa += total;

                if (['LISTO', 'ENTREGADO'].includes(est)) {
                    const tec = o.tecnico_asignado || "PLANTA";
                    if (!nominaMap[tec]) nominaMap[tec] = { total: 0, count: 0 };
                    nominaMap[tec].total += (total * 0.3);
                    nominaMap[tec].count++;
                }
            });

            renderNomina(nominaMap);
            updateUI();
        } catch (err) {
            console.error("Falla rampa:", err);
        }
    };

    const updateUI = () => {
        const ing = balancePUC.ingresos_mo + balancePUC.ingresos_rep;
        const eg = balancePUC.costos_rep + balancePUC.costos_nomina + balancePUC.gastos_fijos + balancePUC.gastos_diver;
        const net = ing - eg;

        document.getElementById("kpi-ingreso").innerText = `$ ${Math.round(ing).toLocaleString('es-CO')}`;
        document.getElementById("kpi-gasto").innerText = `$ ${Math.round(eg).toLocaleString('es-CO')}`;
        document.getElementById("kpi-rampa").innerText = `$ ${Math.round(balancePUC.cartera_rampa).toLocaleString('es-CO')}`;
        
        const txtU = document.getElementById("txtUtilidad");
        if (txtU) {
            txtU.innerText = `$ ${Math.round(net).toLocaleString('es-CO')}`;
            txtU.className = "text-xl font-bold orbitron " + (net >= 0 ? "text-emerald-400" : "text-red-500");
        }
    };

    const renderNomina = (mapa) => {
        const grid = document.getElementById("gridNomina");
        if (!grid) return;
        grid.innerHTML = Object.entries(mapa).map(([t, val]) => `
            <div class="bg-black/40 p-3 rounded border border-white/5 flex justify-between">
                <div><span class="text-xs font-bold uppercase block">${t}</span><span class="text-xs text-emerald-400 font-mono">$ ${Math.round(val.total).toLocaleString('es-CO')}</span></div>
                <span class="text-[10px] text-slate-500 font-mono">${val.count} OS</span>
            </div>`).join('');
    };

    renderLayout();
    await sincronizarNucleo();
}
