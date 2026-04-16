/**
 * 🚀 FINANZAS ELITE V21.0 - NEXUS-X AI CORE
 * Sistema Autónomo Financiero + Decisiones Inteligentes
 */

import { 
    collection, query, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";

// 🧠 IA CORE
import {
    runFinancialAnalysis
} from "../ai/financialPredictorAI.js";

import { optimizePricing } from "../ai/pricingOptimizerAI.js";
import { prioritizeJobs } from "../ai/smartSchedulerAI.js";

export default async function finanzasElite(container) {

    const empresaId = localStorage.getItem("nexus_empresaId");
    const activeListeners = [];

    let reporteData = { 
        cajaReal: 0, 
        enRampa: 0, 
        fugado: 0, 
        stockValor: 0,
        ordenesActivas: [],
        ingresos: 0,
        egresos: 0
    };

    // =====================================================
    // 🎨 UI BASE
    // =====================================================

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white">

            <h1 class="orbitron text-4xl font-black mb-10">
                FINANZAS <span class="text-cyan-400">ELITE AI</span>
            </h1>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div class="card"><p>Score</p><h2 id="kpiScore">0</h2></div>
                <div class="card"><p>Predicción</p><h2 id="kpiPrediccion">$0</h2></div>
                <div class="card"><p>Riesgo</p><h2 id="kpiRiesgo">-</h2></div>
                <div class="card"><p>Estado</p><h2 id="kpiEstado">-</h2></div>
            </div>

            <div id="boxAI" class="p-6 bg-[#0d1117] rounded-xl border border-cyan-500 mb-8"></div>

            <div id="accionesAI" class="grid md:grid-cols-2 gap-4"></div>

        </div>
        `;

        sincronizarNucleo();
    };

    // =====================================================
    // 🔄 DATA ENGINE
    // =====================================================

    function sincronizarNucleo() {

        activeListeners.forEach(unsub => unsub());

        const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const qCont = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
        const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));

        // 💰 CONTABILIDAD
        activeListeners.push(onSnapshot(qCont, snap => {
            let ingresos = 0;
            let egresos = 0;

            snap.forEach(doc => {
                const m = doc.data();
                if (m.tipo === "ingreso") ingresos += m.monto;
                else egresos += m.monto;
            });

            reporteData.ingresos = ingresos;
            reporteData.egresos = egresos;
            reporteData.cajaReal = ingresos - egresos;

            actualizarIA();
        }));

        // 📦 INVENTARIO
        activeListeners.push(onSnapshot(qInv, snap => {
            let total = 0;
            snap.forEach(doc => {
                const i = doc.data();
                total += (i.precioVenta || 0) * (i.cantidad || 0);
            });

            reporteData.stockValor = total;
            actualizarIA();
        }));

        // 🔧 ORDENES
        activeListeners.push(onSnapshot(qOrdenes, snap => {

            const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            reporteData.ordenesActivas = ordenes;

            reporteData.enRampa = ordenes
                .filter(o => o.estado !== "ENTREGADO")
                .reduce((acc, o) => acc + (o.total || 0), 0);

            reporteData.fugado = ordenes
                .filter(o => o.estado === "CANCELADO")
                .reduce((acc, o) => acc + (o.total || 0), 0);

            actualizarIA();
        }));
    }

    // =====================================================
    // 🧠 MOTOR CENTRAL (AQUÍ ESTÁ EL SALTO)
    // =====================================================

    function actualizarIA() {

        if (!reporteData.ordenesActivas.length) return;

        const analysis = runFinancialAnalysis({
            ordenes: reporteData.ordenesActivas,
            inventario: [{ valor: reporteData.stockValor }],
            ordenesProceso: reporteData.ordenesActivas,
            ingresos: reporteData.ingresos,
            egresos: reporteData.egresos,
            caja: reporteData.cajaReal
        });

        renderAI(analysis);
    }

    // =====================================================
    // 🤖 RENDER IA + DECISIONES
    // =====================================================

    function renderAI(analysis) {

        // KPIs
        document.getElementById("kpiScore").innerText = analysis.score;
        document.getElementById("kpiPrediccion").innerText = `$${analysis.revenuePrediction.toLocaleString()}`;
        document.getElementById("kpiRiesgo").innerText = analysis.riesgo.nivel;
        document.getElementById("kpiEstado").innerText = analysis.estado;

        // MENSAJE CENTRAL
        document.getElementById("boxAI").innerHTML = `
            <h3 class="text-cyan-400 font-bold mb-2">NEXUS AI DECISION CORE</h3>
            <p>${analysis.riesgo.mensaje}</p>
        `;

        // 🎯 DECISIONES CEO AI
        const acciones = analysis.decisiones.map(d => `
            <div class="p-4 bg-black/40 rounded-xl border border-white/10">
                <p class="text-xs text-cyan-400">${d.prioridad}</p>
                <p>${d.accion}</p>
            </div>
        `).join("");

        document.getElementById("accionesAI").innerHTML = acciones;

        // =====================================================
        // ⚡ AUTOMATIZACIÓN REAL (NIVEL 200%)
        // =====================================================

        autoOptimizarPrecios();
        autoPriorizarOrdenes();
    }

    // =====================================================
    // 💸 AUTOMATIZAR PRECIOS
    // =====================================================

    function autoOptimizarPrecios() {
        optimizePricing(reporteData.ordenesActivas);
    }

    // =====================================================
    // 🔧 PRIORIZAR TRABAJOS RENTABLES
    // =====================================================

    function autoPriorizarOrdenes() {
        const ordenesOptimizadas = prioritizeJobs(reporteData.ordenesActivas);

        console.log("🔧 Ordenes priorizadas:", ordenesOptimizadas);
    }

    // =====================================================
    // 🚀 INIT
    // =====================================================

    renderLayout();
}