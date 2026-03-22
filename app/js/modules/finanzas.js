/**
 * finanzas_elite.js - TallerPRO360 NEXUS-X V6 💹
 * Enfoque: Rentabilidad Real, Fuga de Capital y Punto de Equilibrio.
 */
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  
  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
      
      <div class="flex justify-between items-end mb-8">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter leading-none">CASH <span class="text-cyan-400">FLOW</span></h1>
            <p class="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em] mt-1">Auditoría en Tiempo Real</p>
        </div>
        <div class="text-right">
            <span id="statusIA" class="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest">IA Optimizando...</span>
        </div>
      </div>

      <div class="bg-gradient-to-br from-slate-900 to-[#0f172a] p-8 rounded-[3rem] border border-white/5 shadow-2xl mb-6 relative overflow-hidden">
         <div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full"></div>
         
         <div class="flex justify-between items-start mb-6">
            <div>
                <h4 class="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Utilidad Bruta Proyectada</h4>
                <div id="txtProyeccion" class="text-5xl font-black tracking-tighter text-white animate-pulse">$ ---.---</div>
            </div>
            <div class="bg-emerald-500/20 p-2 rounded-2xl border border-emerald-500/30">
                <i class="fas fa-chart-line text-emerald-400 text-xs"></i>
            </div>
         </div>

         <div class="space-y-3">
            <div class="flex justify-between items-end">
                <span class="text-[8px] font-black text-slate-500 uppercase">Punto de Equilibrio (Meta)</span>
                <span id="txtMeta" class="text-[10px] font-black text-white">$ 12'000.000</span>
            </div>
            <div class="h-4 bg-black/40 rounded-full p-1 border border-white/5">
                <div id="barProgreso" class="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000 relative" style="width: 0%">
                    <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
                </div>
            </div>
            <div class="flex justify-between text-[7px] font-black text-cyan-500/50 uppercase tracking-widest">
                <span>0%</span>
                <span>50%</span>
                <span class="text-white">100% EFICIENCIA</span>
            </div>
         </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-slate-900/80 p-5 rounded-[2.5rem] border border-white/5">
            <i class="fas fa-clock text-amber-500 text-xs mb-2"></i>
            <span class="text-[8px] text-slate-500 font-black uppercase block">Dinero en Rampa</span>
            <div id="kpiAbierto" class="text-lg font-black text-white">$0</div>
            <p class="text-[7px] text-slate-600 mt-1 uppercase">Órdenes sin Facturar</p>
        </div>
        <div class="bg-slate-900/80 p-5 rounded-[2.5rem] border border-white/5">
            <i class="fas fa-exclamation-triangle text-red-500 text-xs mb-2"></i>
            <span class="text-[8px] text-slate-500 font-black uppercase block">Fuga de Capital</span>
            <div id="kpiFuga" class="text-lg font-black text-red-400">$0</div>
            <p class="text-[7px] text-slate-600 mt-1 uppercase">Cots. No Aprobadas</p>
        </div>
      </div>

      <div id="boxRecomendacion" class="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-[2.5rem] flex items-start gap-4 mb-32">
        <div class="w-10 h-10 bg-cyan-500 rounded-2xl flex-shrink-0 flex items-center justify-center text-black">
            <i class="fas fa-lightbulb"></i>
        </div>
        <div>
            <h5 class="text-[10px] font-black uppercase text-cyan-400 mb-1">Nexus-X Advisor</h5>
            <p id="txtConsejo" class="text-[11px] text-slate-300 leading-relaxed font-medium">Analizando comportamiento de ventas para generar estrategia...</p>
        </div>
      </div>

    </div>
  `;

  async function syncFinance() {
    try {
        const snap = await getDocs(collection(db, `empresas/${empresaId}/ordenes`));
        const ordenes = snap.docs.map(d => d.data());

        // LÓGICA DE CÁLCULO ÉLITE
        const facturado = ordenes.filter(o => o.estado === "LISTO" || o.estado === "ENTREGADO").reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const enTaller = ordenes.filter(o => o.estado === "RECIBIDO" || o.estado === "TALLER").reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const fugado = ordenes.filter(o => o.estado === "CANCELADO").reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        
        const meta = 15000000; // Ejemplo Meta Mes: 15 Millones
        const porcentaje = Math.min(100, (facturado / meta) * 100);

        // ACTUALIZACIÓN DE UI
        document.getElementById("txtProyeccion").innerText = `$${fmt(facturado)}`;
        document.getElementById("kpiIngresos")?.innerText = `$${fmt(facturado)}`; // Por si tienes el ID en otro lado
        document.getElementById("kpiAbierto").innerText = `$${fmt(enTaller)}`;
        document.getElementById("kpiFuga").innerText = `$${fmt(fugado)}`;
        
        setTimeout(() => {
            document.getElementById("barProgreso").style.width = `${porcentaje}%`;
        }, 500);

        // MOTOR DE CONSEJOS IA
        const consejo = getSmartAdvice(facturado, enTaller, fugado);
        document.getElementById("txtConsejo").innerText = consejo;

    } catch (e) {
        console.error("Finance Error:", e);
    }
  }

  function getSmartAdvice(f, t, fug) {
      if (fug > (f * 0.3)) return "Atención: Estás perdiendo el 30% de las ventas en cotización. Revisa tus precios o el tiempo de respuesta.";
      if (t > f) return "Tienes más dinero atrapado en rampa que facturado. Agiliza las entregas para mejorar la liquidez.";
      return "Tendencia positiva. Recomendamos ofrecer un preventivo a los clientes de hace 3 meses para mantener flujo.";
  }

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v); }

  syncFinance();
}
