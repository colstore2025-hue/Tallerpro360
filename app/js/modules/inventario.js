/**
 * inventario.js - TallerPRO360 V5 📦
 */
import { getInventario } from "../services/dataService.js";

export default async function inventario(container, state) {
    container.innerHTML = `
    <div class="p-4 lg:p-8 animate-in fade-in duration-500">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-black text-white italic">ALMACÉN / <span class="text-cyan-400">STOCK</span></h1>
            <button class="bg-white/5 text-white border border-white/10 px-6 py-2 rounded-full font-black text-[10px] uppercase active:scale-95">
                + Insumo
            </button>
        </div>

        <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            </div>
    </div>
    `;

    const grid = document.getElementById("gridStock");
    const data = await getInventario(state.empresaId);

    if (!data.length) {
        grid.innerHTML = `<div class="col-span-full p-20 text-center text-slate-700 font-black uppercase text-[10px] italic tracking-widest">Base de datos vacía</div>`;
        return;
    }

    grid.innerHTML = data.map(item => `
        <div class="bg-slate-900/50 p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 opacity-5 text-4xl text-white group-hover:scale-110 transition-transform">
                <i class="fas fa-boxes"></i>
            </div>
            <p class="text-[8px] text-slate-500 font-black uppercase mb-1 tracking-[0.2em]">${item.categoria || 'Genérico'}</p>
            <h3 class="text-white text-xs font-black uppercase mb-4 tracking-tighter">${item.nombre}</h3>
            
            <div class="flex justify-between items-end">
                <div>
                    <span class="text-2xl font-black ${Number(item.cantidad) <= Number(item.stockMinimo) ? 'text-red-500' : 'text-emerald-400'}">
                        ${item.cantidad}
                    </span>
                    <span class="text-[9px] text-slate-500 font-bold ml-1 uppercase italic">unidades</span>
                </div>
                <div class="text-right">
                    <p class="text-[9px] text-slate-500 font-black uppercase">PVP Sugerido</p>
                    <p class="text-[10px] text-white font-black">$${new Intl.NumberFormat().format(item.precioVenta || 0)}</p>
                </div>
            </div>
        </div>
    `).join("");
}
