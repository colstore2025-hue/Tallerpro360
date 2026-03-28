/**
 * clientes.js - TallerPRO360 CRM ELITE V17.0 👥
 * Reingeniería: Protocolo de Fidelización Nexus-X (Arquitectura Raíz)
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, getClientes } from "../services/dataService.js";

export default async function clientesModule(container, state) {
  // Centralización de Identidad Nexus
  const empresaId = localStorage.getItem("nexus_empresaId");
  const mode = localStorage.getItem("nexus_mode");

  const renderBase = () => {
    container.innerHTML = `
      <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-right-10 duration-1000 pb-40">
        <header class="flex justify-between items-center mb-16 px-4">
            <div class="relative group">
                <div class="absolute -inset-4 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                <h1 class="orbitron text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                    CRM <span class="text-emerald-400">CONNECT</span><span class="text-slate-700 text-2xl">.V17</span>
                </h1>
                <div class="flex items-center gap-3 mt-3">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p class="text-[8px] text-emerald-500/60 font-black uppercase tracking-[0.6em] orbitron">Base de Datos Satelital Activa</p>
                </div>
            </div>
            
            <button id="btnNuevoCliente" class="group relative w-20 h-20 bg-slate-900 rounded-[2.5rem] border border-emerald-500/30 flex items-center justify-center transition-all duration-500 hover:border-emerald-400 hover:rotate-90 shadow-2xl">
                <div class="absolute inset-0 bg-emerald-500/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <i class="fas fa-plus text-emerald-400 text-2xl"></i>
            </button>
        </header>

        <div id="listaClientes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
            </div>
      </div>
    `;
    document.getElementById("btnNuevoCliente").onclick = abrirModalCliente;
    cargarClientes();
  };

  const abrirModalCliente = async () => {
    const { value: f } = await window.Swal.fire({
        title: 'VINCULACIÓN NEXUS-X',
        background: '#020617', 
        color: '#fff',
        padding: '2rem',
        customClass: { 
            popup: 'rounded-[4rem] border border-white/10 backdrop-blur-3xl',
            confirmButton: 'btn-confirm-nexus bg-emerald-500 text-black font-black orbitron rounded-full px-10 py-4'
        },
        html: `
            <div class="space-y-4 mt-6">
                <div class="text-left">
                    <label class="text-[8px] orbitron text-slate-500 ml-4 mb-2 block uppercase tracking-widest">Nombre del Operador</label>
                    <input id="c-nom" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5 outline-none focus:border-emerald-500 transition-all font-bold" placeholder="EJ: WILLIAM URQUIJO">
                </div>
                <div class="text-left">
                    <label class="text-[8px] orbitron text-slate-500 ml-4 mb-2 block uppercase tracking-widest">Enlace Satelital (WA)</label>
                    <input id="c-tel" type="number" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5 outline-none focus:border-emerald-500 transition-all" placeholder="3200000000">
                </div>
                <div class="text-left">
                    <label class="text-[8px] orbitron text-slate-500 ml-4 mb-2 block uppercase tracking-widest">Identificador de Placa</label>
                    <input id="c-pla" class="w-full bg-black/40 p-6 rounded-[2rem] text-emerald-400 font-black border border-white/5 outline-none focus:border-emerald-500 uppercase orbitron text-xl" placeholder="KLO-890">
                </div>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'DESPLEGAR REGISTRO',
        preConfirm: () => {
            const nom = document.getElementById('c-nom').value;
            const tel = document.getElementById('c-tel').value;
            if(!nom || !tel) return window.Swal.showValidationMessage("Nombre y Teléfono son obligatorios");
            return {
                nombre: nom.toUpperCase(),
                telefono: tel.replace(/\s/g, ''),
                placaPrincipal: document.getElementById('c-pla').value.toUpperCase() || 'N/A'
            }
        }
    });

    if(f) {
        try {
            if (mode === "SIMULATOR") {
                window.Swal.fire('MODO DEMO', 'Los clientes no se guardan en la base real durante la simulación.', 'info');
                return;
            }
            
            // 🚀 Uso del Creador Universal de dataService (Inyecta empresaId automáticamente)
            await createDocument("clientes", f);
            
            window.Swal.fire({ 
                icon: 'success', 
                title: 'NÓDULO VINCULADO', 
                text: 'El cliente ha sido integrado al radar CRM.',
                background: '#020617', 
                color: '#fff',
                customClass: { popup: 'rounded-[3rem]' }
            });
            cargarClientes();
        } catch (e) {
            console.error("Fallo en registro CRM:", e);
        }
    }
  };

  async function cargarClientes() {
    const list = document.getElementById("listaClientes");
    list.innerHTML = `
        <div class="col-span-full py-32 text-center">
            <i class="fas fa-circle-notch fa-spin mb-6 text-4xl text-emerald-500/20"></i>
            <p class="orbitron text-[9px] tracking-[0.6em] text-slate-500 animate-pulse uppercase">Sincronizando Base de Datos CRM...</p>
        </div>`;
    
    try {
        // 🛰️ Consulta optimizada a la RAÍZ filtrando por empresaId
        const clientes = await getClientes(empresaId);
        
        if(!clientes || clientes.length === 0) {
            list.innerHTML = `
                <div class="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[4rem] group hover:border-emerald-500/20 transition-all duration-1000">
                    <i class="fas fa-user-slash text-4xl text-slate-800 mb-6 group-hover:scale-110 transition-transform"></i>
                    <p class="orbitron text-[10px] text-slate-600 uppercase tracking-[0.4em] italic">No se detectan operadores en este sector espacial</p>
                </div>`;
            return;
        }

        list.innerHTML = clientes.map(c => `
            <div class="group relative bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white/5 hover:border-emerald-500/30 transition-all duration-700 overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
                
                <div class="flex items-center gap-6 mb-8">
                    <div class="w-16 h-16 bg-black rounded-[1.5rem] flex items-center justify-center border border-white/10 text-emerald-400 font-black orbitron text-2xl shadow-2xl group-hover:border-emerald-500/50 transition-all">
                        ${c.nombre.charAt(0)}
                    </div>
                    <div>
                        <h4 class="text-sm font-black text-white uppercase tracking-tight leading-tight mb-1">${c.nombre}</h4>
                        <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-widest">ID_ACTIVO</p>
                        </div>
                    </div>
                </div>

                <div class="bg-black/40 p-6 rounded-[2rem] border border-white/5 mb-8">
                    <p class="text-[7px] text-slate-600 font-black orbitron uppercase mb-2 tracking-widest">Unidad Principal</p>
                    <p class="text-md font-black text-emerald-400 orbitron italic tracking-tighter">${c.placaPrincipal || 'N/A'}</p>
                </div>

                <div class="flex gap-4">
                    <a href="https://wa.me/57${c.telefono}" target="_blank" class="flex-1 h-14 rounded-2xl bg-emerald-500 text-black flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10">
                        <i class="fab fa-whatsapp text-lg"></i>
                        <span class="orbitron text-[9px] font-black uppercase tracking-widest">Enlace</span>
                    </a>
                    <button class="w-14 h-14 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center border border-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>`).join("");
            
    } catch (e) {
        console.error("Error CRM:", e);
        list.innerHTML = `<div class="col-span-full text-center py-20 text-red-500 orbitron text-[10px] font-black uppercase tracking-widest animate-pulse">Error en Enlace Satelital CRM</div>`;
    }
  }

  renderBase();
}
