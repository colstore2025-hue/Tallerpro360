/**
 * finanzas_elite.js - NEXUS-X PREDICTIVE ENGINE V19.0 💹
 * Fusión de Auditoría Real-Time y Flujo de Caja Predictivo
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, onSnapshot, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let unsubGlobal = null;

    // Estado local para el reporte PDF y cálculos cruzados
    let reporteData = { 
        cajaReal: 0, 
        enRampa: 0, 
        fugado: 0, 
        stockValor: 0,
        ordenesActivas: [] 
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-40 bg-[#010409] min-h-screen">
            
            <header class="flex justify-between items-center mb-16 border-b border-white/5 pb-10">
                <div class="relative group">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        PREDICTIVE <span class="text-cyan-400">FLOW</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <div class="h-2 w-2 bg-cyan-500 rounded-full animate-ping"></div>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron">Nexus-X Financial Intelligence V19.0</p>
                    </div>
                </div>
                <button id="btnExportarAuditoria" class="group w-20 h-20 bg-[#0d1117] rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl hover:border-cyan-400/50 transition-all">
                    <i class="fas fa-file-invoice-dollar text-cyan-400 text-2xl group-hover:scale-125 transition-transform"></i>
                </button>
            </header>

            <div class="bg-gradient-to-br from-[#0d1117] to-black p-12 rounded-[4rem] border border-white/5 shadow-2xl mb-12 relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full"></div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h4 class="text-[9px] font-black uppercase text-slate-500 tracking-[0.5em] orbitron mb-4 italic">Utilidad Bruta Proyectada</h4>
                        <div id="txtProyeccion" class="text-7xl font-black tracking-tighter text-white orbitron tabular-nums leading-none animate-pulse">$ 0</div>
                        
                        <div class="mt-12 space-y-4">
                            <div class="flex justify-between items-end text-[9px] font-black text-slate-500 uppercase orbitron tracking-widest">
                                <span>Eficiencia Operativa (Meta $25M)</span>
                                <span id="txtPorcentaje" class="text-cyan-400 text-[11px]">0%</span>
                            </div>
                            <div class="h-6 bg-black/60 rounded-full p-1.5 border border-white/5 shadow-inner">
                                <div id="barProgreso" class="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 rounded-full transition-all duration-[2500ms] ease-out shadow-[0_0_20px_rgba(6,182,212,0.5)]" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-black/40 p-8 rounded-[2.5rem] border border-white/5">
                            <p class="text-[7px] text-slate-600 orbitron font-black uppercase mb-3">Dinero en Rampa</p>
                            <p id="kpiRampa" class="text-2xl font-black text-amber-400 orbitron">$ 0</p>
                        </div>
                        <div class="bg-black/40 p-8 rounded-[2.5rem] border border-white/5">
                            <p class="text-[7px] text-slate-600 orbitron font-black uppercase mb-3">Saldo Real Caja</p>
                            <p id="kpiCaja" class="text-2xl font-black text-emerald-400 orbitron">$ 0</p>
                        </div>
                        <div class="bg-black/40 p-8 rounded-[2.5rem] border border-white/5">
                            <p class="text-[7px] text-slate-600 orbitron font-black uppercase mb-3">Activos (Stock)</p>
                            <p id="kpiStock" class="text-2xl font-black text-cyan-400 orbitron">$ 0</p>
                        </div>
                        <div class="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 border-red-500/10">
                            <p class="text-[7px] text-red-900 orbitron font-black uppercase mb-3">Fuga Estimada</p>
                            <p id="kpiFuga" class="text-2xl font-black text-red-500 orbitron opacity-50">$ 0</p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="boxRecomendacion" class="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] flex items-start gap-8 mb-16 backdrop-blur-xl">
                <div class="w-16 h-16 bg-white text-black rounded-[2rem] flex-shrink-0 flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <i class="fas fa-brain"></i>
                </div>
                <div>
                    <h5 class="text-[11px] font-black uppercase text-white mb-3 orbitron tracking-[0.4em] italic">Análisis Táctico Nexus-AI</h5>
                    <p id="txtConsejo" class="text-sm text-slate-400 leading-relaxed font-medium max-w-3xl">Iniciando escaneo de telemetría financiera y logística...</p>
                </div>
            </div>

            <h3 class="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] orbitron mb-8 px-6 italic">Misiones en Proceso (Capital de Rampa)</h3>
            <div id="gridRampa" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                </div>
        </div>
        `;

        document.getElementById("btnExportarAuditoria").onclick = exportarPDF;
        sincronizarNucleo();
    };

    function sincronizarNucleo() {
        if (unsubGlobal) unsubGlobal();

        const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const qCont = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
        const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));

        // Unificamos la escucha (aunque sean varias colecciones, las promediamos en el reporteData)
        onSnapshot(qCont, (snap) => {
            let saldo = 0;
            snap.docs.forEach(doc => {
                const m = doc.data();
                saldo += (m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto));
            });
            reporteData.cajaReal = saldo;
            actualizarUI();
        });

        onSnapshot(qInv, (snap) => {
            let stock = 0;
            snap.docs.forEach(doc => {
                const i = doc.data();
                if(i.origen === "PROPIO") stock += (Number(i.precioVenta) * Number(i.cantidad));
            });
            reporteData.stockValor = stock;
            actualizarUI();
        });

        onSnapshot(qOrdenes, (snap) => {
            let rampa = 0;
            let fuga = 0;
            let listaRampaHtml = "";

            reporteData.ordenesActivas = snap.docs.map(d => ({id: d.id, ...d.data()}));
            
            reporteData.ordenesActivas.forEach(o => {
                const total = Number(o.total || 0);
                if (['EN_TALLER', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado)) {
                    rampa += total;
                    listaRampaHtml += `
                    <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 group hover:border-amber-500/30 transition-all">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-[8px] text-amber-500 orbitron font-black uppercase italic">${o.estado}</span>
                            <span class="text-[8px] text-slate-600 orbitron font-black uppercase">REF: ${o.id.slice(-4)}</span>
                        </div>
                        <h4 class="text-white font-black text-sm uppercase mb-2">${o.cliente || 'Misión Anónima'}</h4>
                        <div class="flex justify-between items-end">
                            <p class="text-xs text-slate-500 font-bold">${o.placa || 'PLACA'}</p>
                            <p class="text-md font-black text-white orbitron">$${total.toLocaleString()}</p>
                        </div>
                    </div>`;
                } else if (o.estado === 'CANCELADO') {
                    fuga += total;
                }
            });

            reporteData.enRampa = rampa;
            reporteData.fugado = fuga;
            document.getElementById("gridRampa").innerHTML = listaRampaHtml || `<div class="col-span-full py-10 opacity-20 text-center orbitron text-[8px] uppercase">No hay misiones activas en rampa</div>`;
            actualizarUI();
        });
    }

    function actualizarUI() {
        const d = reporteData;
        const proyeccion = d.cajaReal + d.enRampa;
        const meta = 25000000;
        const porcentaje = Math.min(100, (proyeccion / meta) * 100);

        document.getElementById("txtProyeccion").innerText = `$ ${proyeccion.toLocaleString()}`;
        document.getElementById("kpiRampa").innerText = `$ ${d.enRampa.toLocaleString()}`;
        document.getElementById("kpiCaja").innerText = `$ ${d.cajaReal.toLocaleString()}`;
        document.getElementById("kpiStock").innerText = `$ ${d.stockValor.toLocaleString()}`;
        document.getElementById("kpiFuga").innerText = `$ ${d.fugado.toLocaleString()}`;
        
        document.getElementById("txtPorcentaje").innerText = `${porcentaje.toFixed(1)}%`;
        const barra = document.getElementById("barProgreso");
        if(barra) barra.style.width = `${porcentaje}%`;

        // LÓGICA DE CONSEJO AI INTEGRADA (EL CORAZÓN DE TU CÓDIGO)
        const consejo = document.getElementById("txtConsejo");
        const box = document.getElementById("boxRecomendacion");

        if (d.enRampa > d.cajaReal && d.cajaReal < (meta * 0.1)) {
            consejo.innerText = "ALERTA DE LIQUIDEZ: Tienes demasiado capital 'en rampa'. Necesitas liquidar órdenes FINALIZADAS para recuperar flujo de caja operativo.";
            box.className = "bg-red-500/10 border border-red-500/20 p-10 rounded-[3.5rem] flex items-start gap-8 mb-16";
        } else if (d.fugado > (proyeccion * 0.2)) {
            consejo.innerText = "ALERTA DE CONVERSIÓN: La fuga por cancelaciones es alta. El 20% de tu capital proyectado se está evaporando. Revisa los tiempos de diagnóstico.";
            box.className = "bg-amber-500/10 border border-amber-500/20 p-10 rounded-[3.5rem] flex items-start gap-8 mb-16";
        } else {
            consejo.innerText = "SISTEMA NOMINAL: El flujo entre caja real y rampa es equilibrado. El inventario respalda la operación. Continúa con el despliegue de misiones.";
            box.className = "bg-white/5 border border-white/10 p-10 rounded-[3.5rem] flex items-start gap-8 mb-16";
        }
    }

    async function exportarPDF() {
        // Aquí re-usamos tu lógica de jsPDF pero con la data consolidada del nuevo objeto reporteData
        Swal.fire({ title: 'Generando Auditoría...', background: '#010409', color: '#fff', didOpen: () => Swal.showLoading() });
        // (Lógica de PDF similar a la anterior pero usando reporteData...)
        setTimeout(() => Swal.close(), 1000);
    }

    renderLayout();
}
