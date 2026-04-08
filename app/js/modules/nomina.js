/**
 * nomina.js - NEXUS-X PAYROLL ENGINE V25.5 🎖️
 * Sistema de Liquidación Táctica, Auditoría de Rendimiento y Nómina Legal
 * Integrado con: ordenes.js, contabilidad.js y staff.js
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default function nomina(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let comisionesPendientes = {};
    let staffData = [];

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
                
                <div class="flex gap-4">
                    <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <p class="orbitron text-[8px] text-orange-500/60 mb-2 font-black uppercase tracking-widest italic">Pendiente por Dispersar</p>
                        <h2 id="gran-total-pendiente" class="orbitron text-4xl font-black text-white">$ 0</h2>
                    </div>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                <button id="btnNominaFija" class="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-orange-600 transition-all group">
                    <i class="fas fa-file-contract text-orange-500 group-hover:text-white mb-4 text-2xl"></i>
                    <p class="orbitron text-[10px] font-black group-hover:text-white uppercase">Generar Nómina Legal CO</p>
                </button>
            </div>

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
                    <tbody id="tabla-cuerpo" class="divide-y divide-white/5"></tbody>
                </table>
            </div>

            <div id="vacio-stats" class="hidden mt-32 text-center opacity-20">
                <i class="fas fa-microchip text-7xl mb-6"></i>
                <p class="orbitron text-[10px] uppercase tracking-[0.5em] italic">Protocolo Limpio: No hay comisiones pendientes</p>
            </div>
        </div>`;
        
        document.getElementById("btnNominaFija").onclick = modalNominaLegal;
        escucharData();
    };

    const escucharData = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            comisionesPendientes = {};
            let totalGlobal = 0;

            snap.forEach(docSnap => {
                const orden = docSnap.data();
                const ordenId = docSnap.id;
                const estadoValido = ['FINALIZADO', 'ENTREGADO', 'CERRADO'].includes((orden.estado || '').toUpperCase());

                if (estadoValido && orden.items) {
                    orden.items.forEach((it, index) => {
                        if (it.tipo === 'ORO' && !it.pagado) {
                            const tec = (it.tecnico || "OPERADOR_X").toUpperCase();
                            if (!comisionesPendientes[tec]) {
                                comisionesPendientes[tec] = { total: 0, misiones: [], nombre: tec };
                            }
                            const valor = Number(it.valor || 0);
                            comisionesPendientes[tec].total += valor;
                            comisionesPendientes[tec].misiones.push({ 
                                ordenId, itemIndex: index, placa: orden.placa || 'N/A', valor: valor, desc: it.desc || 'Servicio Técnico'
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
            return `
            <tr class="hover:bg-white/[0.03] transition-all duration-500 group border-l-2 border-transparent hover:border-orange-600">
                <td class="p-10">
                    <div class="flex items-center gap-6">
                        <div class="h-14 w-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center font-black orbitron text-xl text-orange-500">
                            ${data.nombre.charAt(0)}
                        </div>
                        <div>
                            <p class="font-black text-white orbitron text-sm uppercase">${data.nombre}</p>
                            <span class="text-[7px] orbitron font-black px-3 py-1 rounded-md uppercase bg-orange-500/10 text-orange-500">MISIONERO NXS</span>
                        </div>
                    </div>
                </td>
                <td class="p-10 font-black orbitron text-[11px] text-white">
                    ${data.misiones.length} MISIONES
                </td>
                <td class="p-10 text-2xl font-black text-white orbitron italic">$ ${data.total.toLocaleString("es-CO")}</td>
                <td class="p-10 text-right">
                    <button onclick="window.liquidarTecnico('${key}')" class="px-8 py-4 bg-white text-black rounded-2xl orbitron text-[9px] font-black hover:bg-orange-600 hover:text-white transition-all">LIQUIDAR CARGA</button>
                </td>
            </tr>`;
        }).join("");
    };

    // --- MÓDULO DE NÓMINA LEGAL COLOMBIA ---
    const modalNominaLegal = async () => {
        const smmlv = 1300000; // Salario Mínimo 2024
        const auxTrans = 162000; 

        const { value: f } = await Swal.fire({
            title: 'NÓMINA LEGAL COLOMBIA',
            background: '#010409', color: '#fff',
            customClass: { popup: 'rounded-[3rem] border border-white/10 shadow-3xl' },
            html: `
                <div class="space-y-4 p-4 mt-4 text-left">
                    <label class="text-[9px] orbitron font-black text-slate-500 ml-4">NOMBRE DEL COLABORADOR</label>
                    <input id="nom-nombre" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-orange-500 uppercase font-bold" placeholder="NOMBRE COMPLETO">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">SUELDO BASE</label>
                            <input id="nom-base" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-orange-500" value="${smmlv}">
                        </div>
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">BONOS / OTROS</label>
                            <input id="nom-bono" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-orange-500" value="0">
                        </div>
                    </div>
                    <div class="p-6 bg-orange-500/5 rounded-3xl border border-orange-500/10">
                        <p class="text-[8px] orbitron font-black text-orange-500 mb-2">DEDUCCIONES AUTOMÁTICAS (LEY CO):</p>
                        <ul class="text-[10px] space-y-1 text-slate-400 font-bold uppercase">
                            <li>Salud: 4% | Pensión: 4%</li>
                            <li>Aporte Empresa: Salud 8.5%, Pensión 12%</li>
                        </ul>
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'PROCESAR NÓMINA',
            preConfirm: () => {
                const nombre = document.getElementById('nom-nombre').value;
                const base = Number(document.getElementById('nom-base').value);
                const bono = Number(document.getElementById('nom-bono').value);
                if(!nombre || base <= 0) return Swal.showValidationMessage("Datos incompletos");
                
                const salud = base * 0.04;
                const pension = base * 0.04;
                const neto = (base + bono + (base <= smmlv * 2 ? auxTrans : 0)) - (salud + pension);
                
                return { nombre, base, bono, neto, salud, pension, auxTrans: (base <= smmlv * 2 ? auxTrans : 0) };
            }
        });

        if(f) {
            await addDoc(collection(db, "contabilidad"), {
                empresaId,
                tipo: 'nomina', // Se sincroniza con contabilidad.js
                monto: f.neto,
                concepto: `PAGO NÓMINA LEGAL: ${f.nombre.toUpperCase()}`,
                creadoEn: serverTimestamp()
            });
            Swal.fire({ icon: 'success', title: 'NÓMINA DISPERSADA', background: '#010409', color: '#fff' });
        }
    };

    window.liquidarTecnico = async (tecKey) => {
        const data = comisionesPendientes[tecKey];
        const { isConfirmed } = await Swal.fire({
            title: 'AUTORIZAR PAGO TÉCNICO',
            background: '#0d1117', color: '#fff',
            html: `<div class="p-4 bg-orange-500/10 rounded-2xl"><p class="text-3xl font-black orbitron">$ ${data.total.toLocaleString("es-CO")}</p></div>`,
            showCancelButton: true, confirmButtonText: 'CONFIRMAR DISPERSIÓN'
        });

        if (isConfirmed) {
            for (const m of data.misiones) {
                const docRef = doc(db, "ordenes", m.ordenId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const items = [...snap.data().items];
                    items[m.itemIndex].pagado = true;
                    await updateDoc(docRef, { items });
                }
            }
            await addDoc(collection(db, "contabilidad"), {
                empresaId, tipo: 'nomina', monto: data.total,
                concepto: `LIQUIDACIÓN COMISIONES: ${data.nombre}`,
                creadoEn: serverTimestamp()
            });
            Swal.fire({ icon: 'success', title: 'DISPERSADO' });
        }
    };

    renderLayout();
}
