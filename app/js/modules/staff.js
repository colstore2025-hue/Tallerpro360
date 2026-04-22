/**
 * staff.js - TallerPRO360 NEXUS-X V19.0 👥
 * VERSIÓN SIMPLIFICADA PARA DESBLOQUEAR VERCEL
 * Sin funciones complejas, solo carga y registro directo.
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, addDoc, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const miRol = (state?.rol || localStorage.getItem("rol") || "OPERADOR").toUpperCase(); 

    // 1. Estructura visual inmediata
    container.innerHTML = `
    <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white pb-40">
        <header class="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
            <div>
                <h1 class="orbitron text-4xl font-black italic uppercase">CREW <span class="text-indigo-400">CONTROL</span></h1>
                <p class="text-[8px] orbitron text-slate-500 tracking-[0.4em]">MODO RECOVERY 19.0</p>
            </div>
            ${['DUENO', 'ADMIN'].includes(miRol) ? `
                <button id="btnNuevo" class="bg-indigo-600 px-6 py-3 rounded-full orbitron text-[10px] font-black">
                    + REGISTRAR
                </button>
            ` : ''}
        </header>

        <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <p class="col-span-full text-center opacity-50 orbitron text-xs">Sincronizando con Nexus-X...</p>
        </div>
    </div>`;

    const grid = document.getElementById("gridStaff");

    // 2. Escucha de datos simple
    const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));
    onSnapshot(q, (snap) => {
        if (snap.empty) {
            grid.innerHTML = `<p class="col-span-full text-center opacity-30 orbitron text-xs py-20">NODO VACÍO</p>`;
            return;
        }
        grid.innerHTML = snap.docs.map(d => {
            const u = d.data();
            return `
            <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5 relative">
                <span class="absolute top-4 right-6 text-[8px] orbitron text-indigo-400">${(u.role || 'TECNICO').toUpperCase()}</span>
                <h3 class="orbitron text-sm font-bold mb-1">${u.nombre || 'SIN NOMBRE'}</h3>
                <p class="text-[10px] text-slate-500 font-mono">${u.email}</p>
                <button onclick="window.borrarStaff('${d.id}')" class="mt-4 text-[9px] text-red-500/50 hover:text-red-500 orbitron">ELIMINAR</button>
            </div>`;
        }).join("");
    });

    // 3. Registro Directo (Como lo tenías antes)
    document.getElementById("btnNuevo")?.onclick = () => {
        Swal.fire({
            title: 'NUEVO OPERADOR',
            background: '#0d1117',
            color: '#fff',
            html: `
                <input id="n-nom" class="swal2-input bg-black text-white" placeholder="Nombre">
                <input id="n-ema" class="swal2-input bg-black text-white" placeholder="Email">
                <select id="n-rol" class="swal2-input bg-black text-white">
                    <option value="TECNICO">TECNICO</option>
                    <option value="ADMIN">ADMIN</option>
                </select>`,
            preConfirm: () => [
                document.getElementById('n-nom').value,
                document.getElementById('n-ema').value,
                document.getElementById('n-rol').value
            ]
        }).then(async (r) => {
            if (r.isConfirmed) {
                await addDoc(collection(db, "usuarios"), {
                    nombre: r.value[0].toUpperCase(),
                    email: r.value[1].toLowerCase(),
                    role: r.value[2],
                    empresaId: empresaId,
                    status: 'ACTIVE'
                });
                Swal.fire("ÉXITO", "Usuario guardado en base", "success");
            }
        });
    };

    window.borrarStaff = async (id) => {
        if(confirm("¿Eliminar acceso?")) await deleteDoc(doc(db, "usuarios", id));
    };
}
