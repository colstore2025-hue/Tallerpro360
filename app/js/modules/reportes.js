/**
 * reportes.js - TallerPRO360 NEXUS-X V17.0 📄
 * NÚCLEO DE AUDITORÍA, EXPORTACIÓN MASIVA Y GENERACIÓN DE MANIFIESTOS
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// Cargamos librerías externas dinámicamente para máxima velocidad de carga inicial
const LOAD_XL = () => import("https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js");

export default async function reportesModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("nexus_empresaId");
    let datosCargados = [];

    // --- INTERFAZ TÁCTICA DE AUDITORÍA ---
    container.innerHTML = `
    <div class="p-6 lg:p-10 bg-[#050a14] min-h-screen pb-32 text-white animate-in fade-in duration-700 font-sans">
      
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
            <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                <p class="text-[8px] text-slate-500 uppercase font-black tracking-[0.4em]">Data Warehouse Active</p>
            </div>
            <h1 class="text-4xl font-black italic tracking-tighter leading-none text-white uppercase">
                CENTRO DE <span class="text-cyan-400">AUDITORÍA</span>
            </h1>
        </div>
        
        <div class="flex gap-3 bg-slate-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
            <button id="btnExcel" title="Exportar a Excel" class="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white active:scale-90 transition-all">
                <i class="fas fa-file-excel"></i>
            </button>
            <button id="btnPDF" title="Generar Manifiesto PDF" class="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white active:scale-90 transition-all">
                <i class="fas fa-file-pdf"></i>
            </button>
        </div>
      </div>

      <div class="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 mb-8 flex items-center gap-6 shadow-xl">
          <div class="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
              <i class="fas fa-search text-cyan-400 text-xs"></i>
          </div>
          <input id="filtroTabla" placeholder="Buscar por placa, cliente o ID de misión..." 
                 class="bg-transparent border-none outline-none text-sm w-full text-slate-300 placeholder:text-slate-700 orbitron tracking-widest">
      </div>

      <div class="bg-gradient-to-b from-[#0f172a] to-black rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                  <thead>
                      <tr class="bg-black/40 border-b border-white/5">
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest">Misión ID</th>
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest">Vehículo / Placa</th>
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest">Técnico</th>
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest text-right">Monto Total</th>
                          <th class="p-6 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Estado</th>
                      </tr>
                  </thead>
                  <tbody id="bodyReportes" class="text-[11px] font-medium text-slate-300">
                      <tr><td colspan="5" class="p-20 text-center opacity-30 animate-pulse uppercase text-[10px] font-black tracking-[0.5em]">Escaneando Base de Datos...</td></tr>
                  </tbody>
              </table>
          </div>
      </div>

      <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-6 bg-cyan-500/5 rounded-[2rem] border border-cyan-500/10 flex items-center gap-4">
              <i class="fas fa-info-circle text-cyan-500"></i>
              <p class="text-[9px] text-cyan-500/80 font-black uppercase tracking-widest">Para análisis de rentabilidad avanzada, consulte el módulo <span class="text-white">Gerente AI</span></p>
          </div>
          <div class="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex justify-end items-center">
              <p class="text-[9px] text-slate-500 font-black uppercase tracking-widest italic" id="txtTotalRegistros">0 REGISTROS ENCONTRADOS</p>
          </div>
      </div>

    </div>
  `;

    // --- LÓGICA DE DATOS ---

    async function cargarHistorial() {
        try {
            const q = query(
                collection(db, `empresas/${empresaId}/ordenes`),
                orderBy("creadoEn", "desc")
            );
            const snap = await getDocs(q);
            datosCargados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderTabla(datosCargados);
            actualizarContador(datosCargados.length);
        } catch (e) {
            console.error("🚨 Error Reportes Core:", e);
        }
    }

    function renderTabla(data) {
        const body = document.getElementById("bodyReportes");
        if (!data.length) {
            body.innerHTML = `<tr><td colspan="5" class="p-20 text-center text-slate-700 uppercase text-[10px] font-black italic">Sin registros en el perímetro</td></tr>`;
            return;
        }

        body.innerHTML = data.map(o => `
            <tr class="border-t border-white/5 hover:bg-white/5 transition-all group cursor-pointer">
                <td class="p-6 font-bold text-white orbitron">#${o.id.substring(0, 8).toUpperCase()}</td>
                <td class="p-6">
                    <div class="flex flex-col">
                        <span class="text-cyan-400 font-black uppercase tracking-widest">${o.placa || 'SIN PLACA'}</span>
                        <span class="text-[8px] text-slate-600 uppercase font-bold">${o.clienteNombre || 'Cliente Final'}</span>
                    </div>
                </td>
                <td class="p-6 text-slate-400 font-bold uppercase italic text-[10px]">${o.tecnico || 'Sin Asignar'}</td>
                <td class="p-6 text-right font-black text-white orbitron">$${new Intl.NumberFormat("es-CO").format(o.total || 0)}</td>
                <td class="p-6 text-center">
                    <span class="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-tighter shadow-sm
                        ${o.estado === 'LISTO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}">
                        ${o.estado || 'RECIBIDO'}
                    </span>
                </td>
            </tr>
        `).join("");
    }

    // --- SISTEMA DE FILTRADO ---
    document.getElementById("filtroTabla").oninput = (e) => {
        const busqueda = e.target.value.toLowerCase();
        const filtrados = datosCargados.filter(o => 
            (o.placa?.toLowerCase().includes(busqueda)) || 
            (o.id.toLowerCase().includes(busqueda)) ||
            (o.clienteNombre?.toLowerCase().includes(busqueda)) ||
            (o.tecnico?.toLowerCase().includes(busqueda))
        );
        renderTabla(filtrados);
        actualizarContador(filtrados.length);
    };

    function actualizarContador(n) {
        document.getElementById("txtTotalRegistros").innerText = `${n} REGISTROS LOCALIZADOS`;
    }

    // --- MÓDULOS DE EXPORTACIÓN ---

    // 1. EXCEL (Uso de SheetJS)
    document.getElementById("btnExcel").onclick = async () => {
        await LOAD_XL();
        const ws = XLSX.utils.json_to_sheet(datosCargados.map(o => ({
            ID_MISION: o.id.toUpperCase(),
            FECHA: o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : 'N/A',
            VEHICULO_PLACA: o.placa || '---',
            TECNICO_ASIGNADO: o.tecnico || 'N/A',
            CLIENTE: o.clienteNombre || 'N/A',
            VALOR_TOTAL: o.total,
            ESTADO_OPERATIVO: o.estado || 'RECIBIDO'
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "NEXUS_AUDIT");
        XLSX.writeFile(wb, `Auditoria_NexusX_${empresaId}_${Date.now()}.xlsx`);
    };

    // 2. PDF (Uso del Generador Nexus-X)
    document.getElementById("btnPDF").onclick = async () => {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert("Error: Librería jsPDF no cargada. Verifique su index.html");
            return;
        }

        const doc = new jsPDF();
        const ahora = new Date().toLocaleString();

        // Estética Corporativa Dark
        doc.setFillColor(5, 10, 20); // Deep Black
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(0, 242, 255); // Cyan Nexus
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("NEXUS-X AUDIT SYSTEM", 15, 25);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text("MANIFIESTO DE OPERACIONES Y AUDITORÍA DE CAMPO", 15, 33);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text(`CORTESÍA DE: Colombian Trucks Logistics LLC`, 15, 50);
        doc.text(`FECHA REPORTE: ${ahora}`, 15, 56);
        doc.line(15, 60, 195, 60);

        // Tabla de Auditoría en PDF
        const columns = ["ID", "PLACA", "TECNICO", "ESTADO", "TOTAL"];
        const rows = datosCargados.slice(0, 50).map(o => [ // Limitamos a 50 para el PDF rápido
            o.id.substring(0, 8).toUpperCase(),
            o.placa || "N/A",
            o.tecnico || "N/A",
            o.estado || "RECIBIDO",
            `$${new Intl.NumberFormat("es-CO").format(o.total || 0)}`
        ]);

        doc.autoTable({
            startY: 70,
            head: [columns],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [6, 182, 212], textColor: 255, fontSize: 9 },
            styles: { fontSize: 7, font: 'helvetica' },
        });

        doc.save(`Manifiesto_NexusX_${Date.now()}.pdf`);
    };

    cargarHistorial();
}
