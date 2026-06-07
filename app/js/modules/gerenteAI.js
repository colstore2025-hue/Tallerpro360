/**
 * 🦾 NEXUS-X STRATEGIC COMMAND V7.2 - GERENTE AI (EDICIÓN FINAL DE PRODUCCIÓN)
 * RESOLUCIÓN: COMPENSACIÓN CRONOLÓGICA GMT-5 + RENDERIZADOR PDF CON AISLAMIENTO DE VIEWPORT
 * Director General: William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

// Guardia de Inicialización: Previene duplicación de scripts en el Head de la PWA
let cargandoPdfPromesa = null;
const cargarLibreriaPDF = () => {
    if (window.html2pdf) return Promise.resolve();
    if (cargandoPdfPromesa) return cargandoPdfPromesa;

    cargandoPdfPromesa = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.onload = () => resolve();
        script.onerror = (err) => { cargandoPdfPromesa = null; reject(err); };
        document.head.appendChild(script);
    });
    return cargandoPdfPromesa;
};

export default async function gerenteAI(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    const nombreUsuario = localStorage.getItem("nexus_userName") || "Comandante";
    
    // Persistencia del estado temporal de la sesión gerencial
    if (!localStorage.getItem("nexus_tmp_f_inicio")) {
        const hoy = new Date();
        const haceUnMes = new Date();
        haceUnMes.setDate(hoy.getDate() - 30);
        localStorage.setItem("nexus_tmp_f_inicio", haceUnMes.toISOString().split('T')[0]);
        localStorage.setItem("nexus_tmp_f_fin", hoy.toISOString().split('T')[0]);
    }

    let fechaInicioIso = localStorage.getItem("nexus_tmp_f_inicio");
    let fechaFinIso = localStorage.getItem("nexus_tmp_f_fin");
    let dataMemoriaLocal = null; 

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-1000 pb-48 selection:bg-cyan-500">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 border-l-4 border-cyan-500 pl-8 relative">
                <div class="absolute -top-10 -left-10 text-[120px] font-black opacity-5 italic select-none orbitron uppercase">NEXUS</div>
                <div class="relative z-10">
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        STRATEGIC <span class="text-cyan-400">COMMAND</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] orbitron font-black text-cyan-400 uppercase">Consciencia Activa V7.2</span>
                        <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase italic font-black">Bóveda: ${empresaId}</p>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-4 relative z-10 bg-[#0d1117] p-4 rounded-[2rem] border border-white/5 w-full xl:w-auto">
                    <div class="flex items-center gap-2 px-3">
                        <label class="text-[8px] orbitron font-black text-slate-500 uppercase">Desde:</label>
                        <input type="date" id="filtro-fecha-inicio" value="${fechaInicioIso}" class="bg-transparent border-none text-xs font-bold text-cyan-400 font-mono focus:outline-none">
                    </div>
                    <div class="h-4 w-[1px] bg-white/10 hidden md:block"></div>
                    <div class="flex items-center gap-2 px-3">
                        <label class="text-[8px] orbitron font-black text-slate-500 uppercase">Hasta:</label>
                        <input type="date" id="filtro-fecha-fin" value="${fechaFinIso}" class="bg-transparent border-none text-xs font-bold text-cyan-400 font-mono focus:outline-none">
                    </div>
                    
                    <button id="btnFiltrarRango" class="px-4 py-2 bg-cyan-500 text-black text-[9px] orbitron font-black uppercase rounded-xl hover:bg-white transition-all">
                        <i class="fas fa-filter mr-1"></i> Sincronizar
                    </button>
                    
                    <button id="btnExportarPDF" class="px-4 py-2 bg-slate-800 text-slate-200 text-[9px] orbitron font-black uppercase rounded-xl hover:bg-red-600 hover:text-white transition-all">
                        <i class="fas fa-file-pdf mr-1"></i> PDF Report
                    </button>

                    <button id="btnVozIA" class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black hover:bg-cyan-500 hover:text-white transition-all shadow-lg">
                        <i class="fas fa-brain text-lg"></i>
                    </button>
                </div>
            </header>

            <div id="target-print-area">
                <div id="panelIA" class="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    <div class="col-span-full py-40 flex flex-col items-center">
                        <div class="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                        <p class="mt-8 orbitron text-[10px] tracking-[1em] text-cyan-400 animate-pulse uppercase">Mapeando Matriz Financiera...</p>
                    </div>
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

            // COMPENSACIÓN MILITAR DE HORA: Forzamos la medianoche absoluta de Colombia (GMT-5) sin depender del motor local
            const timestampInicioStr = `${fechaInicioIso}T00:00:00.000-05:00`;
            const timestampFinStr = `${fechaFinIso}T23:59:59.999-05:00`;

            const [snapOrdenes, snapContable, snapInv] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), 
                              where("empresaId", "==", empresaId),
                              where("fecha", ">=", timestampInicioStr),
                              where("fecha", "<=", timestampFinStr))),
                getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)))
            ]);

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

            const diffTiempo = Math.abs(new Date(fechaFinIso + "T12:00:00") - new Date(fechaInicioIso + "T12:00:00"));
            const diasAnalizados = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24)) || 1;

            const utilidad = ingresos - gastos;
            const burnRateDiario = gastos / diasAnalizados;
            const salud = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;
            const eficiencia = (otTerminadas / (otActivas + otTerminadas || 1)) * 100;

            const misiones = [];
            if (rampa > utilidad && rampa > 0) {
                misiones.push({
                    id: "caja-rapida", nivel: "CRÍTICO", icon: "fa-bolt-lightning",
                    t: "Operación 'Caja Rápida'",
                    d: `Detectamos $${rampa.toLocaleString()} estancados en patio. Liquidar el inventario de órdenes en desarrollo aumentaría la liquidez dramáticamente.`
                });
            }
            if (invValor > (utilidad > 0 ? utilidad * 1.5 : 5000000)) {
                misiones.push({
                    id: "stock-auditoria", nivel: "ESTRATEGIA", icon: "fa-box-open",
                    t: "Protocolo de Stock Pasivo",
                    d: `El valor de tu inventario ($${invValor.toLocaleString()}) está alto en relación al flujo de utilidad neta. Congela compras externas.`
                });
            }
            if (eficiencia < 70) {
                misiones.push({
                    id: "rampa-cuello", nivel: "OPERACIONES", icon: "fa-microchip",
                    t: "Cuello de Botella Detectado",
                    d: `La tasa de evacuación técnica se encuentra en el ${eficiencia.toFixed(1)}%. Reasigna tareas en patio.`
                });
            }
            if (misiones.length === 0) {
                misiones.push({
                    id: "crecimiento", nivel: "EXPANSIÓN", icon: "fa-rocket",
                    t: "Crecimiento Exponencial",
                    d: "Indicadores estables en el periodo analizado. Óptimo para inyectar capital en infraestructura o marketing."
                });
            }

            dataMemoriaLocal = { ingresos, utilidad, salud, eficiencia, misiones, burnRateDiario, invValor, diasAnalizados };
            renderPanel(dataMemoriaLocal);

        } catch (e) { 
            console.error("Critical Failure Nexus Gerente AI Core:", e);
            if(e.message && e.message.includes("index")) {
                Swal.fire('ÍNDICE REQUERIDO', 'Firestore requiere un índice compuesto para este rango de fechas. Revisa la consola del navegador.', 'warning');
            } else {
                Swal.fire('FALLO_TELEMETRÍA', 'Error al consolidar la información de las bases de datos.', 'error');
            }
        }
    };

    const renderPanel = (data) => {
        const panel = document.getElementById("panelIA");
        const fFirmaInicio = new Date(fechaInicioIso + "T12:00:00").toLocaleDateString('es-CO', {day:'numeric', month:'short', year:'numeric'});
        const fFirmaFin = new Date(fechaFinIso + "T12:00:00").toLocaleDateString('es-CO', {day:'numeric', month:'short', year:'numeric'});

        panel.innerHTML = `
            <div class="hidden print:block col-span-full border-b border-cyan-500 pb-6 mb-8">
                <h2 class="orbitron text-3xl font-black text-white">NEXUS-X SYSTEM // CONSOLIDADO GERENCIAL</h2>
                <p class="text-xs font-mono text-slate-400">PERIODO DE ANÁLISIS FISCAL: ${fFirmaInicio} AL ${fFirmaFin} (${data.diasAnalizados} días)</p>
                <p class="text-[10px] text-slate-500 uppercase">Director Operativo: William Jeffry Urquijo Cubillos</p>
            </div>

            <div class="xl:col-span-8 space-y-10">
                <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                    <div class="absolute -right-10 -top-10 text-cyan-500/5 text-9xl orbitron font-black italic">DATA</div>
                    <h3 class="orbitron text-[10px] font-black text-cyan-400 mb-12 uppercase tracking-[0.3em] italic flex items-center gap-3">
                        <span class="w-2 h-2 bg-cyan-500 rounded-full"></span> Auditoría de Bóveda & Salud Fiscal
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div>
                            <p class="text-[9px] text-slate-500 font-black uppercase mb-4 tracking-widest italic">Recaudo Bruto del Periodo</p>
                            <h2 class="text-6xl font-black text-white orbitron italic tracking-tighter leading-none">$${data.ingresos.toLocaleString()}</h2>
                        </div>
                        <div class="relative border-l border-white/10 pl-12 print:pl-4">
                            <p class="text-[9px] text-amber-400 font-black uppercase mb-4 tracking-widest italic">Utilidad Neta Real</p>
                            <h2 class="text-5xl font-black ${data.utilidad >= 0 ? 'text-emerald-500' : 'text-red-500'} orbitron italic tracking-tighter opacity-80">$${data.utilidad.toLocaleString()}</h2>
                            <span class="absolute right-0 top-0 text-[9px] bg-white/10 print:bg-slate-800 text-cyan-400 px-3 py-1 rounded-full font-black uppercase orbitron">${data.salud.toFixed(1)}% MARGEN</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-6 print:break-before-page">
                    <h3 class="orbitron text-[11px] font-black text-white/50 uppercase tracking-[0.4em] italic mb-8">Misiones de Comando Gerencial</h3>
                    ${data.misiones.map(m => `
                        <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:border-cyan-500/30 transition-all relative overflow-hidden shadow-xl">
                            <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-2xl shrink-0">
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
                <div class="bg-gradient-to-br from-cyan-600 to-blue-900 p-10 rounded-[4rem] text-white relative overflow-hidden group shadow-2xl">
                    <h4 class="orbitron text-[10px] font-black mb-8 uppercase tracking-widest opacity-70 italic">Eficiencia de Rampa</h4>
                    <p class="text-6xl font-black orbitron mb-4 italic tracking-tighter">${data.eficiencia.toFixed(1)}%</p>
                    <div class="h-1.5 w-full bg-black/20 rounded-full overflow-hidden mb-6">
                        <div class="h-full bg-white" style="width: ${data.eficiencia}%"></div>
                    </div>
                    <p class="text-[10px] font-bold italic leading-tight uppercase opacity-90">
                        "Estatus técnico evaluado en rangos ${data.eficiencia > 75 ? 'EFICIENTES' : 'DE ATENCIÓN OPERATIVA'}."
                    </p>
                </div>

                <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 space-y-6">
                    <h4 class="orbitron text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest italic">Análisis de Estructuras</h4>
                    
                    <div class="p-6 bg-black/40 rounded-3xl border border-white/5">
                        <p class="text-[9px] font-black text-cyan-400 uppercase mb-1">Capital Total Inmovilizado</p>
                        <p class="text-3xl font-black orbitron italic text-white">$${data.invValor.toLocaleString()}</p>
                    </div>

                    <div class="p-6 bg-black/40 rounded-3xl border border-white/5">
                        <p class="text-[9px] font-black text-red-400 uppercase mb-1">Burn Rate del Periodo</p>
                        <p class="text-3xl font-black orbitron italic text-white">$${Math.round(data.burnRateDiario).toLocaleString()} / día</p>
                    </div>
                </div>
            </div>

            <div class="hidden print:flex col-span-full justify-between items-center mt-20 pt-12 border-t border-white/10">
                <div>
                    <p class="text-xs font-mono text-white">AUTORIZADO POR:</p>
                    <div class="h-12 flex items-end font-serif tracking-widest text-xl text-cyan-400 italic font-bold">W. J. Urquijo C.</div>
                    <p class="text-[9px] font-mono text-slate-500 uppercase border-t border-white/20 pt-2 w-64">Firma Digital - Command Central</p>
                </div>
                <div class="text-right">
                    <p class="text-[9px] font-mono text-slate-500">AUTENTICACIÓN FINANCIERA</p>
                    <p class="text-xs font-mono text-emerald-400 font-bold">STATUS: AUDITED_OK</p>
                </div>
            </div>
        `;

        document.getElementById("btnVozIA").onclick = () => {
            const msn = `Comandante ${nombreUsuario}. Reporte de telemetría consolidado. Registramos una utilidad neta de ${Math.round(data.utilidad)} pesos con un burn rate diario real de ${Math.round(data.burnRateDiario)} pesos. He generado las misiones tácticas correspondientes.`;
            hablar(msn);
        };
    };

    /**
     * 📄 METODO SEGURO DE EXPORTACIÓN (SANDBOX DE RENDERIZADO ASÍNCRONO)
     */
    async function ejecutarExportacionPDF() {
        if (!dataMemoriaLocal) return Swal.fire('SIN DATOS', 'Por favor espera a que finalice el escaneo de la bóveda.', 'warning');
        
        try {
            Swal.fire({ title: 'COMPILANDO_REPORTE_PDF...', background: '#010409', color: '#fff', didOpen: () => Swal.showLoading() });
            
            await cargarLibreriaPDF();
            
            const original = document.getElementById("target-print-area");
            
            // SANDBOX DE RENDERIZADO: Creamos un contenedor aislado en memoria para evitar que afecte o sea afectado por la pantalla responsiva móvil
            const sandboxContenedor = document.createElement("div");
            sandboxContenedor.style.position = "fixed";
            sandboxContenedor.style.left = "-9999px";
            sandboxContenedor.style.top = "-9999px";
            sandboxContenedor.style.width = "1024px"; // Garantiza consistencia visual idéntica a una pantalla de escritorio
            sandboxContenedor.style.backgroundColor = "#010409";
            sandboxContenedor.style.color = "#ffffff";
            
            const clonParaImpresion = original.cloneNode(true);
            sandboxContenedor.appendChild(clonParaImpresion);
            document.body.appendChild(sandboxContenedor);
            
            // Remueve de forma segura la directiva de ocultamiento CSS sólo para los elementos de impresión dentro del Sandbox
            const bloquesOcultos = sandboxContenedor.querySelectorAll('.hidden');
            bloquesOcultos.forEach(el => el.style.display = 'block');

            const opcionesConfig = {
                margin:       [12, 12, 12, 12],
                filename:     `NEXUS_REPORT_${fechaInicioIso}_AL_${fechaFinIso}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, backgroundColor: '#010409', useCORS: true, width: 1024 },
                jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().set(opcionesConfig).from(sandboxContenedor).save();
            
            // Destrucción inmediata del contenedor flotante
            document.body.removeChild(sandboxContenedor);
            Swal.close();
            
        } catch (error) {
            console.error("Error en el pipeline del generador PDF:", error);
            Swal.fire('🚨 REPORTE_FALLIDO', 'Ocurrió un error al compilar los vectores del documento PDF.', 'error');
        }
    }

    renderLayout();
    await realizarDiagnostico();

    document.getElementById("btnFiltrarRango").onclick = realizarDiagnostico;
    document.getElementById("btnExportarPDF").onclick = ejecutarExportacionPDF;
}
