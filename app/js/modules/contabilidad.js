/**
 * contabilidad.js - NEXUS-X LEDGER V18.5 "STARK" 💼
 * Inteligencia Financiera & Auditoría de Activos
 * FASE 1: ESTABILIZACIÓN SUPERADMIN
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; // Ajustado a compatibilidad
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";

export default async function contabilidad(container, state) {
    // Usamos el ID del estado o del storage para asegurar persistencia
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-right-10 duration-700 pb-40 bg-[#010409] min-h-screen text-white">
            <header class="flex justify-between items-start mb-16 border-b border-white/5 pb-10">
                <div>
                    <h1 class="orbitron text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        LEDGER <span class="text-amber-400">NXS</span><span class="text-slate-700 text-xl">.V18</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <div class="h-2 w-2 bg-amber-500 rounded-full animate-ping"></div>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron italic">Consolidado Fiscal & Auditoría de Activos</p>
                    </div>
                </div>
                <div id="quick-stats" class="text-right hidden md:block">
                    <p class="text-[7px] text-slate-600 orbitron font-black uppercase mb-1 italic">Nodo: ${empresaId}</p>
                    <span class="px-4 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[8px] font-black orbitron">SISTEMA_NOMINAL</span>
                </div>
            </header>

            <div class="bg-[#0d1117] p-8 lg:p-12 rounded-[3.5rem] border border-white/5 mb-16 shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><i class="fas fa-file-invoice-dollar text-8xl"></i></div>
                <p class="text-[10px] font-black uppercase text-amber-500 orbitron tracking-[0.4em] mb-8 italic">Registro de Asientos Contables</p>
                
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div class="lg:col-span-4">
                        <label class="text-[7px] text-slate-500 font-black uppercase ml-4 mb-2 block tracking-widest">Concepto Operativo</label>
                        <input id="acc-concepto" class="w-full bg-black/50 p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-amber-500 transition-all font-bold text-sm uppercase placeholder:text-slate-800" placeholder="Ej: PAGO ARRIENDO LOCAL ABRIL">
                    </div>
                    <div class="lg:col-span-3">
                        <label class="text-[7px] text-slate-500 font-black uppercase ml-4 mb-2 block tracking-widest">Protocolo de Movimiento</label>
                        <select id="acc-tipo" class="w-full bg-black/50 p-6 rounded-3xl text-amber-400 border border-white/5 outline-none font-black orbitron text-[10px] uppercase cursor-pointer focus:border-amber-500">
                            <optgroup label="ENTRADAS" class="bg-[#0d1117] text-emerald-500">
                                <option value="ingreso">🟢 INGRESO POR SERVICIOS</option>
                                <option value="capital">💎 INYECCIÓN DE CAPITAL</option>
                            </optgroup>
                            <optgroup label="SALIDAS (COSTOS/GASTOS)" class="bg-[#0d1117] text-red-500">
                                <option value="egreso">🔴 GASTO ADMINISTRATIVO</option>
                                <option value="nomina">👥 PAGO DE NÓMINA / STAFF</option>
                                <option value="servicios">⚡ SERVICIOS PÚBLICOS / RENTA</option>
                                <option value="repuestos">🛠️ COMPRA DE REPUESTOS (STOCK)</option>
                            </optgroup>
                            <optgroup label="AJUSTES DE AUDITORÍA" class="bg-[#0d1117] text-amber-500">
                                <option value="nota_credito">🟠 NOTA CRÉDITO / DEVOLUCIÓN</option>
                                <option value="ajuste_saldo">⚖️ AJUSTE DE REDONDEO</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="lg:col-span-5">
                        <label class="text-[7px] text-slate-500 font-black uppercase ml-4 mb-2 block tracking-widest">Valor Transacción (COP)</label>
                        <div class="relative">
                            <span class="absolute left-6 top-1/2 -translate-y-1/2 orbitron text-amber-500 font-black text-xl">$</span>
                            <input id="acc-monto" type="number" class="w-full bg-black/50 p-6 pl-12 rounded-3xl text-white border border-white/5 outline-none font-black orbitron text-2xl focus:border-amber-500 transition-all" placeholder="0.00">
                        </div>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row gap-4 mt-10">
                    <button id="btnGuardarFinanza" class="flex-[2] bg-white text-black font-black orbitron text-[12px] py-7 rounded-3xl hover:bg-amber-400 transition-all uppercase tracking-[0.4em] shadow-xl group">
                        <i class="fas fa-sync-alt mr-2 group-hover:rotate-180 transition-all duration-700"></i> SINCRONIZAR LIBRO MAYOR
                    </button>
                    <button id="btnDescargarReporte" class="flex-1 bg-white/5 text-slate-400 font-black orbitron text-[9px] py-7 rounded-3xl border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest">
                        <i class="fas fa-download mr-2"></i> EXPORTAR LIBRO (PDF)
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                    <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-[0.4em] mb-4">Capital Líquido</p>
                    <h2 id="txtBalance" class="text-5xl font-black text-white orbitron tracking-tighter">$ 0</h2>
                    <div id="badgeEstado" class="mt-6 text-[7px] font-black py-2 px-6 rounded-full inline-block uppercase orbitron border transition-all">ANALIZANDO...</div>
                </div>
                
                <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 md:col-span-2 relative">
                    <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-[0.4em] mb-6">Métrica de Flujo de Efectivo</p>
                    <div class="flex items-end gap-2 h-20">
                        ${[20, 50, 35, 80, 45, 90, 30, 60, 50, 100].map(h => `<div class="flex-1 bg-gradient-to-t from-amber-600/20 to-amber-400/40 border-t border-amber-500/50 rounded-t-lg transition-all hover:scale-y-110" style="height: ${h}%"></div>`).join('')}
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between mb-10 px-6">
                <h3 class="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] orbitron italic">Historial de Asientos</h3>
                <div class="h-px flex-1 bg-white/5 mx-10"></div>
            </div>

            <div id="listaFinanzas" class="space-y-4 px-2">
                </div>
        </div>
        `;

        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        
        const list = document.getElementById("listaFinanzas");
        const q = query(
            collection(db, "contabilidad"),
            where("empresaId", "==", empresaId),
            orderBy("creadoEn", "desc"),
            limit(50)
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                list.innerHTML = `<div class="py-32 text-center opacity-10 orbitron text-xs tracking-widest uppercase">Nodo de datos vacío</div>`;
                actualizarResumen(0);
                return;
            }

            let saldo = 0;
            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                const config = obtenerEstiloMovimiento(m.tipo);
                const valor = Number(m.monto || 0);
                
                // Los ingresos y capital suman, el resto resta
                const esEntrada = (m.tipo === 'ingreso' || m.tipo === 'capital');
                saldo += esEntrada ? valor : -valor;

                return `
                <div class="group bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-white/20 transition-all duration-500 relative overflow-hidden">
                    <div class="absolute left-0 top-0 h-full w-1 ${config.border} shadow-[0_0_15px_${config.text.replace('text-', '')}]"></div>
                    
                    <div class="flex items-center gap-6">
                        <div class="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all">
                            <i class="${config.icon} ${config.text} text-lg"></i>
                        </div>
                        <div>
                            <div class="flex flex-wrap items-center gap-3">
                                <p class="text-sm font-black text-white uppercase tracking-tight">${m.concepto}</p>
                                <span class="text-[7px] font-black orbitron px-3 py-1 rounded-full ${config.bg} ${config.text} border ${config.border}">${m.tipo.replace('_', ' ')}</span>
                            </div>
                            <p class="text-[8px] text-slate-600 font-black orbitron mt-2 uppercase tracking-widest italic">
                                Timestamp: ${m.creadoEn?.toDate ? m.creadoEn.toDate().toLocaleString() : 'PROCESANDO EN NUBE...'}
                            </p>
                        </div>
                    </div>
                    <div class="text-right mt-4 md:mt-0 w-full md:w-auto">
                        <p class="text-3xl font-black orbitron ${config.text} italic">
                            ${esEntrada ? '+' : '-'} $${valor.toLocaleString()}
                        </p>
                    </div>
                </div>`;
            }).join("");

            actualizarResumen(saldo);
        });
    }

    function obtenerEstiloMovimiento(tipo) {
        const map = {
            ingreso: { icon: 'fas fa-arrow-up', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            capital: { icon: 'fas fa-gem', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            egreso: { icon: 'fas fa-arrow-down', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            nomina: { icon: 'fas fa-users-gear', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            servicios: { icon: 'fas fa-bolt', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            repuestos: { icon: 'fas fa-gears', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            nota_credito: { icon: 'fas fa-undo', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            ajuste_saldo: { icon: 'fas fa-balance-scale', text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
        };
        return map[tipo] || map.egreso;
    }

    function actualizarResumen(total) {
        const txt = document.getElementById("txtBalance");
        const badge = document.getElementById("badgeEstado");
        if(!txt || !badge) return;

        txt.innerText = `$ ${total.toLocaleString()}`;
        
        if (total >= 0) {
            txt.className = "text-5xl font-black text-emerald-400 orbitron tracking-tighter italic";
            badge.innerText = "NODO_EN_POSITIVO";
            badge.className = "mt-6 text-[7px] font-black py-2 px-6 rounded-full inline-block uppercase orbitron bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
        } else {
            txt.className = "text-5xl font-black text-red-500 orbitron tracking-tighter italic";
            badge.innerText = "DÉFICIT_DETECTADO";
            badge.className = "mt-6 text-[7px] font-black py-2 px-6 rounded-full inline-block uppercase orbitron bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse";
        }
    }

    async function registrarMovimiento() {
        const concepto = document.getElementById("acc-concepto").value.toUpperCase().trim();
        const tipo = document.getElementById("acc-tipo").value;
        const montoInput = document.getElementById("acc-monto").value;
        const monto = Number(montoInput);

        if (!concepto || !montoInput || monto <= 0) {
            return Swal.fire({ 
                icon: 'warning', 
                title: 'PROTOCOLO INCOMPLETO', 
                text: 'Debe ingresar un concepto y un valor válido.',
                background: '#0d1117', 
                color: '#fff',
                confirmButtonColor: '#f59e0b'
            });
        }

        const btn = document.getElementById("btnGuardarFinanza");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite-dish animate-spin mr-2"></i> TRANSMITIENDO...`;

        try {
            await createDocument("contabilidad", {
                empresaId,
                concepto,
                tipo,
                monto,
                creadoEn: serverTimestamp()
            });

            saveLog("CONTABILIDAD_REGISTRO", { concepto, tipo, monto });
            
            // Feedback de éxito
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'ASIENTO SINCRONIZADO',
                showConfirmButton: false,
                timer: 2000,
                background: '#0d1117',
                color: '#10b981'
            });

            document.getElementById("acc-concepto").value = "";
            document.getElementById("acc-monto").value = "";
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-sync-alt mr-2"></i> SINCRONIZAR LIBRO MAYOR`;
            
        } catch (e) {
            console.error("Error contable:", e);
            btn.disabled = false;
            btn.innerText = "FALLO DE ENLACE - REINTENTAR";
        }
    }

    renderLayout();
}
