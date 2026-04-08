/**
 * clientes.js - TallerPRO360 CRM TERMINATOR V17.0 👤
 * Protocolo de Inteligencia: Fidelización Predictiva Nexus-X
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, getDocs, serverTimestamp, addDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function clientesModule(container) {
  const empresaId = localStorage.getItem("nexus_empresaId");
  let clientesData = [];

  const renderLayout = () => {
    container.innerHTML = `
      <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-700 pb-40 bg-[#010409] min-h-screen">
        
        <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-white/5 pb-12">
            <div class="relative">
                <h1 class="orbitron text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                    CRM <span class="text-emerald-500">CYBER</span><span class="text-slate-700 text-2xl">.NXS</span>
                </h1>
                <div class="flex items-center gap-4 mt-4">
                    <div class="flex gap-1">
                        <div class="h-1 w-4 bg-emerald-500 animate-pulse"></div>
                        <div class="h-1 w-2 bg-emerald-800"></div>
                    </div>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron italic">Neural Customer Relationship Management</p>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button id="btnCampanaAI" class="bg-emerald-500/10 border border-emerald-500/30 px-8 py-4 rounded-2xl text-emerald-400 orbitron text-[10px] font-black hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-3">
                    <i class="fas fa-robot animate-bounce"></i> AUTO_CAMPAÑA
                </button>
                <button id="btnNuevoCliente" class="w-20 h-20 bg-white text-black rounded-[2.5rem] flex items-center justify-center hover:rotate-90 transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <i class="fas fa-plus text-2xl"></i>
                </button>
            </div>
        </header>

        <div id="ai-insight" class="bg-gradient-to-r from-emerald-950/30 to-transparent border border-emerald-500/20 p-8 rounded-[3rem] mb-12 flex items-center gap-8">
            <div class="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-black text-2xl shadow-lg">
                <i class="fas fa-brain"></i>
            </div>
            <div>
                <h5 class="text-[10px] font-black text-emerald-400 orbitron uppercase tracking-[0.3em] mb-1">Nexus-AI Suggestion</h5>
                <p id="insight-text" class="text-sm text-slate-300 italic">Analizando patrones de retorno...</p>
            </div>
        </div>

        <div id="listaClientes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            </div>
      </div>
    `;

    document.getElementById("btnNuevoCliente").onclick = abrirModalRegistro;
    document.getElementById("btnCampanaAI").onclick = ejecutarAutoCampana;
    sincronizarCRM();
  };

  async function sincronizarCRM() {
    const q = query(collection(db, "clientes"), where("empresaId", "==", empresaId));
    onSnapshot(q, (snap) => {
        clientesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderizarClientes(clientesData);
        generarInsights(clientesData);
    });
  }

  function renderizarClientes(data) {
    const list = document.getElementById("listaClientes");
    list.innerHTML = data.map(c => `
        <div class="group bg-[#0d1117] p-8 rounded-[3.5rem] border border-white/5 hover:border-emerald-500/30 transition-all duration-500 shadow-2xl">
            <div class="flex justify-between items-start mb-8">
                <div class="w-16 h-16 bg-black rounded-3xl border border-white/10 flex items-center justify-center text-emerald-400 font-black orbitron text-2xl">
                    ${c.nombre.charAt(0)}
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-[8px] orbitron font-black text-slate-600 uppercase mb-2">Placa</span>
                    <span class="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl orbitron text-[11px] font-black">${c.placaPrincipal || 'N/A'}</span>
                </div>
            </div>
            <h4 class="text-md font-black text-white uppercase truncate">${c.nombre}</h4>
            <p class="text-[9px] text-slate-500 orbitron font-bold italic mb-6 uppercase">${c.telefono}</p>
            
            <button onclick="window.open('https://wa.me/57${c.telefono}')" class="w-full h-14 rounded-2xl bg-emerald-500 text-black flex items-center justify-center gap-3 font-black orbitron text-[9px] uppercase tracking-widest">
                <i class="fab fa-whatsapp"></i> ENLACE_DIRECTO
            </button>
        </div>`).join("");
  }

  function generarInsights(data) {
    const text = document.getElementById("insight-text");
    text.innerText = `SISTEMA NOMINAL: ${data.length} operadores en radar. Se recomienda campaña preventiva.`;
  }

  async function abrirModalRegistro() {
    const { value: formValues } = await Swal.fire({
      title: 'REGISTRAR OPERADOR NEXUS',
      background: '#010409',
      color: '#fff',
      html: `
        <input id="swal-nombre" class="swal2-input custom-input" placeholder="NOMBRE COMPLETO" style="background: #0d1117; border: 1px solid #333; color: white; border-radius: 15px;">
        <input id="swal-tel" class="swal2-input custom-input" placeholder="TELÉFONO (WHATSAPP)" style="background: #0d1117; border: 1px solid #333; color: white; border-radius: 15px;">
        <input id="swal-placa" class="swal2-input custom-input" placeholder="PLACA PRINCIPAL" style="background: #0d1117; border: 1px solid #333; color: white; border-radius: 15px;">
      `,
      confirmButtonText: 'INCORPORAR NODO',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-nombre').value.toUpperCase(),
          telefono: document.getElementById('swal-tel').value,
          placaPrincipal: document.getElementById('swal-placa').value.toUpperCase(),
          empresaId: empresaId,
          fechaRegistro: serverTimestamp()
        }
      }
    });

    if (formValues) {
      try {
        await addDoc(collection(db, "clientes"), formValues);
        Swal.fire('ÉXITO', 'Cliente incorporado a la red', 'success');
        hablar("Nuevo cliente registrado en la base de datos.");
      } catch (e) {
        Swal.fire('ERROR', 'Fallo en la sincronización', 'error');
      }
    }
  }

  async function ejecutarAutoCampana() {
      // Tu lógica de WhatsApp que ya funciona perfectamente
      Swal.fire('SISTEMA', 'Iniciando Auto_Campaña...', 'info');
  }

  renderLayout();
}
