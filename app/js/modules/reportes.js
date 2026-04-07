/**
 * reportes.js - TallerPRO360 NEXUS-X V17.5 📄
 * NÚCLEO DE AUDITORÍA Y EXTRACCIÓN DE DATOS SENSITIVOS
 * Optimizado para: GRATI-CORE, BÁSICO, PRO y ELITE
 */
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportesModule(container, state) {
    // Sincronización de Identidad
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let datosCargados = [];
    let datosFiltrados = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        AUDIT <span class="text-cyan-400">CENTER</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Protocolo de Inteligencia de Negocios & BI</p>
                </div>

                <div class="flex flex-wrap gap-4 p-4 bg-[#0d1117] rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                    <div class="flex items-center gap-3 px-6 border-r border-white/5">
                        <i class="fas fa-calendar-day text-cyan-500 text-xs"></i>
                        <input type="date" id="fechaInicio" class="bg-transparent border-none text-[11px] text-white focus:outline-none orbitron font-black uppercase cursor-pointer">
                        <span class="text-slate-700 font-black">>></span>
                        <input type="date" id="fechaFin" class="bg-transparent border-none text-[11px] text-white focus:outline-none orbitron font-black uppercase cursor-pointer">
                    </div>
                    <div class="flex gap-2">
                        <button id="btnExcel" class="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center shadow-lg group">
                            <i class="fas fa-file-excel text-lg group-hover:scale-110"></i>
                        </button>
                        <button id="btnPDF" class="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg group">
                            <i class="fas fa-file-pdf text-lg group-hover:scale-110"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><i class="fas fa-wallet text-5xl"></i></div>
                    <p class="orbitron text-[9px] text-cyan-500 mb-2 font-black uppercase tracking-widest italic">Recaudo Bruto Operativo</p>
                    <h2 id="valorFiltrado" class="orbitron text-4xl font-black text-white italic tracking-tighter">$ 0</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><i class="fas fa-microchip text-5xl"></i></div>
                    <p class="orbitron text-[9px] text-orange-500 mb-2 font-black uppercase tracking-widest italic">Unidades Procesadas</p>
                    <h2 id="totalMisiones" class="orbitron text-4xl font-black text-white italic">0</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><i class="fas fa-chart-line text-5xl"></i></div>
                    <p class="orbitron text-[9px] text-emerald-500 mb-2 font-black uppercase tracking-widest italic">Eficiencia de Ticket</p>
                    <h2 id="ticketPromedio" class="orbitron text-4xl font-black text-white italic tracking-tighter">$ 0</h2>
                </div>
            </div>

            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 mb-10 flex items-center gap-6 focus-within:border-cyan-500/50 transition-all shadow-inner">
                <i class="fas fa-satellite-dish text-cyan-500 text-xl animate-pulse"></i>
                <input id="filtroTabla" placeholder="ESCANEAR PLACA, CLIENTE O TÉCNICO..." 
                       class="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-800 orbitron font-black tracking-[0.2em] uppercase">
            </div>

            <div class="bg-[#0d1117]/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 overflow-x-auto shadow-2xl">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-[0.3em]">
                            <th class="p-10 border-b border-white/5 italic">Time Stamp</th>
                            <th class="p-10 border-b border-white/5 italic">Mission ID</th>
                            <th class="p-10 border-b border-white/5 italic">Unidad / Cliente</th>
                            <th class="p-10 border-b border-white/5 text-right italic">Inversión</th>
                            <th class="p-10 border-b border-white/5 text-center italic">Status</th>
                        </tr>
                    </thead>
                    <tbody id="bodyReportes" class="divide-y divide-white/5 font-bold">
                        </tbody>
                </table>
                <div id="vacio-reportes" class="hidden py-40 text-center opacity-20 group">
                    <i class="fas fa-ghost text-6xl mb-4 group-hover:scale-110 transition-transform duration-1000"></i>
                    <p class="orbitron text-[10px] uppercase tracking-[0.5em]">No se han detectado registros en este cuadrante</p>
                </div>
            </div>
        </div>`;

        // Event Listeners
        document.getElementById("filtroTabla").addEventListener("input", ejecutarFiltroCombinado);
        document.getElementById("fechaInicio").addEventListener("change", ejecutarFiltroCombinado);
        document.getElementById("fechaFin").addEventListener("change", ejecutarFiltroCombinado);
        document.getElementById("btnExcel").onclick = exportarExcel;
        document.getElementById("btnPDF").onclick = () => window.print();

        cargarHistorial();
    };

    const cargarHistorial = async () => {
        try {
            // Consulta Universal compatible con todos los planes
            const q = query(
                collection(db, "ordenes"), 
                where("empresaId", "==", empresaId),
                orderBy("creadoEn", "desc")
            );
            
            const snap = await getDocs(q);
            datosCargados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            datosFiltrados = [...datosCargados];
            
            ejecutarFiltroCombinado();
        } catch (e) { 
            console.error("🚨 Error Audit Center:", e);
            const body = document.getElementById("bodyReportes");
            if(body) body.innerHTML = `<tr class="text-red-500"><td colspan="5" class="p-10 text-center orbitron text-xs">FALLO DE PROTOCOLO: REVISE PERMISOS DE EMPRESA</td></tr>`;
        }
    };

    function ejecutarFiltroCombinado() {
        const busqueda = document.getElementById("filtroTabla").value.toLowerCase();
        const fInicio = document.getElementById("fechaInicio").value;
        const fFin = document.getElementById("fechaFin").value;

        datosFiltrados = datosCargados.filter(o => {
            const fechaO = o.creadoEn?.toDate ? o.creadoEn.toDate() : null;
            const coincideTexto = (o.placa?.toLowerCase().includes(busqueda)) || 
                                 (o.cliente?.toLowerCase().includes(busqueda)) ||
                                 (o.tecnico?.toLowerCase().includes(busqueda));
            
            let coincideFecha = true;
            if (fInicio && fechaO) {
                const dInicio = new Date(fInicio + "T00:00:00");
                coincideFecha = fechaO >= dInicio;
            }
            if (fFin && fechaO && coincideFecha) {
                const dFin = new Date(fFin + "T23:59:59");
                coincideFecha = fechaO <= dFin;
            }

            return coincideTexto && coincideFecha;
        });

        renderTabla(datosFiltrados);
        actualizarKPIs(datosFiltrados);
    }

    const renderTabla = (data) => {
        const body = document.getElementById("bodyReportes");
        const empty = document.getElementById("vacio-reportes");
        if(!body) return;

        if (data.length === 0) {
            body.innerHTML = "";
            empty.classList.remove("hidden");
            return;
        }

        empty.classList.add("hidden");
        body.innerHTML = data.map(o => {
            const valorTotal = Number(o.total || 0);
            return `
            <tr class="hover:bg-white/[0.03] transition-all duration-500 group border-l-2 border-transparent hover:border-cyan-500">
                <td class="p-10">
                    <p class="text-slate-500 orbitron text-[10px] font-black">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : '00/00/00'}</p>
                    <p class="text-[8px] text-slate-700 orbitron font-bold mt-1">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                </td>
                <td class="p-10">
                    <span class="px-4 py-2 bg-black rounded-lg text-white font-black orbitron text-[9px] border border-white/5 italic">
                        #${o.id.substring(0, 6).toUpperCase()}
                    </span>
                </td>
                <td class="p-10">
                    <p class="font-black text-white orbitron text-sm tracking-tighter uppercase group-hover:text-cyan-400 transition-colors">${o.placa || 'N/A'}</p>
                    <p class="text-[9px] text-slate-500 font-black orbitron uppercase italic mt-1 tracking-widest">${o.cliente || 'CLIENTE FINAL'}</p>
                </td>
                <td class="p-10 text-right">
                    <p class="orbitron text-xl font-black text-white italic tracking-tighter">$ ${valorTotal.toLocaleString("es-CO")}</p>
                </td>
                <td class="p-10 text-center">
                    <span class="px-5 py-2 ${o.estado === 'FINALIZADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'} border rounded-full text-[8px] font-black orbitron uppercase italic tracking-widest">
                        ${o.estado || 'PROCESANDO'}
                    </span>
                </td>
            </tr>`;
        }).join("");
    };

    const actualizarKPIs = (data) => {
        const total = data.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const ticket = data.length > 0 ? (total / data.length) : 0;
        
        const elValor = document.getElementById("valorFiltrado");
        const elMisiones = document.getElementById("totalMisiones");
        const elTicket = document.getElementById("ticketPromedio");

        if(elValor) elValor.innerText = `$ ${total.toLocaleString("es-CO")}`;
        if(elMisiones) elMisiones.innerText = data.length;
        if(elTicket) elTicket.innerText = `$ ${Math.round(ticket).toLocaleString("es-CO")}`;
    };

    const exportarExcel = async () => {
        const btn = document.getElementById("btnExcel");
        btn.innerHTML = `<i class="fas fa-spinner animate-spin"></i>`;
        
        try {
            // Importación dinámica para optimizar carga
            const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js");
            const ws = XLSX.utils.json_to_sheet(datosFiltrados.map(o => ({
                ID_MISION: o.id.toUpperCase(),
                TIMESTAMP: o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleString() : 'N/A',
                IDENTIDAD: o.placa || 'N/A',
                OPERADOR: o.tecnico || 'N/A',
                INVERSION: o.total || 0,
                ESTADO_ACTUAL: o.estado || 'RECIBIDO'
            })));
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "AUDITORIA");
            XLSX.writeFile(wb, `Nexus_Audit_Export_${empresaId}.xlsx`);
        } catch (err) {
            console.error("Fallo de exportación:", err);
        } finally {
            btn.innerHTML = `<i class="fas fa-file-excel text-lg"></i>`;
        }
    };

    renderLayout();
}
