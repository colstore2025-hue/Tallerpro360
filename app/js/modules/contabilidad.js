/**
 * contabilidad.js - TallerPRO360 NEXUS-X V17.0 💼
 * Motor de Inteligencia Financiera: Control de Flujo de Caja (Arquitectura Raíz)
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";

export default async function contabilidad(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const mode = localStorage.getItem("nexus_mode");
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-right-10 duration-1000 pb-40">
            <header class="flex justify-between items-center mb-12 px-4">
                <div>
                    <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                        LEDGER <span class="text-amber-400">NEXUS</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-3">
                        <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.6em] orbitron">Control de Activos y Egresos</p>
                    </div>
                </div>
                <div class="w-16 h-16 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center shadow-2xl">
                    <i class="fas fa-vault text-amber-500 text-xl"></i>
                </div>
            </header>

            <div class="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3.5rem] border border-white/5 mb-12 shadow-2xl">
                <p class="text-[9px] font-black uppercase text-amber-500/60 orbitron tracking-[0.3em] mb-6 ml-4">Nuevo Movimiento</p>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="md:col-span-2">
                        <input id="acc-concepto" class="w-full bg-black/40 p-5 rounded-2xl text-white border border-white/5 outline-none focus:border-amber-500 transition-all font-bold text-sm" placeholder="CONCEPTO (Ej: Pago de Nomina)">
                    </div>
                    <div>
                        <select id="acc-tipo" class="w-full bg-black/40 p-5 rounded-2xl text-slate-300 border border-white/5 outline-none font-black orbitron text-[10px] uppercase">
                            <option value="ingreso">🟢 INGRESO</option>
                            <option value="egreso" selected>🔴 EGRESO</option>
                        </select>
                    </div>
                    <div>
                        <input id="acc-monto" type="number" class="w-full bg-black/40 p-5 rounded-2xl text-amber-400 border border-white/5 outline-none font-black orbitron text-lg" placeholder="$ 0.00">
                    </div>
                </div>
                <button id="btnGuardarFinanza" class="w-full mt-6 bg-amber-500 text-black font-black orbitron text-[11px] py-5 rounded-2xl hover:bg-amber-400 active:scale-95 transition-all uppercase tracking-[0.3em] shadow-xl shadow-amber-500/10">
                    Sincronizar Libro Mayor
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 px-2">
                <div class="bg-black/40 p-8 rounded-[3rem] border border-white/5 flex flex-col items-center">
                    <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-[0.4em] mb-2">Balance Disponible</p>
                    <h2 id="txtBalance" class="text-4xl font-black text-white orbitron tracking-tighter">$ 0</h2>
                </div>
                <div class="bg-black/40 p-8 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center">
                    <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-[0.4em] mb-3">Estatus de Caja</p>
                    <div id="badgeEstado" class="text-[9px] font-black py-2 px-6 rounded-full uppercase orbitron tracking-widest">Sincronizando...</div>
                </div>
            </div>

            <h3 class="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] orbitron mb-6 px-6 italic">Últimos Movimientos</h3>
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
        
        // ESTRATEGIA RAÍZ: Consulta a colección plana filtrando por empresaId
        const q = query(
            collection(db, "contabilidad"),
            where("empresaId", "==", empresaId),
            orderBy("creadoEn", "desc"),
            limit(30)
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                list.innerHTML = `<div class="py-20 text-center opacity-20 italic orbitron text-[10px] uppercase">Bóveda vacía</div>`;
                actualizarResumen(0);
                return;
            }

            let saldo = 0;
            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                const isIngreso = m.tipo === "ingreso";
                const valor = Number(m.monto || 0);
                
                saldo += isIngreso ? valor : -valor;

                return `
                <div class="group bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-amber-500/30 transition-all duration-500">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center">
                            <i class="fas ${isIngreso ? 'fa-plus text-emerald-500' : 'fa-minus text-red-500'} text-xs"></i>
                        </div>
                        <div>
                            <p class="text-xs font-black text-white uppercase tracking-tight">${m.concepto}</p>
                            <p class="text-[8px] text-slate-600 font-black orbitron mt-1">${m.creadoEn?.toDate ? m.creadoEn.toDate().toLocaleDateString() : 'PROCESANDO...'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-md font-black orbitron ${isIngreso ? 'text-emerald-400' : 'text-red-400'}">
                            ${isIngreso ? '+' : '-'} $${valor.toLocaleString()}
                        </p>
                    </div>
                </div>`;
            }).join("");

            actualizarResumen(saldo);
        });
    }

    const actualizarResumen = (total) => {
        const txt = document.getElementById("txtBalance");
        const badge = document.getElementById("badgeEstado");
        
        txt.innerText = `$ ${total.toLocaleString()}`;
        
        if (total >= 0) {
            txt.className = "text-4xl font-black text-emerald-400 orbitron tracking-tighter";
            badge.innerText = "Operación Saludable";
            badge.className = "text-[8px] font-black py-2 px-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase orbitron tracking-widest";
        } else {
            txt.className = "text-4xl font-black text-red-400 orbitron tracking-tighter";
            badge.innerText = "Déficit Detectado";
            badge.className = "text-[8px] font-black py-2 px-6 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase orbitron tracking-widest";
        }
    };

    async function registrarMovimiento() {
        if (mode === "SIMULATOR") {
            window.Swal.fire('MODO DEMO', 'Acceso a bóveda restringido.', 'info');
            return;
        }

        const concepto = document.getElementById("acc-concepto").value.toUpperCase();
        const tipo = document.getElementById("acc-tipo").value;
        const monto = Number(document.getElementById("acc-monto").value);

        if (!concepto || monto <= 0) return;

        const btn = document.getElementById("btnGuardarFinanza");
        btn.disabled = true;
        btn.innerText = "SINCRONIZANDO...";

        try {
            // Inyectamos empresaId automáticamente vía createDocument
            await createDocument("contabilidad", {
                concepto,
                tipo,
                monto,
                creadoEn: serverTimestamp()
            });

            saveLog("FINANZAS_UPDATE", { concepto, tipo, monto });
            
            document.getElementById("acc-concepto").value = "";
            document.getElementById("acc-monto").value = "";
            btn.disabled = false;
            btn.innerText = "Sincronizar Libro Mayor";
            
        } catch (e) {
            console.error("Fallo contable:", e);
            btn.disabled = false;
            btn.innerText = "Reintentar";
        }
    }

    renderLayout();
}
