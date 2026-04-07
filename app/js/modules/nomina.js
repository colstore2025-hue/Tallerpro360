/**
 * nomina.js - NEXUS-X PAYROLL ENGINE V25.5 🎖️
 * Sistema de Liquidación Táctica y Auditoría de Rendimiento
 * Optimizado para: GRATI-CORE, BÁSICO, PRO y ELITE
 */
import { 
    collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default function nomina(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let comisionesPendientes = {};

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-slate-100 animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col lg:flex-row justify-between items-end gap-8 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-4 top-0 h-full w-1 bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        PAYROLL <span class="text-orange-500">CORE</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Gestión de Activos y Liquidación Técnica</p>
                </div>
                
                <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><i class="fas fa-coins text-4xl text-orange-500"></i></div>
                    <p class="orbitron text-[8px] text-orange-500/60 mb-2 font-black uppercase tracking-widest italic">Pendiente por Dispersar</p>
                    <h2 id="gran-total-pendiente" class="orbitron text-4xl font-black text-white">$ 0</h2>
                </div>
            </header>

            <div class="bg-[#0d1117]/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 overflow-x-auto shadow-2xl">
                <table class="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-[0.3em]">
                            <th class="p-10 border-b border-white/5 italic">Unidad Operativa</th>
                            <th class="p-10 border-b border-white/5 italic">Carga de Misiones</th>
                            <th class="p-10 border-b border-white/5 italic">Acumulado Mano de Obra</th>
                            <th class="p-10 border-b border-white/5 text-right italic">Acción Táctica</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-cuerpo" class="divide-y divide-white/5">
                        </tbody>
                </table>
            </div>

            <div id="vacio-stats" class="hidden mt-32 text-center">
                <i class="fas fa-microchip text-7xl mb-6 text-slate-800 animate-pulse"></i>
                <p class="orbitron text-[10px] text-slate-600 uppercase tracking-[0.5em] italic">Protocolo Limpio: No hay comisiones por liquidar</p>
            </div>
        </div>`;
        
        escucharData();
    };

    const escucharData = () => {
        // Traemos órdenes que tengan ítems pero filtramos en JS para mayor flexibilidad
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));

        onSnapshot(q, (snap) => {
            comisionesPendientes = {};
            let totalGlobal = 0;

            snap.forEach(docSnap => {
                const orden = docSnap.data();
                const ordenId = docSnap.id;

                // REGLA: Solo liquidamos misiones de órdenes FINALIZADAS o ENTREGADAS
                const estadoValido = ['FINALIZADO', 'ENTREGADO', 'CERRADO'].includes((orden.estado || '').toUpperCase());

                if (estadoValido && orden.items) {
                    orden.items.forEach((it, index) => {
                        // it.tipo === 'ORO' (Mano de Obra) y que no esté pagado
                        if (it.tipo === 'ORO' && !it.pagado) {
                            const tec = (it.tecnico || "OPERADOR_X").toUpperCase();
                            if (!comisionesPendientes[tec]) {
                                comisionesPendientes[tec] = { total: 0, misiones: [], nombre: tec };
                            }
                            const valor = Number(it.valor || 0);
                            comisionesPendientes[tec].total += valor;
                            comisionesPendientes[tec].misiones.push({ 
                                ordenId, 
                                itemIndex: index, 
                                placa: orden.placa || 'SIN-PLACA', 
                                valor: valor, 
                                desc: it.desc || 'Servicio Técnico'
                            });
                            totalGlobal += valor;
                        }
                    });
                }
            });

            actualizarUI(totalGlobal);
        });
    };

    const actualizarUI = (global) => {
        const cuerpo = document.getElementById("tabla-cuerpo");
        const totalTxt = document.getElementById("gran-total-pendiente");
        if(!cuerpo || !totalTxt) return;

        totalTxt.innerText = `$ ${global.toLocaleString("es-CO")}`;

        const keys = Object.keys(comisionesPendientes);
        if (keys.length === 0) {
            document.getElementById("vacio-stats").classList.remove("hidden");
            cuerpo.innerHTML = "";
            return;
        }

        document.getElementById("vacio-stats").classList.add("hidden");
        cuerpo.innerHTML = keys.map(key => {
            const data = comisionesPendientes[key];
            // Rango dinámico por volumen de misiones
            let rango = 'OPERATOR';
            let color = 'text-cyan-400 bg-cyan-400/10';
            
            if(data.misiones.length > 10) { rango = 'MASTER ELITE'; color = 'text-purple-400 bg-purple-400/10'; }
            else if(data.misiones.length > 5) { rango = 'COMMANDER'; color = 'text-orange-400 bg-orange-400/10'; }

            return `
            <tr class="hover:bg-white/[0.03] transition-all duration-500 group border-l-2 border-transparent hover:border-orange-600">
                <td class="p-10">
                    <div class="flex items-center gap-6">
                        <div class="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform font-black orbitron text-xl text-orange-500">
                            ${data.nombre.charAt(0)}
                        </div>
                        <div>
                            <p class="font-black text-white orbitron text-sm uppercase tracking-tight">${data.nombre}</p>
                            <span class="text-[7px] orbitron font-black px-3 py-1 rounded-md uppercase tracking-[0.2em] ${color}">${rango} NXS</span>
                        </div>
                    </div>
                </td>
                <td class="p-10">
                    <div class="flex flex-col gap-2">
                        <span class="text-white font-black orbitron text-[11px]">${data.misiones.length} <span class="text-slate-600 italic">PENDIENTES</span></span>
                        <div class="flex gap-1">
                            ${data.misiones.slice(0, 8).map(() => `<div class="h-1 w-3 bg-orange-600/40 rounded-full"></div>`).join('')}
                        </div>
                    </div>
                </td>
                <td class="p-10">
                    <p class="orbitron text-2xl font-black text-white italic tracking-tighter">$ ${data.total.toLocaleString("es-CO")}</p>
                    <p class="text-[7px] text-slate-600 font-black orbitron mt-1 uppercase">Validado por Nexus-X AI</p>
                </td>
                <td class="p-10 text-right">
                    <button onclick="window.liquidarTecnico('${key}')" class="group/btn relative overflow-hidden px-8 py-4 bg-white text-black rounded-2xl orbitron text-[9px] font-black hover:bg-orange-600 hover:text-white transition-all duration-500 shadow-xl">
                        <span class="relative z-10">LIQUIDAR CARGA</span>
                    </button>
                </td>
            </tr>`;
        }).join("");
    };

    window.liquidarTecnico = async (tecKey) => {
        const data = comisionesPendientes[tecKey];
        
        // Modal de Auditoría Previa
        const { isConfirmed } = await Swal.fire({
            title: 'PROTOCOL_PAYROLL_CONFIRM',
            background: '#0d1117',
            color: '#fff',
            html: `
                <div class="text-left space-y-4 max-h-[300px] overflow-y-auto p-2">
                    <div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-4">
                        <p class="text-[10px] orbitron text-orange-400 font-black">TOTAL A DISPERSAR:</p>
                        <p class="text-3xl font-black orbitron">$ ${data.total.toLocaleString("es-CO")}</p>
                    </div>
                    <p class="text-[8px] orbitron text-slate-500 font-black uppercase tracking-widest px-2">Desglose de Misiones:</p>
                    ${data.misiones.map(m => `
                        <div class="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                            <span class="orbitron text-[9px] font-black text-white">${m.placa}</span>
                            <span class="orbitron text-[9px] font-black text-orange-500">$ ${m.valor.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'AUTORIZAR PAGO',
            confirmButtonColor: '#ea580c',
            cancelButtonText: 'CANCELAR',
            customClass: { popup: 'rounded-[2.5rem] border border-white/10 shadow-2xl' }
        });

        if (isConfirmed) {
            Swal.fire({ title: 'PROCESANDO TRANSACCIÓN...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#0d1117', color: '#fff' });

            try {
                // Liquidar cada ítem en Firestore
                for (const m of data.misiones) {
                    const docRef = doc(db, "ordenes", m.ordenId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const items = [...snap.data().items];
                        if (items[m.itemIndex]) {
                            items[m.itemIndex].pagado = true;
                            items[m.itemIndex].auditInfo = {
                                fecha: new Date().toISOString(),
                                admin: localStorage.getItem("nexus_user") || 'NEXUS-ADMIN'
                            };
                            await updateDoc(docRef, { items });
                        }
                    }
                }

                // Registro en el Ledger Contable (Egreso)
                await addDoc(collection(db, "contabilidad"), {
                    empresaId,
                    tipo: 'egreso',
                    categoria: 'NOMINA_TECNICA',
                    monto: data.total,
                    concepto: `LIQUIDACIÓN: ${data.nombre} (${data.misiones.length} MISIONES)`,
                    operador: data.nombre,
                    creadoEn: serverTimestamp()
                });

                Swal.fire({ icon: 'success', title: 'PAGO REGISTRADO', background: '#0d1117', color: '#fff' });
            } catch (err) {
                console.error(err);
                Swal.fire({ icon: 'error', title: 'ERROR EN DISPERSIÓN', background: '#0d1117', color: '#fff' });
            }
        }
    };

    renderLayout();
}
