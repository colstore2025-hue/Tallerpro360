/**
 * gerenteAI.js - TallerPRO360 NEXUS-X V6.2 👑
 * EL CENTRO DE COMANDO ESTRATÉGICO: INTELIGENCIA PREDICTIVA Y AUDITORÍA GLOBAL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 * @version 6.2 - Rango de Control Cronológico Local (Tolerante a Dispositivos Móviles)
 */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function gerenteAI(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const nombreUsuario = localStorage.getItem("nexus_userName") || "Comandante";
    
    // Inicialización del Estado Temporal del Filtro Cronológico
    if (!localStorage.getItem("nexus_tmp_f_inicio")) {
        const hoy = new Date();
        const haceUnMes = new Date();
        haceUnMes.setDate(hoy.getDate() - 30);
        localStorage.setItem("nexus_tmp_f_inicio", haceUnMes.toISOString().split('T')[0]);
        localStorage.setItem("nexus_tmp_f_fin", hoy.toISOString().split('T')[0]);
    }

    let fechaInicioIso = localStorage.getItem("nexus_tmp_f_inicio");
    let fechaFinIso = localStorage.getItem("nexus_tmp_f_fin");

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-700 pb-48 selection:bg-cyan-500">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 border-l-4 border-cyan-500 pl-8 relative">
                <div class="absolute -top-10 -left-10 text-[120px] font-black opacity-5 italic select-none orbitron uppercase">NEXUS</div>
                <div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white leading-none uppercase">
                        STRATEGIC <span class="text-cyan-400">COMMAND</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] orbitron font-black text-cyan-400 uppercase">Consciencia Activa V6.2</span>
                        <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase italic font-black">Bóveda Operativa: ${empresaId}</p>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-4 bg-[#0d1117] p-4 rounded-[2rem] border border-white/5 w-full xl:w-auto">
                    <div class="flex items-center gap-2 px-3">
                        <label class="text-[8px] orbitron font-black text-slate-500 uppercase">Desde:</label>
                        <input type="date" id="filtro-fecha-inicio" value="${fechaInicioIso}" class="bg-transparent border-none text-xs font-bold text-cyan-400 font-mono focus:outline-none [color-scheme:dark]">
                    </div>
                    <div class="h-4 w-[1px] bg-white/10 hidden md:block"></div>
                    <div class="flex items-center gap-2 px-3">
                        <label class="text-[8px] orbitron font-black text-slate-500 uppercase">Hasta:</label>
                        <input type="date" id="filtro-fecha-fin" value="${fechaFinIso}" class="bg-transparent border-none text-xs font-bold text-cyan-400 font-mono focus:outline-none [color-scheme:dark]">
                    </div>
                    
                    <button id="btnFiltrarRango" class="px-4 py-2 bg-cyan-500 text-black text-[9px] orbitron font-black uppercase rounded-xl hover:bg-white transition-all">
                        <i class="fas fa-sync mr-1"></i> Sincronizar
                    </button>

                    <button id="btnVozIA" class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black hover:bg-cyan-500 hover:text-white transition-all shadow-lg">
                        <i class="fas fa-brain text-lg"></i>
                    </button>
                </div>
            </header>

            <div id="panelIA" class="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div class="col-span-full py-40 flex flex-col items-center">
                    <div class="spinner-nexus"></div>
                    <p class="mt-8 orbitron text-[10px] tracking-[1em] text-cyan-400 animate-pulse uppercase">Mapeando Matriz Financiera...</p>
                </div>
            </div>
        </div>`;
    };

    const realizarDiagnostico = async () => {
        try {
            fechaInicioIso = document.getElementById("filtro-fecha-inicio").value;
            fechaFinIso = document.getElementById("filtro-fecha-fin").value;
            
            localStorage.setItem("nexus_tmp_f_inicio", fechaInicioIso);
            localStorage.setItem("nexus_tmp_f_fin", fechaFinIso);

            // Consultas Atómicas Optimizadas para Evitar Errores de Índices Compuestos
            const [snapOrdenes, snapContable, snapInv] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)))
            ]);

            let ingresos = 0, gastos = 0, rampaVal = 0, invValor = 0;
            let otTerminadas = 0, otActivas = 0;

            // Pipeline de Filtrado Elástico en Memoria del Cliente (Garantiza Compatibilidad)
            snapContable.forEach(doc => {
                const m = doc.data();
                // Extracción segura del campo temporal (Soporta String e ISO)
                const fechaRegistro = m.creadoEn || m.fecha;
                if (!fechaRegistro) return;
                
                const rawFecha = typeof fechaRegistro === 'string' ? fechaRegistro.split('T')[0] : '';
                
                if (rawFecha >= fechaInicioIso && rawFecha <= fechaFinIso) {
                    const v = Number(m.monto || m.valor || 0);
                    if (['ingreso_ot', 'ingreso', 'INGRESO'].includes(m.tipo)) {
                        ingresos += v;
                    } else {
                        gastos += v;
                    }
                }
            });

            snapOrdenes.forEach(doc => {
                const ot = doc.data();
                const total = Number(ot.total || ot.costos_totales?.total || 0);
                if (['LISTO', 'ENTREGADO', 'FINALIZADA'].includes(ot.estado)) {
                    otTerminadas++;
                } else {
                    otActivas++;
                    rampaVal += total;
                }
            });

            snapInv.forEach(doc => {
                const it = doc.data();
                invValor += (Number(it.cantidad || 0) * Number(it.precioCosto || 0));
            });

            // Procesamiento de Métricas Avanzadas
            const diffTiempo = Math.abs(new Date(fechaFinIso + "T12:00:00") - new Date(fechaInicioIso + "T12:00:00"));
            const diasAnalizados = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24)) || 1;

            const utilidad = ingresos - gastos;
            const burnRateDiario = gastos / diasAnalizados;
            const salud = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;
            const eficiencia = (otTerminadas / (otActivas + otTerminadas || 1)) * 100;

            // Motor de Inferencia de Decisiones Corporativas
            const misiones = [];
            if (rampaVal > 0) {
                misiones.push({
                    nivel: "CRÍTICO", icon: "fa-bolt-lightning",
                    t: "Operación 'Caja Rápida'",
                    d: `Detectamos $${rampaVal.toLocaleString()} en rampa de desarrollo. Agilizar la entrega de estas órdenes inyectará liquidez directa al taller.`
                });
            }
            if (invValor > 2000000) {
                misiones.push({
                    nivel: "ESTRATEGIA", icon: "fa-box-open",
                    t: "Protocolo de Stock Pasivo",
                    d: `Tu inventario actual suma $${invValor.toLocaleString()} en costo. Monitorea la rotación antes de autorizar nuevas compras en bodega.`
                });
            }
            if (eficiencia < 80) {
                misiones.push({
                    nivel: "OPERACIONES", icon: "fa-microchip",
                    t: "Optimización de Flujos",
                    d: `La tasa de evacuación técnica se encuentra en un ${eficiencia.toFixed(1)}%. Reasigna tareas para balancear las bahías.`
                });
            }

            renderPanel({ ingresos, utilidad, salud, eficiencia, misiones, burnRateDiario, invValor, diasAnalizados });

        } catch (e) { 
            console.error("Critical Failure Nexus Gerente AI Core:", e);
            const panel = document.getElementById("panelIA");
            if (panel) {
                panel.innerHTML = `
                    <div class="col-span-full text-center py-20 border border-red-500/20 bg-red-500/5 rounded-[2rem]">
                        <p class="orbitron text-xs text-red-400 tracking-widest uppercase">Fallo de Sincronización Telemetría</p>
                    </div>`;
            }
        }
    };

    const renderPanel = (data) => {
        const panel = document.getElementById("panelIA");
        if (!panel) return;

        panel.innerHTML = `
            <div class="xl:col-span-8 space-y-10">
                <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                    <div class="absolute -right-10 -top-10 text-cyan-500/5 text-9xl orbitron font-black italic">DATA</div>
                    <h3 class="orbitron text-xs font-black text-cyan-400 mb-12 uppercase tracking-widest italic flex items-center gap-3">
                        <span class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span> Auditoría de Bóveda & Salud Fiscal
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div>
                            <p class="text-[9px] text-slate-500 font-black uppercase mb-4 tracking-widest italic">Recaudo Bruto (Periodo)</p>
                            <h2 class="text-6xl font-black text-white orbitron italic tracking-tighter leading-none">$ ${data.ingresos.toLocaleString()}</h2>
                        </div>
                        <div class="relative border-l border-white/10 pl-12">
                            <p class="text-[9px] text-emerald-400 font-black uppercase mb-4 tracking-widest italic">Utilidad Neta Real</p>
                            <h2 class="text-5xl font-black ${data.utilidad >= 0 ? 'text-emerald-500' : 'text-red-500'} orbitron italic tracking-tighter opacity-80">$ ${data.utilidad.toLocaleString()}</h2>
                            <span class="absolute right-0 top-0 text-[9px] bg-white/10 text-cyan-400 px-3 py-1 rounded-full font-black uppercase orbitron">${data.salud.toFixed(1)}% MARGEN</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <h3 class="orbitron text-[11px] font-black text-white/50 uppercase tracking-[0.4em] italic mb-4">Misiones de Comando Gerencial</h3>
                    ${data.misiones.map(m => `
                        <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:border-cyan-500/30 transition-all relative overflow-hidden shadow-xl">
                            <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-xl shrink-0">
                                <i class="fas ${m.icon} ${m.nivel === 'CRÍTICO' ? 'text-red-500' : 'text-cyan-400'}"></i>
                            </div>
                            <div class="flex-1">
                                <span class="text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${m.nivel === 'CRÍTICO' ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-400'} orbitron">
                                    ${m.nivel}
                                </span>
                                <h4 class="text-xl font-black mt-1 orbitron italic">${m.t}</h4>
                                <p class="text-slate-400 text-xs mt-1 italic font-medium">${m.d}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="xl:col-span-4 space-y-10">
                <div class="bg-indigo-600 p-10 rounded-[4rem] text-white relative overflow-hidden group shadow-2xl">
                    <h4 class="orbitron text-[10px] font-black mb-8 uppercase tracking-widest opacity-70 italic">Eficiencia de Rampa</h4>
                    <p class="text-6xl font-black orbitron mb-4 italic tracking-tighter">${data.eficiencia.toFixed(1)}%</p>
                    <div class="h-1.5 w-full bg-black/20 rounded-full overflow-hidden mb-6">
                        <div class="h-full bg-white" style="width: ${data.eficiencia}%"></div>
                    </div>
                    <p class="text-[10px] font-bold italic leading-tight uppercase opacity-90">
                        "William, balance de evacuación operativa en rangos estratégicos estables."
                    </p>
                </div>

                <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 space-y-6">
                    <h4 class="orbitron text-[10px] font-black text-slate-500 mb-4 uppercase tracking-widest italic">Análisis de Estructuras</h4>
                    
                    <div class="p-6 bg-black/40 rounded-3xl border border-white/5">
                        <p class="text-[9px] font-black text-cyan-400 uppercase mb-1">Capital Inmovilizado Bodega</p>
                        <p class="text-3xl font-black orbitron italic text-white">$ ${data.invValor.toLocaleString()}</p>
                    </div>

                    <div class="p-6 bg-black/40 rounded-3xl border border-white/5">
                        <p class="text-[9px] font-black text-red-400 uppercase mb-1">Burn Rate del Periodo</p>
                        <p class="text-3xl font-black orbitron italic text-white">$ ${Math.round(data.burnRateDiario).toLocaleString()} / día</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("btnVozIA").onclick = () => {
            const msn = `Comandante ${nombreUsuario}. Reporte de telemetría consolidado. Registramos una utilidad neta de ${Math.round(data.utilidad)} pesos con un burn rate diario real de ${Math.round(data.burnRateDiario)} pesos. He generado las misiones tácticas correspondientes.`;
            hablar(msn);
        };
    };

    renderLayout();
    await realizarDiagnostico();

    document.getElementById("btnFiltrarRango").onclick = realizarDiagnostico;
}
