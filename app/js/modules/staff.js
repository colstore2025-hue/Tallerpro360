/**
 * staff.js - TallerPRO360 NEXUS-X V18.0 👥
 * SISTEMA DE GESTIÓN DE TRIPULACIÓN TIPO SAP (RBAC)
 * Permite registro multicanal (Dueño o Colaborador) sin conflicto de sesión.
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, setDoc, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { db, firebaseConfig } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    const auth = getAuth();
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const miRol = (state?.rol || localStorage.getItem("rol") || "OPERADOR").toUpperCase(); 
    let unsubscribe = null;

    // --- RENDERIZADO DE INTERFAZ ESTILO SAP ---
    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold text-shadow-glow">NEXUS-X CORPORATE INFRASTRUCTURE</p>
                </div>

                ${['DUENO', 'SUPERADMIN', 'ADMIN'].includes(miRol) ? `
                <div class="flex gap-4">
                    <button id="btnRecoverPass" class="group px-6 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-500/10 transition-all shadow-lg" title="Recuperar Llave">
                        <i class="fas fa-key text-indigo-400"></i>
                    </button>
                    <button id="btnNuevoMiembro" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                        <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <i class="fas fa-user-plus"></i> RECLUTAR OPERADOR
                        </span>
                    </button>
                </div>` : ''}
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden shadow-2xl">
                    <p class="orbitron text-[9px] text-indigo-400 mb-2 font-black uppercase tracking-widest italic">Activos en Nodo</p>
                    <h2 id="totalCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden shadow-2xl">
                    <p class="orbitron text-[9px] text-emerald-400 mb-2 font-black uppercase tracking-widest italic">Estado Operativo</p>
                    <h2 id="onlineCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden shadow-2xl">
                    <p class="orbitron text-[9px] text-slate-500 mb-2 font-black uppercase tracking-widest italic">Tu Rango de Mando</p>
                    <h2 class="orbitron text-3xl font-black text-indigo-400 italic uppercase tracking-tighter">${miRol}</h2>
                </div>
            </div>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>`;

        document.getElementById("btnNuevoMiembro")?.addEventListener("click", abrirFormularioStaff);
        document.getElementById("btnRecoverPass")?.addEventListener("click", recuperarPassword);
        escucharStaff();
    };

    // --- REGLAS DE CARGO TIPO SAP ---
    const MANDO_MAP = {
        'ADMIN': { icon: 'fa-user-tie', color: 'text-amber-400', desc: 'GESTIÓN CONTABLE Y REPORTES' },
        'TECNICO': { icon: 'fa-tools', color: 'text-emerald-400', desc: 'OPERACIONES DE TALLER Y ÓRDENES' },
        'DUENO': { icon: 'fa-crown', color: 'text-indigo-400', desc: 'ACCESO TOTAL AL NODO CENTRAL' }
    };

    const escucharStaff = () => {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");
        const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20"><i class="fas fa-user-secret text-7xl mb-6"></i><p class="orbitron text-xs tracking-widest uppercase">Nodo Vacío</p></div>`;
                return;
            }
            const crew = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            document.getElementById("totalCrew").innerText = crew.length;
            document.getElementById("onlineCrew").innerText = crew.filter(u => u.status === 'ACTIVE').length;
            grid.innerHTML = crew.map(u => renderCard(u)).join("");
        });
    };

    const renderCard = (u) => {
        const rol = (u.role || u.rol || 'TECNICO').toUpperCase();
        const config = MANDO_MAP[rol] || MANDO_MAP['TECNICO'];

        return `
        <div class="group relative bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-2xl">
            <div class="absolute top-0 right-0 p-8">
                <span class="px-4 py-1 rounded-full text-[7px] font-black orbitron bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest italic">
                    ${rol}
                </span>
            </div>

            <div class="flex flex-col items-center text-center">
                <div class="w-24 h-24 rounded-[2.5rem] bg-black border border-white/5 flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform">
                    <i class="fas ${config.icon} ${config.color} text-3xl shadow-glow"></i>
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'} rounded-full border-4 border-[#0d1117]"></div>
                </div>
                <h3 class="text-white font-black orbitron text-sm uppercase mb-1">${u.nombre}</h3>
                <p class="text-[9px] text-slate-500 font-bold tracking-widest mb-4 uppercase">${u.email}</p>
                <p class="text-[7px] text-indigo-400/50 font-black orbitron uppercase italic">${config.desc}</p>
            </div>

            ${['DUENO', 'ADMIN'].includes(miRol) ? `
            <div class="mt-10 pt-8 border-t border-white/5 flex gap-3">
                <button onclick="window.editarOperador('${u.id}')" class="flex-1 py-3 bg-white/5 rounded-xl text-[8px] font-black text-slate-500 orbitron uppercase hover:text-indigo-400 transition-all">AJUSTAR</button>
                <button onclick="window.eliminarOperador('${u.id}')" class="w-12 h-10 flex items-center justify-center bg-red-500/5 text-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash-alt text-xs"></i></button>
            </div>` : ''}
        </div>`;
    };

    // --- RECLUTAMIENTO QUÁNTICO (SIN CONFLICTO DE SESIÓN) ---
    const abrirFormularioStaff = () => {
        Swal.fire({
            title: 'RECLUTAR OPERADOR NEXUS',
            background: '#010409',
            color: '#fff',
            html: `
                <div class="space-y-4 p-4 text-left">
                    <label class="orbitron text-[8px] text-slate-500 ml-2 uppercase">Identificación de Unidad</label>
                    <input id="st-nombre" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white orbitron text-xs uppercase" placeholder="NOMBRE COMPLETO">
                    
                    <label class="orbitron text-[8px] text-slate-500 ml-2 uppercase">Enlace de Comunicación</label>
                    <input id="st-email" type="email" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white text-xs" placeholder="email@taller.com">
                    
                    <label class="orbitron text-[8px] text-slate-500 ml-2 uppercase">Llave de Acceso</label>
                    <div class="relative">
                        <input id="st-pass" type="password" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white text-xs" placeholder="PASSWORD">
                        <button type="button" onclick="window.toggleNexusPass()" class="absolute right-5 top-5 text-slate-600"><i id="eye-icon" class="fas fa-eye"></i></button>
                    </div>

                    <label class="orbitron text-[8px] text-slate-500 ml-2 uppercase">Rango de Protocolo</label>
                    <select id="st-rol" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white orbitron text-[10px]">
                        <option value="TECNICO">MODO TÉCNICO: OPERATIVO Y ÓRDENES</option>
                        <option value="ADMIN">MODO ADMINISTRACIÓN: CONTABILIDAD Y REPORTES</option>
                    </select>
                    <p class="text-[7px] text-slate-500 italic mt-2">* El técnico NO podrá ver estados financieros ni reportes gerenciales.</p>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'EMITIR CREDENCIAL',
            preConfirm: () => {
                const nombre = document.getElementById('st-nombre').value.trim();
                const email = document.getElementById('st-email').value.trim();
                const pass = document.getElementById('st-pass').value;
                const role = document.getElementById('st-rol').value;
                if (!nombre || !email || !pass) return Swal.showValidationMessage("Información Incompleta");
                if (pass.length < 6) return Swal.showValidationMessage("La llave debe tener al menos 6 caracteres");
                return { nombre, email, pass, role };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'CREANDO NODO...', background: '#010409', didOpen: () => Swal.showLoading() });
                    
                    // --- EL TRUCO SAP: INSTANCIA SECUNDARIA ---
                    // Esto evita que el Dueño pierda su sesión al crear un técnico
                    const secondaryApp = initializeApp(firebaseConfig, "Secondary");
                    const secondaryAuth = getAuth(secondaryApp);

                    const userCred = await createUserWithEmailAndPassword(secondaryAuth, result.value.email, result.value.pass);
                    const uid = userCred.user.uid;

                    // Guardar en Firestore con el UID exacto
                    await setDoc(doc(db, "usuarios", uid), {
                        uid,
                        nombre: result.value.nombre.toUpperCase(),
                        email: result.value.email.toLowerCase(),
                        role: result.value.role,
                        empresaId: empresaId,
                        status: 'ACTIVE',
                        misionesCount: 0,
                        creadoEn: serverTimestamp()
                    });

                    // Limpieza: Cerramos la sesión secundaria y destruimos la instancia temporal
                    await signOut(secondaryAuth);
                    
                    Swal.fire({ icon: 'success', title: 'OPERADOR VINCULADO', text: 'Ya puede iniciar sesión en su terminal.', background: '#0d1117' });
                } catch (e) {
                    Swal.fire({ icon: 'error', title: 'ERROR CRÍTICO', text: e.message, background: '#0d1117' });
                }
            }
        });
    };

    // --- RECUPERACIÓN DE ACCESO ---
    const recuperarPassword = async () => {
        const { value: email } = await Swal.fire({
            title: 'RESET DE LLAVE',
            input: 'email',
            background: '#0d1117',
            color: '#fff',
            confirmButtonText: 'ENVIAR PROTOCOLO'
        });
        if (email) {
            try {
                await sendPasswordResetEmail(auth, email);
                Swal.fire('ENVIADO', 'Revisar bandeja de entrada.', 'success');
            } catch (e) { Swal.fire('ERROR', e.message, 'error'); }
        }
    };

    // --- UTILIDADES ---
    window.toggleNexusPass = () => {
        const p = document.getElementById('st-pass');
        const i = document.getElementById('eye-icon');
        p.type = p.type === 'password' ? 'text' : 'password';
        i.classList.toggle('fa-eye'); i.classList.toggle('fa-eye-slash');
    };

    window.eliminarOperador = async (id) => {
        const res = await Swal.fire({ title: '¿REVOCAR ACCESO?', text: "Se perderá el vínculo con el nodo.", icon: 'warning', showCancelButton: true });
        if (res.isConfirmed) await deleteDoc(doc(db, "usuarios", id));
    };

    renderLayout();
}
