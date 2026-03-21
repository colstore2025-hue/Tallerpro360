/**
 * inventario.js - V3 SINCRO REAL
 */
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import InventoryAI from "../ai/InventoryAI.js";

export default async function inventarioModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const ia = new InventoryAI();

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-24 text-white">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-black text-yellow-400 italic">BOX / <span class="text-white font-normal text-lg underline decoration-yellow-500">ALMACÉN</span></h1>
        <button id="btnVoiceInv" class="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]">
          <i class="fas fa-microphone"></i>
        </button>
      </div>

      <div id="iaStatus" class="mb-4"></div>

      <div class="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 mb-6 shadow-xl">
        <input id="prodNombre" placeholder="Nombre del repuesto..." 
               class="w-full bg-[#050a14] border border-slate-800 p-4 rounded-2xl text-sm mb-3 outline-none focus:border-yellow-500 transition">
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="relative">
            <span class="absolute left-4 top-1 text-[8px] text-slate-500 font-bold uppercase">Cantidad</span>
            <input id="prodStock" type="number" class="w-full bg-[#050a14] border border-slate-800 p-4 pt-6 rounded-2xl text-sm outline-none">
          </div>
          <div class="relative">
            <span class="absolute left-4 top-1 text-[8px] text-slate-500 font-bold uppercase">Precio</span>
            <input id="prodPrecio" type="number" class="w-full bg-[#050a14] border border-slate-800 p-4 pt-6 rounded-2xl text-sm outline-none">
          </div>
        </div>
        <button id="btnGuardarProd" class="w-full bg-yellow-500 text-black font-black p-4 rounded-2xl text-xs uppercase shadow-lg active:scale-95 transition">
          Ingresar a Inventario
        </button>
      </div>

      <div id="listaInventario" class="space-y-3">
        <div class="text-center py-10 opacity-20">Sincronizando Stock...</div>
      </div>
    </div>
  `;

  async function cargar() {
    const listado = document.getElementById("listaInventario");
    const iaBox = document.getElementById("iaStatus");
    
    // Sincronizar con IA
    const data = await ia.loadInventory(empresaId);
    const bajos = ia.detectLowStock();

    // Render Alertas IA
    iaBox.innerHTML = bajos.map(b => `
      <div class="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl mb-2 flex items-center gap-3 animate-pulse">
        <i class="fas fa-exclamation-triangle text-red-500"></i>
        <span class="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Stock Crítico: ${b.nombre}</span>
      </div>
    `).join("");

    // Render Lista
    listado.innerHTML = data.map(item => `
      <div class="bg-[#0f172a] p-4 rounded-3xl border ${item.stock <= 5 ? 'border-red-500/40 bg-red-950/20' : 'border-slate-800'} flex justify-between items-center transition">
        <div>
          <h4 class="font-bold text-sm uppercase">${item.nombre}</h4>
          <span class="text-[10px] text-slate-500">$${new Intl.NumberFormat("es-CO").format(item.precio)} COP</span>
        </div>
        <div class="bg-black/40 px-4 py-2 rounded-2xl border border-white/5 text-center min-w-[60px]">
          <span class="block text-lg font-black ${item.stock <= 5 ? 'text-red-500' : 'text-yellow-400'}">${item.stock}</span>
          <span class="text-[8px] text-slate-500 font-bold">UNDS</span>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("btnGuardarProd").onclick = async () => {
    const n = document.getElementById("prodNombre").value;
    const s = Number(document.getElementById("prodStock").value);
    const p = Number(document.getElementById("prodPrecio").value);

    if(!n || isNaN(s)) return;

    try {
      await addDoc(collection(db, `empresas/${empresaId}/inventario`), {
        nombre: n,
        cantidad: s,
        precio: p,
        actualizadoEn: serverTimestamp()
      });
      hablar("Almacén actualizado");
      document.getElementById("prodNombre").value = "";
      document.getElementById("prodStock").value = "";
      document.getElementById("prodPrecio").value = "";
      cargar();
    } catch(e) { alert("Error Nexus: " + e.message); }
  };

  cargar();
}
