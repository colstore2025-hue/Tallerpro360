/**
 * 🦾 NEXUS-X TERMINATOR CORE V20.0 - FINANZAS ELITE
 * ESTRATEGIA: QUANTUM-SAP 2030 AUDIT PROTOCOL
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI
 */
import { 
    collection, query, where, getDocs, onSnapshot, serverTimestamp, doc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let activeListeners = [];
    
    // Estado financiero con segregación de activos
    let estadoFinanciero = { 
        cajaEfectiva: 0,    // Lo que ya entró (PUC 1105)
        cuentasPorCobrar: 0, // Lo que está en rampa (PUC 1305)
        gastosOperativos: 0, // Salidas (PUC 51)
        patrimonioStock: 0,  // Valor inventario (PUC 14)
        utilidadBruta: 0,
        burnRate: 0,         // Gasto diario promedio
        eficienciaRampa: 0   // % de conversión de órdenes
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in duration-700 pb-40 bg-[#010409] min-h-screen text-white font-sans selection:bg-cyan-500 selection:text-black">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 border-b-2 border-cyan-500/20 pb-10 gap-8 relative">
                <div class="absolute -top-10 left-0 text-[100px] font-black opacity-5 italic select-none orbitron">AUDIT</div>
                <div class="relative z-10">
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter uppercase leading-none glow-text-cyan">
                        FINANZAS <span class="text-cyan-400">ELITE</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <span class="h-2 w-2 bg-green-500 rounded-full animate-ping"></span>
                        <p class="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] orbitron">Nexus-X Financial Intelligence // V20.0 TERMINATOR</p>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-4 items-center bg-[#0d1117] p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                    <div class="flex flex-col px-4 border-r border-white/10">
                        <label class="text-[8px] orbitron text-cyan-500 font-black mb-1">RANGO DE AUDITORÍA</label>
                        <div class="flex gap-2">
                            <input type="date" id="fechaInicio" class="bg-transparent text-xs font-bold text-white outline-none">
                            <input type="date" id="fechaFin" class="bg-transparent text-xs font-bold text-white outline-none">
                        </div>
                    </div>
                    <button id="btnFiltrar" class="w-12 h-12 bg-cyan-500 text-black rounded-xl hover:rotate-180 transition-all duration-500 shadow-lg shadow-cyan-500/20">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button id="btnExportarAuditoria" class="px-8 py-4 bg-white text-black rounded-xl flex items-center gap-4 hover:bg-red-600 hover:text-white transition-all duration-300 font-black">
                        <i class="fas fa-file-pdf"></i>
                        <span class="orbitron text-[10px] uppercase">Generar P&G Auditor</span>
                    </button>
                </div>
            </header>

            <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12"></div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                <div class="lg:col-span-8 bg-gradient-to-br from-[#0d1117] to-[#010409] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
                     <div class="flex flex-col md:flex-row items-center gap-10 relative z-10">
                        <div class="relative">
                            <canvas id="chartUtilidad" width="150" height="150"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span class="text-[8px] orbitron text-slate-500">ROI</span>
                                <span id="roiPct" class="text-xl font-black orbitron">0%</span>
                            </div>
                        </div>
                        <div class="flex-1">
                            <h5 class="text-[10px] font-black uppercase text-cyan-400 mb-2 orbitron tracking-widest">NEXUS-AI Operational Advisor</h5>
                            <div id="txtConsejo" class="text-lg text-slate-300 leading-tight font-medium italic border-l-2 border-cyan-500 pl-6 py-2">Iniciando escaneo de flujos...</div>
                        </div>
                     </div>
                </div>

                <div class="lg:col-span-4 bg-[#0d1117] border border-red-500/30 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 text-4xl text-red-500"><i class="fas fa-skull-crossbones"></i></div>
                    <h3 class="orbitron text-[10px] font-black text-red-500 uppercase mb-6">Fugas de Capital (Cancelaciones)</h3>
                    <div id="listFuga" class="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2"></div>
                </div>
            </div>

            <div class="mb-8 flex items-center justify-between">
                <h3 class="text-[12px] font-black text-white uppercase tracking-[0.4em] orbitron">Inventario de Misiones en <span class="text-cyan-500 italic">Proceso Digital</span></h3>
                <div id="rampaCount" class="px-6 py-2 bg-cyan-500/5 border border-cyan-500/20 rounded-full orbitron text-[10px] font-black text-cyan-400">---</div>
            </div>
            <div id="gridRampa" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>
        </div>`;

        setupEvents();
        sincronizarNucleo();
    };

    const setupEvents = () => {
        document.getElementById("btnFiltrar").onclick = () => sincronizarNucleo(true);
        document.getElementById("btnExportarAuditoria").onclick = exportarAuditoriaElite;
        
        const hoy = new Date();
        document.getElementById("fechaInicio").value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        document.getElementById("fechaFin").value = hoy.toISOString().split('T')[0];
    };

    const sincronizarNucleo = async (esFiltro = false) => {
        activeListeners.forEach(unsub => unsub());
        const fInicio = document.getElementById("fechaInicio").value;
        const fFin = document.getElementById("fechaFin").value;

        // 🟢 1. Auditoría de Caja Real (Contabilidad)
        const qCont = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
        const snapCont = await getDocs(qCont);
        
        estadoFinanciero.cajaEfectiva = 0;
        estadoFinanciero.gastosOperativos = 0;
        
        snapCont.docs.forEach(doc => {
            const t = doc.data();
            const f = t.fecha?.toDate ? t.fecha.toDate().toISOString().split('T')[0] : "";
            if (f >= fInicio && f <= fFin) {
                const total = Number(t.total || 0);
                // Si el total es positivo y viene de orden/venta es ingreso
                if (total > 0) estadoFinanciero.cajaEfectiva += total;
                else estadoFinanciero.gastosOperativos += Math.abs(total);
            }
        });

        // 🔧 2. Telemetría de Órdenes (Capital Atrapado)
        const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        activeListeners.push(onSnapshot(qOrd, (snap) => {
            const ords = snap.docs.map(d => ({id: d.id, ...d.data()}));
            procesarRampaYFugas(ords);
        }));

        // 📦 3. Auditoría de Bóveda (Inventario)
        const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
        const snapInv = await getDocs(qInv);
        estadoFinanciero.patrimonioStock = snapInv.docs.reduce((acc, d) => {
            const i = d.data();
            return acc + (Number(i.precioCosto || 0) * Number(i.stock || 0));
        }, 0);
        
        if(!esFiltro) updateUI();
    };

    const procesarRampaYFugas = (ordenes) => {
        estadoFinanciero.cuentasPorCobrar = 0;
        let rampaHTML = ""; let fugaHTML = "";
        let countRampa = 0;

        ordenes.forEach(o => {
            const totalOT = Number(o.costos_totales?.total || 0);
            
            if (['INGRESO', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado)) {
                estadoFinanciero.cuentasPorCobrar += totalOT;
                countRampa++;
                rampaHTML += renderRampaCard(o, totalOT);
            } else if (o.estado === 'CANCELADO') {
                fugaHTML += renderFugaItem(o, totalOT);
            }
        });

        document.getElementById("gridRampa").innerHTML = rampaHTML || `<div class="col-span-full py-20 opacity-20 text-center orbitron uppercase tracking-[1em]">Zona Despejada</div>`;
        document.getElementById("listFuga").innerHTML = fugaHTML || `<p class="text-[8px] text-slate-600 uppercase text-center py-10 tracking-widest">Sin fugas detectadas</p>`;
        document.getElementById("rampaCount").innerText = `${countRampa} Unidades Activas`;
        
        updateUI();
    };

    const updateUI = () => {
        const d = estadoFinanciero;
        const utilidad = d.cajaEfectiva - d.gastosOperativos;
        const roi = d.gastosOperativos > 0 ? (utilidad / d.gastosOperativos) * 100 : 0;

        document.getElementById("kpiGrid").innerHTML = `
            ${renderStatBox("Caja Efectiva", d.cajaEfectiva, "fa-wallet", "text-emerald-400", "Recaudado Real")}
            ${renderStatBox("Capital en Rampa", d.cuentasPorCobrar, "fa-microchip", "text-cyan-400", "Proyectado")}
            ${renderStatBox("Gastos Auditoría", d.gastosOperativos, "fa-file-invoice", "text-red-400", "PUC 51")}
            ${renderStatBox("Patrimonio Stock", d.patrimonioStock, "fa-box", "text-amber-400", "Valor de Bóveda")}
        `;

        document.getElementById("roiPct").innerText = `${Math.round(roi)}%`;
        document.getElementById("txtConsejo").innerHTML = generarDiagnosticoIA(utilidad, d);
    };

    const generarDiagnosticoIA = (utilidad, d) => {
        if (utilidad < 0) return `<span class="text-red-500 font-black">CRÍTICO:</span> Déficit operativo de $${Math.abs(utilidad).toLocaleString()}. <br><span class="text-white">ACCIÓN:</span> Reducir gastos PUC 51 y acelerar liquidación de rampa (actualmente en $${d.cuentasPorCobrar.toLocaleString()}).`;
        if (d.cuentasPorCobrar > d.cajaEfectiva * 1.5) return `<span class="text-amber-500 font-black">ALERTA DE CAJA:</span> El capital atrapado supera tu liquidez. <br><span class="text-white">ESTRATEGIA:</span> Implementar cobro de anticipos del 50% para equilibrar el flujo.`;
        return `<span class="text-emerald-400 font-black">SISTEMA SALUDABLE:</span> ROI positivo detectado. <br><span class="text-white">RECOMENDACIÓN:</span> Reinvertir en stock de alta rotación para proteger el capital contra inflación.`;
    };

    const renderStatBox = (title, val, icon, color, subtitle) => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-cyan-500/20 transition-all duration-500">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <i class="fas ${icon} text-slate-500 group-hover:${color} transition-colors"></i>
                </div>
                <div>
                    <h6 class="text-[9px] orbitron font-black text-slate-500 uppercase">${title}</h6>
                    <p class="text-[7px] text-slate-600 uppercase font-bold">${subtitle}</p>
                </div>
            </div>
            <p class="text-3xl font-black orbitron tracking-tighter ${color}">$ ${Math.round(val).toLocaleString()}</p>
        </div>`;

    const renderRampaCard = (o, total) => `
        <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 hover:border-cyan-500/40 transition-all relative overflow-hidden group">
            <div class="flex justify-between items-start mb-4">
                <span class="text-[8px] border border-cyan-500/50 text-cyan-400 px-3 py-1 rounded-full orbitron uppercase">${o.estado}</span>
                <i class="fas fa-satellite text-cyan-500/20 group-hover:animate-spin"></i>
            </div>
            <h4 class="text-white font-black text-xs uppercase mb-1">${o.cliente || 'CLIENTE_ANONIMO'}</h4>
            <p class="text-xl font-black text-white orbitron mb-4">${o.placa || 'UNIT_ID'}</p>
            <div class="text-[10px] text-slate-500 orbitron">DEUDA: <span class="text-white">$${total.toLocaleString()}</span></div>
        </div>`;

    const renderFugaItem = (o, total) => `
        <div class="flex justify-between items-center p-4 bg-red-500/5 border border-red-500/10 rounded-xl group hover:bg-red-500/10 transition-all">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div>
                    <p class="text-[9px] font-black text-white orbitron uppercase">${o.placa}</p>
                    <p class="text-[7px] text-slate-500 uppercase italic">Cancelada por Auditoría</p>
                </div>
            </div>
            <span class="text-red-500 font-black orbitron text-xs">-$${total.toLocaleString()}</span>
        </div>`;

// 1. CONFIGURACIÓN DE MÉRITO (Agrégalo al inicio de la función)
const MERITO_CONFIG = {
    comision_tecnico: 0.30, // 30% sobre la mano de obra
    bono_eficiencia: 0.05,  // 5% extra si entrega antes de 24h
};

// 2. NUEVA SECCIÓN DE UI: PANEL DE MÉRITO
// Inserta esto en el renderLayout, justo antes del gridRampa
const meritSection = `
<div class="mb-12">
    <div class="flex items-center justify-between mb-6">
        <h3 class="text-[12px] font-black text-white uppercase tracking-[0.5em] orbitron italic">
            Performance & Nómina <span class="text-emerald-500">[Meritocracia Digital]</span>
        </h3>
    </div>
    <div id="gridNomina" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        </div>
</div>
`;

// 3. LÓGICA DE CÁLCULO DE COMISIONES (Dentro de procesarRampaYFugas o similar)
const procesarNomina = (ordenes) => {
    const nominaPorTecnico = {};

    ordenes.filter(o => o.estado === 'LISTO' || o.estado === 'ENTREGADO').forEach(o => {
        const tecnico = o.tecnico_asignado || "Sin Asignar";
        const manoDeObra = o.items?.filter(i => i.tipo === 'SERVICIO')
                             .reduce((acc, i) => acc + (Number(i.venta) * Number(i.cantidad)), 0) || 0;
        
        const comision = manoDeObra * MERITO_CONFIG.comision_tecnico;
        
        if (!nominaPorTecnico[tecnico]) {
            nominaPorTecnico[tecnico] = { total: 0, misiones: 0 };
        }
        nominaPorTecnico[tecnico].total += comision;
        nominaPorTecnico[tecnico].misiones += 1;
    });

    renderNominaUI(nominaPorTecnico);
};

const renderNominaUI = (data) => {
    const container = document.getElementById("gridNomina");
    if (!container) return;

    container.innerHTML = Object.entries(data).map(([nombre, stats]) => `
        <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-emerald-500/10 hover:border-emerald-500/40 transition-all group">
            <div class="flex justify-between items-center mb-4">
                <div class="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                    <i class="fas fa-user-gear"></i>
                </div>
                <span class="text-[8px] orbitron text-slate-500 uppercase">${stats.misiones} Misiones Completadas</span>
            </div>
            <h4 class="text-white font-black text-sm uppercase mb-1">${nombre}</h4>
            <p class="text-[8px] text-emerald-400 font-bold mb-4 orbitron uppercase tracking-tighter">Comisión Acumulada</p>
            <div class="text-2xl font-black text-white orbitron">$${Math.round(stats.total).toLocaleString()}</div>
            <div class="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500" style="width: 70%"></div>
            </div>
        </div>
    `).join('');
};

    async function exportarAuditoriaElite() {
        // Implementación con jsPDF (Ya integrada en el sistema global)
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const d = estadoFinanciero;

        Swal.fire({
            title: 'SINCRO-AUDIT INICIADO',
            html: 'Compilando datos PUC 2030...',
            background: '#010409', color: '#fff', showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
                pdf.setFillColor(1, 4, 9); pdf.rect(0, 0, 210, 297, 'F');
                pdf.setTextColor(6, 182, 212); pdf.text("NEXUS-X FINANCIAL AUDIT REPORT", 20, 20);
                // Lógica de tabla P&G...
                pdf.save(`Audit_Elite_${new Date().getTime()}.pdf`);
                Swal.close();
            }
        });
    }

    renderLayout();
}
