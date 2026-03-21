/**
 * vehiculos.js - TallerPRO360 ULTRA V3
 * Gestión de Flota e Historial Inteligente
 * Nexus-X Starlink SAS
 */
import { 
  collection, getDocs, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js"; // ✅ Importación certificada
import { hablar } from "../voice/voiceCore.js";

export default async function vehiculosModule(container, state) {
  const empresaId = state.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen text-white">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-black text-white">🚗 Vehículos</h1>
          <p class="text-[10px] text-cyan-400 tracking-widest uppercase">Base de Datos de Flota</p>
        </div>
        <button id="btnNuevoVehiculo" class="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <i class="fas fa-plus"></i>
        </button>
      </div>

      <div class="relative mb-6">
        <i class="fas fa-search absolute left-4 top-4 text-slate-500"></i>
        <input id="searchVehiculo" type="text" placeholder="Buscar placa, marca o cliente..." 
               class="w-full bg-[#0f172a] border border-slate-800 p-4 pl-12 rounded-2xl text-sm focus:border-cyan-500 outline-none transition">
      </div>

      <div id="vehiculosList" class="grid grid-cols-1 gap-4">
        <div class="animate-pulse text-center p-10 text-slate-600">Sincronizando con Nexus-X...</div>
      </div>
    </div>

    <div id="modalVehiculo" class="fixed inset-0 bg-black/90 z-50 hidden p-4 overflow-y-auto">
      <div id="detalleVehiculo" class="max-w-md mx-auto mt-10"></div>
    </div>
  `;

  let vehiculosData = [];

  async function cargarVehiculos() {
    const lista = document.getElementById("vehiculosList");
    try {
      const q = query(
        collection(db, "vehiculos"),
        where("empresaId", "==", empresaId),
        orderBy("placa", "asc")
      );
      const snap = await getDocs(q);
      vehiculosData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderVehiculos(vehiculosData);
    } catch (e) {
      console.error(e);
      lista.innerHTML = `<div class="text-red-500 text-center">Falla de enlace: ${e.message}</div>`;
    }
  }

  function renderVehiculos(data) {
    const lista = document.getElementById("vehiculosList");
    if (data.length === 0) {
      lista.innerHTML = `<div class="text-center py-10 text-slate-500 text-sm">No hay vehículos registrados.</div>`;
      return;
    }

    lista.innerHTML = data.map(v => `
      <div class="card-vehiculo bg-[#0f172a] p-4 rounded-3xl border border-slate-800 flex items-center gap-4 active:scale-95 transition cursor-pointer" onclick="window.verVehiculo('${v.id}')">
        <div class="w-16 h-16 bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-slate-700">
          <span class="text-[10px] text-slate-500 font-bold uppercase">Placa</span>
          <span class="text-emerald-400 font-black">${v.placa?.toUpperCase() || '---'}</span>
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-white">${v.marca || ''} ${v.modelo || ''}</h4>
          <p class="text-xs text-slate-500"><i class="fas fa-user mr-1"></i> ${v.clienteNombre || 'Sin dueño'}</p>
        </div>
        <i class="fas fa-chevron-right text-slate-700"></i>
      </div>
    `).join("");
  }

  // Búsqueda en tiempo real (Supremacía Mobile)
  document.getElementById("searchVehiculo").oninput = (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = vehiculosData.filter(v => 
      v.placa?.toLowerCase().includes(val) || 
      v.marca?.toLowerCase().includes(val) || 
      v.clienteNombre?.toLowerCase().includes(val)
    );
    renderVehiculos(filtered);
  };

  window.verVehiculo = async (id) => {
    const v = vehiculosData.find(x => x.id === id);
    const modal = document.getElementById("modalVehiculo");
    const detalle = document.getElementById("detalleVehiculo");
    modal.classList.remove("hidden");

    detalle.innerHTML = `
      <div class="bg-[#111827] rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
             <h2 class="text-2xl font-black text-white">${v.placa?.toUpperCase()}</h2>
             <button onclick="document.getElementById('modalVehiculo').classList.add('hidden')" class="text-slate-500"><i class="fas fa-times text-xl"></i></button>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-black/20 p-3 rounded-2xl">
              <span class="text-[10px] text-slate-500 block">MARCA</span>
              <span class="text-sm font-bold">${v.marca || 'N/A'}</span>
            </div>
            <div class="bg-black/20 p-3 rounded-2xl">
              <span class="text-[10px] text-slate-500 block">MODELO</span>
              <span class="text-sm font-bold">${v.modelo || 'N/A'}</span>
            </div>
          </div>

          <div class="space-y-3">
            <button onclick="window.navigate('ordenes')" class="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
              <i class="fas fa-file-invoice"></i> CREAR ORDEN MANUAL
            </button>
            <button id="btnIAVehiculo" class="w-full bg-cyan-500 text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
              <i class="fas fa-robot"></i> DICTAR ORDEN (IA)
            </button>
          </div>

          <div class="mt-8">
            <h5 class="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Historial Reciente</h5>
            <div id="historialVehiculo" class="text-xs text-slate-400">Cargando historial...</div>
          </div>
        </div>
      </div>
    `;

    // Cargar historial de órdenes específicas
    const ordSnap = await getDocs(query(collection(db, `empresas/${empresaId}/ordenes`), where("vehiculoId", "==", v.placa)));
    const hist = document.getElementById("historialVehiculo");
    if(ordSnap.empty) hist.innerHTML = "No registra órdenes previas.";
    else hist.innerHTML = ordSnap.docs.map(d => {
      const o = d.data();
      return `<div class="mb-2 p-2 border-l-2 border-cyan-500 bg-white/5">${o.fecha?.toDate().toLocaleDateString() || ''} - ${o.servicio || 'General'}</div>`;
    }).join("");

    document.getElementById("btnIAVehiculo").onclick = () => {
      hablar("¿Qué trabajo realizaremos en este vehículo?");
      const dictado = prompt("Describa la falla o mantenimiento:");
      if(dictado) hablar("Procesando orden con Nexus IA");
    };
  };

  cargarVehiculos();
}
