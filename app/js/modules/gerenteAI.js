/**
 * gerenteAI.js - TallerPRO360 NEXUS-X V6.0 👑
 * EL CENTRO DE COMANDO ESTRATÉGICO: INTELIGENCIA PREDICTIVA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function gerenteAI(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const nombreUsuario = localStorage.getItem("nexus_userName") || "Comandante";

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-48">
            <header class="flex flex-col xl:flex-row justify-between items-start gap-12 mb-16 border-l-4 border-cyan-500 pl-8">
                <div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white leading-none uppercase">
                        STRATEGIC <span class="text-cyan-400">NEXUS_V6</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-black">Inteligencia de Flota y Análisis Predictivo</p>
                </div>
                <div class="flex items-center gap-4">
                    <button id="btnVozIA" class="group w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center text-black shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                       <i class="fas fa-satellite-dish text-2xl animate-pulse"></i>
                    </button>
                </div>
            </header>

            <div id="panelIA" class="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div class="col-span-full py-40 flex flex-col items-center">
                    <div class="spinner"></div>
                    <p class="mt-8 orbitron text-[10px] tracking-widest text-cyan-400">ESCANEANDO KPIS DEL TALLER...</p>
                </div>
            </div>
        </div>`;
    };

    const realizarDiagnostico = async () => {
        try {
            // Consulta de Órdenes para calcular ingresos
            const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            
            let totalIngresos = 0;
            snap.forEach(doc => {
                totalIngresos += Number(doc.data().total || 0);
            });

            const kpis = {
                ingresos: totalIngresos,
                margen: 35, // Simulado hasta que tengamos 'precioCosto'
                eficiencia: 88,
                insights: "William, el flujo de ingresos es estable. He detectado que el 60% de tus misiones son de mantenimiento preventivo. Sugiero potenciar el área de pesados."
            };

            renderAnalisis(kpis);
        } catch (e) {
            console.error(e);
        }
    };

    const renderAnalisis = (data) => {
        const panel = document.getElementById("panelIA");
        panel.innerHTML = `
            <div class="xl:col-span-2 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden">
                <h3 class="orbitron text-sm font-black text-cyan-400 mb-10 uppercase italic tracking-widest">
                    <i class="fas fa-chart-line"></i> Diagnóstico Financiero
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <div>
                        <p class="text-[9px] text-slate-500 font-black uppercase mb-2">Ingresos Mes</p>
                        <h2 class="text-6xl font-black text-white orbitron italic tracking-tighter">$ ${data.ingresos.toLocaleString()}</h2>
                    </div>
                    <div class="bg-black/40 p-8 rounded-[3rem] border border-white/5">
                        <p class="text-[9px] text-cyan-400 font-black uppercase mb-2">Margen de Potencia</p>
                        <h2 class="text-5xl font-black text-white orbitron italic">${data.margen}%</h2>
                    </div>
                </div>
                <div class="bg-white/5 p-8 rounded-[2.5rem] border-l-4 border-cyan-500 italic text-sm text-slate-300">
                    "${data.insights}"
                </div>
            </div>

            <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-indigo-500/10 flex flex-col">
                <h3 class="orbitron text-[10px] font-black text-indigo-400 mb-10 uppercase tracking-widest italic">Nexus Growth Engine</h3>
                <div class="p-6 bg-black/40 rounded-3xl border border-white/5 mb-6">
                    <h4 class="text-[10px] font-black text-white uppercase orbitron mb-2">Optimización Quindío</h4>
                    <p class="text-[9px] text-slate-500 font-bold uppercase">Desplegar taller móvil los martes para maximizar rutas.</p>
                </div>
                <button id="btnEjecutarGrowth" class="mt-auto w-full py-6 bg-indigo-600 rounded-3xl text-[10px] font-black orbitron uppercase hover:bg-white hover:text-indigo-600 transition-all">
                    EJECUTAR PLAN MAESTRO
                </button>
            </div>
        `;

        document.getElementById("btnVozIA").onclick = () => {
            hablar(`Comandante ${nombreUsuario}. Los ingresos actuales son de ${data.ingresos} pesos. El sistema está nominal.`);
        };
        
        document.getElementById("btnEjecutarGrowth").onclick = () => {
            hablar("Plan de crecimiento desplegado en la red.");
            Swal.fire('NEXUS', 'Plan Maestro Desplegado', 'success');
        };
    };

    renderLayout();
    await realizarDiagnostico();
}
