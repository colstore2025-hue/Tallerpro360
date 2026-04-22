/**
 * staff.js - TallerPRO360 NEXUS-X V17.5 👥
 * CONTROL DE TRIPULACIÓN: SEGMENTACIÓN TÁCTICA Y RBAC
 * Optimizado para: GRATI-CORE, BÁSICO, PRO y ELITE
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, addDoc, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    // Priorizamos los datos del 'state' inyectado por el router
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const miRol = (state?.rol || localStorage.getItem("rol") || "OPERADOR").toUpperCase(); 
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Protocolo de Personal & Unidades de Campo</p>
                </div>

                ${(miRol === 'ADMIN' || miRol === 'SUPERADMIN' || miRol === 'DUENO') ? `
                <button id="btnNuevoMiembro" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                    <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                        <i class="fas fa-user-plus text-xs"></i> RECLUTAR OPERADOR
                    </span>
                </button>` : ''}
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <div class="absolute -right-5 -bottom-5 text-indigo-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-users-cog"></i></div>
                    <p class="orbitron text-[9px] text-indigo-400 mb-2 font-black uppercase tracking-widest italic">Total Tripulación</p>
                    <h2 id="totalCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <div class="absolute -right-5 -bottom-5 text-emerald-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-satellite"></i></div>
                    <p class="orbitron text-[9px] text-emerald-400 mb-2 font-black uppercase tracking-widest italic">Personal Activo</p>
                    <h2 id="onlineCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <div class="absolute -right-5 -bottom-5 text-indigo-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-user-shield"></i></div>
                    <p class="orbitron text-[9px] text-slate-500 mb-2 font-black uppercase tracking-widest italic">Rango de Mando</p>
                    <h2 class="orbitron text-3xl font-black text-indigo-400 italic uppercase tracking-tighter">${miRol}</h2>
                </div>
            </div>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                </div>
        </div>
        `;

        const btnAdd = document.getElementById("btnNuevoMiembro");
        if (btnAdd) btnAdd.onclick = abrirFormularioStaff;
        
        escucharStaff();
    };

    const escucharStaff = () => {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");
        
        // Filtro estricto por empresaId para seguridad
        const q = query(
            collection(db, "usuarios"),
            where("empresaId", "==", empresaId)
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `
                    <div class="col-span-full py-40 text-center opacity-20">
                        <i class="fas fa-user-secret text-7xl mb-6"></i>
                        <p class="orbitron text-[10px] tracking-[0.5em] uppercase italic">Sin tripulación registrada en este nodo</p>
                    </div>`;
                document.getElementById("totalCrew").innerText = "0";
                document.getElementById("onlineCrew").innerText = "0";
                return;
            }

            const crew = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            document.getElementById("totalCrew").innerText = crew.length;
            document.getElementById("onlineCrew").innerText = crew.filter(u => (u.status || u.estado) === 'ACTIVE' || (u.status || u.estado) === 'ACTIVO').length;

            grid.innerHTML = crew.map(u => {
                const rolU = (u.role || u.rol || 'OPERADOR').toUpperCase();
                const esAdmin = rolU.includes('ADMIN') || rolU.includes('DUENO');
                const status = (u.status || u.estado || 'INACTIVE').toUpperCase();

                return `
                <div class="group relative bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-2xl overflow-hidden">
                    <div class="absolute top-0 right-0 p-8">
                        <span class="px-4 py-1 rounded-full text-[7px] font-black orbitron ${esAdmin ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-500'} tracking-widest uppercase italic">
                            ${rolU}
                        </span>
                    </div>

                    <div class="flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-[2.5rem] bg-black border border-white/5 flex items-center justify-center mb-6 relative group-hover:border-indigo-500 transition-all duration-500 shadow-inner">
                            <i class="fas ${esAdmin ? 'fa-user-shield text-indigo-400' : 'fa-id-badge text-slate-600'} text-3xl"></i>
                            <div class="absolute -bottom-1 -right-1 w-6 h-6 ${status === 'ACTIVE' || status === 'ACTIVO' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'} rounded-full border-4 border-[#0d1117]"></div>
                        </div>
                        
                        <h3 class="text-white font-black orbitron text-sm uppercase tracking-tighter mb-2 group-hover:text-indigo-400 transition-colors">${u.nombre || 'SIN_NOMBRE'}</h3>
                        <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">${u.email}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-white/5">
                        <div class="flex flex-col items-center">
                            <span class="text-[7px] text-slate-600 font-black orbitron uppercase mb-1">Misiones</span>
                            <span class="text-xs font-black text-white orbitron italic">${u.misionesCount || 0}</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <span class="text-[7px] text-slate-600 font-black orbitron uppercase mb-1">Protocolo</span>
                            <span class="text-[8px] font-black text-indigo-500 orbitron uppercase tracking-widest">${status}</span>
                        </div>
                    </div>

                    ${(miRol === 'ADMIN' || miRol === 'SUPERADMIN' || miRol === 'DUENO') ? `
                    <div class="mt-8 flex gap-3">
                        <button onclick="window.editarOperador('${u.id}')" class="flex-1 py-3 bg-white/5 rounded-xl text-[8px] font-black text-slate-500 orbitron uppercase tracking-[0.2em] hover:text-indigo-400 hover:bg-indigo-500/5 transition-all">
                            Configurar
                        </button>
                        <button onclick="window.eliminarOperador('${u.id}')" class="w-12 h-10 flex items-center justify-center bg-red-500/5 text-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/10">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>` : ''}
                </div>`;
            }).join("");
        });
    };

    // Funciones Globales para manejo de clicks
    window.editarOperador = async (id) => {
        const { value: formValues } = await Swal.fire({
            title: 'AJUSTE DE PERFIL',
            background: '#0d1117',
            color: '#fff',
            html: `
                <select id="sw-rol" class="w-full bg-black p-4 rounded-xl text-white border border-white/10 mb-4 orbitron text-xs">
                    <option value="TECNICO">TECNICO</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="DUENO">DUENO</option>
                </select>
                <select id="sw-estado" class="w-full bg-black p-4 rounded-xl text-white border border-white/10 orbitron text-xs">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                </select>
            `,
            focusConfirm: false,
            preConfirm: () => [
                document.getElementById('sw-rol').value,
                document.getElementById('sw-estado').value
            ]
        });

        if (formValues) {
            await updateDoc(doc(db, "usuarios", id), { role: formValues[0], status: formValues[1] });
            Swal.fire({ icon: 'success', title: 'PERFIL ACTUALIZADO', background: '#0d1117', color: '#fff' });
        }
    };

    window.eliminarOperador = async (id) => {
        const result = await Swal.fire({
            title: '¿REVOCAR ACCESO?',
            text: "El operador perderá conexión con la base de datos.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            background: '#0d1117',
            color: '#fff'
        });

        if (result.isConfirmed) {
            await deleteDoc(doc(db, "usuarios", id));
        }
    };

    const abrirFormularioStaff = () => {
        window.Swal.fire({
            title: 'NUEVA CREDENCIAL DE ACCESO',
            background: '#010409',
            color: '#fff',
            customClass: { 
                popup: 'rounded-[3rem] border border-indigo-500/20',
                confirmButton: 'bg-indigo-600 rounded-full orbitron font-black text-[10px] px-10 py-4'
            },
            html: `
                <div class="space-y-6 p-4 text-left">
                    <input id="st-nombre" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 orbitron text-xs uppercase" placeholder="Nombre Operador">
                    <input id="st-email" type="email" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 font-mono text-xs" placeholder="email@taller.com">
                    <div class="grid grid-cols-2 gap-4">
                        <input id="st-pass" type="password" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 text-xs" placeholder="Password">
                        <select id="st-rol" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 orbitron text-[10px]">
                            <option value="tecnico">TECNICO</option>
                            <option value="admin">ADMIN</option>
                        </select>
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'EMITIR CREDENCIAL',
            preConfirm: () => {
                const nombre = document.getElementById('st-nombre').value.toUpperCase().trim();
                const email = document.getElementById('st-email').value.toLowerCase().trim();
                const pass = document.getElementById('st-pass').value;
                const role = document.getElementById('st-rol').value;

                if (!nombre || !email || !pass) return window.Swal.showValidationMessage("Protocolo incompleto");
                return { nombre, email, pass, role };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await addDoc(collection(db, "usuarios"), {
                        ...result.value,
                        empresaId: empresaId,
                        status: 'ACTIVE',
                        misionesCount: 0,
                        creadoEn: serverTimestamp()
                    });
                    
                    window.Swal.fire({ icon: 'success', title: 'OPERADOR VINCULADO', background: '#0d1117', color: '#fff' });
                } catch (e) {
                    console.error("Fallo de registro:", e);
                }
            }
        });
    };

    renderLayout();
}
