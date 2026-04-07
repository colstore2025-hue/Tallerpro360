/**
 * contabilidad.js - NEXUS-X LEDGER V18.5 "STARK" 💼
 * Inteligencia Financiera & Auditoría de Activos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";

export default async function contabilidad(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-right-10 duration-700 pb-40 bg-[#010409] min-h-screen">
            <header class="flex justify-between items-start mb-16 border-b border-white/5 pb-10">
                <div>
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        LEDGER <span class="text-amber-400">NXS</span><span class="text-slate-700 text-xl">.V18</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <div class="h-2 w-2 bg-amber-500 rounded-full animate-ping"></div>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron italic">Consolidado Fiscal & Auditoría Logística</p>
                    </div>
                </div>
                <div id="quick-stats" class="text-right hidden md:block">
                    <p class="text-[7px] text-slate-600 orbitron font-black uppercase mb-1">Estado de Conexión</p>
                    <span class="px-4 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[8px] font-black orbitron">ENLACE_ACTIVO</span>
                </div>
            </header>

            <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 mb-16 shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 right-0 p-10 opacity-5"><i class="fas fa-file-invoice-dollar text-8xl"></i></div>
                <p class="text-[10px] font-black uppercase text-amber-500 orbitron tracking-[0.4em] mb-8 italic">Módulo de Asientos y Ajustes</p>
                
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-5">
                        <label class="text-[7px] text-slate-500 font-black uppercase ml-4 mb-2 block">Concepto de la Operación</label>
                        <input id="acc-concepto" class="w-full bg-black/50 p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-amber-500 transition-all font-bold text-sm uppercase" placeholder="EJ: NOTA CRÉDITO POR GARANTÍA PLACA ABC-123">
                    </div>
                    <div class="lg:col-span-3">
                        <label class="text-[7px] text-slate-500 font-black uppercase ml-4 mb-2 block">Tipo de Movimiento</label>
                        <select id="acc-tipo" class="w-full bg-black/50 p-6 rounded-3xl text-amber-400 border border-white/5 outline-none font-black orbitron text-[10px] uppercase cursor-pointer">
                            <optgroup label="OPERATIVOS" class="bg-[#0d1117]">
                                <option value="ingreso">🟢 INGRESO ESTÁNDAR</option>
                                <option value="egreso">🔴 EGRESO / COSTO</option>
                            </optgroup>
                            <optgroup label="AJUSTES PROFESIONALES" class="bg-[#0d1117]">
                                <option value="nota_credito">🟠 NOTA CRÉDITO (DEVOLUCIÓN)</option>
                                <option value="perdida_taller">📉 AJUSTE POR PÉRDIDA/DAÑO</option>
                                <option value="ajuste_saldo">⚖️ AJUSTE DE SALDO (REDONDEO)</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="lg:col-span-4">
                        <label class="text-[7px] text-slate-500 font-black uppercase ml-4 mb-2 block">Valor de Transacción (COP)</label>
                        <input id="acc-monto" type="number" class="w-full bg-black/50 p-6 rounded-3xl text-white border border-white/5 outline-none font-black orbitron text-2xl" placeholder="0.00">
                    </div>
                </div>

                <div class="flex flex-col md:flex-row gap-4 mt-8">
                    <button id="btnGuardarFinanza" class="flex-[2] bg-white text-black font-black orbitron text-[12px] py-7 rounded-3xl hover:bg-amber-400 transition-all uppercase tracking-[0.4em] shadow-xl">
                        SINCRONIZAR LIBRO MAYOR
                    </button>
                    <button id="btnAuditoria" class="flex-1 bg-white/5 text-slate-400 font-black orbitron text-[9px] py-7 rounded-3xl border border-white/5 hover:bg-white/10 transition-all uppercase">
                        REPORTE DE AUDITORÍA
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 relative group">
                    <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-[0.4em] mb-4">Capital en Bóveda</p>
                    <h2 id="txtBalance" class="text-5xl font-black text-white orbitron tracking-tighter">$ 0</h2>
                    <div id="badgeEstado" class="mt-6 text-[7px] font-black py-2 px-6 rounded-full inline-block uppercase orbitron border transition-all">SINC_PENDING</div>
                </div>
                
                <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 md:col-span-2">
                    <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-[0.4em] mb-6">Analítica de Flujo (Últimos 30 días)</p>
                    <div class="flex items-end gap-1 h-20">
                        ${[40, 70, 45, 90, 65, 80, 30, 95, 50, 100].map(h => `<div class="flex-1 bg-amber-500/20 border-t border-amber-500/40 rounded-t-sm" style="height: ${h}%"></div>`).join('')}
                    </div>
                </div>
            </div>

            <h3 class="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] orbitron mb-10 px-6 italic">REGISTRO CRONOLÓGICO DE ASIENTOS</h3>
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
                list.innerHTML = `<div class="py-32 text-center opacity-10 orbitron text-xs tracking-widest uppercase">Bóveda sin registros</div>`;
                actualizarResumen(0);
                return;
            }

            let saldo = 0;
            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                const config = obtenerEstiloMovimiento(m.tipo);
                
                // Lógica de saldo: Ingresos suman, todo lo demás resta en este flujo
                const valor = Number(m.monto || 0);
                saldo += (m.tipo === 'ingreso') ? valor : -valor;

                return `
                <div class="group bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-white/20 transition-all duration-500 relative overflow-hidden">
                    <div class="absolute left-0 top-0 h-full w-1 ${config.border}"></div>
                    
                    <div class="flex items-center gap-6">
                        <div class="w-14 h-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center shadow-inner">
                            <i class="${config.icon} ${config.text} text-sm"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-3">
                                <p class="text-sm font-black text-white uppercase tracking-tight">${m.concepto}</p>
                                <span class="text-[7px] font-black orbitron px-3 py-1 rounded-full ${config.bg} ${config.text} border ${config.border}">${m.tipo.replace('_', ' ')}</span>
                            </div>
                            <p class="text-[8px] text-slate-600 font-black orbitron mt-2 uppercase tracking-widest italic">
                                Sinc: ${m.creadoEn?.toDate ? m.creadoEn.toDate().toLocaleString() : 'PENDIENTE...'}
                            </p>
                        </div>
                    </div>
                    <div class="text-right mt-4 md:mt-0 w-full md:w-auto">
                        <p class="text-2xl font-black orbitron ${config.text}">
                            ${m.tipo === 'ingreso' ? '+' : '-'} $${valor.toLocaleString()}
                        </p>
                    </div>
                </div>`;
            }).join("");

            actualizarResumen(saldo);
        });
    }

    const obtenerEstiloMovimiento = (tipo) => {
        const map = {
            ingreso: { icon: 'fas fa-arrow-up', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            egreso: { icon: 'fas fa-arrow-down', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            nota_credito: { icon: 'fas fa-undo', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            perdida_taller: { icon: 'fas fa-car-crash', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            ajuste_saldo: { icon: 'fas fa-balance-scale', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' }
        };
        return map[tipo] || map.egreso;
    };

    const actualizarResumen = (total) => {
        const txt = document.getElementById("txtBalance");
        const badge = document.getElementById("badgeEstado");
        txt.innerText = `$ ${total.toLocaleString()}`;
        
        if (total >= 0) {
            txt.className = "text-5xl font-black text-emerald-400 orbitron tracking-tighter";
            badge.innerText = "CAPITAL_ESTABLE";
            badge.className = "mt-6 text-[7px] font-black py-2 px-6 rounded-full inline-block uppercase orbitron bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
        } else {
            txt.className = "text-5xl font-black text-red-500 orbitron tracking-tighter";
            badge.innerText = "RIESGO_LIQUIDEZ";
            badge.className = "mt-6 text-[7px] font-black py-2 px-6 rounded-full inline-block uppercase orbitron bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse";
        }
    };

    async function registrarMovimiento() {
        const concepto = document.getElementById("acc-concepto").value.toUpperCase();
        const tipo = document.getElementById("acc-tipo").value;
        const monto = Number(document.getElementById("acc-monto").value);

        if (!concepto || monto <= 0) {
            return Swal.fire({ icon: 'error', title: 'DATOS INVÁLIDOS', background: '#0d1117', color: '#fff' });
        }

        const btn = document.getElementById("btnGuardarFinanza");
        btn.disabled = true;
        btn.innerText = "INYECTANDO DATOS...";

        try {
            await createDocument("contabilidad", {
                concepto,
                tipo,
                monto,
                creadoEn: serverTimestamp()
            });

            saveLog("LEDGER_ENTRY", { concepto, tipo, monto });
            
            document.getElementById("acc-concepto").value = "";
            document.getElementById("acc-monto").value = "";
            btn.disabled = false;
            btn.innerText = "SINCRONIZAR LIBRO MAYOR";
            
        } catch (e) {
            btn.disabled = false;
            btn.innerText = "REINTENTAR ENLACE";
        }
    }

    renderLayout();
}
