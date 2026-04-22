/**
 * staff.js - TallerPRO360 NEXUS-X V18.5 👥
 * SISTEMA COMPLETO DE GESTIÓN DE TRIPULACIÓN Y CREDENCIALES
 * Integración total: Auth + Firestore + RBAC (Role Based Access Control)
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, setDoc, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { db, firebaseConfig } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    const auth = getAuth();
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const miRol = (state?.rol || localStorage.getItem("rol") || "OPERADOR").toUpperCase(); 
    let unsubscribe = null;

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 text-red-500 orbitron text-center">ERROR: NODO NO IDENTIFICADO</div>`;
        return;
    }

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-700 pb-40">
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-glow"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter uppercase">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">NEXUS-X CORPORATE INFRASTRUCTURE</p>
                </div>

                ${['DUENO', 'ADMIN', 'SUPERADMIN'].includes(miRol) ? `
                <div class="flex gap-4">
                    <button id="btnRecover" class="px-6 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-500/10 transition-all shadow-lg">
                        <i class="fas fa-key text-indigo-400"></i>
                    </button>
                    <button id="btnNuevoMiembro" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 shadow-glow">
                        <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <i class="fas fa-user-plus"></i> RECLUTAR OPERADOR
                        </span>
                    </button>
                </div>` : ''}
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <p class="orbitron text-[9px] text-indigo-400 mb-2 font-black uppercase tracking-widest italic">Total Tripulación</p>
                    <h2 id="totalCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <p class="orbitron text-[9px] text-emerald-400 mb-2 font-black uppercase tracking-widest italic">Estado Operativo</p>
                    <h2 id="onlineCrew" class="orbitron text-4xl font-black text-white italic italic">CONECTADO</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                    <p class="orbitron text-[9px] text-slate-500 mb-2 font-black uppercase tracking-widest italic">Rango de Mando</p>
                    <h2 class="orbitron text-3xl font-black text-indigo-400 uppercase">${miRol}</h2>
                </div>
            </div>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>`;

        document.getElementById("btnNuevoMiembro")?.addEventListener("click", abrirFormularioStaff);
        document.getElementById("btnRecover")?.addEventListener("click", recuperarPassword);
        escucharStaff();
    };

    const escucharStaff = () => {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");
        const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20 orbitron text-xs tracking-widest uppercase">Nodo Vacío</div>`;
                return;
            }
            const crew = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            document.getElementById("totalCrew").innerText = crew.length;
            grid.innerHTML = crew.map(u => renderCard(u)).join("");
        });
    };

    const renderCard = (u) => {
        const rolU = (u.role || u.rol || 'OPERADOR').toUpperCase();
        const status = (u.status || 'INACTIVE').toUpperCase();
        const esAdmin = rolU.includes('ADMIN') || rolU.includes('DUENO');

        return `
        <div class="group relative bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-2xl">
            <div class="absolute top-0 right-0 p-8">
                <span class="px-4 py-1 rounded-full text-[7px] font-black orbitron ${esAdmin ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-500'} uppercase tracking-widest italic">
                    ${rolU}
                </span>
            </div>

            <div class="flex flex-col items-center text-center">
                <div class="w-24 h-24 rounded-[2.5rem] bg-black border border-white/5 flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500">
                    <i class="fas ${esAdmin ? 'fa-user-shield text-indigo-400' : 'fa-tools text-slate-500'} text-3xl"></i>
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 ${status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'} rounded-full border-4 border-[#0d1117]"></div>
                </div>
                <h3 class="text-white font-black orbitron text-sm uppercase mb-1">${u.nombre || 'UNIDAD_X'}</h3>
                <p class="text-[9px] text-slate-500 font-bold tracking-widest mb-4 italic font-mono">${u.email}</p>
            </div>

            ${['DUENO', 'ADMIN', 'SUPERADMIN'].includes(miRol) ? `
            <div class="mt-8 pt-8 border-t border-white/5 flex gap-3">
                <button onclick="window.editarOperador('${u.id}')" class="flex-1 py-3 bg-white/5 rounded-xl text-[8px] font-black text-slate-500 orbitron uppercase hover:text-indigo-400 transition-all">CONFIGURAR</button>
                <button onclick="window.eliminarOperador('${u.id}')" class="w-12 h-10 flex items-center justify-center bg-red-500/5 text-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash-alt text-xs"></i></button>
            </div>` : ''}
        </div>`;
    };

    const abrirFormularioStaff = () => {
        Swal.fire({
            title: 'EMISIÓN DE CREDENCIALES',
            background: '#010409',
            color: '#fff',
            html: `
                <div class="space-y-4 p-4 text-left">
                    <label class="orbitron text-[8px] text-slate-500 ml-2 uppercase tracking-widest font-black">Identificación</label>
                    <input id="st-nombre" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white orbitron text-xs uppercase" placeholder="Nombre Completo">
                    <label class="orbitron text-[8px] text-slate-500 ml-2 uppercase tracking-widest font-black">Canal Digital</label>
                    <input id="st-email" type="email" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white text-xs" placeholder="email@taller.com">
                    <label class="orbitron text-[8px] text-slate-500 ml-2 uppercase tracking-widest font-black">Llave de Acceso</label>
                    <input id="st-pass" type="password" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white text-xs" placeholder="Mínimo 6 caracteres">
                    <label class="orbitron text-[8px] text-slate-500 ml-2 uppercase tracking-widest font-black">Rango de Mando</label>
                    <select id="st-rol" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white orbitron text-[10px]">
                        <option value="TECNICO">MODO TÉCNICO: OPERATIVO</option>
                        <option value="ADMIN">MODO ADMINISTRACIÓN: FINANZAS</option>
                    </select>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'CREAR ACCESO',
            preConfirm: () => {
                const nombre = document.getElementById('st-nombre').value.trim();
                const email = document.getElementById('st-email').value.trim();
                const pass = document.getElementById('st-pass').value;
                const role = document.getElementById('st-rol').value;
                if (!nombre || !email || !pass) return Swal.showValidationMessage("Información Requerida");
                return { nombre, email, pass, role };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'SINCRONIZANDO NODO...', background: '#010409', didOpen: () => Swal.showLoading() });
                    
                    // --- BYPASS DE SESIÓN (Secondary App) ---
                    let secondaryApp = getApps().find(app => app.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
                    const secondaryAuth = getAuth(secondaryApp);

                    const userCred = await createUserWithEmailAndPassword(secondaryAuth, result.value.email, result.value.pass);
                    const uid = userCred.user.uid;

                    await setDoc(doc(db, "usuarios", uid), {
                        uid,
                        nombre: result.value.nombre.toUpperCase(),
                        email: result.value.email.toLowerCase(),
                        role: result.value.role,
                        empresaId: empresaId,
                        status: 'ACTIVE',
                        creadoEn: serverTimestamp()
                    });

                    await signOut(secondaryAuth);
                    Swal.fire({ icon: 'success', title: 'ACCESO CREADO', text: 'El operador ya puede entrar con su correo.', background: '#0d1117' });
                } catch (e) {
                    Swal.fire({ icon: 'error', title: 'FALLO DE NODO', text: e.message, background: '#0d1117' });
                }
            }
        });
    };

    const recuperarPassword = async () => {
        const { value: email } = await Swal.fire({
            title: 'RECUPERAR LLAVE',
            input: 'email',
            background: '#0d1117',
            color: '#fff',
            confirmButtonText: 'ENVIAR'
        });
        if (email) {
            try {
                await sendPasswordResetEmail(auth, email);
                Swal.fire('ENVIADO', 'Revisa el correo del operador.', 'success');
            } catch (e) { Swal.fire('ERROR', e.message, 'error'); }
        }
    };

    window.editarOperador = async (id) => {
        const { value: res } = await Swal.fire({
            title: 'AJUSTAR RANGO',
            background: '#0d1117',
            color: '#fff',
            html: `
                <select id="ed-rol" class="swal2-input bg-black text-white">
                    <option value="TECNICO">TECNICO</option>
                    <option value="ADMIN">ADMIN</option>
                </select>`,
            preConfirm: () => document.getElementById('ed-rol').value
        });
        if (res) await updateDoc(doc(db, "usuarios", id), { role: res });
    };

    window.eliminarOperador = async (id) => {
        const res = await Swal.fire({ title: '¿ELIMINAR?', background: '#0d1117', showCancelButton: true });
        if (res.isConfirmed) await deleteDoc(doc(db, "usuarios", id));
    };

    renderLayout();
}
