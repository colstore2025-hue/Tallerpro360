/**
 * staff.js - TallerPRO360 NEXUS-X V18.2 👥
 * SISTEMA DE GESTIÓN DE TRIPULACIÓN TIPO SAP (RBAC)
 * Solución al error de "Perfil no encontrado" y Multisesión.
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, setDoc, doc, deleteDoc
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
        container.innerHTML = `<div class="p-10 text-red-500 orbitron text-center">ERROR: NODO DE EMPRESA NO DETECTADO</div>`;
        return;
    }

    // --- MAPA DE ACCESO TIPO SAP (RBAC) ---
    const MANDO_MAP = {
        'ADMIN': { icon: 'fa-user-tie', color: 'text-amber-400', desc: 'CONTABILIDAD Y REPORTES' },
        'TECNICO': { icon: 'fa-tools', color: 'text-emerald-400', desc: 'OPERACIONES Y TALLER' },
        'DUENO': { icon: 'fa-crown', color: 'text-indigo-400', desc: 'ACCESO TOTAL NEXUS' }
    };

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

                ${['DUENO', 'ADMIN'].includes(miRol) ? `
                <div class="flex gap-4">
                    <button id="btnRecoverPass" class="group px-6 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-500/10 transition-all shadow-lg">
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
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <p class="orbitron text-[9px] text-indigo-400 mb-2 font-black uppercase tracking-widest italic">Personal en Nodo</p>
                    <h2 id="totalCrew" class="orbitron text-4xl font-black text-white">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <p class="orbitron text-[9px] text-emerald-400 mb-2 font-black uppercase tracking-widest italic">Estado Operativo</p>
                    <h2 id="onlineCrew" class="orbitron text-4xl font-black text-white">READY</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <p class="orbitron text-[9px] text-slate-500 mb-2 font-black uppercase tracking-widest italic">Rango de Mando</p>
                    <h2 class="orbitron text-3xl font-black text-indigo-400 uppercase">${miRol}</h2>
                </div>
            </div>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>`;

        document.getElementById("btnNuevoMiembro")?.addEventListener("click", abrirFormularioStaff);
        document.getElementById("btnRecoverPass")?.addEventListener("click", recuperarPassword);
        escucharStaff();
    };

    const escucharStaff = () => {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");
        const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-20 text-center opacity-20 orbitron text-xs">NODO VACÍO</div>`;
                return;
            }
            const crew = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            document.getElementById("totalCrew").innerText = crew.length;
            grid.innerHTML = crew.map(u => renderCard(u)).join("");
        });
    };

    const renderCard = (u) => {
        const rol = (u.role || u.rol || 'TECNICO').toUpperCase();
        const config = MANDO_MAP[rol] || MANDO_MAP['TECNICO'];
        return `
        <div class="group relative bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 hover:border-indigo-500/50 transition-all shadow-2xl">
            <div class="flex flex-col items-center text-center">
                <div class="w-20 h-20 rounded-[2rem] bg-black border border-white/5 flex items-center justify-center mb-6 relative shadow-inner">
                    <i class="fas ${config.icon} ${config.color} text-2xl"></i>
                    <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#0d1117]"></div>
                </div>
                <h3 class="text-white font-black orbitron text-sm uppercase tracking-tighter">${u.nombre}</h3>
                <p class="text-[9px] text-slate-500 font-bold tracking-widest mb-4">${u.email}</p>
                <span class="px-4 py-1 rounded-full text-[7px] font-black orbitron bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest italic">${rol}</span>
            </div>
            ${['DUENO', 'ADMIN'].includes(miRol) ? `
            <div class="mt-8 pt-6 border-t border-white/5 flex gap-2">
                <button onclick="window.eliminarOperador('${u.id}')" class="w-full py-3 bg-red-500/5 text-red-500/40 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[8px] orbitron font-black uppercase">ELIMINAR</button>
            </div>` : ''}
        </div>`;
    };

    const abrirFormularioStaff = () => {
        Swal.fire({
            title: 'NUEVA CREDENCIAL NEXUS',
            background: '#010409',
            color: '#fff',
            html: `
                <div class="space-y-4 p-4 text-left">
                    <input id="st-nombre" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white orbitron text-xs" placeholder="NOMBRE">
                    <input id="st-email" type="email" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white text-xs" placeholder="EMAIL">
                    <input id="st-pass" type="password" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white text-xs" placeholder="PASSWORD">
                    <select id="st-rol" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white orbitron text-[10px]">
                        <option value="TECNICO">MODO TÉCNICO: ÓRDENES E INVENTARIO</option>
                        <option value="ADMIN">MODO ADMINISTRACIÓN: CONTABILIDAD Y REPORTES</option>
                    </select>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'ACTIVAR',
            preConfirm: () => {
                const nombre = document.getElementById('st-nombre').value.trim();
                const email = document.getElementById('st-email').value.trim();
                const pass = document.getElementById('st-pass').value;
                const role = document.getElementById('st-rol').value;
                if (!nombre || !email || !pass) return Swal.showValidationMessage("Faltan datos");
                return { nombre, email, pass, role };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'SINCRONIZANDO...', background: '#010409', didOpen: () => Swal.showLoading() });
                    
                    // --- PROTECCIÓN DE INSTANCIA SECUNDARIA ---
                    let secondaryApp;
                    const existingApp = getApps().find(app => app.name === "Secondary");
                    if (existingApp) {
                        secondaryApp = existingApp;
                    } else {
                        secondaryApp = initializeApp(firebaseConfig, "Secondary");
                    }
                    
                    const secondaryAuth = getAuth(secondaryApp);
                    const userCred = await createUserWithEmailAndPassword(secondaryAuth, result.value.email, result.value.pass);
                    const uid = userCred.user.uid;

                    await setDoc(doc(db, "usuarios", uid), {
                        uid: uid,
                        nombre: result.value.nombre.toUpperCase(),
                        email: result.value.email.toLowerCase(),
                        role: result.value.role,
                        empresaId: empresaId,
                        status: 'ACTIVE',
                        creadoEn: serverTimestamp()
                    });

                    await signOut(secondaryAuth);
                    Swal.fire({ icon: 'success', title: 'OPERADOR ACTIVADO', background: '#0d1117' });
                } catch (e) {
                    Swal.fire({ icon: 'error', title: 'FALLO', text: e.message, background: '#0d1117' });
                }
            }
        });
    };

    const recuperarPassword = async () => {
        const { value: email } = await Swal.fire({ title: 'RESET LLAVE', input: 'email', background: '#0d1117', color: '#fff' });
        if (email) {
            try {
                await sendPasswordResetEmail(auth, email);
                Swal.fire('ENVIADO', 'Verifica el correo.', 'success');
            } catch (e) { Swal.fire('ERROR', e.message, 'error'); }
        }
    };

    window.eliminarOperador = async (id) => {
        const res = await Swal.fire({ title: '¿ELIMINAR?', background: '#010409', color: '#fff', showCancelButton: true });
        if (res.isConfirmed) await deleteDoc(doc(db, "usuarios", id));
    };

    renderLayout();
}
