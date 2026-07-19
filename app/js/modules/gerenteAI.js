/**
 * 👑 gerenteAI.js - TallerPRO360 NEXUS-X QUANTUM-BI EDITION
 * RE-DISEÑO: DE DASHBOARD A SISTEMA DE TOMA DE DECISIONES
 */

import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function gerenteAI(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");

    // UI Rediseñada para ser más limpia y enfocada a datos críticos
    container.innerHTML = `
    <div class="p-6 bg-[#05070a] min-h-screen text-slate-200">
        <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
            <div>
                <h1 class="text-2xl font-black text-white orbitron">CENTRO DE MANDO BI</h1>
                <p class="text-[10px] text-cyan-500 uppercase tracking-widest font-bold">Inteligencia de Negocio / Diagnóstico Forense</p>
            </div>
            <button id="btnRefresh" class="bg-cyan-600 px-6 py-2 rounded-lg text-[10px] font-black orbitron text-black">
                <i class="fas fa-sync mr-2"></i> ACTUALIZAR MATRIZ
            </button>
        </div>

        <!-- KPI CRÍTICOS -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            ${[
                {id: 'ingresos', title: 'Ingresos', color: 'text-green-400'},
                {id: 'costos', title: 'Costos PUC', color: 'text-red-400'},
                {id: 'utilidad', title: 'Utilidad Real', color: 'text-cyan-400'},
                {id: 'eficiencia', title: 'Eficiencia %', color: 'text-indigo-400'}
            ].map(k => `
                <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5">
                    <div class="text-[9px] text-slate-500 font-bold uppercase">${k.title}</div>
                    <div id="kpi-${k.id}" class="text-xl font-black ${k.color}">$0</div>
                </div>
            `).join('')}
        </div>

        <!-- MATRIZ DE RENTABILIDAD POR UNIDAD -->
        <div class="bg-[#0d1117] rounded-xl p-6 border border-white/5">
            <h3 class="text-xs font-black text-white mb-4 uppercase">Matriz de Rentabilidad (Placas en Patio)</h3>
            <div id="matrizUnidades" class="space-y-2">
                <div class="text-slate-600 italic text-sm">Escaneando transacciones contables...</div>
            </div>
        </div>
    </div>`;

    const procesarDatosBI = async () => {
        // 1. Fetch unificado
        const snapConta = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        
        let report = { ingresos: 0, costos: 0, unidades: {} };

        snapConta.forEach(d => {
            const row = d.data();
            const monto = Number(row.monto || row.debito || row.credito || 0);
            const placa = row.placa || "N/A";
            
            if (!report.unidades[placa]) report.unidades[placa] = { ing: 0, cost: 0 };

            if (row.puc?.startsWith("4")) {
                report.ingresos += monto;
                report.unidades[placa].ing: += monto;
            } else if (row.puc?.startsWith("6") || row.puc?.startsWith("5")) {
                report.costos += monto;
                report.unidades[placa].cost += monto;
            }
        });

        // 2. Renderizado de la Matriz (Decisión Gerencial)
        const contenedor = document.getElementById("matrizUnidades");
        contenedor.innerHTML = "";
        
        Object.keys(report.unidades).forEach(p => {
            const u = report.unidades[p];
            const utilidad = u.ing - u.cost;
            const barWidth = u.ing > 0 ? (u.cost / u.ing) * 100 : 0;

            contenedor.innerHTML += `
            <div class="flex items-center gap-4 p-3 hover:bg-white/5 rounded transition-all">
                <div class="w-20 font-black text-xs text-cyan-500">${p}</div>
                <div class="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full ${utilidad < 0 ? 'bg-red-500' : 'bg-green-500'}" style="width: ${Math.min(barWidth, 100)}%"></div>
                </div>
                <div class="w-32 text-right font-black text-xs ${utilidad < 0 ? 'text-red-400' : 'text-green-400'}">
                    $${Math.round(utilidad).toLocaleString()}
                </div>
            </div>`;
        });

        // 3. Actualizar KPIs superiores
        document.getElementById("kpi-ingresos").innerText = `$${Math.round(report.ingresos).toLocaleString()}`;
        document.getElementById("kpi-costos").innerText = `$${Math.round(report.costos).toLocaleString()}`;
        document.getElementById("kpi-utilidad").innerText = `$${Math.round(report.ingresos - report.costos).toLocaleString()}`;
    };

    document.getElementById("btnRefresh").onclick = procesarDatosBI;
    procesarDatosBI();
}
