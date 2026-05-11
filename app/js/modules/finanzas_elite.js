/**
 * 🦾 NEXUS-X TERMINATOR CORE V22.1 - FINANZAS ELITE
 * ESTRATEGIA: QUANTUM-SAP 2030 AUDIT PROTOCOL
 * OBJETIVO: Auditoría en Tiempo Real vs Contabilidad Tradicional
 * Director: William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, getDocs, onSnapshot, serverTimestamp, doc, setDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let activeListeners = [];
    
    // Motor de Estado Financiero (Nivel Auditoría)
    let estadoFinanciero = { 
        cajaEfectiva: 0,     // 1105
        cuentasPorCobrar: 0, // 1305
        gastosOperativos: 0, // 51
        patrimonioStock: 0,  // 14
        comisionesPendientes: 0,
        utilidadReal: 0,
        burnRate: 0 
    };

    const CATEGORIAS_SAP = {
        INGRESOS: ["ingreso_ot", "venta_repuestos", "saneamiento_deuda", "anticipo_cliente", "inyeccion_capital"],
        GASTOS: ["gasto_operativo", "compra_repuestos", "pago_nomina", "pago_servicios", "arrendamientos"]
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in duration-700 pb-40 bg-[#010409] min-h-screen text-white font-sans">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 border-b-2 border-cyan-500/20 pb-10 gap-8 relative">
                <div class="absolute -top-10 left-0 text-[100px] font-black opacity-5 italic select-none orbitron uppercase">Audit</div>
                <div class="relative z-10">
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                        FINANZAS <span class="text-cyan-400">ELITE</span>
                    </h1>
                    <p class="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] orbitron mt-4">
                        Quantum-SAP Auditor // Authorized by W.J. Urquijo
                    </p>
                </div>
                
                <div class="flex flex-wrap gap-4 items-center bg-[#0d1117] p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                    <div class="flex flex-col px-4 border-r border-white/10">
                        <label class="text-[8px] orbitron text-cyan-500 font-black mb-1 italic">RANGO DE AUDITORÍA ANALÍTICA</label>
                        <div class="flex gap-2">
                            <input type="date" id="fechaInicio" class="bg-transparent text-xs font-bold text-white outline-none cursor-pointer">
                            <span class="text-slate-600 text-xs font-black">>></span>
                            <input type="date" id="fechaFin" class="bg-transparent text-xs font-bold text-white outline-none cursor-pointer">
                        </div>
                    </div>
                    <button id="btnFiltrar" class="w-12 h-12 bg-cyan-500 text-black rounded-xl hover:rotate-180 transition-all duration-500 flex items-center justify-center">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button id="btnExportarExcel" class="px-8 py-4 bg-emerald-600 text-black rounded-xl flex items-center gap-4 hover:bg-white transition-all font-black">
                        <i class="fas fa-file-excel"></i>
                        <span class="orbitron text-[10px] uppercase">Exportar SAP-XLSX</span>
                    </button>
                </div>
            </header>

            <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12"></div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                <div class="lg:col-span-8 bg-gradient-to-br from-[#0d1117] to-[#010409] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
                     <div class="flex flex-col md:flex-row items-center gap-10 relative z-10">
                        <div class="relative w-32 h-32 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/30">
                            <div class="text-center">
                                <span class="text-[8px] orbitron text-slate-500 block uppercase">Balance</span>
                                <span id="roiPct" class="text-xl font-black orbitron text-cyan-400">0%</span>
                            </div>
                        </div>
                        <div class="flex-1">
                            <h5 class="text-[10px] font-black uppercase text-cyan-400 mb-2 orbitron tracking-widest italic">NEXUS-AI Operational Advisor</h5>
                            <div id="txtConsejo" class="text-lg text-slate-300 leading-tight font-medium italic border-l-2 border-cyan-500 pl-6 py-2">Escaneando flujos de caja...</div>
                        </div>
                     </div>
                </div>

                <div class="lg:col-span-4 bg-[#0d1117] border border-red-500/30 rounded-[3rem] p-8 shadow-2xl">
                    <h3 class="orbitron text-[10px] font-black text-red-500 uppercase mb-6 flex items-center gap-2">
                        <i class="fas fa-skull-crossbones animate-pulse"></i> Fugas (Cancelaciones)
                    </h3>
                    <div id="listFuga" class="space-y-3 max-h-[200px] overflow-y-auto custom-scroll pr-2"></div>
                </div>
            </div>

            <div class="mb-12">
                <div class="flex items-center justify-between mb-8 border-l-4 border-emerald-500 pl-6">
                    <h3 class="text-[14px] font-black text-white uppercase tracking-[0.5em] orbitron">Performance <span class="text-emerald-500">& Nómina</span></h3>
                </div>
                <div id="gridNomina" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
            </div>

            <div class="mb-8 flex items-center justify-between border-l-4 border-cyan-500 pl-6">
                <h3 class="text-[14px] font-black text-white uppercase tracking-[0.5em] orbitron italic">Capital en <span class="text-cyan-500 uppercase">Rampa</span></h3>
                <div id="rampaCount" class="px-6 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full orbitron text-[10px] font-black text-cyan-400 italic tracking-widest">---</div>
            </div>
            <div id="gridRampa" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>
        </div>`;

        setupEvents();
        sincronizarNucleo();
    };

    const setupEvents = () => {
        document.getElementById("btnFiltrar").onclick = () => sincronizarNucleo(true);
        // Aquí conectaremos el exportarExcel de la v22.0.2
        const hoy = new Date();
        document.getElementById("fechaInicio").value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        document.getElementById("fechaFin").value = hoy.toISOString().split('T')[0];
    };

    const sincronizarNucleo = async () => {
        activeListeners.forEach(unsub => unsub());
        const fInicio = new Date(document.getElementById("fechaInicio").value + "T00:00:00");
        const fFin = new Date(document.getElementById("fechaFin").value + "T23:59:59");

        // 🟢 1. Sincronización con el PUC de Contabilidad
        const qCont = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snapCont = await getDocs(qCont);
        
        estadoFinanciero.cajaEfectiva = 0;
        estadoFinanciero.gastosOperativos = 0;
        
        snapCont.docs.forEach(doc => {
            const data = doc.data();
            const fechaDoc = data.creadoEn?.toDate();
            if (fechaDoc >= fInicio && fechaDoc <= fFin) {
                const monto = data.monto || 0;
                if (CATEGORIAS_SAP.INGRESOS.includes(data.tipo)) estadoFinanciero.cajaEfectiva += monto;
                if (CATEGORIAS_SAP.GASTOS.includes(data.tipo)) estadoFinanciero.gastosOperativos += monto;
            }
        });

        // 🔧 2. Telemetría de Órdenes (Cartera y Nómina)
        const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const unsubOrd = onSnapshot(qOrd, (snap) => {
            const ords = snap.docs.map(d => ({id: d.id, ...d.data()}));
            procesarRampaYFugas(ords);
            procesarNomina(ords);
        });
        activeListeners.push(unsubOrd);

        // 📦 3. Auditoría de Inventario
        const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
        const snapInv = await getDocs(qInv);
        estadoFinanciero.patrimonioStock = snapInv.docs.reduce((acc, d) => {
            const i = d.data();
            return acc + (Number(i.precioCosto || 0) * Number(i.stock || 0));
        }, 0);
        
        updateUI();
    };

    const procesarNomina = (ordenes) => {
        const comisionGlobal = 0.30; // 30% como estándar
        const nomina = {};
        estadoFinanciero.comisionesPendientes = 0;

        ordenes.forEach(o => {
            if (['LISTO', 'ENTREGADO'].includes(o.estado)) {
                const tecnico = o.tecnico_asignado || "POR_ASIGNAR";
                const mObra = o.items?.filter(i => i.tipo === 'SERVICIO')
                              .reduce((acc, i) => acc + (Number(i.venta) * Number(i.cantidad)), 0) || 0;
                const comi = mObra * comisionGlobal;
                
                if (!nomina[tecnico]) nomina[tecnico] = { total: 0, q: 0 };
                nomina[tecnico].total += comi;
                nomina[tecnico].q += 1;
                estadoFinanciero.comisionesPendientes += comi;
            }
        });
        renderNominaUI(nomina);
    };

    const updateUI = () => {
        const util = estadoFinanciero.cajaEfectiva - estadoFinanciero.gastosOperativos - estadoFinanciero.comisionesPendientes;
        const roi = estadoFinanciero.gastosOperativos > 0 ? (util / estadoFinanciero.gastosOperativos) * 100 : 0;

        document.getElementById("kpiGrid").innerHTML = `
            ${renderStatBox("Caja Neta (1105)", estadoFinanciero.cajaEfectiva, "fa-wallet", "text-emerald-400", "Recaudado Real")}
            ${renderStatBox("Proyectado (1305)", estadoFinanciero.cuentasPorCobrar, "fa-microchip", "text-cyan-400", "Capital en Rampa")}
            ${renderStatBox("Egresos (51)", estadoFinanciero.gastosOperativos, "fa-file-invoice-dollar", "text-red-400", "Costos Fijos/Variables")}
            ${renderStatBox("Pasivo Laboral", estadoFinanciero.comisionesPendientes, "fa-user-tag", "text-amber-400", "Comisiones Técnicos")}
        `;

        document.getElementById("roiPct").innerText = `${Math.round(roi)}%`;
        document.getElementById("txtConsejo").innerHTML = generarDiagnosticoIA(util);
    };

    const renderStatBox = (title, val, icon, color, subtitle) => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-cyan-500/20 transition-all shadow-2xl">
            <div class="flex items-center gap-4 mb-4 text-slate-500">
                <i class="fas ${icon} text-lg group-hover:${color} transition-all"></i>
                <h6 class="text-[9px] orbitron font-black uppercase tracking-widest">${title}</h6>
            </div>
            <p class="text-3xl font-black orbitron ${color}">$ ${Math.round(val).toLocaleString()}</p>
            <p class="text-[7px] text-slate-600 uppercase font-black mt-2 italic">${subtitle}</p>
        </div>`;

    const renderNominaUI = (data) => {
        const container = document.getElementById("gridNomina");
        if (!container) return;
        container.innerHTML = Object.entries(data).map(([nombre, s]) => `
            <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                <div>
                    <h4 class="text-xs font-black uppercase">${nombre}</h4>
                    <p class="text-[8px] text-slate-500 orbitron uppercase">${s.q} Órdenes Finalizadas</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-black orbitron text-emerald-400">$${Math.round(s.total).toLocaleString()}</p>
                    <p class="text-[7px] text-slate-600 uppercase">Comisión</p>
                </div>
            </div>`).join('');
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
                rampaHTML += `
                <div class="bg-black/40 p-5 rounded-3xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                    <div class="flex justify-between text-[8px] orbitron text-cyan-500 mb-2"><span>${o.estado}</span><i class="fas fa-clock"></i></div>
                    <p class="text-xs font-black uppercase truncate">${o.cliente || 'ANONIMO'}</p>
                    <p class="text-xl font-black orbitron text-white">${o.placa || 'UNIT'}</p>
                    <p class="text-[10px] text-slate-500 font-bold mt-2">DEUDA: $${totalOT.toLocaleString()}</p>
                </div>`;
            } else if (o.estado === 'CANCELADO') {
                fugaHTML += `
                <div class="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                    <span class="text-[9px] font-black orbitron uppercase">${o.placa}</span>
                    <span class="text-red-500 font-black orbitron text-[10px]">-$${totalOT.toLocaleString()}</span>
                </div>`;
            }
        });

        document.getElementById("gridRampa").innerHTML = rampaHTML;
        document.getElementById("listFuga").innerHTML = fugaHTML;
        document.getElementById("rampaCount").innerText = `${countRampa} Unidades en proceso`;
        updateUI();
    };

    const generarDiagnosticoIA = (utilidad) => {
        if (utilidad < 0) return `<span class="text-red-500 font-black underline uppercase">CRÍTICO:</span> Balance negativo detectado. <br><span class="text-white">AUDITORÍA:</span> Los gastos + comisiones superan los ingresos recaudados en el rango seleccionado. Urge liquidar Cartera (Rampa).`;
        return `<span class="text-emerald-400 font-black uppercase tracking-tighter italic">SISTEMA EN OPTIMIZACIÓN:</span> Utilidad real detectada tras deducir pasivos laborales. <br><span class="text-white">CONSEJO:</span> Proyecta el 15% de esta utilidad para reposición de equipo.`;
    };

    renderLayout();
}
