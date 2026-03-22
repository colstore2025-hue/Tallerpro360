/**
 * reportes.js - TallerPRO360 NEXUS-X 📄
 * Edición: Auditoría y Exportación Masiva
 */
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// Cargamos librerías externas de forma dinámica para no pesar al inicio
const LOAD_XL = () => import("https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js");

export default async function reportesModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  let datosCargados = [];

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
      
      <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter leading-none text-white">CENTRO DE <span class="text-cyan-400">REPORTES</span></h1>
            <p class="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em] mt-1">Auditoría y Descargas Excel/PDF</p>
        </div>
        <div class="flex gap-2">
            <button id="btnExcel" class="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-file-excel"></i>
            </button>
            <button id="btnPDF" class="w-10 h-10 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 flex items-center justify-center active:scale-90 transition-all">
                <i class="fas fa-file-pdf"></i>
            </button>
        </div>
      </div>

      <div class="bg-slate-900/50 p-4 rounded-3xl border border-white/5 mb-6 flex items-center gap-4">
          <i class="fas fa-filter text-cyan-500 text-xs"></i>
          <input id="filtroTabla" placeholder="Filtrar por placa o cliente..." class="bg-transparent border-none outline-none text-xs w-full text-slate-300">
      </div>

      <div class="bg-[#0f172a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                  <thead>
                      <tr class="bg-black/20">
                          <th class="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Orden</th>
                          <th class="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">Vehículo</th>
                          <th class="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-right">Total</th>
                          <th class="p-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Estado</th>
                      </tr>
                  </thead>
                  <tbody id="bodyReportes" class="text-[11px] font-medium text-slate-300">
                      <tr><td colspan="4" class="p-10 text-center opacity-30 animate-pulse uppercase text-[9px] font-black">Sincronizando Archivos...</td></tr>
                  </tbody>
              </table>
          </div>
      </div>

      <div class="mt-6 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 text-center">
          <p class="text-[9px] text-cyan-500/60 font-black uppercase">Para análisis visual y proyecciones IA, visita el módulo de <span class="text-cyan-400">Finanzas</span></p>
      </div>

    </div>
  `;

  async function cargarHistorial() {
    try {
      const q = query(
        collection(db, `empresas/${empresaId}/ordenes`),
        orderBy("creadoEn", "desc")
      );
      const snap = await getDocs(q);
      datosCargados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderTabla(datosCargados);
    } catch (e) {
      console.error("Error Reportes:", e);
    }
  }

  function renderTabla(data) {
    const body = document.getElementById("bodyReportes");
    if (!data.length) {
      body.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-slate-600 uppercase text-[9px] font-black">Sin registros para exportar</td></tr>`;
      return;
    }

    body.innerHTML = data.map(o => `
      <tr class="border-t border-white/5 active:bg-white/5 transition-colors">
          <td class="p-4 font-bold text-white">#${o.id.substring(0, 5)}</td>
          <td class="p-4 uppercase text-cyan-400 font-black">${o.placa || '---'}</td>
          <td class="p-4 text-right font-black">$${fmt(o.total)}</td>
          <td class="p-4 text-center">
              <span class="px-2 py-1 rounded-md text-[8px] font-black uppercase ${o.estado === 'LISTO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
                ${o.estado || 'Recibido'}
              </span>
          </td>
      </tr>
    `).join("");
  }

  // Lógica de Exportación a Excel (Tesla Style)
  document.getElementById("btnExcel").onclick = async () => {
    await LOAD_XL();
    const ws = XLSX.utils.json_to_sheet(datosCargados.map(o => ({
        ORDEN: o.id,
        FECHA: o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : '---',
        PLACA: o.placa,
        CLIENTE: o.clienteNombre,
        TOTAL: o.total,
        ESTADO: o.estado
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_TallerPRO360");
    XLSX.writeFile(wb, `Reporte_Auditoria_${empresaId}.xlsx`);
  };

  // El PDF ya lo tenemos en Finanzas, pero aquí podemos hacer uno resumido de la tabla
  document.getElementById("btnPDF").onclick = () => window.print();

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }

  cargarHistorial();
}
