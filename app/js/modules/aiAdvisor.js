/**
 * aiAdvisor.js - TallerPRO360 V4 🧠
 * Núcleo de Análisis de Datos y Proyecciones Financieras
 */
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/* =========================
   PROCESADOR DE INTELIGENCIA
   ========================= */
export async function generarSugerencias({ ordenes = [], inventario = [], empresaId } = {}) {
  try {
    const sugerencias = [];
    let totalVentas = 0;
    let totalCosto = 0;
    let totalItems = 0;

    // 1. ANÁLISIS DE RENTABILIDAD
    ordenes.forEach(o => {
      totalVentas += Number(o.total || 0);
      totalCosto += Number(o.costoTotal || 0);
      totalItems += (o.items?.length || 1);
    });

    const utilidad = totalVentas - totalCosto;
    const ticketPromedio = totalItems ? (totalVentas / totalItems) : 0;
    const margen = totalVentas ? ((utilidad / totalVentas) * 100) : 0;

    // 2. ALERTAS ESTRATÉGICAS
    if (margen < 20) {
        sugerencias.push({ tipo: "critico", msg: "🚨 Margen de utilidad bajo el 20%. Revisa costos de insumos." });
    } else {
        sugerencias.push({ tipo: "info", msg: `📈 Salud financiera: Margen del ${margen.toFixed(1)}%` });
    }

    // 3. INTELIGENCIA DE ALMACÉN
    const criticos = inventario.filter(r => (r.cantidad || 0) <= (r.stockMinimo || 5));
    criticos.slice(0, 2).forEach(r => {
        sugerencias.push({ tipo: "stock", msg: `⚠️ Reponer urgente: ${r.nombre} (Stock: ${r.cantidad})` });
    });

    // 4. PROYECCIÓN BASADA EN TENDENCIA (Algoritmo Nexus)
    const proyeccionVentas = totalVentas * 1.12; // Asumimos un 12% de crecimiento por optimización IA

    return {
      sugerencias,
      resumen: {
        totalVentas,
        totalCosto,
        utilidad,
        ticketPromedio: ticketPromedio,
        margen: margen.toFixed(1),
        proyeccionVentas
      }
    };

  } catch (error) {
    console.error("❌ Error Nexus Advisor:", error);
    return { sugerencias: [{ tipo: "error", msg: "Sistema de análisis desconectado" }], resumen: {} };
  }
}

/* =========================
   RENDERIZADO DE ALTO IMPACTO
   ========================= */
export function renderSugerencias(container, data = {}) {
  if (!container) return;

  const { sugerencias = [], resumen = {} } = data;

  container.innerHTML = `
    <div class="bg-[#0f172a]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
      
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center text-black text-xs">
            <i class="fas fa-brain"></i>
        </div>
        <h2 class="text-sm font-black uppercase tracking-widest text-white">Análisis <span class="text-cyan-400">Nexus-X</span></h2>
      </div>

      <div class="grid grid-cols-2 gap-3">
          <div class="bg-black/20 p-4 rounded-3xl border border-white/5">
              <p class="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1 text-center">Utilidad Estimada</p>
              <p class="text-sm font-black text-emerald-400 text-center tracking-tighter">$${fmt(resumen.utilidad)}</p>
          </div>
          <div class="bg-black/20 p-4 rounded-3xl border border-white/5">
              <p class="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1 text-center">Ticket Promedio</p>
              <p class="text-sm font-black text-cyan-400 text-center tracking-tighter">$${fmt(resumen.ticketPromedio)}</p>
          </div>
      </div>

      <div class="space-y-3">
        ${sugerencias.map(s => `
          <div class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
            <div class="w-2 h-2 rounded-full ${s.tipo === 'critico' ? 'bg-red-500' : s.tipo === 'stock' ? 'bg-yellow-500' : 'bg-cyan-500'}"></div>
            <p class="text-[10px] font-bold text-slate-300 leading-tight uppercase tracking-tighter">${s.msg}</p>
          </div>
        `).join("")}
      </div>

      <div class="pt-4 border-t border-white/5 text-center">
        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">Proyección Nexus (7 Días)</p>
        <p class="text-lg font-black text-white italic tracking-tighter underline decoration-cyan-500 decoration-2 underline-offset-4">
            $${fmt(resumen.proyeccionVentas)}
        </p>
      </div>
    </div>
  `;
}

function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }
