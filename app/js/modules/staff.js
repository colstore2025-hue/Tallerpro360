/**
 * staff.js - TallerPRO360 NEXUS-X V36.0 🛰️
 * SEGMENTACIÓN TÁCTICA Y GESTIÓN DE ACCESOS DE ALTA PRECISIÓN
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, addDoc, doc, deleteDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("nexus_empresaId");
    const miRol = localStorage.getItem("nexus_rol") || "TECNICO";
    
    // BLOQUEO DE SEGURIDAD: Solo el DUEÑO puede ver o gestionar este módulo
    if (miRol !== 'DUENO') {
        container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-screen bg-[#020617] text-center p-10">
            <i class="fas fa-user-shield text-red-500 text-6xl mb-6 animate-pulse"></i>
            <h1 class="orbitron text-2xl font-black text-white">ACCESO DENEGADO</h1>
            <p class="orbitron text-[10px] text-slate-500 mt-4 tracking-[0.5em]">ESTE NODO REQUIERE NIVEL: DUEÑO</p>
        </div>`;
        return;
    }

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white pb-40 animate-in fade-in duration-700">
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white uppercase">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Gestión de Privilegios Nexus-X</p>
                </div>

                <button id="btnNuevoStaff" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                    <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                        <i class="fas fa-user-plus text-xs"></i> VINCULAR OPERADOR
                    </span>
                </button>
            </header>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>`;

        document.getElementById("btnNuevoStaff").onclick = () => abrirFormularioStaff();
        escucharPersonal();
    };

    const escucharPersonal = () => {
        const q = query(collection(db, "staff_local"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("gridStaff");
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20"><p class="orbitron tracking-[0.5em]">NODO DE PERSONAL VACÍO</p></div>`;
                return;
            }

            grid.innerHTML = snap.docs.map(d => {
                const s = d.data();
                const esAdmin = s.cargo === 'ADMIN';
                const color = esAdmin ? 'amber' : 'emerald';
                
                return `
                <div class="group relative bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 hover:border-${color}-500/50 transition-all duration-500 shadow-2xl">
                    <div class="flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-[2.5rem] bg-black border border-white/5 flex items-center justify-center mb-6 relative group-hover:border-${color}-500 transition-all duration-500">
                            <i class="fas ${esAdmin ? 'fa-user-tie text-amber-400' : 'fa-wrench text-emerald-400'} text-3xl"></i>
                        </div>
                        
                        <h3 class="text-white font-black orbitron text-sm uppercase tracking-tighter mb-2">${s.nombre}</h3>
                        <span class="px-4 py-1 rounded-full text-[7px] font-black orbitron bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 tracking-widest uppercase italic">
                            ${s.cargo}
                        </span>
                    </div>

                    <div class="mt-10 pt-8 border-t border-white/5">
                        <div class="flex justify-between items-center mb-6">
                            <span class="text-[7px] text-slate-600 font-black orbitron uppercase">PIN ACCESO</span>
                            <span class="text-xs font-black text-white orbitron tracking-[0.3em] bg-black px-3 py-1 rounded-lg">${s.pass}</span>
                        </div>
                        
                        <div class="flex gap-3">
                            <button onclick="editarStaff('${d.id}', '${s.nombre}', '${s.cargo}', '${s.pass}')" class="flex-1 py-3 bg-white/5 rounded-xl text-[8px] font-black text-slate-500 orbitron hover:text-white hover:bg-white/10 transition-all">
                                EDITAR
                            </button>
                            <button onclick="eliminarStaff('${d.id}')" class="w-12 h-10 flex items-center justify-center bg-red-500/5 text-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/10">
                                <i class="fas fa-trash-alt text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join("");
        });
    };

    // --- OPERACIONES DE ALTA PRECISIÓN (WINDOW SCOPE) ---

    window.abrirFormularioStaff = (editData = null) => {
        const isEdit = !!editData;
        Swal.fire({
            title: isEdit ? 'RECALIBRAR ACCESO' : 'NUEVA LLAVE TÁCTICA',
            background: '#010409',
            color: '#fff',
            html: `
                <div class="space-y-4 p-4 text-left">
                    <input id="f-nombre" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-xs uppercase" placeholder="NOMBRE" value="${isEdit ? editData.nombre : ''}">
                    <select id="f-cargo" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-[10px]">
                        <option value="TECNICO" ${isEdit && editData.cargo === 'TECNICO' ? 'selected' : ''}>TÉCNICO (Solo Ordenes)</option>
                        <option value="ADMIN" ${isEdit && editData.cargo === 'ADMIN' ? 'selected' : ''}>ADMIN (Contabilidad/Inventario)</option>
                    </select>
                    <input id="f-pass" type="text" maxlength="6" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-center text-lg font-black" placeholder="PIN" value="${isEdit ? editData.pass : ''}">
                </div>`,
            showCancelButton: true,
            confirmButtonText: isEdit ? 'ACTUALIZAR' : 'CREAR',
            preConfirm: () => {
                const nombre = document.getElementById('f-nombre').value.toUpperCase().trim();
                const cargo = document.getElementById('f-cargo').value;
                const pass = document.getElementById('f-pass').value.trim();
                if(!nombre || !pass) return Swal.showValidationMessage("Incompleto");
                return { nombre, cargo, pass };
            }
        }).then(async (res) => {
            if(res.isConfirmed) {
                if(isEdit) {
                    await updateDoc(doc(db, "staff_local", editData.id), res.value);
                } else {
                    await addDoc(collection(db, "staff_local"), { ...res.value, empresaId, creadoEn: serverTimestamp() });
                }
                Swal.fire({ icon: 'success', title: 'OPERACIÓN EXITOSA', background: '#010409' });
            }
        });
    };

    window.editarStaff = (id, nombre, cargo, pass) => abrirFormularioStaff({ id, nombre, cargo, pass });

    window.eliminarStaff = async (id) => {
        const res = await Swal.fire({ title: '¿REVOCAR ACCESO?', background: '#0d1117', color: '#fff', showCancelButton: true, confirmButtonColor: '#ef4444' });
        if(res.isConfirmed) await deleteDoc(doc(db, "staff_local", id));
    };

    renderLayout();
}
