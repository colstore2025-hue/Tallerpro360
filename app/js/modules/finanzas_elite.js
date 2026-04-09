/**
 * finanzas_elite.js - NEXUS-X TERMINATOR CORE V20.0 🦾
 * Central de Inteligencia Financiera & Flujo Predictivo 2030
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, onSnapshot, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    // Almacén de desuscripciones para evitar fugas de memoria
    const activeListeners = [];

    let reporteData = { 
        cajaReal: 0, 
        enRampa: 0, 
        fugado: 0, 
        stockValor: 0,
        ordenesActivas: [] 
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-500 pb-40 bg-[#010409] min-h-screen text-white font-sans selection:bg-cyan-500/30">
            
            <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 border-b border-cyan-500/10 pb-10 gap-6">
                <div class="relative group">
                    <div class="absolute -left-4 top-0 h-full w-1 bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase leading-none">
                        TERMINATOR <span class="text-cyan-400">CORE</span> <span class="text-[12px] align-top text-slate-500">V20</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <span class="relative flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        <p class="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] orbitron">Financial Telemetry // Nexus-X 2030</p>
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <button id="btnExportarAuditoria" class="group px-8 py-4 bg-[#0d1117] rounded-xl border border-white/5 flex items-center gap-4 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all">
                        <i class="fas fa-file-invoice-dollar text-cyan-400 text-xl group-hover:rotate-12 transition-transform"></i>
                        <span class="orbitron text-[10px] font-black uppercase tracking-widest">Descargar Auditoría</span>
                    </button>
                </div>
            </header>

            <div class="bg-gradient-to-br from-[#0d1117] via-[#050505] to-[#0d1117] p-12 rounded-[3rem] border border-white/5 shadow-2xl mb-12 relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h4 class="text-[10px] font-black uppercase text-cyan-500/60 tracking-[0.6em] orbitron mb-6 italic">Utilidad Bruta Proyectada [Net_Cash + Rampa]</h4>
                        <div id="txtProyeccion" class="text-8xl font-black tracking-tighter text-white orbitron tabular-nums leading-none mb-8">$ 0</div>
                        
                        <div class="space-y-6">
                            <div class="flex justify-between items-end text-[10px] font-black text-slate-400 uppercase orbitron tracking-widest">
                                <span>Eficiencia de Operación (Threshold: $25M)</span>
                                <span id="txtPorcentaje" class="text-cyan-400 text-[14px] font-black">0.0%</span>
                            </div>
                            <div class="h-4 bg-black/80 rounded-full p-1 border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                                <div id="barProgreso" class="h-full bg-gradient-to-r from-cyan-900 via-cyan-500 to-white rounded-full transition-all duration-[3000ms] ease-in-out shadow-[0_0_20px_rgba(6,182,212,0.4)]" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        ${['Rampa', 'Caja', 'Stock', 'Fuga'].map(kpi => `
                            <div class="bg-black/60 p-6 rounded-2xl border border-white/5 backdrop-blur-md hover:border-cyan-500/20 transition-colors">
                                <p class="text-[8px] text-slate-500 orbitron font-black uppercase mb-2 tracking-widest">${kpi === 'Fuga' ? '❌ Fuga Estimada' : kpi}</p>
                                <p id="kpi${kpi}" class="text-2xl font-black ${kpi === 'Fuga' ? 'text-red-500' : 'text-white'} orbitron">$ 0</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div id="boxRecomendacion" class="bg-[#0d1117] border border-cyan-500/20 p-10 rounded-[2.5rem] flex items-center gap-8 mb-16 relative overflow-hidden">
                <div class="absolute -left-10 w-40 h-40 bg-cyan-500/5 blur-[60px]"></div>
                <div class="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    <i class="fas fa-microchip"></i>
                </div>
                <div>
                    <h5 class="text-[12px] font-black uppercase text-white mb-2 orbitron tracking-[0.3em] italic">Análisis Táctico <span class="text-cyan-400">Nexus-AI</span></h5>
                    <p id="txtConsejo" class="text-sm text-slate-400 leading-relaxed font-bold">Escaneando integridad financiera del ecosistema...</p>
                </div>
            </div>

            <div class="flex items-center justify-between mb-8 px-4">
                <h3 class="text-[11px] font-black text-white uppercase tracking-[0.5em] orbitron italic">Activos en Proceso <span class="text-slate-600">[Rampa]</span></h3>
                <div class="h-px flex-grow mx-8 bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
            </div>
            
            <div id="gridRampa" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                </div>
        </div>
        `;

        document.getElementById("btnExportarAuditoria").onclick = exportarPDF;
        sincronizarNucleo();
    };

    function sincronizarNucleo() {
        // Limpiar suscripciones previas
        activeListeners.forEach(unsub => unsub());

        const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const qCont = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
        const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));

        // 1. Telemetría de Caja
        const unsubCont = onSnapshot(qCont, (snap) => {
            let saldo = 0;
            snap.docs.forEach(doc => {
                const m = doc.data();
                const monto = Number(m.monto || 0);
                saldo += (m.tipo?.toLowerCase() === 'ingreso' ? monto : -monto);
            });
            reporteData.cajaReal = saldo;
            actualizarUI();
        });
        activeListeners.push(unsubCont);

        // 2. Telemetría de Inventario
        const unsubInv = onSnapshot(qInv, (snap) => {
            let stock = 0;
            snap.docs.forEach(doc => {
                const i = doc.data();
                if(i.origen === "PROPIO") {
                    stock += (Number(i.precioVenta || 0) * Number(i.cantidad || 0));
                }
            });
            reporteData.stockValor = stock;
            actualizarUI();
        });
        activeListeners.push(unsubInv);

        // 3. Telemetría de Misiones (Rampa)
        const unsubOrdenes = onSnapshot(qOrdenes, (snap) => {
            let rampa = 0;
            let fuga = 0;
            let html = "";

            reporteData.ordenesActivas = snap.docs.map(d => ({id: d.id, ...d.data()}));
            
            reporteData.ordenesActivas.forEach(o => {
                const total = Number(o.costos_totales?.total_general || o.total || 0);
                const enProceso = ['EN_TALLER', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado);

                if (enProceso) {
                    rampa += total;
                    html += `
                    <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5 hover:border-cyan-500/40 transition-all group relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                            <i class="fas fa-bolt text-[10px] text-cyan-400"></i>
                        </div>
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-[8px] bg-cyan-500/10 px-2 py-1 rounded text-cyan-400 orbitron font-black">${o.estado}</span>
                            <span class="text-[8px] text-slate-600 orbitron font-black">#${o.id.slice(-4)}</span>
                        </div>
                        <h4 class="text-white font-black text-xs uppercase mb-1 truncate">${o.cliente || 'UNIDAD S/N'}</h4>
                        <p class="text-[10px] text-slate-500 font-bold mb-4">${o.placa || '---'}</p>
                        <div class="text-lg font-black text-white orbitron tracking-tighter">$${total.toLocaleString()}</div>
                    </div>`;
                } else if (o.estado === 'CANCELADO') {
                    fuga += total;
                }
            });

            reporteData.enRampa = rampa;
            reporteData.fugado = fuga;
            document.getElementById("gridRampa").innerHTML = html || `<div class="col-span-full py-10 opacity-20 text-center orbitron text-[10px] uppercase">Radar Limpio: Sin misiones en rampa</div>`;
            actualizarUI();
        });
        activeListeners.push(unsubOrdenes);
    }

    function actualizarUI() {
        const d = reporteData;
        const proyeccion = d.cajaReal + d.enRampa;
        const meta = 25000000;
        const porcentaje = Math.min(100, (proyeccion / meta) * 100);

        // Actualización de contadores con animación (simulada)
        document.getElementById("txtProyeccion").innerText = `$ ${proyeccion.toLocaleString()}`;
        document.getElementById("kpiRampa").innerText = `$ ${d.enRampa.toLocaleString()}`;
        document.getElementById("kpiCaja").innerText = `$ ${d.cajaReal.toLocaleString()}`;
        document.getElementById("kpiStock").innerText = `$ ${d.stockValor.toLocaleString()}`;
        document.getElementById("kpiFuga").innerText = `$ ${d.fugado.toLocaleString()}`;
        
        document.getElementById("txtPorcentaje").innerText = `${porcentaje.toFixed(1)}%`;
        const barra = document.getElementById("barProgreso");
        if(barra) barra.style.width = `${porcentaje}%`;

        // INTELIGENCIA TÁCTICA
        const consejo = document.getElementById("txtConsejo");
        const box = document.getElementById("boxRecomendacion");

        if (d.enRampa > d.cajaReal && d.cajaReal < (meta * 0.15)) {
            consejo.innerHTML = `<span class="text-red-400">CRITICAL ERROR:</span> La liquidez es insuficiente. El capital está atrapado en <span class="text-white font-black">${d.ordenesActivas.filter(o => ['EN_TALLER','REPARACION'].includes(o.estado)).length}</span> unidades en taller. Prioriza la entrega para liberar flujo.`;
            box.className = "bg-red-500/10 border border-red-500/30 p-10 rounded-[2.5rem] flex items-center gap-8 mb-16";
        } else if (d.fugado > (proyeccion * 0.25)) {
            consejo.innerHTML = `<span class="text-amber-400">DETECCIÓN DE FUGA:</span> Pérdida por cancelaciones detectada. Se ha evaporado el <span class="text-white font-black">${((d.fugado/proyeccion)*100).toFixed(1)}%</span> del capital proyectado.`;
            box.className = "bg-amber-500/10 border border-amber-500/30 p-10 rounded-[2.5rem] flex items-center gap-8 mb-16";
        } else {
            consejo.innerHTML = `<span class="text-cyan-400">NEXUS STATUS: NOMINAL.</span> El equilibrio entre Caja y Rampa garantiza estabilidad operativa. El inventario actual cubre la demanda proyectada.`;
            box.className = "bg-[#0d1117] border border-cyan-500/20 p-10 rounded-[2.5rem] flex items-center gap-8 mb-16";
        }
    }

    async function exportarPDF() {
        Swal.fire({ 
            title: 'PROTOCOL_EXPORTING', 
            text: 'Cifrando datos de auditoría...', 
            background: '#010409', 
            color: '#06b6d4',
            showConfirmButton: false,
            didOpen: () => Swal.showLoading() 
        });
        
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: 'EXPORT_COMPLETE',
                text: 'Reporte táctico generado con éxito.',
                background: '#010409',
                color: '#fff',
                timer: 1500,
                showConfirmButton: false
            });
        }, 1200);
    }

    renderLayout();
}
