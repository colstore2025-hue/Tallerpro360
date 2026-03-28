/**
 * reportes.js - TallerPRO360 NEXUS-X V17.0 📄
 * NÚCLEO DE AUDITORÍA CON FILTRADO TEMPORAL Y EXPORTACIÓN MASIVA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

const LOAD_XL = () => import("https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js");

export default async function reportesModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("nexus_empresaId");
    let datosCargados = [];
    let datosFiltrados = [];

    container.innerHTML = `
    <div class="p-6 lg:p-10 bg-[#050a14] min-h-screen pb-32 text-white animate-in fade-in duration-700 font-sans">
      
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
            <h1 class="text-4xl font-black italic tracking-tighter leading-none text-white uppercase">
                CENTRO DE <span class="text-cyan-400">AUDITORÍA</span>
            </h1>
            <p class="text-[8px] text-slate-500 uppercase font-black tracking-[0.4em] mt-2 italic">Análisis de Operaciones Transnacionales</p>
        </div>
        
        <div class="flex flex-wrap gap-3 p-3 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div class="flex items-center gap-2 px-4 border-r border-white/10">
                <i class="fas fa-calendar-alt text-cyan-500 text-[10px]"></i>
                <input type="date" id="fechaInicio" class="bg-transparent border-none text-[10px] text-white focus:outline-none orbitron">
                <span class="text-slate-600 text-[10px] font-black">→</span>
                <input type="date" id="fechaFin" class="bg-transparent border-none text-[10px] text-white focus:outline-none orbitron">
            </div>
            <button id="btnExcel" class="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center">
                <i class="fas fa-file-excel"></i>
            </button>
            <button id="btnPDF" class="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 hover:bg-red-500 transition-all flex items-center justify-center">
                <i class="fas fa-file-pdf"></i>
            </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-4 gap-6 mb-8">
          <div class="lg:col-span-3 bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 flex items-center gap-6 shadow-xl">
              <i class="fas fa-search text-cyan-400 text-xs"></i>
              <input id="filtroTabla" placeholder="Buscar por placa, cliente o técnico..." 
                     class="bg-transparent border-none outline-none text-sm w-full text-slate-300 placeholder:text-slate-700 orbitron tracking-widest">
          </div>
          <div class="bg-gradient-to-br from-cyan-600/20 to-transparent p-6 rounded-[2rem] border border-cyan-500/20 text-center">
              <p class="text-[8px] text-slate-400 font-black uppercase mb-1">Total del Periodo</p>
              <h4 id="valorFiltrado" class="text-xl font-black orbitron text-white italic">$0</h4>
          </div>
      </div>

      <div class="bg-gradient-to-b from-[#0f172a] to-black rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                  <thead>
                      <tr class="bg-black/40 border-b border-white/5">
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest">Fecha</th>
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest">Misión ID</th>
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest">Placa / Vehículo</th>
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest text-right">Monto</th>
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody id="bodyReportes" class="text-[11px] font-medium text-slate-300">
                      <tr><td colspan="5" class="p-20 text-center opacity-30 animate-pulse text-[10px] font-black uppercase">Sincronizando Archivos de Satélite...</td></tr>
                  </tbody>
              </table>
          </div>
      </div>
    </div>`;

    // --- LÓGICA DE FILTRADO Y CARGA ---

    async function cargarHistorial() {
        try {
            const q = query(collection(db, `empresas/${empresaId}/ordenes`), orderBy("creadoEn", "desc"));
            const snap = await getDocs(q);
            datosCargados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            datosFiltrados = [...datosCargados];
            ejecutarFiltroCombinado();
        } catch (e) { console.error("🚨 Error:", e); }
    }

    function ejecutarFiltroCombinado() {
        const busqueda = document.getElementById("filtroTabla").value.toLowerCase();
        const fInicio = document.getElementById("fechaInicio").value;
        const fFin = document.getElementById("fechaFin").value;

        datosFiltrados = datosCargados.filter(o => {
            const fechaO = o.creadoEn?.toDate ? o.creadoEn.toDate() : null;
            const coincideTexto = (o.placa?.toLowerCase().includes(busqueda)) || (o.clienteNombre?.toLowerCase().includes(busqueda));
            
            let coincideFecha = true;
            if (fInicio && fechaO) coincideFecha = fechaO >= new Date(fInicio);
            if (fFin && fechaO && coincideFecha) coincideFecha = fechaO <= new Date(fFin);

            return coincideTexto && coincideFecha;
        });

        renderTabla(datosFiltrados);
        actualizarKPIs(datosFiltrados);
    }

    function renderTabla(data) {
        const body = document.getElementById("bodyReportes");
        body.innerHTML = data.map(o => `
            <tr class="border-t border-white/5 hover:bg-white/5 transition-all group">
                <td class="p-6 text-slate-500 mono">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : 'N/A'}</td>
                <td class="p-6 font-bold text-white orbitron">#${o.id.substring(0, 6).toUpperCase()}</td>
                <td class="p-6 font-black text-cyan-400 uppercase tracking-widest">${o.placa || '---'}</td>
                <td class="p-6 text-right font-black text-white orbitron">$${new Intl.NumberFormat("es-CO").format(o.total || 0)}</td>
                <td class="p-6 text-center">
                    <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[8px] font-black uppercase">
                        ${o.estado || 'RECIBIDO'}
                    </span>
                </td>
            </tr>
        `).join("");
    }

    function actualizarKPIs(data) {
        const total = data.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        document.getElementById("valorFiltrado").innerText = `$${new Intl.NumberFormat("es-CO").format(total)}`;
    }

    // --- EVENT LISTENERS ---
    document.getElementById("filtroTabla").oninput = ejecutarFiltroCombinado;
    document.getElementById("fechaInicio").onchange = ejecutarFiltroCombinado;
    document.getElementById("fechaFin").onchange = ejecutarFiltroCombinado;

    // EXCEL
    document.getElementById("btnExcel").onclick = async () => {
        await LOAD_XL();
        const ws = XLSX.utils.json_to_sheet(datosFiltrados.map(o => ({
            ID: o.id.toUpperCase(),
            FECHA: o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : 'N/A',
            PLACA: o.placa || '---',
            TOTAL: o.total,
            STATUS: o.estado
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
        XLSX.writeFile(wb, `Audit_NexusX_${new Date().getTime()}.xlsx`);
    };

    // PDF 
    document.getElementById("btnPDF").onclick = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFillColor(5, 10, 20);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(0, 242, 255);
        doc.setFontSize(20);
        doc.text("COLOMBIAN TRUCKS LOGISTICS LLC", 15, 25);
        doc.setFontSize(8);
        doc.text(`AUDITORÍA DE PERIODO: ${document.getElementById("fechaInicio").value || 'INICIO'} - ${document.getElementById("fechaFin").value || 'ACTUAL'}`, 15, 33);
        
        doc.autoTable({
            startY: 50,
            head: [['FECHA', 'ID', 'PLACA', 'ESTADO', 'TOTAL']],
            body: datosFiltrados.map(o => [
                o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : '',
                o.id.substring(0, 6),
                o.placa,
                o.estado,
                `$${new Intl.NumberFormat("es-CO").format(o.total)}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        });
        doc.save(`Nexus_Report_${Date.now()}.pdf`);
    };

    cargarHistorial();
}
