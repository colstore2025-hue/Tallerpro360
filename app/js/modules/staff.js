/**
 * staff.js - TallerPRO360 NEXUS-X V32.0 🚀
 * SISTEMA DE PERFILES LOCALES CON SEGMENTACIÓN DE MÓDULOS
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, addDoc, doc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    
    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 bg-[#010409] min-h-screen text-white pb-40 animate-in fade-in duration-500">
            <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/5 pb-8 gap-6">
                <div>
                    <h1 class="orbitron text-4xl font-black text-white uppercase italic">CREW <span class="text-indigo-500">NEXUS</span></h1>
                    <p class="text-[9px] orbitron text-slate-500 tracking-[0.3em]">ADMINISTRACIÓN DE LLAVES DE ACCESO</p>
                </div>
                <button id="btnNuevoStaff" class="group relative bg-indigo-600 hover:bg-indigo-500 px-10 py-5 rounded-[2rem] orbitron text-[10px] font-black transition-all shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                    + VINCULAR PERSONAL
                </button>
            </header>

            <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                grid.innerHTML = `
                <div class="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <i class="fas fa-user-lock text-4xl mb-4 opacity-20"></i>
                    <p class="orbitron text-[10px] opacity-30 tracking-widest uppercase">Nodo de personal vacío</p>
                </div>`;
                return;
            }

            grid.innerHTML = snap.docs.map(d => {
                const s = d.data();
                const colorCargo = s.cargo === 'TECNICO' ? 'emerald' : (s.cargo === 'ADMIN' ? 'amber' : 'indigo');
                
                return `
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group hover:border-${colorCargo}-500/50 transition-all duration-500">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-${colorCargo}-500/5 rounded-full blur-2xl"></div>
                    
                    <div class="flex flex-col items-center text-center relative z-10">
                        <div class="w-20 h-20 bg-black rounded-[2rem] flex items-center justify-center mb-5 border border-white/5 group-hover:border-${colorCargo}-500 transition-all shadow-inner">
                            <i class="fas ${s.cargo === 'TECNICO' ? 'fa-wrench' : 'fa-user-tie'} text-${colorCargo}-400 text-2xl"></i>
                        </div>
                        
                        <h3 class="orbitron text-xs font-black text-white uppercase mb-1">${s.nombre}</h3>
                        <span class="text-[7px] bg-${colorCargo}-500/10 text-${colorCargo}-400 px-4 py-1.5 rounded-full orbitron font-black tracking-widest border border-${colorCargo}-500/20">
                            ${s.cargo}
                        </span>
                        
                        <div class="mt-8 pt-6 border-t border-white/5 w-full">
                            <p class="text-[7px] text-slate-500 orbitron uppercase mb-2 tracking-tighter italic">Credencial de acceso</p>
                            <div class="bg-black/40 py-3 rounded-xl border border-white/5 group-hover:border-${colorCargo}-500/20 transition-all">
                                <code class="text-white text-xs font-bold tracking-[0.5em]">${s.pass}</code>
                            </div>
                        </div>

                        <button onclick="window.eliminarStaff('${d.id}')" class="mt-6 text-[8px] text-red-500/30 hover:text-red-500 orbitron transition-all uppercase font-black tracking-widest">
                            Revocar Acceso
                        </button>
                    </div>
                </div>`;
            }).join("");
        });
    };

    const formularioNuevoStaff = () => {
        Swal.fire({
            title: 'NUEVA LLAVE TÁCTICA',
            background: '#010409',
            color: '#fff',
            customClass: { popup: 'rounded-[3rem] border border-white/10' },
            html: `
                <div class="space-y-4 p-4 text-left">
                    <label class="orbitron text-[9px] text-slate-500 ml-2 uppercase">Identificación</label>
                    <input id="f-nombre" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-xs uppercase" placeholder="NOMBRE COMPLETO">
                    
                    <label class="orbitron text-[9px] text-slate-500 ml-2 uppercase">Asignación de Rango</label>
                    <select id="f-cargo" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-[10px] appearance-none">
                        <option value="TECNICO">MECÁNICO / TÉCNICO (Solo Ordenes)</option>
                        <option value="ADMIN">ADMINISTRATIVO (Todo menos Ordenes)</option>
                    </select>
                    
                    <label class="orbitron text-[9px] text-slate-500 ml-2 uppercase">PIN de Seguridad (4-6 Dígitos)</label>
                    <input id="f-pass" type="text" maxlength="6" class="w-full bg-black p-5 rounded-2xl text-white border border-white/5 orbitron text-center text-lg font-black tracking-widest" placeholder="0000">
                </div>`,
            confirmButtonText: 'CONFIRMAR ALTA',
            preConfirm: () => {
                const nombre = document.getElementById('f-nombre').value.trim();
                const cargo = document.getElementById('f-cargo').value;
                const pass = document.getElementById('f-pass').value.trim();
                if(!nombre || !pass) return Swal.showValidationMessage("Protocolo incompleto");
                return { nombre, cargo, pass };
            }
        }).then(async (res) => {
            if(res.isConfirmed) {
                try {
                    await addDoc(collection(db, "staff_local"), {
                        ...res.value,
                        empresaId,
                        creadoEn: serverTimestamp()
                    });
                    Swal.fire({ icon: 'success', title: 'PERSONAL REGISTRADO', background: '#010409', color: '#fff' });
                } catch (e) { console.error(e); }
            }
        });
    };

    window.eliminarStaff = async (id) => {
        const confirm = await Swal.fire({ 
            title: '¿ELIMINAR?', 
            text: "El personal no podrá volver a usar su PIN.",
            background: '#0d1117', 
            color: '#fff',
            showCancelButton: true 
        });
        if(confirm.isConfirmed) await deleteDoc(doc(db, "staff_local", id));
    };

    renderLayout();
}
