/**
 * staff.js - TallerPRO360 NEXUS-X V17.0 👥
 * CONTROL DE TRIPULACIÓN: SEGMENTACIÓN TÁCTICA Y RBAC
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function staffModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const miRol = localStorage.getItem("nexus_rol"); 
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Gestión de Privilegios y Unidades de Campo</p>
                </div>

                ${miRol === 'ADMIN' ? `
                <button id="btnNuevoMiembro" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                    <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                        <i class="fas fa-user-plus"></i> Reclutar Operador
                    </span>
                </button>` : ''}
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <div class="absolute -right-5 -bottom-5 text-indigo-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-users-cog"></i></div>
                    <p class="orbitron text-[9px] text-indigo-400 mb-2 font-black uppercase tracking-widest italic">Total Tripulación</p>
                    <h2 id="totalCrew" class="orbitron text-4xl font-black text-white italic">0</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <div class="absolute -right-5 -bottom-5 text-emerald-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-satellite"></i></div>
                    <p class="orbitron text-[9px] text-emerald-400 mb-2 font-black uppercase tracking-widest italic">Operadores Online</p>
                    <h2 id="onlineCrew" class="orbitron text-4xl font-black text-white italic">0</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <div class="absolute -right-5 -bottom-5 text-indigo-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-user-shield"></i></div>
                    <p class="orbitron text-[9px] text-slate-500 mb-2 font-black uppercase tracking-widest italic">Tu Rango</p>
                    <h2 class="orbitron text-4xl font-black text-indigo-400 italic uppercase">${miRol}</h2>
                </div>
            </div>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                </div>
        </div>
        `;

        if (miRol === 'ADMIN') {
            document.getElementById("btnNuevoMiembro").onclick = abrirFormularioStaff;
        }
        escucharStaff();
    };

    const escucharStaff = () => {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");
        
        // Consulta enfocada en la empresa específica para seguridad multi-tenant
        const q = query(
            collection(db, "usuarios"),
            where("empresaId", "==", empresaId)
        );

        unsubscribe = onSnapshot(q, (snap) => {
            const crew = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            document.getElementById("totalCrew").innerText = crew.length;
            document.getElementById("onlineCrew").innerText = crew.filter(u => u.estado === 'ACTIVO').length;

            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20"><i class="fas fa-user-secret text-7xl mb-6"></i><p class="orbitron text-[10px] tracking-[0.5em] uppercase italic">Sección de personal vacía</p></div>`;
                return;
            }

            grid.innerHTML = crew.map(u => {
                const isAdmin = u.rol === 'ADMIN';
                return `
                <div class="group relative bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-2xl overflow-hidden">
                    <div class="absolute top-0 right-0 p-8">
                        <span class="px-4 py-1 rounded-full text-[7px] font-black orbitron ${isAdmin ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-500'} tracking-widest uppercase italic">
                            ${u.rol}
                        </span>
                    </div>

                    <div class="flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-[2.5rem] bg-black border border-white/5 flex items-center justify-center mb-6 relative group-hover:border-indigo-500 transition-all duration-500 shadow-inner">
                            <i class="fas ${isAdmin ? 'fa-user-shield text-indigo-400' : 'fa-id-badge text-slate-600'} text-3xl"></i>
                            <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0d1117] animate-pulse"></div>
                        </div>
                        
                        <h3 class="text-white font-black orbitron text-sm uppercase tracking-tighter mb-2 group-hover:text-indigo-400 transition-colors">${u.nombre}</h3>
                        <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest">${u.email}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-white/5">
                        <div class="flex flex-col items-center">
                            <span class="text-[7px] text-slate-600 font-black orbitron uppercase mb-1">Misiones</span>
                            <span class="text-xs font-black text-white orbitron italic">${u.misionesCount || 0}</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <span class="text-[7px] text-slate-600 font-black orbitron uppercase mb-1">Status</span>
                            <span class="text-[8px] font-black text-emerald-500 orbitron uppercase tracking-widest">Linked</span>
                        </div>
                    </div>

                    ${miRol === 'ADMIN' ? `
                    <div class="mt-8 flex gap-3">
                        <button onclick="editarAcceso('${u.id}')" class="flex-1 py-3 bg-white/5 rounded-xl text-[8px] font-black text-slate-500 orbitron uppercase tracking-[0.2em] hover:text-indigo-400 hover:bg-indigo-500/5 transition-all">
                            Editar
                        </button>
                        <button onclick="revocarAcceso('${u.id}')" class="w-12 h-10 flex items-center justify-center bg-red-500/5 text-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/10">
                            <i class="fas fa-user-slash text-xs"></i>
                        </button>
                    </div>` : ''}
                </div>`;
            }).join("");
        });
    };

    const abrirFormularioStaff = () => {
        window.Swal.fire({
            title: 'NUEVA CREDENCIAL DE ACCESO',
            background: '#010409',
            color: '#fff',
            customClass: { 
                popup: 'rounded-[3rem] border border-indigo-500/20 shadow-[0_0_50px_rgba(0,0,0,1)]',
                confirmButton: 'bg-indigo-600 rounded-full orbitron font-black text-[10px] px-10 py-4',
                cancelButton: 'bg-transparent text-slate-500 orbitron font-black text-[10px]'
            },
            html: `
                <div class="space-y-6 p-6 text-left">
                    <div class="space-y-2">
                        <label class="text-[8px] text-indigo-400 font-black orbitron uppercase ml-4 tracking-[0.3em]">Identidad Operativa</label>
                        <input id="st-nombre" class="w-full bg-black/60 p-6 rounded-3xl text-white font-black orbitron border border-white/5 outline-none focus:border-indigo-500 uppercase" placeholder="NOMBRE COMPLETO">
                    </div>
                    <div class="space-y-2">
                        <label class="text-[8px] text-slate-500 font-black orbitron uppercase ml-4 tracking-[0.3em]">Correo de Enlace</label>
                        <input id="st-email" type="email" class="w-full bg-black/60 p-6 rounded-3xl text-white font-mono border border-white/5 outline-none focus:border-indigo-500" placeholder="usuario@nexus-x.tech">
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-[8px] text-slate-500 font-black orbitron uppercase ml-4 tracking-[0.3em]">Clave Inicial</label>
                            <input id="st-pass" type="password" class="w-full bg-black/60 p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-indigo-500" placeholder="****">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[8px] text-indigo-400 font-black orbitron uppercase ml-4 tracking-[0.3em]">Rango de Acceso</label>
                            <select id="st-rol" class="w-full bg-black/60 p-6 rounded-3xl text-white font-black orbitron text-[10px] border border-white/5 outline-none focus:border-indigo-500 appearance-none">
                                <option value="TECNICO">MODO TÉCNICO</option>
                                <option value="ADMIN">MODO COMANDANTE (ADMIN)</option>
                            </select>
                        </div>
                    </div>
                    <div class="bg-indigo-500/5 p-6 rounded-[2rem] border border-indigo-500/10">
                        <p class="text-[8px] text-indigo-400/60 font-black uppercase italic leading-relaxed">
                            Al crear este acceso, el usuario podrá operar bajo la firma de ${localStorage.getItem("nexus_empresaNombre") || 'la empresa'}.
                        </p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'AUTORIZAR ACCESO',
            preConfirm: () => {
                const nombre = document.getElementById('st-nombre').value.toUpperCase();
                const email = document.getElementById('st-email').value.toLowerCase();
                const pass = document.getElementById('st-pass').value;
                const rol = document.getElementById('st-rol').value;

                if (!nombre || !email || !pass) return window.Swal.showValidationMessage("Todos los campos de identidad son requeridos");
                return { nombre, email, pass, rol };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await addDoc(collection(db, "usuarios"), {
                        ...result.value,
                        empresaId: empresaId,
                        estado: 'ACTIVO',
                        misionesCount: 0,
                        creadoEn: serverTimestamp()
                    });
                    
                    hablar(`Acceso autorizado para el operador ${result.value.nombre}. Rango ${result.value.rol}.`);
                    window.Swal.fire({ icon: 'success', title: 'CREDENCIAL EMITIDA', background: '#010409', color: '#fff' });
                } catch (e) {
                    console.error("Fallo de reclutamiento:", e);
                }
            }
        });
    };

    renderLayout();
}
