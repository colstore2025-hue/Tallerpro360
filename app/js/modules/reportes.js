/**
 * reportes.js - TallerPRO360 NEXUS-X V17.0 📄
 * NÚCLEO DE AUDITORÍA Y EXTRACCIÓN DE DATOS SENSITIVOS
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function reportesModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let datosCargados = [];
    let datosFiltrados = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        AUDIT <span class="text-cyan-400">CENTER</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Protocolo de Inteligencia de Negocios</p>
                </div>

                <div class="flex flex-wrap gap-4 p-4 bg-[#0d1117] rounded-[2rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                    <div class="flex items-center gap-3 px-6 border-r border-white/5">
                        <i class="fas fa-calendar-day text-cyan-500 text-xs"></i>
                        <input type="date" id="fechaInicio" class="bg-transparent border-none text-[11px] text-white focus:outline-none orbitron font-black uppercase">
                        <span class="text-slate-700 font-black">>></span>
                        <input type="date" id="fechaFin" class="bg-transparent border-none text-[11px] text-white focus:outline-none orbitron font-black uppercase">
                    </div>
                    <div class="flex gap-2">
                        <button id="btnExcel" class="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center shadow-lg">
                            <i class="fas fa-file-excel text-lg"></i>
                        </button>
                        <button id="btnPDF" class="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg">
                            <i class="fas fa-file-pdf text-lg"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><i class="fas fa-wallet text-5xl"></i></div>
                    <p class="orbitron text-[9px] text-cyan-500 mb-2 font-black uppercase tracking-widest">Recaudo Total</p>
                    <h2 id="valorFiltrado" class="orbitron text-4xl font-black text-white">$ 0</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><i class="fas fa-box text-5xl"></i></div>
                    <p class="orbitron text-[9px] text-orange-500 mb-2 font-black uppercase tracking-widest">Misiones Procesadas</p>
                    <h2 id="totalMisiones" class="orbitron text-4xl font-black text-white">0</h2>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><i class="fas fa-chart-line text-5xl"></i></div>
                    <p class="orbitron text-[9px] text-emerald-500 mb-2 font-black uppercase tracking-widest">Ticket Promedio</p>
                    <h2 id="ticketPromedio" class="orbitron text-4xl font-black text-white">$ 0</h2>
                </div>
            </div>

            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 mb-10 flex items-center gap-6 focus-within:border-cyan-500/50 transition-all shadow-inner">
                <i class="fas fa-fingerprint text-cyan-500 text-xl animate-pulse"></i>
                <input id="filtroTabla" placeholder="RASTREAR POR PLACA, CLIENTE O TÉCNICO..." 
                       class="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-800 orbitron font-black tracking-widest">
            </div>

            <div class="bg-[#0d1117]/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-[0.3em]">
                            <th class="p-10 border-b border-white/5">Marca Temporal</th>
                            <th class="p-10 border-b border-white/5">Código Misión</th>
                            <th class="p-10 border-b border-white/5">Identidad Unidad</th>
                            <th class="p-10 border-b border-white/5 text-right">Inversión Total</th>
                            <th class="p-10 border-b border-white/5 text-center">Protocolo</th>
                        </tr>
                    </thead>
                    <tbody id="bodyReportes" class="divide-y divide-white/5">
                        </tbody>
                </table>
                <div id="vacio-reportes" class="hidden py-40 text-center opacity-20 group">
                    <i class="fas fa-ghost text-6xl mb-4 group-hover:scale-110 transition-transform duration-1000"></i>
                    <p class="orbitron text-[10px] uppercase tracking-[0.5em]">No se han detectado registros en este cuadrante</p>
                </div>
            </div>
        </div>`;
    };

    const cargarHistorial = async () => {
        try {
            // Consulta optimizada para la estructura de tu Dashboard
            const q = query(collection(db, "empresas", empresaId, "ordenes"), orderBy("creadoEn", "desc"));
            const snap = await getDocs(q);
            datosCargados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            datosFiltrados = [...datosCargados];
            
            hablar(`Sistema de auditoría sincronizado. Detectados ${datosCargados.length} registros operativos.`);
            ejecutarFiltroCombinado();
        } catch (e) { 
            console.error("🚨 Fallo de Enlace:", e);
            hablar("Error en la sincronización de archivos de satélite.");
        }
    };

    const ejecutarFiltroCombinado = () => {
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
    };

    const renderTabla = (data) => {
        const body = document.getElementById("bodyReportes");
        const empty = document.getElementById("vacio-reportes");

        if (data.length === 0) {
            body.innerHTML = "";
            empty.classList.remove("hidden");
            return;
        }

        empty.classList.add("hidden");
        body.innerHTML = data.map(o => `
            <tr class="hover:bg-white/[0.03] transition-all duration-500 group border-l-2 border-transparent hover:border-cyan-500">
                <td class="p-10">
                    <p class="text-slate-500 orbitron text-[10px] font-black">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : '---'}</p>
                    <p class="text-[8px] text-slate-700 orbitron font-bold mt-1">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</p>
                </td>
                <td class="p-10">
                    <span class="px-4 py-2 bg-slate-800 rounded-lg text-white font-black orbitron text-[10px] border border-white/5 italic">
                        #${o.id.substring(0, 8).toUpperCase()}
                    </span>
                </td>
                <td class="p-10">
                    <p class="font-black text-white orbitron text-sm tracking-tighter uppercase">${o.placa || 'OPERACIÓN_X'}</p>
                    <p class="text-[9px] text-cyan-500/60 font-black orbitron uppercase italic mt-1">${o.cliente || 'CLIENTE_ANÓNIMO'}</p>
                </td>
                <td class="p-10 text-right">
                    <p class="orbitron text-xl font-black text-white italic tracking-tighter">$ ${new Intl.NumberFormat("es-CO").format(o.total || 0)}</p>
                </td>
                <td class="p-10 text-center">
                    <span class="px-5 py-2 ${o.estado === 'FINALIZADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'} border rounded-full text-[8px] font-black orbitron uppercase italic tracking-widest">
                        ${o.estado || 'RECIBIDO'}
                    </span>
                </td>
            </tr>
        `).join("");
    };

    const actualizarKPIs = (data) => {
        const total = data.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const ticket = data.length > 0 ? (total / data.length) : 0;
        
        document.getElementById("valorFiltrado").innerText = `$ ${new Intl.NumberFormat("es-CO").format(total)}`;
        document.getElementById("totalMisiones").innerText = data.length;
        document.getElementById("ticketPromedio").innerText = `$ ${new Intl.NumberFormat("es-CO").format(Math.round(ticket))}`;
    };

    // --- EXPORTACIÓN ---
    const exportarExcel = async () => {
        const XLSX = await import("https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js");
        const ws = XLSX.utils.json_to_sheet(datosFiltrados.map(o => ({
            ID: o.id.toUpperCase(),
            FECHA: o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleString() : 'N/A',
            CLIENTE: o.cliente || 'N/A',
            PLACA: o.placa || '---',
            TECNICO: o.tecnico || '---',
            TOTAL: o.total,
            ESTADO: o.estado
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "AUDITORIA_NEXUS");
        XLSX.writeFile(wb, `Nexus_Audit_Report_${Date.now()}.xlsx`);
    };

    renderLayout();
    
    // Listeners
    document.getElementById("filtroTabla").oninput = ejecutarFiltroCombinado;
    document.getElementById("fechaInicio").onchange = ejecutarFiltroCombinado;
    document.getElementById("fechaFin").onchange = ejecutarFiltroCombinado;
    document.getElementById("btnExcel").onclick = exportarExcel;

    cargarHistorial();
}
