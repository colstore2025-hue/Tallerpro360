/**
 * ordenes.js - TallerPRO360 V5 🛠️
 */
import { getOrdenes, saveOrden } from "../services/dataService.js";

export default async function ordenes(container, state) {
    const empresaId = state.empresaId;
    
    container.innerHTML = `
    <div class="p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-black text-white italic">GESTIÓN / <span class="text-cyan-400">ÓRDENES</span></h1>
            <button id="btnNuevaOrden" class="bg-cyan-500 text-black px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">
                + Crear Orden
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input type="text" id="busquedaPlaca" placeholder="BUSCAR PLACA (ABC-123)..." class="bg-slate-900 border border-white/10 p-4 rounded-2xl text-[11px] font-bold text-cyan-400 outline-none uppercase">
            <div class="bg-slate-900 border border-white/5 rounded-2xl flex items-center px-4 overflow-hidden">
                <i class="fas fa-filter text-slate-500 text-xs mr-3"></i>
                <select id="filtroEstado" class="bg-transparent text-slate-400 text-[10px] font-black uppercase w-full outline-none py-4 cursor-pointer">
                    <option value="todos">TODOS LOS ESTADOS</option>
                    <option value="pendiente">PENDIENTES</option>
                    <option value="proceso">EN PROCESO</option>
                    <option value="entregado">ENTREGADOS</option>
                </select>
            </div>
        </div>

        <div id="listaOrdenes" class="space-y-4">
            <div class="p-10 text-center animate-pulse text-slate-600 text-[10px] font-black uppercase italic">Sincronizando Órdenes con Nexus...</div>
        </div>
    </div>
    `;

    renderList(empresaId);
}

async function renderList(empresaId) {
    const listArea = document.getElementById("listaOrdenes");
    const docs = await getOrdenes(empresaId);

    if (docs.length === 0) {
        listArea.innerHTML = `<p class="text-center text-slate-600 py-10 uppercase text-[10px] font-bold tracking-widest italic opacity-50">No hay órdenes registradas aún</p>`;
        return;
    }

    listArea.innerHTML = docs.map(o => `
        <div class="bg-slate-900/40 p-5 rounded-3xl border border-white/5 hover:border-cyan-500/20 transition-all group backdrop-blur-md">
            <div class="flex justify-between items-center">
                <div class="flex gap-4 items-center">
                    <div class="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-white/5 text-cyan-500 font-black text-xs">
                        ${o.placa || 'N/A'}
                    </div>
                    <div>
                        <h3 class="text-white text-xs font-black uppercase tracking-tight">${o.cliente || 'Cliente Genérico'}</h3>
                        <p class="text-[9px] text-slate-500 font-bold italic">${o.vehiculo || 'Vehículo sin marca'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getEstadoColor(o.estado)}">
                        ${o.estado || 'Recibido'}
                    </span>
                    <p class="mt-2 text-[10px] font-black text-slate-300">$${new Intl.NumberFormat().format(o.total || 0)}</p>
                </div>
            </div>
        </div>
    `).join("");
}

function getEstadoColor(e) {
    const s = (e || "").toLowerCase();
    if (s === 'entregado' || s === 'pagado') return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    if (s === 'proceso' || s === 'reparacion') return 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20';
    return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
}
