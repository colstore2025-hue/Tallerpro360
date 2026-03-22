/**
 * finanzas_elite.js - TallerPRO360 NEXUS-X V6.1 💹
 * Incluye: Exportación PDF y Auditoría de Cierre
 */
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  let datosReporte = { facturado: 0, enTaller: 0, fugado: 0, lista: [] };

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-40 text-white animate-fade-in font-sans">
      
      <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter leading-none">CASH <span class="text-cyan-400">FLOW</span></h1>
            <p class="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em] mt-1">Nexus-X Predictive Engine</p>
        </div>
        <button id="btnExportarPDF" class="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-cyan-400 shadow-xl active:scale-90 transition-all">
            <i class="fas fa-file-pdf text-lg"></i>
        </button>
      </div>

      <div class="bg-gradient-to-br from-slate-900 to-[#0f172a] p-8 rounded-[3rem] border border-white/5 shadow-2xl mb-6 relative overflow-hidden">
         <div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full"></div>
         <h4 class="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Utilidad Bruta Proyectada</h4>
         <div id="txtProyeccion" class="text-5xl font-black tracking-tighter text-white animate-pulse">$ ---.---</div>
         
         <div class="mt-6 space-y-3">
            <div class="flex justify-between items-end text-[8px] font-black text-slate-500 uppercase">
                <span>Punto de Equilibrio</span>
                <span id="txtMeta" class="text-white text-[10px]">$ 15'000.000</span>
            </div>
            <div class="h-4 bg-black/40 rounded-full p-1 border border-white/5">
                <div id="barProgreso" class="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000" style="width: 0%"></div>
            </div>
         </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-slate-900/80 p-5 rounded-[2.5rem] border border-white/5">
            <i class="fas fa-clock text-amber-500 text-xs mb-2"></i>
            <span class="text-[8px] text-slate-500 font-black uppercase block">Dinero en Rampa</span>
            <div id="kpiAbierto" class="text-lg font-black text-white">$0</div>
        </div>
        <div class="bg-slate-900/80 p-5 rounded-[2.5rem] border border-white/5">
            <i class="fas fa-exclamation-triangle text-red-500 text-xs mb-2"></i>
            <span class="text-[8px] text-slate-500 font-black uppercase block">Fuga de Capital</span>
            <div id="kpiFuga" class="text-lg font-black text-red-400">$0</div>
        </div>
      </div>

      <div id="boxRecomendacion" class="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-[2.5rem] flex items-start gap-4 mb-10">
        <div class="w-10 h-10 bg-cyan-500 rounded-2xl flex-shrink-0 flex items-center justify-center text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <i class="fas fa-brain"></i>
        </div>
        <div>
            <h5 class="text-[10px] font-black uppercase text-cyan-400 mb-1">Nexus-X Advisor</h5>
            <p id="txtConsejo" class="text-[11px] text-slate-300 leading-relaxed">Sincronizando flujo de caja...</p>
        </div>
      </div>

    </div>
  `;

  async function syncFinance() {
    try {
        const snap = await getDocs(collection(db, `empresas/${empresaId}/ordenes`));
        const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        datosReporte.facturado = ordenes.filter(o => o.estado === "LISTO" || o.estado === "ENTREGADO").reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        datosReporte.enTaller = ordenes.filter(o => o.estado === "RECIBIDO" || o.estado === "TALLER").reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        datosReporte.fugado = ordenes.filter(o => o.estado === "CANCELADO").reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        datosReporte.lista = ordenes;

        const meta = 15000000;
        const porcentaje = Math.min(100, (datosReporte.facturado / meta) * 100);

        document.getElementById("txtProyeccion").innerText = `$${fmt(datosReporte.facturado)}`;
        document.getElementById("kpiAbierto").innerText = `$${fmt(datosReporte.enTaller)}`;
        document.getElementById("kpiFuga").innerText = `$${fmt(datosReporte.fugado)}`;
        
        setTimeout(() => {
            document.getElementById("barProgreso").style.width = `${porcentaje}%`;
        }, 500);

        document.getElementById("txtConsejo").innerText = getSmartAdvice(datosReporte.facturado, datosReporte.enTaller, datosReporte.fugado);

        // Activar botón de exportación
        document.getElementById("btnExportarPDF").onclick = () => exportarCierreMes(datosReporte);

    } catch (e) {
        console.error("Finance Error:", e);
    }
  }

  function exportarCierreMes(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();

    // Estilo del PDF
    doc.setFillColor(10, 15, 26);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(0, 255, 255);
    doc.setFontSize(22);
    doc.text("TallerPRO360 - CIERRE FINANCIERO", 15, 25);
    
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Fecha de Reporte: ${fecha}`, 15, 50);
    doc.text(`Empresa ID: ${empresaId}`, 15, 55);

    // Resumen de KPIs
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("RESUMEN DE OPERACIÓN", 15, 75);
    doc.setFontSize(11);
    doc.text(`Total Facturado: $${fmt(data.facturado)}`, 15, 85);
    doc.text(`Dinero en Rampa (Activo): $${fmt(data.enTaller)}`, 15, 92);
    doc.text(`Capital Fugado (Cancelaciones): $${fmt(data.fugado)}`, 15, 99);

    // Tabla de Órdenes (Usando autoTable)
    const tableData = data.lista.map(o => [o.id.substring(0,5), o.placa || 'N/A', o.estado, `$${fmt(o.total)}`]);
    doc.autoTable({
      startY: 110,
      head: [['ID', 'PLACA', 'ESTADO', 'VALOR']],
      body: tableData,
      headStyles: { fillColor: [6, 182, 212] }
    });

    doc.save(`Cierre_Mes_${empresaId}_${fecha}.pdf`);
  }

  function getSmartAdvice(f, t, fug) {
      if (fug > (f * 0.3)) return "Alerta Crítica: El 30% de tus ingresos se están perdiendo por cotizaciones no aprobadas.";
      if (t > f) return "Cuello de Botella Detectado: Tienes más capital en el taller que en el banco. ¡Agiliza entregas!";
      return "Operación Saludable: El flujo de caja es constante. Mantén el ritmo actual.";
  }

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }

  syncFinance();
}
