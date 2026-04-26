/**
 * clientes.js - TallerPRO360 CRM TERMINATOR V18.0 👤
 * Protocolo: Fidelización Predictiva Nexus-X (Grado Empresarial)
 */
import { 
    collection, query, where, getDocs, serverTimestamp, addDoc, onSnapshot, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function clientesModule(container) {
  const empresaId = localStorage.getItem("nexus_empresaId");
  let clientesData = [];

  const renderLayout = () => {
    container.innerHTML = `
      <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-40 bg-[#010409] min-h-screen">
        
        <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-white/5 pb-12">
            <div class="relative">
                <h1 class="orbitron text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                    CRM <span class="text-emerald-500">CYBER</span><span class="text-slate-700 text-2xl">.V18</span>
                </h1>
                <div class="flex items-center gap-4 mt-4">
                    <div class="flex gap-1">
                        <div class="h-1 w-8 bg-emerald-500 animate-pulse"></div>
                        <div class="h-1 w-2 bg-emerald-800"></div>
                    </div>
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.6em] orbitron italic">PREDICTIVE CUSTOMer INTELLIGENCE</p>
                </div>
            </div>
            
            <div class="flex gap-4">
                <div class="flex flex-col items-end justify-center px-6 border-r border-white/10">
                    <span class="text-[9px] orbitron text-slate-500 uppercase font-black">Total Activos</span>
                    <span id="counter-total" class="text-2xl text-white font-black orbitron">0</span>
                </div>
                <button id="btnCampanaAI" class="bg-emerald-500/10 border border-emerald-500/30 px-8 py-4 rounded-2xl text-emerald-400 orbitron text-[10px] font-black hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-3 group">
                    <i class="fas fa-satellite-dish group-hover:rotate-12 transition-transform"></i> AUTO_MARKETING
                </button>
                <button id="btnNuevoCliente" class="w-20 h-20 bg-white text-black rounded-[2.5rem] flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all duration-500 shadow-[0_0_50px_rgba(255,255,255,0.15)]">
                    <i class="fas fa-plus text-2xl"></i>
                </button>
            </div>
        </header>

        <div id="ai-insight" class="bg-[#0d1117] border border-white/5 p-10 rounded-[4rem] mb-12 flex flex-col lg:flex-row items-center gap-10 shadow-inner">
            <div class="relative">
                <div class="h-24 w-24 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-[2rem] flex items-center justify-center text-black text-4xl shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <i class="fas fa-microchip animate-pulse"></i>
                </div>
                <div class="absolute -top-2 -right-2 h-8 w-8 bg-black border-2 border-emerald-500 rounded-full flex items-center justify-center text-[10px] text-emerald-500 font-bold">AI</div>
            </div>
            <div class="flex-1">
                <h5 class="text-[11px] font-black text-emerald-400 orbitron uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span> Nexus Core Analytics
                </h5>
                <p id="insight-text" class="text-lg text-slate-300 font-light leading-relaxed">Sincronizando red de operadores...</p>
                <div class="flex gap-4 mt-4" id="stats-mini"></div>
            </div>
        </div>

        <div id="listaClientes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
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
        document.getElementById("counter-total").innerText = clientesData.length;
        renderizarClientes(clientesData);
        generarInsights(clientesData);
    });
  }

  function renderizarClientes(data) {
    const list = document.getElementById("listaClientes");
    list.innerHTML = data.map(c => {
        const score = c.puntos_lealtad || 0;
        const segmentClass = score > 1000 ? 'text-yellow-500 border-yellow-500/20' : 'text-emerald-400 border-emerald-500/20';
        
        return `
        <div class="group bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 hover:border-emerald-500/50 hover:-translate-y-2 transition-all duration-500 shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8">
                <div class="text-[8px] orbitron font-black text-slate-700 uppercase mb-1">Status</div>
                <div class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
            </div>

            <div class="flex items-center gap-6 mb-10">
                <div class="w-20 h-20 bg-gradient-to-b from-slate-800 to-black rounded-[2.5rem] border border-white/10 flex items-center justify-center text-white font-black orbitron text-3xl group-hover:scale-110 transition-transform">
                    ${c.nombre.charAt(0)}
                </div>
                <div>
                    <h4 class="text-xl font-black text-white uppercase leading-none mb-2">${c.nombre}</h4>
                    <span class="bg-slate-900 text-slate-500 px-3 py-1 rounded-lg orbitron text-[8px] font-black uppercase tracking-tighter border border-white/5">ID: ${c.id.slice(-6)}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="bg-black/40 p-4 rounded-3xl border border-white/5">
                    <span class="text-[8px] orbitron font-black text-slate-600 uppercase block mb-1">Placa</span>
                    <span class="text-emerald-400 orbitron text-xs font-black tracking-widest">${c.placaPrincipal || '---'}</span>
                </div>
                <div class="bg-black/40 p-4 rounded-3xl border border-white/5 text-right">
                    <span class="text-[8px] orbitron font-black text-slate-600 uppercase block mb-1">Score</span>
                    <span class="text-white orbitron text-xs font-black">${score} pts</span>
                </div>
            </div>

            <div class="flex flex-col gap-3">
                <button onclick="window.open('https://wa.me/57${c.telefono}')" class="group/btn w-full h-16 rounded-[2rem] bg-emerald-500 text-black flex items-center justify-center gap-4 font-black orbitron text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-lg active:scale-95">
                    <i class="fab fa-whatsapp text-lg"></i> ENLACE_COM
                </button>
                <p class="text-center text-[9px] text-slate-600 orbitron font-bold italic uppercase mt-2">Mobile: ${c.telefono}</p>
            </div>
        </div>`;
    }).join("");
  }

  function generarInsights(data) {
    const text = document.getElementById("insight-text");
    const totalVip = data.filter(c => (c.puntos_lealtad || 0) > 1000).length;
    
    text.innerHTML = `Actualmente gestionas <span class="text-white font-bold">${data.length} operadores</span>. <br>
    Identificados <span class="text-yellow-500 font-bold">${totalVip} Clientes High-Value</span> (VIP) listos para campaña de fidelización premium.`;
    
    const statsMini = document.getElementById("stats-mini");
    statsMini.innerHTML = `
        <div class="text-[10px] orbitron font-black text-slate-500 bg-black/30 px-4 py-2 rounded-xl border border-white/5">RETORNO: +12%</div>
        <div class="text-[10px] orbitron font-black text-slate-500 bg-black/30 px-4 py-2 rounded-xl border border-white/5">NPS: 9.8</div>
    `;
  }

  async function abrirModalRegistro() {
    const { value: formValues } = await Swal.fire({
      title: '<span class="orbitron font-black italic">NEW_NODE_LINK</span>',
      background: '#010409',
      color: '#fff',
      html: `
        <div class="p-4 flex flex-col gap-4">
            <input id="swal-nombre" class="swal2-input custom-input" placeholder="NOMBRE COMPLETO" style="background: #0d1117; border: 1px solid #10b98133; color: white; border-radius: 25px; margin: 0; font-family: 'Orbitron', sans-serif; text-transform: uppercase;">
            <input id="swal-tel" class="swal2-input custom-input" placeholder="WHATSAPP (+57)" style="background: #0d1117; border: 1px solid #10b98133; color: white; border-radius: 25px; margin: 0; font-family: 'Orbitron', sans-serif;">
            <input id="swal-placa" class="swal2-input custom-input" placeholder="PLACA VEHÍCULO" style="background: #0d1117; border: 1px solid #10b98133; color: white; border-radius: 25px; margin: 0; font-family: 'Orbitron', sans-serif; text-transform: uppercase;">
            <select id="swal-tipo" class="swal2-input custom-input" style="background: #0d1117; border: 1px solid #10b98133; color: white; border-radius: 25px; margin: 0; font-family: 'Orbitron', sans-serif;">
                <option value="PARTICULAR">OPERADOR_PARTICULAR</option>
                <option value="FLOTA">OPERADOR_FLOTA</option>
                <option value="PREMIUM">OPERADOR_VIP</option>
            </select>
        </div>
      `,
      confirmButtonText: 'ESTABLECER CONEXIÓN',
      confirmButtonColor: '#10b981',
      showCancelButton: true,
      cancelButtonText: 'ABORTAR',
      cancelButtonColor: '#334155',
      preConfirm: () => {
        const nombre = document.getElementById('swal-nombre').value;
        if(!nombre) { Swal.showValidationMessage('El nombre es mandatorio'); return; }
        return {
          nombre: nombre.toUpperCase(),
          telefono: document.getElementById('swal-tel').value,
          placaPrincipal: document.getElementById('swal-placa').value.toUpperCase(),
          tipo: document.getElementById('swal-tipo').value,
          empresaId: empresaId,
          puntos_lealtad: 0,
          total_facturado: 0,
          fechaRegistro: serverTimestamp()
        }
      }
    });

    if (formValues) {
      try {
        await addDoc(collection(db, "clientes"), formValues);
        Swal.fire({
            icon: 'success',
            title: 'SISTEMA SINCRONIZADO',
            text: 'Nuevo nodo incorporado a la red Nexus-X',
            background: '#0d1117',
            color: '#fff',
            confirmButtonColor: '#10b981'
        });
        hablar("Protocolo de registro completado exitosamente.");
      } catch (e) {
        Swal.fire('ERROR CRÍTICO', 'Fallo en enlace con base de datos', 'error');
      }
    }
  }

  async function ejecutarAutoCampana() {
      hablar("Iniciando análisis de base de datos para campaña de reenganche.");
      Swal.fire({
          title: 'CYBER_CAMPAÑA',
          text: 'Enviando protocolos de marketing vía WhatsApp API...',
          icon: 'info',
          background: '#010409',
          color: '#fff'
      });
  }

  renderLayout();
}
