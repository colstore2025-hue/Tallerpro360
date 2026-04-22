/**
 * staff.js - TallerPRO360 NEXUS-X V31.0 🚀
 * SISTEMA DE PERFILES LOCALES (Sin registros de email externos)
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, addDoc, doc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    
    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 bg-[#010409] min-h-screen text-white pb-40">
            <header class="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
                <div>
                    <h1 class="orbitron text-4xl font-black text-white uppercase italic">STAFF <span class="text-indigo-500">NEXUS</span></h1>
                    <p class="text-[9px] orbitron text-slate-500 tracking-[0.3em]">GESTIÓN DE ACCESOS INTERNOS</p>
                </div>
                <button id="btnNuevoStaff" class="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl orbitron text-[10px] font-bold transition-all shadow-lg shadow-indigo-500/20">
                    + VINCULAR PERSONAL
                </button>
            </header>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                </div>
        </div>`;

        document.getElementById("btnNuevoStaff").onclick = formularioNuevoStaff;
        escucharPersonal();
    };

    const escucharPersonal = () => {
        const q = query(collection(db, "staff_local"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("gridStaff");
            if (snap.empty) {
                grid.innerHTML = `<p class="col-span-full text-center py-20 opacity-30 orbitron text-xs">NO HAY PERSONAL REGISTRADO</p>`;
                return;
            }

            grid.innerHTML = snap.docs.map(d => {
                const s = d.data();
                return `
                <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                    <div class="flex flex-col items-center">
                        <div class="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20 group-hover:border-indigo-500 transition-all">
                            <i class="fas fa-user-nut text-indigo-400 text-xl"></i>
                        </div>
                        <h3 class="orbitron text-xs font-bold text-white uppercase">${s.nombre}</h3>
                        <span class="text-[8px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full mt-2 orbitron font-black">${s.cargo}</span>
                        
                        <div class="mt-6 pt-6 border-t border-white/5 w-full text-center">
                            <p class="text-[7px] text-slate-500 orbitron uppercase mb-1 text-center">Acceso Directo</p>
                            <code class="text-indigo-300 text-xs font-bold tracking-widest italic font-mono">****</code>
                        </div>

                        <button onclick="window.eliminarStaff('${d.id}')" class="mt-6 text-[8px] text-red-500/40 hover:text-red-500 orbitron transition-colors">
                            REMOVER ACCESO
                        </button>
                    </div>
                </div>`;
            }).join("");
        });
    };

    const formularioNuevoStaff = () => {
        Swal.fire({
            title: 'REGISTRO RÁPIDO',
            background: '#0d1117',
            color: '#fff',
            html: `
                <div class="space-y-4 p-4">
                    <input id="f-nombre" class="w-full bg-black p-4 rounded-xl text-white border border-white/10 orbitron text-xs" placeholder="NOMBRE Y APELLIDO">
                    <select id="f-cargo" class="w-full bg-black p-4 rounded-xl text-white border border-white/10 orbitron text-xs">
                        <option value="TECNICO">TÉCNICO / MECÁNICO</option>
                        <option value="AUXILIAR">AUXILIAR CONTABLE</option>
                        <option value="ADMIN">ADMINISTRADOR</option>
                    </select>
                    <input id="f-pass" type="text" class="w-full bg-black p-4 rounded-xl text-white border border-white/10 orbitron text-xs text-center" placeholder="CREAR CONTRASEÑA O PIN">
                </div>`,
            confirmButtonText: 'DAR DE ALTA',
            preConfirm: () => {
                const nombre = document.getElementById('f-nombre').value.toUpperCase();
                const cargo = document.getElementById('f-cargo').value;
                const pass = document.getElementById('f-pass').value;
                if(!nombre || !pass) return Swal.showValidationMessage("Faltan datos");
                return { nombre, cargo, pass };
            }
        }).then(async (res) => {
            if(res.isConfirmed) {
                await addDoc(collection(db, "staff_local"), {
                    ...res.value,
                    empresaId,
                    creadoEn: serverTimestamp()
                });
                Swal.fire({ icon: 'success', title: 'PERSONAL VINCULADO', background: '#0d1117' });
            }
        });
    };

    window.eliminarStaff = async (id) => {
        const confirm = await Swal.fire({ title: '¿Eliminar?', background: '#0d1117', showCancelButton: true });
        if(confirm.isConfirmed) await deleteDoc(doc(db, "staff_local", id));
    };

    renderLayout();
}
