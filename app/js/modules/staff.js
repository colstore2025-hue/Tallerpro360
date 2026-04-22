/**
 * staff.js - TallerPRO360 NEXUS-X V30.0 🦾 [TERMINATOR EDITION]
 * PROTOCOLO DE SEGURIDAD ABSOLUTA Y GESTIÓN DE TRIPULACIÓN
 * Estado: Operacional / Órbita Reestablecida
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, setDoc, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { db, firebaseConfig } from "../core/firebase-config.js"; 

export default async function staffModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const miRol = (state?.rol || localStorage.getItem("rol") || "OPERADOR").toUpperCase(); 
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">V30.0 - Sistema de Gestión de Personal</p>
                </div>

                ${(miRol === 'DUENO' || miRol === 'SUPERADMIN') ? `
                <div class="flex gap-4">
                    <button id="btnRecoverAll" class="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-500/20 transition-all orbitron text-[9px] font-bold text-indigo-400">
                        <i class="fas fa-key mr-2"></i> RESETEAR CLAVES
                    </button>
                    <button id="btnNuevoMiembro" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                        <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <i class="fas fa-user-shield text-xs"></i> ALTA OPERADOR
                        </span>
                    </button>
                </div>` : ''}
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" id="statsContainer">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <p class="orbitron text-[9px] text-indigo-400 mb-2 font-black uppercase">Total Tripulación</p>
                    <h2 id="totalCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <p class="orbitron text-[9px] text-emerald-400 mb-2 font-black uppercase">Unidades Activas</p>
                    <h2 id="onlineCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <p class="orbitron text-[9px] text-slate-500 mb-2 font-black uppercase">Rango Actual</p>
                    <h2 class="orbitron text-3xl font-black text-indigo-400 italic uppercase tracking-tighter">${miRol}</h2>
                </div>
            </div>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>`;

        document.getElementById("btnNuevoMiembro")?.addEventListener("click", abrirFormularioStaff);
        document.getElementById("btnRecoverAll")?.addEventListener("click", recuperarPassword);
        escucharStaff();
    };

    const escucharStaff = () => {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");
        const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20 orbitron uppercase text-xs tracking-widest">Sin personal vinculado</div>`;
                return;
            }

            const crew = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            document.getElementById("totalCrew").innerText = crew.length;
            document.getElementById("onlineCrew").innerText = crew.filter(u => u.status === 'ACTIVE').length;

            grid.innerHTML = crew.map(u => {
                const rolU = (u.role || 'TECNICO').toUpperCase();
                const status = (u.status || 'INACTIVE').toUpperCase();
                
                return `
                <div class="group relative bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-2xl">
                    <div class="absolute top-8 right-8">
                        <span class="px-3 py-1 rounded-full text-[7px] font-black orbitron bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                            ${rolU}
                        </span>
                    </div>

                    <div class="flex flex-col items-center text-center">
                        <div class="w-20 h-20 rounded-3xl bg-black border border-white/10 flex items-center justify-center mb-6 relative group-hover:border-indigo-500 transition-all">
                            <i class="fas ${rolU === 'DUENO' ? 'fa-crown text-amber-400' : 'fa-user-gear text-slate-500'} text-2xl"></i>
                            <div class="absolute -bottom-1 -right-1 w-5 h-5 ${status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'} rounded-full border-4 border-[#0d1117]"></div>
                        </div>
                        <h3 class="text-white font-black orbitron text-xs uppercase mb-1">${u.nombre}</h3>
                        <p class="text-[9px] text-slate-500 font-mono opacity-50">${u.email}</p>
                    </div>

                    ${(miRol === 'DUENO' || miRol === 'ADMIN') ? `
                    <div class="mt-8 flex gap-2">
                        <button onclick="window.editarOperador('${u.id}')" class="flex-1 py-3 bg-white/5 rounded-xl text-[8px] font-black orbitron uppercase hover:bg-indigo-500/10 transition-all">EDITAR</button>
                        <button onclick="window.eliminarOperador('${u.id}')" class="w-12 h-10 flex items-center justify-center bg-red-500/5 text-red-500/40 rounded-xl hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash-alt"></i></button>
                    </div>` : ''}
                </div>`;
            }).join("");
        });
    };

    const abrirFormularioStaff = () => {
        Swal.fire({
            title: 'AUTORIZACIÓN DE ACCESO',
            background: '#010409',
            color: '#fff',
            html: `
                <div class="space-y-4 p-4 text-left">
                    <input id="st-nombre" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-xs" placeholder="NOMBRE">
                    <input id="st-email" type="email" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 font-mono text-xs" placeholder="EMAIL">
                    <input id="st-pass" type="password" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 text-xs" placeholder="PASSWORD TEMPORAL">
                    <select id="st-rol" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-[10px]">
                        <option value="TECNICO">TÉCNICO (Solo Órdenes)</option>
                        <option value="ADMIN">ADMIN (Gestión Staff/Inv)</option>
                    </select>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'ALTA DE USUARIO',
            preConfirm: () => {
                const nombre = document.getElementById('st-nombre').value.toUpperCase().trim();
                const email = document.getElementById('st-email').value.toLowerCase().trim();
                const pass = document.getElementById('st-pass').value;
                const role = document.getElementById('st-rol').value;
                if (!nombre || !email || !pass) return Swal.showValidationMessage("Protocolo Incompleto");
                return { nombre, email, pass, role };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // USO DE APP SECUNDARIA PARA NO CERRAR SESIÓN DEL DUEÑO
                    let secondaryApp = getApps().find(a => a.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
                    const authSec = getAuth(secondaryApp);
                    
                    const userCred = await createUserWithEmailAndPassword(authSec, result.value.email, result.value.pass);
                    
                    await setDoc(doc(db, "usuarios", userCred.user.uid), {
                        nombre: result.value.nombre,
                        email: result.value.email,
                        role: result.value.role,
                        empresaId: empresaId,
                        status: 'ACTIVE',
                        creadoEn: serverTimestamp()
                    });

                    await signOut(authSec);
                    Swal.fire({ icon: 'success', title: 'OPERADOR VINCULADO', background: '#010409' });
                } catch (e) {
                    Swal.fire({ icon: 'error', title: 'FALLO DE SEGURIDAD', text: e.message, background: '#010409' });
                }
            }
        });
    };

    const recuperarPassword = async () => {
        const { value: email } = await Swal.fire({ title: 'RECUPERACIÓN', input: 'email', background: '#010409', color: '#fff' });
        if (email) {
            await sendPasswordResetEmail(getAuth(), email);
            Swal.fire({ icon: 'success', title: 'LINK ENVIADO', background: '#010409' });
        }
    };

    // Funciones globales para botones dinámicos
    window.editarOperador = async (id) => {
        const { value: role } = await Swal.fire({
            title: 'CAMBIO DE RANGO',
            input: 'select',
            inputOptions: { 'TECNICO': 'TECNICO', 'ADMIN': 'ADMIN' },
            background: '#0d1117', color: '#fff'
        });
        if (role) await updateDoc(doc(db, "usuarios", id), { role });
    };

    window.eliminarOperador = async (id) => {
        const res = await Swal.fire({ title: '¿ELIMINAR?', icon: 'warning', showCancelButton: true, background: '#0d1117' });
        if (res.isConfirmed) await deleteDoc(doc(db, "usuarios", id));
    };

    renderLayout();
}
