/**
 * inventario.js - TallerPRO360 NEXUS-X V4 📦
 * Enfoque: Almacén Inteligente con Alerta Temprana y Dictado por Voz
 */
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function inventarioModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  let stockData = [];

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in">
      
      <div class="flex justify-between items-end mb-8">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter leading-none text-white uppercase">
                BOX / <span class="text-yellow-400">ALMACÉN</span>
            </h1>
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Control de Stock & Repuestos</p>
        </div>
        <button id="btnVoiceInv" class="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] active:scale-90 transition-all">
          <i class="fas fa-microphone-alt"></i>
        </button>
      </div>

      <div id="iaStatus" class="space-y-2 mb-6"></div>

      <div class="bg-slate-900/50 p-4 rounded-3xl border border-white/5 mb-6 flex items-center gap-4">
          <i class="fas fa-search text-yellow-500 text-xs"></i>
          <input id="searchInv" placeholder="Buscar repuesto por nombre..." class="bg-transparent border-none outline-none text-xs w-full text-slate-300">
      </div>

      <div class="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl mb-8 relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 opacity-5 text-6xl text-yellow-500 rotate-12"><i class="fas fa-boxes"></i></div>
        
        <input id="prodNombre" placeholder="Nombre del repuesto (ej. Pastillas Frenos)" 
               class="w-full bg-black/30 border border-white/5 p-4 rounded-2xl text-sm mb-3 outline-none focus:border-yellow-500 transition-all text-white font-medium">
        
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-black/20 p-3 rounded-2xl border border-white/5">
            <span class="block text-[8px] text-slate-500 font-black uppercase mb-1">Stock Inicial</span>
            <input id="prodStock" type="number" class="w-full bg-transparent border-none outline-none text-sm font-black text-yellow-400" placeholder="0">
          </div>
          <div class="bg-black/20 p-3 rounded-2xl border border-white/5">
            <span class="block text-[8px] text-slate-500 font-black uppercase mb-1">Precio Unitario</span>
            <input id="prodPrecio" type="number" class="w-full bg-transparent border-none outline-none text-sm font-black text-emerald-400" placeholder="$0">
          </div>
        </div>
        
        <button id="btnGuardarProd" class="w-full bg-yellow-500 text-black font-black p-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          Ingresar a Almacén
        </button>
      </div>

      <div id="listaInventario" class="space-y-3 pb-20">
        <div class="text-center py-10 opacity-20 animate-pulse text-[10px] font-black uppercase">Sincronizando Inventario...</div>
      </div>
    </div>
  `;

  const listado = document.getElementById("listaInventario");
  const iaBox = document.getElementById("iaStatus");

  async function cargar() {
    try {
      const q = query(collection(db, `empresas/${empresaId}/inventario`), orderBy("actualizadoEn", "desc"));
      const snap = await getDocs(q);
      stockData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render(stockData);
    } catch (e) {
      console.error(e);
      listado.innerHTML = `<div class="p-10 text-center text-red-500 font-black text-[9px] uppercase italic">Falla de Enlace con Nexus-X Almacén</div>`;
    }
  }

  function render(data) {
    if (data.length === 0) {
      listado.innerHTML = `<div class="text-center py-10 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Almacén Vacío</div>`;
      return;
    }

    // Alertas de Stock Crítico (IA Silenciosa)
    const criticos = data.filter(i => i.cantidad <= 5);
    iaBox.innerHTML = criticos.map(i => `
      <div class="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl flex items-center gap-3 animate-pulse">
        <div class="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 text-[10px]">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <span class="text-[9px] font-black text-red-400 uppercase tracking-tighter">Reponer Urgente: ${i.nombre} (Quedan ${i.cantidad})</span>
      </div>
    `).join("");

    // Render de Items
    listado.innerHTML = data.map(item => `
      <div class="bg-[#0f172a] p-5 rounded-[2.5rem] border ${item.cantidad <= 5 ? 'border-red-500/30 bg-red-950/10' : 'border-white/5'} flex justify-between items-center transition-all hover:bg-[#1e293b]">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                <i class="fas fa-toolbox text-yellow-500/50 text-xs"></i>
            </div>
            <div>
                <h4 class="font-black text-xs uppercase text-white tracking-tighter">${item.nombre}</h4>
                <span class="text-[9px] text-slate-500 font-bold uppercase tracking-widest">$${fmt(item.precio)} COP</span>
            </div>
        </div>
        <div class="text-right">
          <div class="bg-black/30 px-3 py-2 rounded-xl border border-white/5 min-w-[50px] text-center">
            <span class="block text-lg font-black leading-none ${item.cantidad <= 5 ? 'text-red-500' : 'text-yellow-400'}">${item.cantidad}</span>
            <span class="text-[7px] text-slate-600 font-black uppercase">Unids</span>
          </div>
        </div>
      </div>
    `).join("");
  }

  // Buscador en tiempo real
  document.getElementById("searchInv").oninput = (e) => {
      const val = e.target.value.toLowerCase();
      const filtrado = stockData.filter(i => i.nombre.toLowerCase().includes(val));
      render(filtrado);
  };

  document.getElementById("btnGuardarProd").onclick = async () => {
    const n = document.getElementById("prodNombre").value.trim();
    const s = Number(document.getElementById("prodStock").value);
    const p = Number(document.getElementById("prodPrecio").value);

    if(!n || isNaN(s)) return;

    try {
      const btn = document.getElementById("btnGuardarProd");
      btn.innerText = "SINCRONIZANDO...";
      btn.disabled = true;

      await addDoc(collection(db, `empresas/${empresaId}/inventario`), {
        nombre: n,
        cantidad: s,
        precio: p,
        actualizadoEn: serverTimestamp()
      });
      
      hablar("Almacén actualizado correctamente");
      document.getElementById("prodNombre").value = "";
      document.getElementById("prodStock").value = "";
      document.getElementById("prodPrecio").value = "";
      btn.innerText = "Ingresar a Almacén";
      btn.disabled = false;
      cargar();
    } catch(e) { console.error(e); }
  };

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }

  cargar();
}
