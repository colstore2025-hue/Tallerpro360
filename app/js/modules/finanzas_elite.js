/**
 * finanzas_elite.js - NEXUS-X TERMINATOR CORE V20.0 🦾
 * Central de Inteligencia Financiera & Flujo Predictivo 2030
 * Estrategia: Balance Scorecard Dinámico para Taller Automotriz
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, onSnapshot, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
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
        <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-500 pb-40 bg-[#010409] min-h-screen text-white selection:bg-cyan-500/30">
            
            <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 border-b border-white/5 pb-10 gap-6">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1.5 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase leading-none">
                        FINANZAS <span class="text-cyan-400">ELITE</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] orbitron font-black text-cyan-400 uppercase tracking-widest">Auditoría en Tiempo Real</span>
                        <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron">BSC Protocol // Nexus-X 2030</p>
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <button id="btnExportarAuditoria" class="group px-8 py-5 bg-white text-black rounded-2xl flex items-center gap-4 hover:bg-cyan-500 hover:text-white transition-all duration-500">
                        <i class="fas fa-file-pdf text-xl"></i>
                        <span class="orbitron text-[10px] font-black uppercase tracking-widest">Informe de Gerencia</span>
                    </button>
                </div>
            </header>

            <div class="bg-[#0d1117] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl mb-12 relative overflow-hidden group">
                <div class="absolute -right-20 -top-20 text-[15rem] text-white/5 font-black orbitron italic select-none">$$</div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <h4 class="text-[10px] font-black uppercase text-cyan-500 tracking-[0.6em] orbitron mb-6 italic">Capital Total en Operación</h4>
                        <div id="txtProyeccion" class="text-8xl font-black tracking-tighter text-white orbitron tabular-nums leading-none mb-8">$ 0</div>
                        
                        <div class="space-y-6">
                            <div class="flex justify-between items-end text-[10px] font-black text-slate-400 uppercase orbitron tracking-widest">
                                <span>Eficiencia de Conversión (Meta: $25M)</span>
                                <span id="txtPorcentaje" class="text-cyan-400 text-[14px] font-black">0.0%</span>
                            </div>
                            <div class="h-3 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                <div id="barProgreso" class="h-full bg-cyan-500 shadow-[0_0_15px_#06b6d4] transition-all duration-[2000ms] ease-out" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        ${[
                            {id: 'Rampa', label: 'En Rampa (OT)', icon: 'fa-truck-ramp-box', color: 'text-white'},
                            {id: 'Caja', label: 'Caja Real', icon: 'fa-vault', color: 'text-emerald-400'},
                            {id: 'Stock', label: 'Valor Bóveda', icon: 'fa-box-open', color: 'text-blue-400'},
                            {id: 'Fuga', label: 'Fuga (Cancelados)', icon: 'fa-radiation', color: 'text-red-500'}
                        ].map(kpi => `
                            <div class="bg-black/40 p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                                <div class="flex items-center gap-3 mb-4">
                                    <i class="fas ${kpi.icon} text-[10px] text-slate-500"></i>
                                    <p class="text-[8px] text-slate-500 orbitron font-black uppercase tracking-widest">${kpi.label}</p>
                                </div>
                                <p id="kpi${kpi.id}" class="text-2xl font-black ${kpi.color} orbitron tracking-tighter">$ 0</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div id="boxRecomendacion" class="bg-gradient-to-r from-[#0d1117] to-transparent border-l-4 border-cyan-500 p-12 rounded-r-[3rem] flex items-center gap-10 mb-16 transition-all duration-700">
                <div class="w-20 h-20 bg-white text-black rounded-3xl flex-shrink-0 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <i class="fas fa-brain"></i>
                </div>
                <div>
                    <h5 class="text-[12px] font-black uppercase text-white mb-2 orbitron tracking-[0.3em] italic">Estrategia Táctica <span class="text-cyan-400">Nexus-IA</span></h5>
                    <p id="txtConsejo" class="text-lg text-slate-400 leading-relaxed font-medium italic">Sincronizando flujos de trabajo con registros contables...</p>
                </div>
            </div>

            <div class="flex items-center justify-between mb-10 px-4">
                <div class="flex items-center gap-4">
                    <div class="h-6 w-1 bg-white"></div>
                    <h3 class="text-[12px] font-black text-white uppercase tracking-[0.5em] orbitron italic">Unidades en Proceso <span class="text-cyan-500">[Telemetría de Rampa]</span></h3>
                </div>
                <div id="rampaCount" class="orbitron text-[10px] font-black text-slate-500 bg-white/5 px-4 py-2 rounded-full uppercase">0 Misiones</div>
            </div>
            
            <div id="gridRampa" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                </div>
        </div>
        `;

        document.getElementById("btnExportarAuditoria").onclick = exportarPDF;
        sincronizarNucleo();
    };

    function sincronizarNucleo() {
        activeListeners.forEach(unsub => unsub());

        const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const qCont = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
        const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));

        // 📊 1. Flujo de Caja Real (Liquidez)
        activeListeners.push(onSnapshot(qCont, (snap) => {
            let saldo = 0;
            snap.docs.forEach(doc => {
                const m = doc.data();
                saldo += (m.tipo?.toLowerCase() === 'ingreso' ? Number(m.monto || 0) : -Number(m.monto || 0));
            });
            reporteData.cajaReal = saldo;
            actualizarUI();
        }));

        // 📦 2. Valor de Activos en Bóveda (Inversión)
        activeListeners.push(onSnapshot(qInv, (snap) => {
            let stock = 0;
            snap.docs.forEach(doc => {
                const i = doc.data();
                if(i.origen === "PROPIO") stock += (Number(i.precioVenta || 0) * Number(i.cantidad || 0));
            });
            reporteData.stockValor = stock;
            actualizarUI();
        }));

        // 🔧 3. Gestión de Rampa (Procesos)
        activeListeners.push(onSnapshot(qOrdenes, (snap) => {
            let rampa = 0; let fuga = 0; let html = "";
            reporteData.ordenesActivas = snap.docs.map(d => ({id: d.id, ...d.data()}));
            
            const activas = reporteData.ordenesActivas.filter(o => ['EN_TALLER', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado));
            
            activas.forEach(o => {
                const total = Number(o.costos_totales?.total_general || o.total || 0);
                rampa += total;
                html += `
                <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5 hover:border-cyan-500/50 transition-all group relative overflow-hidden">
                    <div class="flex justify-between items-start mb-6">
                        <span class="text-[7px] bg-cyan-500 text-black px-3 py-1 rounded-full orbitron font-black uppercase tracking-tighter">${o.estado}</span>
                        <i class="fas fa-microchip text-slate-800 group-hover:text-cyan-500 transition-colors"></i>
                    </div>
                    <h4 class="text-white font-black text-sm uppercase mb-1 truncate tracking-tighter">${o.cliente}</h4>
                    <p class="text-[10px] text-slate-500 font-bold mb-6 orbitron">${o.placa || 'S/N'}</p>
                    <div class="flex justify-between items-end border-t border-white/5 pt-4">
                        <p class="text-[8px] text-slate-600 orbitron font-black uppercase">Subtotal</p>
                        <div class="text-xl font-black text-white orbitron tracking-tighter">$${total.toLocaleString()}</div>
                    </div>
                </div>`;
            });

            reporteData.ordenesActivas.forEach(o => {
                if(o.estado === 'CANCELADO') fuga += Number(o.costos_totales?.total_general || o.total || 0);
            });

            reporteData.enRampa = rampa;
            reporteData.fugado = fuga;
            document.getElementById("gridRampa").innerHTML = html || `<div class="col-span-full py-20 opacity-20 text-center orbitron text-[10px] uppercase tracking-[1em]">Zona Despejada: Sin misiones activas</div>`;
            document.getElementById("rampaCount").innerText = `${activas.length} Misiones Activas`;
            actualizarUI();
        }));
    }

    function actualizarUI() {
        const d = reporteData;
        const proyeccion = d.cajaReal + d.enRampa;
        const meta = 25000000; // Meta estratégica
        const porcentaje = Math.min(100, (proyeccion / meta) * 100);

        document.getElementById("txtProyeccion").innerText = `$ ${proyeccion.toLocaleString()}`;
        document.getElementById("kpiRampa").innerText = `$ ${d.enRampa.toLocaleString()}`;
        document.getElementById("kpiCaja").innerText = `$ ${d.cajaReal.toLocaleString()}`;
        document.getElementById("kpiStock").innerText = `$ ${d.stockValor.toLocaleString()}`;
        document.getElementById("kpiFuga").innerText = `$ ${d.fugado.toLocaleString()}`;
        
        document.getElementById("txtPorcentaje").innerText = `${porcentaje.toFixed(1)}%`;
        const barra = document.getElementById("barProgreso");
        if(barra) barra.style.width = `${porcentaje}%`;

        // LÓGICA DE BALANCE SCORECARD (BSC)
        const consejo = document.getElementById("txtConsejo");
        const box = document.getElementById("boxRecomendacion");

        if (d.enRampa > d.cajaReal * 2) {
            consejo.innerHTML = `<span class="text-cyan-400 uppercase font-black">Alerta de Cuello de Botella:</span> Tienes demasiado capital atrapado en el taller. <span class="text-white font-bold">Acelera las salidas</span> para convertir rampa en caja real. Tu liquidez actual es de solo el <span class="text-white">${((d.cajaReal/proyeccion)*100).toFixed(0)}%</span> del total.`;
            box.style.borderColor = "#06b6d4";
        } else if (d.fugado > (proyeccion * 0.10)) {
            consejo.innerHTML = `<span class="text-red-500 uppercase font-black">Fuga de Oportunidad:</span> Las cancelaciones están drenando tu utilidad. Revisa el protocolo de <span class="text-white font-bold">Cierre de Ventas</span> y anticipos para asegurar el compromiso del cliente.`;
            box.style.borderColor = "#ef4444";
        } else {
            consejo.innerHTML = `<span class="text-emerald-400 uppercase font-black">Salud Nominal:</span> El flujo proyectado está alineado. Es un buen momento para <span class="text-white font-bold">reinvertir el stock de la bóveda</span> en repuestos de alta rotación para maximizar el ROI.`;
            box.style.borderColor = "#10b981";
        }
    }

    async function exportarPDF() {
        // Lógica de feedback visual con SweetAlert2
        Swal.fire({ 
            title: 'GENERANDO AUDITORÍA', 
            html: '<p class="orbitron text-[10px] text-cyan-500">Compilando estados financieros y telemetría de rampa...</p>',
            background: '#010409', 
            color: '#fff',
            showConfirmButton: false,
            didOpen: () => Swal.showLoading() 
        });
        setTimeout(() => Swal.close(), 1500);
    }

    renderLayout();
}
