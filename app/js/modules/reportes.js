/**
 * 🌌 NEXUS-X REPORTES V26.9 - FINAL STABLE
 * REPARA: LINK PROTOCOL BROKEN
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// Importaciones de IA alineadas a las rutas del servidor
import { calcularPrecioInteligente } from "../ai/pricingOptimizerAI.js";
import repairEstimator from "../ai/repairEstimator.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("empresaId");
    
    // Interfaz base para evitar pantalla negra
    container.innerHTML = `
        <div class="p-8 bg-[#010409] min-h-screen text-white">
            <h1 class="orbitron text-3xl font-black text-cyan-400 mb-8 italic">AUDIT CENTER <span class="text-white">V26.9</span></h1>
            <div id="statusAI" class="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-3xl mb-10">
                <p class="text-[10px] orbitron animate-pulse">🛰️ ESCANEANDO PROTOCOLOS NEXUS-X STARLINK...</p>
            </div>
            <div id="gridAnalisis" class="grid gap-6"></div>
        </div>`;

    try {
        // Enlace directo a la colección de órdenes en Firestore
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        const misiones = snap.docs.map(d => ({ ...d.data(), id: d.id }));

        const grid = document.getElementById("gridAnalisis");
        const status = document.getElementById("statusAI");

        if (misiones.length === 0) {
            status.innerHTML = "<p class='text-amber-500 orbitron text-xs'>⚠️ NO SE DETECTAN MISIONES EN ESTA ÓRBITA.</p>";
            return;
        }

        grid.innerHTML = misiones.map(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
            
            // Integración con PricingOptimizerAI
            const analisis = calcularPrecioInteligente({
                costoRepuestos: repuestos,
                horasTrabajo: o.horas_reales || 1,
                tipoCliente: o.cliente_tipo || "normal"
            });

            return `
            <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5 hover:border-cyan-500/50 transition-all">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="orbitron text-2xl font-black italic text-white">${o.placa || 'PRO-360'}</h2>
                    <span class="text-[9px] px-4 py-1 bg-cyan-500 text-black rounded-full font-bold orbitron">RENTABILIDAD: ${venta >= analisis.total ? 'ÓPTIMA' : 'BAJA'}</span>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <p class="text-[8px] text-slate-500 orbitron mb-1">FACTURADO</p>
                        <p class="text-sm font-bold">$ ${venta.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-[8px] text-slate-500 orbitron mb-1">SUGERIDO IA</p>
                        <p class="text-sm font-bold text-cyan-400">$ ${analisis.total.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-[8px] text-slate-500 orbitron mb-1">CLIENTE</p>
                        <p class="text-[10px] uppercase font-medium text-slate-300">${o.cliente || 'Anon'}</p>
                    </div>
                </div>
            </div>`;
        }).join("");

        status.innerHTML = `<p class="text-emerald-400 orbitron text-[10px]">✅ PROTOCOLO SINCRONIZADO: ${misiones.length} MISIONES AUDITADAS.</p>`;

    } catch (err) {
        status.innerHTML = `<p class="text-red-500 orbitron text-xs font-bold">❌ FALLO DE COMUNICACIÓN: ${err.message}</p>`;
        console.error("Critical System Failure:", err);
    }
}
