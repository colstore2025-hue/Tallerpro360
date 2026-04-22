/**
 * staff.js - TallerPRO360 NEXUS-X V30.0 🦾 [MODO AUDITORÍA]
 * SISTEMA DE CONTROL DE ACCESO DUAL (AUTH + FIRESTORE)
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, setDoc, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { db, firebaseConfig } from "../core/firebase-config.js"; 

export default async function staffModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    // ROLES PERMITIDOS PARA GESTIONAR: DUENO y ADMIN
    const miRol = (state?.rol || localStorage.getItem("rol") || "OPERADOR").toUpperCase(); 
    const tienePermisosElevados = ['DUENO', 'ADMIN', 'SUPERADMIN'].includes(miRol);
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-700 pb-40">
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white uppercase">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">
                        Panel de Comandos Administrativos
                    </p>
                </div>

                ${tienePermisosElevados ? `
                <button id="btnNuevoMiembro" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                    <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                        <i class="fas fa-user-shield text-xs"></i> ACTIVAR NUEVO ACCESO
                    </span>
                </button>` : ''}
            </header>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                </div>
        </div>`;

        if (tienePermisosElevados) {
            document.getElementById("btnNuevoMiembro").onclick = abrirFormularioStaff;
        }
        
        escucharStaff();
    };

    const escucharStaff = () => {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");
        const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-20 text-center opacity-20">SIN PERSONAL ASIGNADO</div>`;
                return;
            }

            grid.innerHTML = snap.docs.map(d => {
                const u = d.data();
                const id = d.id;
                const rolU = (u.role || u.rol || 'TECNICO').toUpperCase();
                const status = (u.status || 'ACTIVE').toUpperCase();

                return `
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-indigo-500/30 transition-all group">
                    <div class="flex justify-between items-start mb-6">
                        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <i class="fas ${rolU === 'DUENO' ? 'fa-crown' : 'fa-user-cog'}"></i>
                        </div>
                        <span class="text-[8px] orbitron px-3 py-1 bg-black rounded-full border border-white/10 ${status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}">
                            ${status}
                        </span>
                    </div>
                    <h3 class="orbitron text-sm font-bold text-white mb-1">${u.nombre}</h3>
                    <p class="text-[10px] text-slate-500 font-mono mb-6">${u.email}</p>
                    <div class="pt-4 border-t border-white/5 flex gap-2">
                        <span class="text-[7px] orbitron text-slate-600 uppercase">Cargo:</span>
                        <span class="text-[7px] orbitron text-indigo-400 uppercase font-black">${rolU}</span>
                    </div>
                    
                    ${tienePermisosElevados && rolU !== 'DUENO' ? `
                    <div class="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="window.eliminarOperador('${id}')" class="flex-1 py-2 bg-red-500/10 text-red-500 rounded-xl text-[8px] orbitron hover:bg-red-500 hover:text-white transition-all">BORRAR ACCESO</button>
                    </div>` : ''}
                </div>`;
            }).join("");
        });
    };

    const abrirFormularioStaff = () => {
        Swal.fire({
            title: 'PROTOCOL DE ACCESO',
            background: '#010409',
            color: '#fff',
            html: `
                <div class="space-y-4 p-4">
                    <input id="st-nombre" class="w-full bg-black p-4 rounded-xl text-white border border-white/5 orbitron text-xs" placeholder="NOMBRE COMPLETO">
                    <input id="st-email" type="email" class="w-full bg-black p-4 rounded-xl text-white border border-white/5 font-mono text-xs" placeholder="CORREO ELECTRÓNICO">
                    <input id="st-pass" type="password" class="w-full bg-black p-4 rounded-xl text-white border border-white/5 text-xs" placeholder="CONTRASEÑA (Mínimo 6 caracteres)">
                    <select id="st-rol" class="w-full bg-black p-4 rounded-xl text-white border border-white/5 orbitron text-xs">
                        <option value="TECNICO">TÉCNICO (Solo órdenes)</option>
                        <option value="ADMIN">ADMIN (Todo menos Dueño)</option>
                    </select>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'CREAR LLAVE MAESTRA',
            preConfirm: () => {
                const nombre = document.getElementById('st-nombre').value.toUpperCase().trim();
                const email = document.getElementById('st-email').value.toLowerCase().trim();
                const pass = document.getElementById('st-pass').value;
                const role = document.getElementById('st-rol').value;
                if (!nombre || !email || !pass || pass.length < 6) return Swal.showValidationMessage("Protocolo incompleto o clave muy corta");
                return { nombre, email, pass, role };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'Sincronizando con la red...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                    /**
                     * ⚡ AUDITORÍA FORENSE: El truco para no cerrar la sesión del Dueño.
                     * Usamos una instancia secundaria de Firebase Auth para crear al técnico.
                     */
                    const secondaryApp = getApps().find(a => a.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
                    const authSec = getAuth(secondaryApp);
                    
                    const userCred = await createUserWithEmailAndPassword(authSec, result.value.email, result.value.pass);
                    const uid = userCred.user.uid;

                    // Guardamos el perfil en la colección de usuarios para el RBAC
                    await setDoc(doc(db, "usuarios", uid), {
                        nombre: result.value.nombre,
                        email: result.value.email,
                        role: result.value.role,
                        empresaId: empresaId,
                        status: 'ACTIVE',
                        creadoEn: serverTimestamp()
                    });

                    // Deslogueamos la cuenta creada en la instancia secundaria (sin afectar al Dueño)
                    await signOut(authSec);

                    Swal.fire({ icon: 'success', title: 'OPERADOR VINCULADO', text: 'Ya puede ingresar con su correo y clave.' });
                } catch (e) {
                    Swal.fire({ icon: 'error', title: 'FALLO DE SISTEMA', text: e.message });
                }
            }
        });
    };

    window.eliminarOperador = async (id) => {
        const res = await Swal.fire({ title: '¿REVOCAR ACCESO?', text: "Esta acción es irreversible", icon: 'warning', showCancelButton: true });
        if (res.isConfirmed) await deleteDoc(doc(db, "usuarios", id));
    };

    renderLayout();
}
