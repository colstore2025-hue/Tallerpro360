/**
 * nomina.js - Ecosistema TallerPRO360 V25.0
 * LIQUIDACIÓN DE COMISIONES Y AUDITORÍA DE MANO DE OBRA
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { enviarComprobanteWhatsApp } from "../services/printService.js";

export default function nomina(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let comisionesPendientes = {};

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-slate-100 animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-10">
                <div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white">NÓMINA<span class="text-orange-500">_NEXUS</span></h1>
                    <p class="text-[10px] orbitron tracking-[0.4em] text-slate-500 uppercase mt-2">Control de Comisiones y Rendimiento Técnico</p>
                </div>
                <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 shadow-2xl">
                    <p class="orbitron text-[9px] text-orange-500 mb-1 font-black uppercase">Fondo de Comisiones Pendiente</p>
                    <h2 id="gran-total-pendiente" class="orbitron text-4xl font-black text-white">$ 0</h2>
                </div>
            </header>

            <div class="bg-[#0d1117] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <table class="w-full text-left">
                    <thead class="bg-white/5 orbitron text-[10px] text-slate-500">
                        <tr>
                            <th class="p-8">IDENTIDAD TÉCNICA</th>
                            <th class="p-8">MISIONES</th>
                            <th class="p-8">ACUMULADO ORO</th>
                            <th class="p-8 text-right">ACCIONES OPERATIVAS</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-cuerpo" class="divide-y divide-white/5">
                        </tbody>
                </table>
            </div>

            <div id="vacio-stats" class="hidden mt-20 text-center opacity-20">
                <i class="fas fa-satellite-dish text-6xl mb-4"></i>
                <p class="orbitron text-xs">No hay misiones pendientes de liquidación</p>
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
                    if (it.tipo === 'ORO' && !it.pagado) {
                        const tec = it.tecnico || "SIN_ASIGNAR";
                        if (!comisionesPendientes[tec]) {
                            comisionesPendientes[tec] = { total: 0, misiones: [], nombre: tec };
                        }
                        comisionesPendientes[tec].total += it.valor;
                        comisionesPendientes[tec].misiones.push({ ordenId, itemIndex: index, placa: orden.placa, valor: it.valor, desc: it.desc });
                        totalGlobal += it.valor;
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
        cuerpo.innerHTML = Object.entries(comisionesPendientes).map(([key, data]) => `
            <tr class="hover:bg-white/[0.02] transition-all group">
                <td class="p-8">
                    <div class="flex items-center gap-4">
                        <div class="h-12 w-12 rounded-full bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black orbitron">
                            ${data.nombre.charAt(0)}
                        </div>
                        <div>
                            <p class="font-black text-white orbitron text-sm uppercase">${data.nombre}</p>
                            <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Operador Nexus-X</p>
                        </div>
                    </div>
                </td>
                <td class="p-8">
                    <span class="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full orbitron text-[10px] font-black">
                        ${data.misiones.length} ÓRDENES
                    </span>
                </td>
                <td class="p-8">
                    <p class="orbitron text-xl font-black text-white italic">$ ${data.total.toLocaleString()}</p>
                </td>
                <td class="p-8 text-right">
                    <button onclick="window.liquidarTecnico('${key}')" class="px-8 py-4 bg-white text-black rounded-2xl orbitron text-[9px] font-black hover:bg-orange-600 hover:text-white transition-all shadow-xl">
                        LIQUIDAR Y NOTIFICAR
                    </button>
                </td>
            </tr>
        `).join("");
    };

    window.liquidarTecnico = async (tecKey) => {
        const data = comisionesPendientes[tecKey];
        const confirmacion = await Swal.fire({
            title: `¿LIQUIDAR NÓMINA: ${data.nombre}?`,
            text: `Se procesará un pago por $${data.total.toLocaleString()} y se enviará evidencia.`,
            icon: 'warning',
            showCancelButton: true,
            background: '#0d1117',
            color: '#fff',
            confirmButtonColor: '#ea580c'
        });

        if (confirmacion.isConfirmed) {
            try {
                // 1. Marcar ítems como pagados en cada orden original (Auditoría Forense)
                for (const m of data.misiones) {
                    const docRef = doc(db, "ordenes", m.ordenId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const itemsActualizados = snap.data().items;
                        itemsActualizados[m.itemIndex].pagado = true;
                        itemsActualizados[m.itemIndex].fechaPago = new Date();
                        await updateDoc(docRef, { items: itemsActualizados });
                    }
                }

                // 2. Registrar el egreso en Finanzas (ERP Link)
                await addDoc(collection(db, "finanzas"), {
                    tipo: 'EGRESO',
                    categoria: 'NOMINA_TECNICA',
                    descripcion: `Pago comisiones técnico: ${data.nombre}`,
                    monto: data.total,
                    tecnico: data.nombre,
                    empresaId,
                    fecha: serverTimestamp()
                });

                // 3. Notificación y Voz
                hablar(`Nómina de ${data.nombre} liquidada correctamente`);
                
                // 4. WhatsApp (Simulado - Aquí conectas tu servicio)
                enviarComprobanteWhatsApp(data);

                Swal.fire('ÉXITO', 'Cierre contable de nómina realizado', 'success');
            } catch (error) {
                console.error(error);
                Swal.fire('ERROR', 'Fallo en la sincronización ERP', 'error');
            }
        }
    };

    renderLayout();
    escucharData();
}
