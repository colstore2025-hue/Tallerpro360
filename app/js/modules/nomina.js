/**
 * nomina.js - NEXUS-X PAYROLL ENGINE V25.0 🎖️
 * Sistema de Liquidación Táctica y Auditoría de Rendimiento
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default function nomina(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let comisionesPendientes = {};

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-slate-100 animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col lg:flex-row justify-between items-end gap-8 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-4 top-0 h-full w-1 bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)]"></div>
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white leading-none">
                        PAYROLL <span class="text-orange-500">CORE</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic">Unidad de Gestión de Activos Humanos</p>
                </div>
                
                <div class="flex gap-4">
                    <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div class="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><i class="fas fa-coins text-4xl"></i></div>
                        <p class="orbitron text-[8px] text-orange-500/60 mb-2 font-black uppercase tracking-widest">Pendiente por Liquidar</p>
                        <h2 id="gran-total-pendiente" class="orbitron text-4xl font-black text-white tabular-nums">$ 0</h2>
                    </div>
                </div>
            </header>

            <div class="bg-[#0d1117]/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-[0.3em]">
                            <th class="p-10 border-b border-white/5 font-black italic text-orange-500">Operador / Rango</th>
                            <th class="p-10 border-b border-white/5 font-black">Carga de Misiones</th>
                            <th class="p-10 border-b border-white/5 font-black">Acumulado ORO</th>
                            <th class="p-10 border-b border-white/5 text-right font-black">Protocolo</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-cuerpo" class="divide-y divide-white/5">
                        </tbody>
                </table>
            </div>

            <div id="vacio-stats" class="hidden mt-32 text-center group">
                <div class="relative inline-block">
                    <i class="fas fa-microchip text-7xl mb-6 text-slate-800 group-hover:text-orange-500/20 transition-colors duration-700"></i>
                    <div class="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full"></div>
                </div>
                <p class="orbitron text-[10px] text-slate-600 uppercase tracking-[0.5em]">Frecuencia Nominal: Sin deudas de nómina activas</p>
            </div>
        </div>`;
    };

    const escucharData = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));

        onSnapshot(q, (snap) => {
            comisionesPendientes = {};
            let totalGlobal = 0;

            snap.forEach(docSnap => {
                const orden = docSnap.data();
                const ordenId = docSnap.id;

                (orden.items || []).forEach((it, index) => {
                    // Solo filtramos ítems de mano de obra (ORO) que no han sido liquidados
                    if (it.tipo === 'ORO' && !it.pagado) {
                        const tec = it.tecnico || "COMANDO_ANONIMO";
                        if (!comisionesPendientes[tec]) {
                            comisionesPendientes[tec] = { total: 0, misiones: [], nombre: tec };
                        }
                        comisionesPendientes[tec].total += Number(it.valor || 0);
                        comisionesPendientes[tec].misiones.push({ 
                            ordenId, 
                            itemIndex: index, 
                            placa: orden.placa, 
                            valor: it.valor, 
                            desc: it.desc 
                        });
                        totalGlobal += Number(it.valor || 0);
                    }
                });
            });

            actualizarUI(totalGlobal);
        });
    };

    const actualizarUI = (global) => {
        const cuerpo = document.getElementById("tabla-cuerpo");
        const totalTxt = document.getElementById("gran-total-pendiente");
        totalTxt.innerText = `$ ${global.toLocaleString()}`;

        if (Object.keys(comisionesPendientes).length === 0) {
            document.getElementById("vacio-stats").classList.remove("hidden");
            cuerpo.innerHTML = "";
            return;
        }

        document.getElementById("vacio-stats").classList.add("hidden");
        cuerpo.innerHTML = Object.entries(comisionesPendientes).map(([key, data]) => {
            // Lógica de Rango Nexus-X (Ficticio por volumen)
            const rango = data.misiones.length > 5 ? 'COMMANDER' : 'OPERATOR';
            const badgeColor = rango === 'COMMANDER' ? 'text-orange-400 bg-orange-400/10' : 'text-cyan-400 bg-cyan-400/10';

            return `
            <tr class="hover:bg-white/[0.03] transition-all duration-500 group border-l-2 border-transparent hover:border-orange-600">
                <td class="p-10">
                    <div class="flex items-center gap-6">
                        <div class="relative">
                            <div class="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
                                <span class="text-2xl font-black text-white orbitron">${data.nombre.charAt(0)}</span>
                            </div>
                            <div class="absolute -bottom-2 -right-2 h-6 w-6 bg-orange-600 rounded-lg flex items-center justify-center border-2 border-[#0d1117]">
                                <i class="fas fa-shield-alt text-[10px] text-white"></i>
                            </div>
                        </div>
                        <div>
                            <p class="font-black text-white orbitron text-md uppercase tracking-tight">${data.nombre}</p>
                            <span class="text-[8px] orbitron font-black px-3 py-1 rounded-md uppercase tracking-[0.2em] ${badgeColor}">${rango} NXS</span>
                        </div>
                    </div>
                </td>
                <td class="p-10">
                    <div class="flex flex-col gap-2">
                        <span class="text-white font-black orbitron text-xs">${data.misiones.length} <span class="text-slate-600">MISIONES</span></span>
                        <div class="flex gap-1">
                            ${data.misiones.slice(0, 5).map(() => `<div class="h-1 w-4 bg-orange-600/30 rounded-full"></div>`).join('')}
                        </div>
                    </div>
                </td>
                <td class="p-10">
                    <p class="orbitron text-2xl font-black text-white italic tracking-tighter">$ ${data.total.toLocaleString()}</p>
                    <p class="text-[7px] text-slate-600 font-black orbitron mt-1">Sujeto a Auditoría Real-Time</p>
                </td>
                <td class="p-10 text-right">
                    <button onclick="window.liquidarTecnico('${key}')" class="group/btn relative overflow-hidden px-10 py-5 bg-white text-black rounded-[1.5rem] orbitron text-[10px] font-black hover:bg-orange-600 hover:text-white transition-all duration-500 shadow-2xl">
                        <span class="relative z-10">EJECUTAR LIQUIDACIÓN</span>
                        <div class="absolute inset-0 bg-orange-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </td>
            </tr>
        `}).join("");
    };

    window.liquidarTecnico = async (tecKey) => {
        const data = comisionesPendientes[tecKey];
        const res = await Swal.fire({
            title: 'PROTOCOL_PAYROLL_INIT',
            html: `<div class="p-4 bg-black/50 border border-white/5 rounded-2xl">
                    <p class="text-[10px] orbitron text-slate-500 mb-4 uppercase">Confirmar liquidación para:</p>
                    <p class="text-xl font-black text-white orbitron uppercase">${data.nombre}</p>
                    <p class="text-3xl font-black text-orange-500 orbitron mt-2">$ ${data.total.toLocaleString()}</p>
                   </div>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'CONFIRMAR CIERRE',
            cancelButtonText: 'ABORTAR',
            background: '#0d1117',
            color: '#fff',
            confirmButtonColor: '#ea580c',
            customClass: { popup: 'rounded-[2rem] border border-white/10' }
        });

        if (res.isConfirmed) {
            Swal.fire({ title: 'SINCRONIZANDO LIBRO MAYOR...', didOpen: () => Swal.showLoading(), background: '#0d1117', color: '#fff' });

            try {
                // 1. Auditoría Forense: Marcar ítems pagados
                for (const m of data.misiones) {
                    const docRef = doc(db, "ordenes", m.ordenId);
                    const snap = await getDoc(docRef);
                    
                    if (snap.exists()) {
                        const itemsActualizados = [...snap.data().items];
                        if (itemsActualizados[m.itemIndex]) {
                            itemsActualizados[m.itemIndex].pagado = true;
                            itemsActualizados[m.itemIndex].auditadoPor = "Nexus-X_AI";
                            itemsActualizados[m.itemIndex].fechaLiquidacion = new Date();
                            await updateDoc(docRef, { items: itemsActualizados });
                        }
                    }
                }

                // 2. Vínculo Contable (ERP Integration)
                await addDoc(collection(db, "contabilidad"), {
                    concepto: `NÓMINA TÉCNICA: ${data.nombre}`,
                    tipo: 'egreso', // Para que reste en tu Ledger
                    monto: data.total,
                    categoria: 'MANO_DE_OBRA',
                    creadoEn: serverTimestamp(),
                    empresaId
                });

                hablar(`Liquidación de ${data.nombre} completada con éxito. Libro mayor actualizado.`);
                
                Swal.fire({
                    icon: 'success',
                    title: 'MISIÓN CUMPLIDA',
                    text: 'Los activos han sido transferidos al historial contable.',
                    background: '#0d1117',
                    color: '#fff',
                    confirmButtonColor: '#ea580c'
                });

            } catch (error) {
                console.error(error);
                Swal.fire('ERROR_CRÍTICO', 'Fallo en la sincronización con el núcleo Firebase.', 'error');
            }
        }
    };

    renderLayout();
    escucharData();
}
