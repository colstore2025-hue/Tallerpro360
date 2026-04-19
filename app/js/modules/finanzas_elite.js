/**
 * 🦾 NEXUS-X TERMINATOR CORE V20.0 - FINANZAS ELITE
 * Central de Inteligencia Financiera & Auditoría PUC
 * Estabilización Total: Reloj Suizo 2030 // William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, getDocs, onSnapshot, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let activeListeners = [];
    
    let estadoFinanciero = { 
        ingresos: 0, gastos: 0, utilidad: 0,
        enRampa: 0, fuga: 0, stock: 0,
        ordenes: [], transacciones: []
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-500 pb-40 bg-[#010409] min-h-screen text-white font-sans">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 border-b border-white/5 pb-10 gap-8">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1.5 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase leading-none">
                        FINANZAS <span class="text-cyan-400">ELITE</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4">Auditoría PUC // Protocolo de Liquidez Nexus-X</p>
                </div>
                
                <div class="flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div class="flex flex-col px-4">
                        <label class="text-[8px] orbitron text-cyan-500 font-black uppercase mb-1">Periodo de Auditoría</label>
                        <div class="flex gap-2">
                            <input type="date" id="fechaInicio" class="bg-transparent border-none text-xs font-bold focus:ring-0 text-white cursor-pointer outline-none">
                            <span class="text-slate-600">-</span>
                            <input type="date" id="fechaFin" class="bg-transparent border-none text-xs font-bold focus:ring-0 text-white cursor-pointer outline-none">
                        </div>
                    </div>
                    <button id="btnFiltrar" class="p-4 bg-cyan-500 text-black rounded-2xl hover:bg-white transition-all transform active:scale-90">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button id="btnExportarAuditoria" class="group px-8 py-4 bg-white text-black rounded-2xl flex items-center gap-4 hover:bg-emerald-500 hover:text-white transition-all duration-500 shadow-xl">
                        <i class="fas fa-file-pdf text-xl"></i>
                        <span class="orbitron text-[10px] font-black uppercase tracking-widest">Generar Auditoría P&G</span>
                    </button>
                </div>
            </header>

            <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
                <div class="lg:col-span-2 bg-[#0d1117] border border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
                     <div class="absolute -right-10 -bottom-10 opacity-5 text-9xl italic font-black orbitron select-none">PUC</div>
                     <div class="flex items-start gap-8 relative z-10">
                        <div class="w-24 h-24 bg-cyan-500 text-black rounded-[2rem] flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <div class="flex-1">
                            <h5 class="text-[12px] font-black uppercase text-cyan-400 mb-4 orbitron tracking-[0.3em]">IA Financial Operational Advisor</h5>
                            <p id="txtConsejo" class="text-xl text-slate-300 leading-relaxed font-medium italic mb-6">Analizando flujos de caja y pasivos circulantes...</p>
                            <div class="flex gap-6">
                                <div class="bg-black/40 p-5 rounded-2xl border border-white/5 flex-1">
                                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Estatus Utilidad</p>
                                    <p id="txtUtilidad" class="text-2xl font-black text-emerald-400 orbitron">$ 0</p>
                                </div>
                                <div class="bg-black/40 p-5 rounded-2xl border border-white/5 flex-1">
                                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Punto de Equilibrio (Meta)</p>
                                    <p id="txtEquilibrio" class="text-2xl font-black text-white orbitron">Calculando...</p>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>

                <div class="bg-[#0d1117] border border-red-500/20 rounded-[3.5rem] p-10 shadow-2xl">
                    <h3 class="orbitron text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <i class="fas fa-bolt"></i> Fuga detectada (Cancelaciones)
                    </h3>
                    <div id="listFuga" class="space-y-4 max-h-[250px] overflow-y-auto pr-4 custom-scrollbar"></div>
                </div>
            </div>

            <div class="mb-10 flex items-center justify-between">
                <h3 class="text-[12px] font-black text-white uppercase tracking-[0.5em] orbitron italic">Inventario de Misiones <span class="text-cyan-500">[Telemetría en Rampa]</span></h3>
                <div id="rampaCount" class="px-6 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full orbitron text-[10px] font-black text-cyan-400">0 Unidades</div>
            </div>
            <div id="gridRampa" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>
        </div>`;

        document.getElementById("btnFiltrar").onclick = () => sincronizarNucleo(true);
        document.getElementById("btnExportarAuditoria").onclick = exportarBalanceDetallado;
        
        const hoy = new Date();
        document.getElementById("fechaInicio").value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        document.getElementById("fechaFin").value = hoy.toISOString().split('T')[0];

        sincronizarNucleo();
    };

    const sincronizarNucleo = async (esFiltro = false) => {
        activeListeners.forEach(unsub => unsub());
        const fInicio = document.getElementById("fechaInicio").value;
        const fFin = document.getElementById("fechaFin").value;

        // 🟢 1. CONTABILIDAD (PUC REAL)
        const qCont = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snapCont = await getDocs(qCont);
        
        estadoFinanciero.ingresos = 0;
        estadoFinanciero.gastos = 0;
        
        snapCont.docs.forEach(doc => {
            const t = doc.data();
            const fecha = t.creadoEn?.toDate ? t.creadoEn.toDate().toISOString().split('T')[0] : "";
            if (fecha >= fInicio && fecha <= fFin) {
                const monto = Number(t.monto || 0);
                if ([NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT, NEXUS_CONFIG.FINANCE_TYPES.REVENUE_PARTS].includes(t.tipo)) {
                    estadoFinanciero.ingresos += monto;
                } else {
                    estadoFinanciero.gastos += monto;
                }
            }
        });

        // 🔧 2. ORDENES (RAMPA Y FUGAS)
        const qOrd = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ORDERS), where("empresaId", "==", empresaId));
        activeListeners.push(onSnapshot(qOrd, (snap) => {
            estadoFinanciero.ordenes = snap.docs.map(d => ({id: d.id, ...d.data()}));
            procesarUI();
        }));

        // 📦 3. INVENTARIO (ACTIVOS)
        const qInv = query(collection(db, NEXUS_CONFIG.COLLECTIONS.INVENTORY), where("empresaId", "==", empresaId));
        const snapInv = await getDocs(qInv);
        estadoFinanciero.stock = snapInv.docs.reduce((acc, d) => {
            const i = d.data();
            return acc + (Number(i.precioVenta || 0) * Number(i.cantidad || 0));
        }, 0);
        
        if(!esFiltro) procesarUI();
    };

    const procesarUI = () => {
        const d = estadoFinanciero;
        let rampaHTML = ""; let fugaHTML = "";
        d.enRampa = 0; d.fuga = 0;
        
        const activas = d.ordenes.filter(o => ['EN_TALLER', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado));
        activas.forEach(o => {
            const subtotal = Number(o.costos_totales?.total_general || 0);
            d.enRampa += subtotal;
            rampaHTML += `
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[7px] bg-cyan-500 text-black px-3 py-1 rounded-full orbitron font-black uppercase">${o.estado}</span>
                </div>
                <h4 class="text-white font-black text-sm uppercase truncate mb-1">${o.cliente}</h4>
                <p class="text-[9px] text-cyan-400 font-bold mb-4 orbitron tracking-tighter">${o.placa || 'OT-PRO'}</p>
                <div class="pt-4 border-t border-white/5">
                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Por Cobrar</p>
                    <div class="text-xl font-black text-white orbitron tabular-nums">$${subtotal.toLocaleString()}</div>
                </div>
            </div>`;
        });

        d.ordenes.filter(o => o.estado === 'CANCELADO').forEach(o => {
            const valor = Number(o.costos_totales?.total_general || 0);
            d.fuga += valor;
            fugaHTML += `
            <div class="flex justify-between items-center p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                <div>
                    <p class="text-[9px] font-black text-white orbitron uppercase">${o.placa || 'S/N'}</p>
                    <p class="text-[7px] text-slate-500 uppercase">${o.cliente?.substring(0,15)}...</p>
                </div>
                <span class="text-red-500 font-black orbitron text-[10px]">-$${valor.toLocaleString()}</span>
            </div>`;
        });

        document.getElementById("gridRampa").innerHTML = rampaHTML || `<div class="col-span-full py-20 opacity-20 text-center orbitron text-[10px] uppercase tracking-[1em]">Bahías Despejadas</div>`;
        document.getElementById("listFuga").innerHTML = fugaHTML || `<p class="text-[8px] text-slate-600 uppercase text-center py-10 tracking-widest">Protocolo Antifugas Activo</p>`;
        document.getElementById("rampaCount").innerText = `${activas.length} Misiones en Rampa`;

        actualizarKPIs();
    };

    const actualizarKPIs = () => {
        const d = estadoFinanciero;
        const utilidad = d.ingresos - d.gastos;

        document.getElementById("kpiGrid").innerHTML = `
            ${renderStatBox("Flujo de Caja", d.ingresos, "fa-vault", "text-emerald-400")}
            ${renderStatBox("Activos en Rampa", d.enRampa, "fa-gears", "text-cyan-400")}
            ${renderStatBox("Egresos Totales", d.gastos, "fa-arrow-trend-down", "text-red-400")}
            ${renderStatBox("Valor en Bóveda", d.stock, "fa-box-open", "text-amber-400")}
        `;

        document.getElementById("txtUtilidad").innerText = `$ ${utilidad.toLocaleString()}`;
        document.getElementById("txtEquilibrio").innerText = `$ ${(d.gastos * 1.3).toLocaleString()} (Margen 30%)`;

        const consejo = document.getElementById("txtConsejo");
        if (utilidad < 0) {
            consejo.innerHTML = `<span class="text-red-500 font-black uppercase">Protocolo de Emergencia:</span> Gastos exceden ingresos. <span class="text-white">Acción:</span> Liquidar misiones con más de 48h en rampa para inyectar flujo.`;
        } else if (d.enRampa > (d.ingresos * 2)) {
            consejo.innerHTML = `<span class="text-cyan-400 font-black uppercase">Alerta de Liquidez:</span> Demasiado capital atrapado en taller. <span class="text-white">Estrategia:</span> Optimizar tiempos de entrega para convertir rampa en caja real.`;
        } else {
            consejo.innerHTML = `<span class="text-emerald-400 font-black uppercase">Operación Saludable:</span> Saldo positivo detectado. <span class="text-white">Sugerencia:</span> Adquirir stock de alta rotación para aumentar el patrimonio líquido.`;
        }
    };

    const renderStatBox = (title, val, icon, colorClass) => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-500">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <i class="fas ${icon} text-slate-500 group-hover:${colorClass} transition-colors"></i>
                </div>
                <h6 class="text-[9px] orbitron font-black text-slate-500 uppercase tracking-widest">${title}</h6>
            </div>
            <p class="text-3xl font-black orbitron tracking-tighter ${colorClass}">$ ${val.toLocaleString()}</p>
        </div>`;

    async function exportarBalanceDetallado() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const d = estadoFinanciero;

        Swal.fire({
            title: 'GENERANDO AUDITORÍA',
            background: '#010409', color: '#fff', showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
                pdf.setFillColor(1, 4, 9); pdf.rect(0, 0, 210, 297, 'F');
                pdf.setTextColor(6, 182, 212); pdf.setFontSize(24);
                pdf.text("AUDITORÍA FINANCIERA NEXUS-X", 15, 25);
                
                pdf.setTextColor(255, 255, 255); pdf.setFontSize(10);
                pdf.text(`EMPRESA: ${empresaId} | FECHA: ${new Date().toLocaleDateString()}`, 15, 35);

                const dataPUC = [
                    ["CUENTA PUC", "DESCRIPCIÓN", "MONTO"],
                    ["4135", "INGRESOS POR SERVICIOS (TALLER)", `$ ${d.ingresos.toLocaleString()}`],
                    ["1305", "CLIENTES (CAPITAL EN RAMPA)", `$ ${d.enRampa.toLocaleString()}`],
                    ["5105", "EGRESOS Y GASTOS OPERATIVOS", `$ ${d.gastos.toLocaleString()}`],
                    ["1435", "INVENTARIO Y ACTIVOS (BÓVEDA)", `$ ${d.stock.toLocaleString()}`],
                    ["9999", "UTILIDAD PROYECTADA TOTAL", `$ ${(d.ingresos + d.enRampa - d.gastos).toLocaleString()}`]
                ];

                pdf.autoTable({
                    startY: 50,
                    head: [dataPUC[0]], body: dataPUC.slice(1),
                    theme: 'grid',
                    headStyles: { fillColor: [6, 182, 212], textColor: [0, 0, 0], fontStyle: 'bold' },
                    bodyStyles: { fillColor: [13, 17, 23], textColor: [255, 255, 255] }
                });

                pdf.save(`Auditoria_NexusX_${empresaId}.pdf`);
                Swal.close();
            }
        });
    }

    renderLayout();
}
