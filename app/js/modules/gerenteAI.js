/**
 * 👑 gerenteAI.js - TallerPRO360 NEXUS-X QUANTUM-BI EDITION
 * MOTOR DE ANALÍTICA PRESCRIPTIVA Y TOMA DE DECISIONES
 * @version 8.0
 */

import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function gerenteAI(container) {
    if (!container) return;

    const empresaId = localStorage.getItem("nexus_empresaId") || "";
    
    // 1. ESTRUCTURA DE LA UI (DISEÑO ORIENTADO A DECISIÓN)
    const renderLayout = () => {
        container.innerHTML = `
        <div class="bg-[#05070a] text-white p-6 min-h-screen font-sans">
            <header class="flex justify-between items-end mb-6">
                <div>
                    <h1 class="text-2xl font-black text-cyan-400">COMMAND CENTER BI</h1>
                    <p class="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Inteligencia Prescriptiva TallerPRO360</p>
                </div>
                <button id="btnRefreshAI" class="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-2 rounded-lg font-black text-[10px] transition-all">
                    EJECUTAR DIAGNÓSTICO
                </button>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- PANEL DE ACCIÓN (PRESCRIPTIVO) -->
                <div class="lg:col-span-1 bg-[#0d1117] p-6 rounded-2xl border border-white/5">
                    <h2 class="text-sm font-bold text-white mb-4">🚀 ACCIONES RECOMENDADAS</h2>
                    <div id="panelAcciones" class="space-y-3">
                        <p class="text-slate-500 text-xs italic">Inicie el diagnóstico para generar insights...</p>
                    </div>
                </div>

                <!-- PANEL DE KPIs -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20">
                            <span class="text-[9px] text-indigo-400 block uppercase">Margen Neto</span>
                            <h2 id="kpi-margen" class="text-2xl font-black">$0</h2>
                        </div>
                        <div class="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20">
                            <span class="text-[9px] text-emerald-400 block uppercase">Eficiencia</span>
                            <h2 id="kpi-eficiencia" class="text-2xl font-black">0%</h2>
                        </div>
                        <div class="bg-rose-950/20 p-4 rounded-xl border border-rose-500/20">
                            <span class="text-[9px] text-rose-400 block uppercase">Riesgo Financiero</span>
                            <h2 id="kpi-riesgo" class="text-2xl font-black">Bajo</h2>
                        </div>
                    </div>
                    
                    <!-- TABLA DE RENDIMIENTO POR UNIDAD -->
                    <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5">
                        <h2 class="text-sm font-bold text-white mb-4">📊 RENTABILIDAD POR PLACA</h2>
                        <div id="tablaRentabilidad" class="overflow-x-auto">
                            <table class="w-full text-xs text-left">
                                <thead class="text-slate-500 border-b border-white/5 uppercase">
                                    <tr><th class="pb-2">Placa</th><th class="pb-2">Ingreso</th><th class="pb-2">Gasto</th><th class="pb-2">Utilidad</th></tr>
                                </thead>
                                <tbody id="bodyRentabilidad"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    };

    // 2. MOTOR DE ANÁLISIS (EL "CEREBRO" DE LA IA)
    const ejecutarAnalisis = async () => {
        const btn = document.getElementById("btnRefreshAI");
        btn.innerText = "PROCESANDO...";
        
        try {
            const snapConta = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
            let data = { totalIng: 0, totalGast: 0, unidades: {} };

            snapConta.forEach(d => {
                const r = d.data();
                const monto = Number(r.monto || 0);
                const placa = r.placa || "N/A";
                
                if (!data.unidades[placa]) data.unidades[placa] = { ing: 0, gast: 0 };
                
                if (String(r.tipo).toLowerCase().includes("ingreso")) {
                    data.totalIng += monto;
                    data.unidades[placa].ing += monto;
                } else {
                    data.totalGast += monto;
                    data.unidades[placa].gast += monto;
                }
            });

            renderizarResultados(data);
        } catch (e) {
            console.error("Error BI:", e);
        } finally {
            btn.innerText = "EJECUTAR DIAGNÓSTICO";
        }
    };

    // 3. LÓGICA DE DECISIÓN (IA PRESCRIPTIVA)
    const renderizarResultados = (data) => {
        const tbody = document.getElementById("bodyRentabilidad");
        const panelAcciones = document.getElementById("panelAcciones");
        let acciones = [];
        tbody.innerHTML = "";

        Object.entries(data.unidades).forEach(([placa, stats]) => {
            const utilidad = stats.ing - stats.gast;
            const margen = stats.ing > 0 ? (utilidad / stats.ing) * 100 : 0;

            // Lógica de detección de anomalías
            if (stats.gast > stats.ing) acciones.push(`⚠️ Unidad ${placa} en pérdida: Revisar costos.`);
            if (stats.ing === 0 && stats.gast > 500000) acciones.push(`🚨 Alerta: ${placa} genera gastos sin facturación.`);

            tbody.innerHTML += `
                <tr class="border-b border-white/5 hover:bg-white/5">
                    <td class="py-3 font-bold text-cyan-400">${placa}</td>
                    <td>$${stats.ing.toLocaleString()}</td>
                    <td>$${stats.gast.toLocaleString()}</td>
                    <td class="${utilidad < 0 ? 'text-red-400' : 'text-green-400'} font-bold">$${utilidad.toLocaleString()}</td>
                </tr>`;
        });

        // Actualizar KPIs
        document.getElementById("kpi-margen").innerText = `$${(data.totalIng - data.totalGast).toLocaleString()}`;
        document.getElementById("kpi-eficiencia").innerText = `${data.totalIng > 0 ? Math.round((1 - (data.totalGast/data.totalIng)) * 100) : 0}%`;
        document.getElementById("kpi-riesgo").innerText = data.totalGast > (data.totalIng * 0.8) ? "ALTO" : "ÓPTIMO";

        // Renderizar Acciones
        panelAcciones.innerHTML = acciones.length > 0 
            ? acciones.map(a => `<div class="p-3 bg-red-950/30 border-l-2 border-red-500 text-red-200 text-xs font-mono rounded">${a}</div>`).join('')
            : `<div class="text-green-500 text-xs font-mono">✅ Operaciones bajo control. No se detectan anomalías.</div>`;
    };

    renderLayout();
    document.getElementById("btnRefreshAI").onclick = ejecutarAnalisis;
    ejecutarAnalisis();
}
