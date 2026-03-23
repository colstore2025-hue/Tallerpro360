/**
 * ordenes.js - TallerPRO360 NEXUS-CORE
 */
import { getOrdenes } from "../services/dataService.js";

export default async function ordenes(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    
    // UI Inicial
    container.innerHTML = `
    <div class="p-4 lg:p-8 animate-in fade-in duration-500">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-black text-white italic">OPERACIONES / <span class="text-cyan-400">ÓRDENES</span></h1>
            <button class="bg-cyan-500 text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">
                + Nueva Orden
            </button>
        </div>

        <div id="listaOrdenes" class="grid gap-4">
            <div class="flex flex-col items-center justify-center p-20 opacity-20">
                <div class="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-[10px] font-black uppercase tracking-[0.4em]">Sincronizando con Nexus...</p>
            </div>
        </div>
    </div>
    `;

    try {
        const listArea = document.getElementById("listaOrdenes");
        const docs = await getOrdenes(empresaId);

        if (!docs || docs.length === 0) {
            listArea.innerHTML = `
                <div class="bg-slate-900/50 p-10 rounded-[2.5rem] border border-dashed border-white/10 text-center">
                    <i class="fas fa-folder-open text-slate-700 text-3xl mb-4"></i>
                    <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">No hay órdenes activas en la base de datos</p>
                </div>`;
            return;
        }

        listArea.innerHTML = docs.map(o => `
            <div class="bg-slate-900/40 p-5 rounded-3xl border border-white/5 hover:border-cyan-500/20 transition-all group backdrop-blur-md">
                <div class="flex justify-between items-center text-[11px]">
                    <div class="flex gap-4 items-center">
                        <div class="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-white/5 text-cyan-400 font-black">
                            ${o.placa || 'N/A'}
                        </div>
                        <div>
                            <h3 class="text-white font-black uppercase">${o.cliente || 'Sin Nombre'}</h3>
                            <p class="text-[9px] text-slate-500 font-bold italic">${o.vehiculo || 'Vehículo'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                            ${o.estado || 'Pendiente'}
                        </span>
                        <p class="mt-2 font-black text-white">$${new Intl.NumberFormat().format(o.total || 0)}</p>
                    </div>
                </div>
            </div>
        `).join("");

    } catch (err) {
        console.error("Error cargando órdenes:", err);
        document.getElementById("listaOrdenes").innerHTML = `<p class="text-red-500 text-[10px] font-black text-center uppercase">Error de enlace con Firestore</p>`;
    }
}
