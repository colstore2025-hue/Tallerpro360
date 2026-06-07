/**
• 🦾 NEXUS-X STRATEGIC COMMAND V6.1 - GERENTE AI
• FUSIÓN: AUDITORÍA DE BÓVEDA + MOTOR DE DECISIÓN QUANTUM
• Objetivo: Transformar telemetría real en misiones tácticas.
• Director: William Jeffry Urquijo Cubillos & Gemini AI
*/
import {
collection, query, where, getDocs, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function gerenteAI(container) {
const empresaId = localStorage.getItem("nexus_empresaId");
const nombreUsuario = localStorage.getItem("nexus_userName") || "Comandante";

const renderLayout = () => {
container.innerHTML = `
<div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-1000 pb-48 selection:bg-cyan-500">

<header class="flex flex-col xl:flex-row justify-between items-start gap-12 mb-16 border-l-4 border-cyan-500 pl-8 relative">
<div class="absolute -top-10 -left-10 text-[120px] font-black opacity-5 italic select-none orbitron uppercase">NEXUS</div>
<div class="relative z-10">
<h1 class="orbitron text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
STRATEGIC <span class="text-cyan-400">COMMAND</span>
</h1>
<div class="flex items-center gap-4 mt-4">
<span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] orbitron font-black text-cyan-400 uppercase animate-pulse">Consciencia Activa</span>
<p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase italic font-black">Telemetría de Bóveda: $`{empresaId}</p>
</div>
</div>
<button id="btnVozIA" class="group w-28 h-28 bg-white rounded-[2.5rem] flex flex-col items-center justify-center text-black shadow-[0_0_50px_rgba(255,255,255,0.05)] hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-105 active:scale-95">
<i class="fas fa-brain text-3xl mb-2 group-hover:animate-bounce"></i>
<span class="text-[8px] font-black orbitron uppercase tracking-widest">Briefing</span>
</button>
</header>

<div id="panelIA" class="grid grid-cols-1 xl:grid-cols-12 gap-10">
<div class="col-span-full py-40 flex flex-col items-center">
<div class="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
<p class="mt-8 orbitron text-[10px] tracking-[1em] text-cyan-400 animate-pulse uppercase">Extrayendo Datos de la Bóveda...</p>
</div>
</div>
</div>`;
};

const realizarDiagnostico = async () => {
try {
// 1. DATA MINING DE BÓVEDA
const [snapOrdenes, snapContable, snapInv] = await Promise.all([
getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
getDocs(query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId))),
getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)))
 ]);

// 2. ANALÍTICA DE PRECISIÓN
let ingresos = 0, gastos = 0, rampa = 0, invValor = 0;
let otTerminadas = 0, otActivas = 0;

snapContable.forEach(doc => {
const m = doc.data();
const v = Number(m.monto || 0);
if (['ingreso_ot', 'ingreso'].includes(m.tipo)) ingresos += v; else gastos += v;
});

snapOrdenes.forEach(doc => {
const ot = doc.data();
const total = Number(ot.costos_totales?.total || 0);
if (['LISTO', 'ENTREGADO', 'FINALIZADA'].includes(ot.estado)) otTerminadas++;
else { otActivas++; rampa += total; }
});

snapInv.forEach(doc => {
const it = doc.data();
invValor += (Number(it.cantidad || 0) * Number(it.precioCosto || 0));
});

const utilidad = ingresos - gastos;
const burnRateDiario = gastos / 30;
const salud = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;
const eficiencia = (otTerminadas / (otActivas + otTerminadas || 1)) * 100;

// 3. MOTOR DE INFERENCIA: GENERACIÓN DE MISIONES
const misiones = [];
if (rampa > utilidad) {
misiones.push({
id: "caja-rapida", nivel: "CRÍTICO", icon: "fa-bolt-lightning",
t: "Operación 'Caja Rápida'",
d: Tienes${rampa.toLocaleString()} atrapados en rampa. Liquidar 2 OT hoy incrementará la utilidad en un  {invValor.toLocaleString()}) supera tu utilidad neta. Pausa compras y prioriza repuestos internos.`
});
}
if (eficiencia < 70) {
misiones.push({
id: "rampa-cuello", nivel: "OPERACIONES", icon: "fa-microchip",
t: "Cuello de Botella Detectado",
d: "La rampa se está moviendo lento. Revisa el rendimiento de técnicos con más de 3 órdenes pendientes."
});
}
if (misiones.length === 0) {
misiones.push({
id: "crecimiento", nivel: "EXPANSIÓN", icon: "fa-rocket",
t: "Crecimiento Exponencial",
d: "Ecosistema saludable. Es el momento de invertir en pauta digital o expansión de servicios."
});
}

renderPanel({ ingresos, utilidad, salud, eficiencia, misiones, burnRateDiario, invValor });

} catch (e) { console.error("Error en Nexus Command:", e); }
};

const renderPanel = (data) => {
const panel = document.getElementById("panelIA");
panel.innerHTML = `
<div class="xl:col-span-8 space-y-10">

<div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden group shadow-2xl">
<div class="absolute -right-10 -top-10 text-cyan-500/5 text-9xl orbitron font-black italic">DATA</div>
<h3 class="orbitron text-[10px] font-black text-cyan-400 mb-12 uppercase tracking-[0.3em] italic flex items-center gap-3">
<span class="w-2 h-2 bg-cyan-500 animate-ping rounded-full"></span> Auditoría de Bóveda & Salud Fiscal
</h3>

<div class="grid grid-cols-1 md:grid-cols-2 gap-16">
<div>
<p class="text-[9px] text-slate-500 font-black uppercase mb-4 tracking-widest italic">Recaudo Bruto Detectado</p>
<h2 class="text-7xl font-black text-white orbitron italic tracking-tighter leading-none"> {data.utilidad >= 0 ? 'text-emerald-500' : 'text-red-500'} orbitron italic tracking-tighter opacity-80"> {data.salud.toFixed(1)}% MARGEN</span>
</div>
</div>
</div>

<div class="space-y-6">
<h3 class="orbitron text-[11px] font-black text-white/50 uppercase tracking-[0.4em] italic mb-8">Misiones de Comando Gerencial</h3>
latex
{data.misiones.map(m =&gt; ` &lt;div class="bg-[#0d1117] border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:border-cyan-500/30 transition-all relative overflow-hidden shadow-xl"&gt; &lt;div class="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110"&gt; &lt;i class="fas 

{m.icon}  {m.nivel === 'CRÍTICO' ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-400'} orbitron">
 {m.t}</h4>
<p class="text-slate-400 text-sm mt-1 italic font-medium">${m.d}&lt;/p&gt; &lt;/div&gt; &lt;button class="px-8 py-4 bg-white text-black text-[10px] font-black rounded-2xl hover:bg-cyan-500 hover:text-white transition-all uppercase orbitron"&gt;Ejecutar&lt;/button&gt; &lt;/div&gt;).join('')}
</div>
</div>

<div class="xl:col-span-4 space-y-10">
<div class="bg-gradient-to-br from-cyan-600 to-blue-900 p-10 rounded-[4rem] text-white relative overflow-hidden group shadow-2xl">
<i class="fas fa-microchip absolute -right-4 -bottom-4 text-9xl opacity-10 rotate-12 group-hover:scale-125 transition-transform"></i>
<h4 class="orbitron text-[10px] font-black mb-8 uppercase tracking-widest opacity-70 italic">Eficiencia de Rampa</h4>
<p class="text-6xl font-black orbitron mb-4 italic tracking-tighter">${data.eficiencia.toFixed(1)}%&lt;/p&gt; &lt;div class="h-1.5 w-full bg-black/20 rounded-full overflow-hidden mb-6"&gt; &lt;div class="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="width: ${data.eficiencia}%"></div>
</div>
<p class="text-[10px] font-bold italic leading-tight uppercase opacity-90">
"Comandante ${nombreUsuario}, el rendimiento del equipo técnico está en niveles ${data.eficiencia > 75 ? 'ÓPTIMOS' : 'PARA REVISIÓN'}."
</p>
</div>

<div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 space-y-6">
<h4 class="orbitron text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest italic">Activos Inmovilizados</h4>

<div class="p-6 bg-black/40 rounded-3xl border border-white/5">
<p class="text-[9px] font-black text-cyan-400 uppercase mb-2">Capital en Bodega</p>
<p class="text-3xl font-black orbitron italic text-white">`${data.invValor.toLocaleString()}</p>
<p class="text-[8px] text-slate-600 uppercase mt-2 font-bold italic">Valoración total de repuestos</p>
</div>

<div class="p-6 bg-black/40 rounded-3xl border border-white/5">
<p class="text-[9px] font-black text-red-400 uppercase mb-2">Burn Rate Diario</p>
<p class="text-3xl font-black orbitron italic text-white">${Math.round(data.burnRateDiario).toLocaleString()}&lt;/p&gt; &lt;p class="text-[8px] text-slate-600 uppercase mt-2 font-bold italic"&gt;Costo de existir (gastos/30)&lt;/p&gt; &lt;/div&gt; &lt;/div&gt; &lt;/div&gt;;

// VOZ IA BRIEFING
document.getElementById("btnVozIA").onclick = () => {
const msn = Comandante${nombreUsuario}. Reporte táctico listo. La utilidad neta es de  {data.salud.toFixed(0)} por ciento. He detectado ${data.misiones.length} misiones críticas para optimizar la caja. ¿Iniciamos la ejecución?`;
hablar(msn);
};
};

renderLayout();
await realizarDiagnostico();
}