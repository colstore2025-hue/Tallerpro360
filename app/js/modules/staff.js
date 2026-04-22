/**
 * staff.js - TallerPRO360 NEXUS-X V30.0 🦾 [TERMINATOR EDITION]
 * PROTOCOLO DE SEGURIDAD ABSOLUTA Y GESTIÓN DE TRIPULACIÓN
 * Desarrollado por: William Jeffry Urquijo Cubillos
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

    // --- LÓGICA DE PERMISOS (HARDCODED PARA SEGURIDAD) ---
    const PERMISOS = {
        'DUENO': { acceso: 'TOTAL', modulos: ['*'] },
        'ADMIN': { acceso: 'GESTION', modulos: ['inventario', 'staff', 'dashboard'] },
        'TECNICO': { acceso: 'OPERATIVO', modulos: ['ordenes'] }
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold tracking-widest">Protocolo V30.0 - Seguridad de Grado 5</p>
                </div>

                ${(miRol === 'DUENO' || miRol === 'SUPERADMIN') ? `
                <div class="flex flex-wrap gap-4">
                    <button id="btnRecoverAll" class="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-500/20 transition-all flex items-center gap-3 orbitron text-[9px] font-bold text-indigo-400">
                        <i class="fas fa-key"></i> REGENERAR LLAVE
                    </button>
                    <button id="btnNuevoMiembro" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                        <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <i class="fas fa-user-shield text-xs"></i> ALTA DE OPERADOR
                        </span>
                    </button>
                </div>` : ''}
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden shadow-2xl">
                    <div class="absolute -right-5 -bottom-5 text-indigo-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-users-cog"></i></div>
                    <p class="orbitron text-[9px] text-indigo-400 mb-2 font-black uppercase tracking-widest italic">Personal en Nómina</p>
                    <h2 id="totalCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden shadow-2xl">
                    <div class="absolute -right-5 -bottom-5 text-emerald-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-satellite"></i></div>
                    <p class="orbitron text-[9px] text-emerald-400 mb-2 font-black uppercase tracking-widest italic">Unidades Activas</p>
                    <h2 id="onlineCrew" class="orbitron text-4xl font-black text-white italic">...</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden shadow-2xl">
                    <div class="absolute -right-5 -bottom-5 text-indigo-500/5 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-shield-alt"></i></div>
                    <p class="orbitron text-[9px] text-slate-500 mb-2 font-black uppercase tracking-widest italic">Tu Nivel de Mando</p>
                    <h2 class="orbitron text-3xl font-black text-indigo-400 italic uppercase tracking-tighter">${miRol}</h2>
                </div>
            </div>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                </div>
        </div>
        `;

        document.getElementById("btnNuevoMiembro")?.addEventListener("click", abrirFormularioStaff);
        document.getElementById("btnRecoverAll")?.addEventListener("click", () => recuperarPasswordGenerico());
        escucharStaff();
    };

    const escucharStaff = () => {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");
        const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20"><i class="fas fa-user-secret text-7xl mb-6"></i><p class="orbitron text-[10px] tracking-[0.5em] uppercase italic">Sector Deshabitado</p></div>`;
                document.getElementById("totalCrew").innerText = "0";
                document.getElementById("onlineCrew").innerText = "0";
                return;
            }

            const crew = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            document.getElementById("totalCrew").innerText = crew.length;
            document.getElementById("onlineCrew").innerText = crew.filter(u => u.status === 'ACTIVE').length;

            grid.innerHTML = crew.map(u => {
                const rolU = (u.role || 'OPERADOR').toUpperCase();
                const esAdmin = rolU.includes('ADMIN') || rolU.includes('DUENO');
                const status = (u.status || 'INACTIVE').toUpperCase();

                return `
                <div class="group relative bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-2xl overflow-hidden">
                    <div class="absolute top-0 right-0 p-8">
                        <span class="px-4 py-1 rounded-full text-[7px] font-black orbitron ${esAdmin ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-500'} tracking-widest uppercase italic">
                            ${rolU}
                        </span>
                    </div>

                    <div class="flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-[2.5rem] bg-black border border-white/5 flex items-center justify-center mb-6 relative group-hover:border-indigo-500 transition-all duration-500">
                            <i class="fas ${esAdmin ? 'fa-user-shield text-indigo-400' : 'fa-id-badge text-slate-600'} text-3xl"></i>
                            <div class="absolute -bottom-1 -right-1 w-6 h-6 ${status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500'} rounded-full border-4 border-[#0d1117]"></div>
                        </div>
                        
                        <h3 class="text-white font-black orbitron text-sm uppercase tracking-tighter mb-2">${u.nombre || 'SIN_IDENTIFICAR'}</h3>
                        <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">${u.email}</p>
                    </div>

                    ${(miRol === 'DUENO' || miRol === 'ADMIN') ? `
                    <div class="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="window.editarOperador('${u.id}')" class="flex-1 py-3 bg-white/5 rounded-xl text-[8px] font-black text-slate-500 orbitron uppercase hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                            CONFIGURAR
                        </button>
                        <button onclick="window.eliminarOperador('${u.id}')" class="w-12 h-10 flex items-center justify-center bg-red-500/5 text-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>` : ''}
                </div>`;
            }).join("");
        });
    };

    // --- MOTOR DE ALTA DE PERSONAL (Capa de Autenticación Real) ---
    const abrirFormularioStaff = () => {
        Swal.fire({
            title: 'PROTOCOL DE RECLUTAMIENTO',
            background: '#010409',
            color: '#fff',
            customClass: { popup: 'rounded-[3rem] border border-indigo-500/20 shadow-[0_0_50px_rgba(0,0,0,1)]' },
            html: `
                <div class="space-y-5 p-4 text-left">
                    <input id="st-nombre" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-xs" placeholder="NOMBRE COMPLETO">
                    <input id="st-email" type="email" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 font-mono text-xs" placeholder="CORREO@TALLER.COM">
                    <div class="relative">
                        <input id="st-pass" type="password" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 text-xs" placeholder="PASSWORD TEMPORAL">
                        <span class="absolute right-4 top-4 text-slate-600"><i class="fas fa-shield-alt"></i></span>
                    </div>
                    <select id="st-rol" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-[10px]">
                        <option value="TECNICO">RANGO: TÉCNICO (Solo Órdenes)</option>
                        <option value="ADMIN">RANGO: ADMIN (Gestión Total)</option>
                    </select>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'AUTORIZAR ACCESO',
            confirmButtonColor: '#4f46e5',
            preConfirm: () => {
                const nombre = document.getElementById('st-nombre').value.toUpperCase().trim();
                const email = document.getElementById('st-email').value.toLowerCase().trim();
                const pass = document.getElementById('st-pass').value;
                const role = document.getElementById('st-rol').value;
                if (!nombre || !email || !pass) return Swal.showValidationMessage("Protocolo Incompleto");
                if (pass.length < 6) return Swal.showValidationMessage("Llave de seguridad muy corta");
                return { nombre, email, pass, role };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'CREANDO IDENTIDAD...', background: '#010409', didOpen: () => Swal.showLoading() });
                    
                    // CREACIÓN EN FIREBASE AUTH SIN CERRAR SESIÓN DEL DUEÑO
                    let secondaryApp = getApps().find(a => a.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
                    const authSec = getAuth(secondaryApp);
                    
                    const userCred = await createUserWithEmailAndPassword(authSec, result.value.email, result.value.pass);
                    const uid = userCred.user.uid;

                    // GUARDAR EN FIRESTORE
                    await setDoc(doc(db, "usuarios", uid), {
                        nombre: result.value.nombre,
                        email: result.value.email,
                        role: result.value.role,
                        empresaId: empresaId,
                        status: 'ACTIVE',
                        creadoEn: serverTimestamp()
                    });

                    await signOut(authSec); // Cerramos la app secundaria únicamente
                    Swal.fire({ icon: 'success', title: 'OPERADOR ACTIVADO', background: '#010409' });
                } catch (e) {
                    Swal.fire({ icon: 'error', title: 'ERROR CRÍTICO', text: e.message, background: '#010409' });
                }
            }
        });
    };

    // --- RECUPERACIÓN DE CONTRASEÑA ---
    const recuperarPasswordGenerico = async () => {
        const { value: email } = await Swal.fire({
            title: 'REGENERAR LLAVE',
            input: 'email',
            inputLabel: 'Correo del Colaborador',
            background: '#010409',
            color: '#fff',
            confirmButtonColor: '#4f46e5'
        });

        if (email) {
            try {
                await sendPasswordResetEmail(getAuth(), email);
                Swal.fire({ icon: 'success', title: 'LINK ENVIADO', text: 'El técnico debe revisar su correo para cambiar su clave.', background: '#010409' });
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'FALLO', text: e.message, background: '#010409' });
            }
        }
    };

    // --- FUNCIONES GLOBALES ---
    window.editarOperador = async (id) => {
        const { value: form } = await Swal.fire({
            title: 'ACTUALIZAR RANGO',
            background: '#0d1117',
            color: '#fff',
            html: `
                <select id="ed-rol" class="w-full bg-black p-4 rounded-xl text-white orbitron text-xs">
                    <option value="TECNICO">TECNICO</option>
                    <option value="ADMIN">ADMIN</option>
                </select>
                <select id="ed-status" class="w-full bg-black p-4 rounded-xl text-white orbitron text-xs mt-4">
                    <option value="ACTIVE">ACTIVO</option>
                    <option value="INACTIVE">BLOQUEADO</option>
                </select>`,
            preConfirm: () => [document.getElementById('ed-rol').value, document.getElementById('ed-status').value]
        });

        if (form) {
            await updateDoc(doc(db, "usuarios", id), { role: form[0], status: form[1] });
            Swal.fire({ icon: 'success', title: 'PROTOCOLO ACTUALIZADO', background: '#0d1117' });
        }
    };

    window.eliminarOperador = async (id) => {
        const res = await Swal.fire({ title: '¿ELIMINAR OPERADOR?', text: "Se revocará el acceso de forma permanente.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: '#0d1117' });
        if (res.isConfirmed) await deleteDoc(doc(db, "usuarios", id));
    };

    renderLayout();
}
