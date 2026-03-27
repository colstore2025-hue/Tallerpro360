/**
 * clientes.js - TallerPRO360 CRM ELITE V16.0 👥
 * Reingeniería: Protocolo de Fidelización Nexus-X
 */
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function clientesModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  const renderBase = () => {
    container.innerHTML = `
      <div class="p-6 lg:p-10 animate-in fade-in duration-700 pb-32">
        <header class="flex justify-between items-center mb-12">
            <div>
                <h1 class="orbitron text-2xl font-black text-white italic uppercase tracking-tighter">
                    CRM / <span class="text-emerald-400">CLIENTES</span>
                </h1>
                <p class="text-[7px] text-slate-500 font-black uppercase tracking-[0.5em] mt-1 italic">Base de Datos de Fidelización Starlink</p>
            </div>
            <button id="btnNuevoCliente" class="w-16 h-16 bg-emerald-500 rounded-[2rem] text-black flex items-center justify-center shadow-[0_15px_40px_rgba(16,185,129,0.3)] active:scale-90 hover:rotate-90 transition-all duration-500">
                <i class="fas fa-plus text-xl"></i>
            </button>
        </header>

        <div id="listaClientes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      </div>
    `;
    document.getElementById("btnNuevoCliente").onclick = abrirModalCliente;
    cargarClientes();
  };

  const abrirModalCliente = async () => {
    const { value: f } = await window.Swal.fire({
        title: 'REGISTRO CRM NEXUS-X',
        background: '#020617', color: '#fff',
        customClass: { popup: 'rounded-[2.5rem] border border-white/10' },
        html: `
            <div class="space-y-3 p-4">
                <input id="c-nom" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 outline-none focus:border-emerald-500" placeholder="NOMBRE COMPLETO">
                <input id="c-tel" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5 outline-none focus:border-emerald-500" placeholder="TELÉFONO (Ej: 3001234567)">
                <input id="c-pla" class="w-full bg-black/60 p-5 rounded-2xl text-emerald-400 font-black border border-white/5 outline-none focus:border-emerald-500 uppercase" placeholder="PLACA PRINCIPAL">
            </div>`,
        preConfirm: () => {
            const nom = document.getElementById('c-nom').value;
            if(!nom) return window.Swal.showValidationMessage("Se requiere nombre");
            return {
                nombre: nom.toUpperCase(),
                telefono: document.getElementById('c-tel').value.replace(/\s/g, ''),
                placaPrincipal: document.getElementById('c-pla').value.toUpperCase(),
                creadoEn: serverTimestamp()
            }
        }
    });

    if(f) {
        await addDoc(collection(db, "empresas", empresaId, "clientes"), f);
        window.Swal.fire({ icon: 'success', title: 'CLIENTE VINCULADO', background: '#020617', color: '#fff' });
        cargarClientes();
    }
  };

  async function cargarClientes() {
    const list = document.getElementById("listaClientes");
    list.innerHTML = `<div class="col-span-full py-20 text-center opacity-30"><i class="fas fa-sync fa-spin mb-4 text-2xl"></i><p class="orbitron text-[8px] tracking-[0.5em]">DESCARGANDO NÓDULOS CRM...</p></div>`;
    
    try {
        const q = query(collection(db, "empresas", empresaId, "clientes"), orderBy("creadoEn", "desc"));
        const snap = await getDocs(q);
        
        if(snap.empty) {
            list.innerHTML = `<div class="col-span-full py-20 text-center border border-dashed border-white/5 rounded-[3rem] text-slate-600 orbitron text-[9px] uppercase tracking-widest italic">No hay clientes registrados en este nodo</div>`;
            return;
        }

        list.innerHTML = snap.docs.map(doc => {
            const c = doc.data();
            return `
            <div class="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-5 group hover:border-emerald-500/40 hover:bg-white/[0.07] transition-all duration-500">
                <div class="w-14 h-14 bg-black/60 rounded-2xl flex items-center justify-center border border-white/5 text-emerald-400 font-black orbitron text-xl shadow-inner">
                    ${c.nombre.charAt(0)}
                </div>
                <div class="flex-1">
                    <h4 class="text-xs font-black text-white uppercase tracking-tighter">${c.nombre}</h4>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[6px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black orbitron tracking-widest">${c.placaPrincipal || 'SIN PLACA'}</span>
                    </div>
                </div>
                <a href="https://wa.me/57${c.telefono}" target="_blank" class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all">
                    <i class="fab fa-whatsapp text-lg"></i>
                </a>
            </div>`;
        }).join("");
    } catch (e) {
        list.innerHTML = `<p class="text-red-500 text-center uppercase text-[10px] orbitron font-black">Error de enlace CRM</p>`;
    }
  }

  renderBase();
}
