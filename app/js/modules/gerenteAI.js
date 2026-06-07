/**
 * gerenteAI.js - TallerPRO360 NEXUS-X V6.0 👑
 * EL CENTRO DE COMANDO ESTRATÉGICO: INTELIGENCIA PREDICTIVA REAL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function gerenteAI(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const nombreUsuario = localStorage.getItem("nexus_userName") || "Comandante";

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-700 pb-48">
            <header class="flex flex-col xl:flex-row justify-between items-start gap-12 mb-16 border-l-4 border-cyan-500 pl-8">
                <div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white leading-none uppercase">
                        STRATEGIC <span class="text-cyan-400">NEXUS_V6</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] orbitron font-black text-cyan-400 uppercase">Estado: Consciencia Activa</span>
                        <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase italic font-black">Analizando Telemetría de ${empresaId}</p>
                    </div>
                </div>
                <button id="btnVozIA" class="group w-24 h-24 bg-white rounded-[2rem] flex flex-col items-center justify-center text-black shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:bg-cyan-500 hover:text-white transition-all">
                    <i class="fas fa-brain text-2xl mb-2"></i>
                    <span class="text-[8px] font-black orbitron uppercase">Briefing</span>
                </button>
            </header>

            <div id="panelIA" class="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div class="col-span-full py-40 flex flex-col items-center">
                    <div class="spinner-nexus"></div>
                    <p class="mt-8 orbitron text-[10px] tracking-[1em] text-cyan-400 animate-pulse uppercase">Extrayendo Datos de la Bóveda...</p>
                </div>
            </div>
        </div>`;
    };

    const realizarDiagnostico = async () => {
        try {
            // 1. DATA MINING REAL
            const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
            const qContable = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
            const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
            
            const [snapOrdenes, snapContable, snapInv] = await Promise.all([
                getDocs(qOrdenes), getDocs(qContable), getDocs(qInv)
            ]);

            // 2. ANALÍTICA DE PRECISIÓN
            let ingresosMes = 0, gastosMes = 0;
            let otActivas = 0, otTerminadas = 0;
            let valorInventario = 0;
            let serviciosMasRentables = {};

            // Procesar Contabilidad Real
            snapContable.forEach(doc => {
                const m = doc.data();
                const v = Number(m.monto || 0);
                const esIng = [NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT, 'ingreso'].includes(m.tipo);
                if (esIng) ingresosMes += v; else gastosMes += v;
            });

            // Procesar Órdenes para Eficiencia
            snapOrdenes.forEach(doc => {
                const ot = doc.data();
                if (['FINALIZADA', 'ENTREGADO'].includes(ot.estado)) otTerminadas++;
                else otActivas++;
                
                // Mapear servicios populares
                const serv = ot.servicio || "General";
                serviciosMasRentables[serv] = (serviciosMasRentables[serv] || 0) + 1;
            });

            // Procesar Inventario (Capital Atrapado)
            snapInv.forEach(doc => {
                const item = doc.data();
                valorInventario += (Number(item.cantidad || 0) * Number(item.precioCosto || 0));
            });

            // 3. MOTOR DE INFERENCIA (Lógica de Decisión)
            const utilidad = ingresosMes - gastosMes;
            const saludFinanciera = ingresosMes > 0 ? (utilidad / ingresosMes) * 100 : 0;
            const eficienciaRampa = (otTerminadas / (otActivas + otTerminadas || 1)) * 100;

            const analisis = {
                actual: ingresosMes,
                utilidad: utilidad,
                salud: saludFinanciera.toFixed(1),
                eficiencia: eficienciaRampa.toFixed(1),
                puntosCriticos: [
                    { t: "Margen Operativo", v: `${saludFinanciera.toFixed(1)}%`, desc: utilidad > 0 ? "Flujo de caja saludable." : "Alerta de insolvencia operativa." },
                    { t: "Capital en Bodega", v: `$${valorInventario.toLocaleString()}`, desc: "Valor total de repuestos en stock." }
                ],
                planMaestro: generarPlanMaestro(utilidad, eficienciaRampa, valorInventario)
            };

            renderAnalisis(analisis);
        } catch (e) { console.error("Error en Diagnóstico Forense:", e); }
    };

    const generarPlanMaestro = (utilidad, eficiencia, inventario) => {
        const plan = [];
        if (utilidad <= 0) plan.push({ fase: "URGENTE", accion: "Recortar gastos operativos no críticos y revisar costos de insumos." });
        if (eficiencia < 60) plan.push({ fase: "OPERACIONES", accion: "Cuello de botella detectado en rampa. Optimizar tiempos de entrega." });
        if (inventario > utilidad) plan.push({ fase: "ESTRATEGIA", accion: "Exceso de stock. Priorizar uso de repuestos propios en próximas OT." });
        
        // Plan por defecto si todo va bien
        if (plan.length === 0) plan.push({ fase: "CRECIMIENTO", accion: "Invertir excedente en Taller Móvil y marketing localizado." });
        
        return plan.length >= 3 ? plan : [...plan, { fase: "NEXUS-X", accion: "Mantener monitoreo de KPIs en tiempo real." }];
    };

    const renderAnalisis = (data) => {
        const panel = document.getElementById("panelIA");
        panel.innerHTML = `
            <div class="xl:col-span-8 space-y-10">
                <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                    <div class="absolute -right-10 -top-10 text-cyan-500/5 text-9xl orbitron font-black italic">DATA</div>
                    <h3 class="orbitron text-xs font-black text-cyan-400 mb-12 uppercase tracking-widest italic flex items-center gap-3">
                        <span class="w-2 h-2 bg-cyan-500 animate-ping rounded-full"></span> Auditoría de Bóveda & Salud Fiscal
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div>
                            <p class="text-[9px] text-slate-500 font-black uppercase mb-4 tracking-widest">Ingresos Reales Detectados</p>
                            <h2 class="text-7xl font-black text-white orbitron italic tracking-tighter">$ ${data.actual.toLocaleString()}</h2>
                        </div>
                        <div class="relative border-l border-white/10 pl-12">
                            <p class="text-[9px] text-amber-400 font-black uppercase mb-4 tracking-widest">Utilidad Neta (Libre)</p>
                            <h2 class="text-6xl font-black ${data.utilidad >= 0 ? 'text-emerald-500' : 'text-red-500'} orbitron italic tracking-tighter opacity-80">$ ${data.utilidad.toLocaleString()}</h2>
                            <span class="absolute right-0 top-0 text-[10px] bg-white/5 text-white px-3 py-1 rounded-full font-black uppercase">${data.salud}% MARGEN</span>
                        </div>
                    </div>
                </div>

                <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5">
                    <h3 class="orbitron text-xs font-black text-white mb-10 uppercase tracking-widest italic">Acciones Recomendadas por IA</h3>
                    <div class="space-y-6">
                        ${data.planMaestro.map((step, i) => `
                            <div class="flex items-center gap-8 p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all">
                                <div class="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center orbitron text-xs font-black text-cyan-500 border border-cyan-500/20">${i+1}</div>
                                <div>
                                    <p class="text-[8px] font-black text-slate-500 uppercase mb-1">${step.fase}</p>
                                    <p class="text-sm font-bold text-slate-200 uppercase tracking-tight">${step.accion}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="xl:col-span-4 space-y-10">
                <div class="bg-gradient-to-br from-cyan-600 to-blue-700 p-10 rounded-[4rem] text-white relative overflow-hidden group shadow-2xl">
                    <i class="fas fa-microchip absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12 group-hover:scale-125 transition-transform"></i>
                    <h4 class="orbitron text-[10px] font-black mb-8 uppercase tracking-widest">Eficiencia de Rampa</h4>
                    <p class="text-5xl font-black orbitron mb-4">${data.eficiencia}%</p>
                    <p class="text-[10px] font-black italic leading-tight uppercase opacity-80">"Comandante ${nombreUsuario}, el rendimiento del equipo técnico está en niveles ${Number(data.eficiencia) > 70 ? 'ÓPTIMOS' : 'CRÍTICOS'}."</p>
                </div>

                <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5">
                    <h4 class="orbitron text-[10px] font-black text-slate-500 mb-8 uppercase tracking-widest italic">Diagnóstico de Activos</h4>
                    ${data.puntosCriticos.map(p => `
                        <div class="mb-6 p-6 bg-black/40 rounded-3xl border border-white/5">
                            <p class="text-[8px] font-black text-cyan-400 uppercase mb-1">${p.t}</p>
                            <p class="text-2xl font-black orbitron mb-2">${p.v}</p>
                            <p class="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">${p.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById("btnVozIA").onclick = () => {
            const mensaje = `Comandante ${nombreUsuario}. Reporte de telemetría listo. Tenemos una utilidad neta de ${data.utilidad} pesos con un margen de salud del ${data.salud} por ciento. La eficiencia en rampa es del ${data.eficiencia} por ciento. He actualizado el plan maestro con tres acciones inmediatas.`;
            hablar(mensaje);
        };
    };

    renderLayout();
    await realizarDiagnostico();
}
