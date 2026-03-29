/**
 * nomina.js - Ecosistema TallerPRO360
 * Liquidación de Comisiones y Control de Mano de Obra
 */
import { collection, query, where, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default function nomina(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");

    container.innerHTML = `
    <div class="p-10 bg-[#010409] min-h-screen text-slate-100">
        <h1 class="orbitron text-4xl font-black mb-10 italic text-orange-500">CENTRO DE NÓMINA <span class="text-white">NEXUS</span></h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5">
                <p class="orbitron text-[9px] text-slate-500 uppercase mb-2">Comisiones por Pagar</p>
                <h2 id="total-pendiente" class="orbitron text-3xl font-black text-white">$ 0</h2>
            </div>
            </div>

        <div class="bg-[#0d1117] rounded-[2.5rem] border border-white/5 overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-white/5 orbitron text-[10px] text-orange-500">
                    <tr>
                        <th class="p-6">TÉCNICO</th>
                        <th class="p-6">MISIONES</th>
                        <th class="p-6">POR PAGAR</th>
                        <th class="p-6">ACCIONES</th>
                    </tr>
                </thead>
                <tbody id="tabla-nomina" class="text-sm">
                    </tbody>
            </table>
        </div>
    </div>`;

    // Lógica para agrupar órdenes por técnico y sumar sus comisiones de ORO
    escucharComisiones(empresaId);
}

function escucharComisiones(empresaId) {
    // Aquí filtramos órdenes que tengan ítems tipo ORO y no estén pagadas
    const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
    
    onSnapshot(q, (snap) => {
        const resumenTecnicos = {};
        
        snap.forEach(docSnap => {
            const data = docSnap.data();
            data.items.forEach(it => {
                if(it.tipo === 'ORO' && !it.pagado) {
                    const tec = it.tecnico || "Sin Asignar";
                    if(!resumenTecnicos[tec]) resumenTecnicos[tec] = { total: 0, misiones: 0 };
                    resumenTecnicos[tec].total += it.valor; // O el % que definas
                    resumenTecnicos[tec].misiones++;
                }
            });
        });

        renderizarTabla(resumenTecnicos);
    });
}
