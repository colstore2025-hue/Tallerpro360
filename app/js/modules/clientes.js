/**
 * clientes.js - TallerPRO360 CRM ELITE V4 👥
 * Enfoque: Fidelización, Historial de Vehículos y Acciones Rápidas
 */
import { 
  collection, getDocs, addDoc, query, where, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function clientesModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  let clientes = [];

  /* ================= ESTRUCTURA UI PRO ================= */
  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white font-sans">
      
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-black italic tracking-tighter text-white">CRM <span class="text-cyan-400">PRO360</span></h1>
          <p class="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">Gestión de Relaciones Nexus-X</p>
        </div>
        <button id="btnOpenAdd" class="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_5px_20px_rgba(6,182,212,0.4)] active:scale-90 transition-all">
          <i class="fas fa-plus text-black"></i>
        </button>
      </div>

      <div class="relative mb-6">
        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
        <input id="busqueda" placeholder="Buscar por nombre o placa..." 
          class="w-full bg-[#0f172a] border border-white/5 py-4 pl-12 pr-4 rounded-2xl text-sm focus:border-cyan-500 outline-none transition-all placeholder:text-slate-600"/>
      </div>

      <div id="listaClientes" class="space-y-4">
        <div class="flex flex-col items-center justify-center py-20 opacity-20">
            <i class="fas fa-users text-4xl mb-2"></i>
            <p class="text-[10px] font-black uppercase tracking-widest">Sincronizando Base de Datos...</p>
        </div>
      </div>

      <div id="panelDetalle" class="fixed inset-0 bg-black/90 z-50 translate-y-full transition-transform duration-500 p-6 flex flex-col hidden">
         </div>
    </div>
  `;

  const listaContainer = document.getElementById("listaClientes");
  const panelDetalle = document.getElementById("panelDetalle");

  /* ================= LÓGICA DE DATOS ================= */

  async function cargarClientes() {
    try {
      const q = query(collection(db, `empresas/${empresaId}/clientes`), orderBy("creadoEn", "desc"));
      const snap = await getDocs(q);
      clientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderLista(clientes);
    } catch(e) {
      listaContainer.innerHTML = "<p class='text-red-500 text-center text-xs'>Error de conexión Nexus-X.</p>";
    }
  }

  function renderLista(data) {
    if (!data.length) {
      listaContainer.innerHTML = `<div class="text-center py-10 text-slate-500 text-[10px] font-black uppercase">Sin registros</div>`;
      return;
    }

    listaContainer.innerHTML = data.map(c => `
      <div class="cli-card bg-[#0f172a] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center active:scale-95 transition-all cursor-pointer" data-id="${c.id}">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-white/5">
                <span class="text-cyan-400 font-black text-lg">${c.nombre?.charAt(0) || '?'}</span>
            </div>
            <div>
                <h4 class="text-sm font-black text-white uppercase tracking-tighter">${c.nombre || "Sin Nombre"}</h4>
                <p class="text-[9px] font-bold text-slate-500 tracking-widest"><i class="fab fa-whatsapp text-emerald-500 mr-1"></i> ${c.telefono || "---"}</p>
            </div>
        </div>
        <i class="fas fa-chevron-right text-slate-700 text-xs"></i>
      </div>
    `).join("");

    document.querySelectorAll(".cli-card").forEach(card => {
      card.onclick = () => verDetalle(card.dataset.id);
    });
  }

  /* ================= ACCIONES ÉLITE ================= */

  async function verDetalle(id) {
    const cliente = clientes.find(c => c.id === id);
    hablar(`Abriendo perfil de ${cliente.nombre}`);
    
    // Abrir panel con animación
    panelDetalle.classList.remove('hidden');
    setTimeout(() => panelDetalle.classList.remove('translate-y-full'), 10);

    panelDetalle.innerHTML = `
        <div class="flex justify-between items-start mb-8">
            <button id="closePanel" class="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
                <i class="fas fa-times"></i>
            </button>
            <div class="text-right">
                <span class="bg-cyan-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase">Cliente VIP</span>
            </div>
        </div>

        <div class="text-center mb-8">
            <div class="w-24 h-24 bg-slate-800 rounded-[2.5rem] mx-auto mb-4 border-2 border-cyan-500/20 flex items-center justify-center">
                <i class="fas fa-user text-4xl text-cyan-400"></i>
            </div>
            <h2 class="text-2xl font-black italic tracking-tighter">${cliente.nombre}</h2>
            <p class="text-slate-500 text-xs">${cliente.telefono}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-8">
            <a href="https://wa.me/57${cliente.telefono}" class="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex flex-col items-center gap-2">
                <i class="fab fa-whatsapp text-emerald-500 text-xl"></i>
                <span class="text-[8px] font-black uppercase text-emerald-500">Enviar WhatsApp</span>
            </a>
            <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-3xl flex flex-col items-center gap-2">
                <i class="fas fa-history text-blue-400 text-xl"></i>
                <span class="text-[8px] font-black uppercase text-blue-400">Ver Historial</span>
            </div>
        </div>

        <div id="vehiculosCliente" class="space-y-3">
            <h5 class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Vehículos Vinculados</h5>
            <div class="animate-pulse bg-slate-800 h-16 rounded-3xl opacity-20"></div>
        </div>
    `;

    document.getElementById("closePanel").onclick = () => {
        panelDetalle.classList.add('translate-y-full');
        setTimeout(() => panelDetalle.classList.add('hidden'), 500);
    };
  }

  // Inicialización
  cargarClientes();
}
