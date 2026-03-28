/**
 * staff.js - TallerPRO360 NEXUS-X V17.0 👥
 * Control de Tripulación: Multi-Tenant & RBAC (Role Based Access Control)
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";

export default async function staff(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const miRol = localStorage.getItem("nexus_rol"); // ADMIN o TECNICO
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-right-10 duration-1000 pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
                <div>
                    <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                        CREW <span class="text-indigo-400">CONTROL</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <span class="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></span>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron">Gestión de Accesos Satelitales</p>
                    </div>
                </div>
                
                ${miRol === 'ADMIN' ? `
                <button id="btnNuevoMiembro" class="group relative px-10 py-6 bg-slate-900 rounded-[2rem] border border-indigo-500/30 hover:border-indigo-400 transition-all shadow-2xl overflow-hidden">
                    <span class="relative orbitron text-[10px] font-black text-indigo-400 tracking-widest flex items-center gap-4">
                        <i class="fas fa-user-plus text-lg"></i> RECLUTAR TÉCNICO
                    </span>
                </button>` : ''}
            </header>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                </div>
        </div>
        `;

        if (miRol === 'ADMIN') {
            document.getElementById("btnNuevoMiembro").onclick = abrirFormularioStaff;
        }
        escucharStaff();
    };

    const abrirFormularioStaff = () => {
        window.Swal.fire({
            title: 'NUEVA CREDENCIAL',
            background: '#050a14',
            color: '#fff',
            html: `
                <div class="space-y-4 p-4">
                    <input id="st-nombre" class="sw-input" placeholder="NOMBRE DEL TÉCNICO">
                    <input id="st-email" type="email" class="sw-input" placeholder="EMAIL (USUARIO)">
                    <input id="st-pass" type="password" class="sw-input" placeholder="PASSWORD INICIAL">
                    <select id="st-rol" class="sw-input">
                        <option value="TECNICO">MODO TÉCNICO (Solo Ops)</option>
                        <option value="ADMIN">MODO ADMIN (Acceso Total)</option>
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'CREAR ACCESO',
            customClass: { confirmButton: 'btn-confirm-nexus' }
        }).then(result => {
            if (result.isConfirmed) {
                registrarMiembro();
            }
        });
    };

    async function registrarMiembro() {
        const nombre = document.getElementById('st-nombre').value.toUpperCase();
        const email = document.getElementById('st-email').value.toLowerCase();
        const pass = document.getElementById('st-pass').value;
        const rol = document.getElementById('st-rol').value;

        if (!nombre || !email || !pass) return;

        try {
            // Guardamos en la colección raíz 'usuarios' con el link al taller
            await createDocument("usuarios", {
                nombre,
                email,
                pass, // En producción usar Auth de Firebase, esto es para gestión interna
                rol,
                empresaId: empresaId,
                estado: 'ACTIVO',
                ultimoAcceso: serverTimestamp()
            });

            saveLog("STAFF_CREATED", { tecnico: nombre, rol });
            window.Swal.fire('ÉXITO', 'Credenciales activadas.', 'success');
        } catch (e) { console.error(e); }
    }

    function escucharStaff() {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridStaff");

        const q = query(
            collection(db, "usuarios"),
            where("empresaId", "==", empresaId)
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-20 text-center opacity-20 orbitron text-xs">Sin personal asignado</div>`;
                return;
            }

            grid.innerHTML = snap.docs.map(docSnap => {
                const u = docSnap.data();
                const isAdmin = u.rol === 'ADMIN';

                return `
                <div class="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 group hover:border-indigo-500/30 transition-all relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-6">
                        <span class="text-[7px] font-black orbitron ${isAdmin ? 'text-indigo-400' : 'text-slate-500'} tracking-widest uppercase">
                            ${u.rol}
                        </span>
                    </div>
                    
                    <div class="flex items-center gap-6 mb-8">
                        <div class="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border border-white/10">
                            <i class="fas ${isAdmin ? 'fa-user-shield text-indigo-400' : 'fa-wrench text-slate-500'} text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-white font-black orbitron text-sm uppercase tracking-tighter">${u.nombre}</h3>
                            <p class="text-[9px] text-slate-500 font-bold">${u.email}</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-center pt-6 border-t border-white/5">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="text-[8px] text-slate-500 font-black orbitron uppercase">Online</span>
                        </div>
                        ${miRol === 'ADMIN' ? `
                        <button class="text-red-500/30 hover:text-red-500 transition-colors text-xs">
                            <i class="fas fa-user-slash"></i>
                        </button>` : ''}
                    </div>
                </div>`;
            }).join("");
        });
    }

    renderLayout();
}
