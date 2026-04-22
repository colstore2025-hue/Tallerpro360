/**
 * staff.js - TallerPRO360 NEXUS-X V19.5 👥
 * VERSIÓN FINAL DE COMPATIBILIDAD
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, addDoc, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const miRol = (state?.rol || localStorage.getItem("rol") || "OPERADOR").toUpperCase(); 

    // Renderizado base ultra-rápido
    container.innerHTML = `
    <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white">
        <header class="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
            <h1 class="orbitron text-3xl font-black italic uppercase">CREW <span class="text-indigo-400">CONTROL</span></h1>
            ${['DUENO', 'ADMIN', 'SUPERADMIN'].includes(miRol) ? `
                <button id="btnNuevo" class="bg-indigo-600 px-6 py-3 rounded-2xl orbitron text-[10px] font-black hover:scale-105 transition-transform">
                    + RECLUTAR
                </button>
            ` : ''}
        </header>

        <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full py-20 text-center opacity-30 orbitron text-xs animate-pulse">SINCRONIZANDO NODO...</div>
        </div>
    </div>`;

    const grid = document.getElementById("gridStaff");

    // Escucha en tiempo real
    const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));
    onSnapshot(q, (snap) => {
        if (snap.empty) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center opacity-20 orbitron text-xs uppercase italic">Sin tripulación registrada</div>`;
            return;
        }
        grid.innerHTML = snap.docs.map(d => {
            const u = d.data();
            const rol = (u.role || u.rol || 'TECNICO').toUpperCase();
            return `
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all shadow-xl">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/5">
                        <i class="fas ${rol.includes('ADMIN') ? 'fa-user-shield text-indigo-400' : 'fa-tools text-slate-500'}"></i>
                    </div>
                    <span class="text-[7px] orbitron bg-white/5 px-3 py-1 rounded-full text-slate-400 font-black uppercase italic">${rol}</span>
                </div>
                <h3 class="orbitron text-xs font-black text-white uppercase">${u.nombre || 'UNIDAD_X'}</h3>
                <p class="text-[9px] text-slate-600 font-mono mt-1">${u.email}</p>
                
                ${['DUENO', 'ADMIN'].includes(miRol) ? `
                <div class="mt-6 pt-4 border-t border-white/5">
                    <button onclick="window.eliminarStaff('${d.id}')" class="text-[8px] orbitron text-red-500/40 hover:text-red-500 transition-colors uppercase font-black">Revocar Acceso</button>
                </div>` : ''}
            </div>`;
        }).join("");
    });

    // Lógica de Registro
    document.getElementById("btnNuevo")?.addEventListener("click", () => {
        Swal.fire({
            title: 'REGISTRO DE PERSONAL',
            background: '#010409',
            color: '#fff',
            html: `
                <div class="space-y-4 p-2 text-left">
                    <input id="sw-nom" class="w-full bg-black p-4 rounded-xl border border-white/5 text-white text-xs orbitron" placeholder="NOMBRE COMPLETO">
                    <input id="sw-ema" type="email" class="w-full bg-black p-4 rounded-xl border border-white/5 text-white text-xs" placeholder="EMAIL">
                    <select id="sw-rol" class="w-full bg-black p-4 rounded-xl border border-white/5 text-white text-[10px] orbitron">
                        <option value="TECNICO">MODO TÉCNICO</option>
                        <option value="ADMIN">MODO ADMINISTRACIÓN</option>
                    </select>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'GUARDAR',
            preConfirm: () => {
                const nombre = document.getElementById('sw-nom').value.trim();
                const email = document.getElementById('sw-ema').value.trim();
                const role = document.getElementById('sw-rol').value;
                if (!nombre || !email) return Swal.showValidationMessage("Faltan datos");
                return { nombre, email, role };
            }
        }).then(async (res) => {
            if (res.isConfirmed) {
                await addDoc(collection(db, "usuarios"), {
                    ...res.value,
                    empresaId: empresaId,
                    status: 'ACTIVE',
                    creadoEn: serverTimestamp()
                });
                Swal.fire({ icon: 'success', title: 'OPERADOR REGISTRADO', background: '#0d1117' });
            }
        });
    });

    window.eliminarStaff = async (id) => {
        const confirmacion = await Swal.fire({ title: '¿ELIMINAR?', background: '#0d1117', showCancelButton: true });
        if (confirmacion.isConfirmed) await deleteDoc(doc(db, "usuarios", id));
    };
}
