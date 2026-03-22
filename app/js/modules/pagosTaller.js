/**
 * pagosTaller.js - TallerPRO360 V4 💳
 * Gestión de Cobro Inteligente & Pasarela de Conciliación
 */
import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// Importación dinámica de librerías para optimizar carga inicial
const LOAD_JS_PDF = () => import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
const LOAD_XLSX = () => import("https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js");

export default async function pagosTaller(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
      
      <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter leading-none text-white uppercase">
                TERMINAL <span class="text-emerald-400">PAGOS</span>
            </h1>
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Recaudos & Facturación Electrónica</p>
        </div>
        <div class="flex gap-2">
            <button id="btnPDF" class="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 active:scale-90"><i class="fas fa-file-pdf"></i></button>
            <button id="btnXL" class="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 active:scale-90"><i class="fas fa-file-excel"></i></button>
        </div>
      </div>

      <div class="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl mb-8 relative overflow-hidden">
        <div class="absolute -right-4 -top-4 opacity-5 text-6xl text-emerald-500"><i class="fas fa-credit-card"></i></div>
        
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-black/20 p-3 rounded-2xl border border-white/5">
                    <label class="text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-1">ID Orden</label>
                    <input id="ordenId" placeholder="EJ: 4509" class="bg-transparent border-none outline-none text-sm font-black text-emerald-400 w-full uppercase">
                </div>
                <div class="bg-black/20 p-3 rounded-2xl border border-white/5">
                    <label class="text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-1">Valor Recibido</label>
                    <input id="monto" type="number" placeholder="$ 0.00" class="bg-transparent border-none outline-none text-sm font-black text-white w-full">
                </div>
            </div>

            <div class="bg-black/20 p-3 rounded-2xl border border-white/5">
                <label class="text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-1">Método de Pago</label>
                <select id="metodo" class="bg-transparent border-none outline-none text-xs font-black text-emerald-400 w-full appearance-none uppercase">
                    <option value="pse" class="bg-slate-900">🏦 PSE / Transferencia</option>
                    <option value="nequi" class="bg-slate-900">🟣 Nequi / Daviplata</option>
                    <option value="tarjeta" class="bg-slate-900">💳 Tarjeta Crédito/Débito</option>
                    <option value="efectivo" class="bg-slate-900" selected>💵 Efectivo</option>
                </select>
            </div>

            <button id="procesarPago" class="w-full bg-emerald-500 text-black py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all">
                Registrar y Finalizar Orden
            </button>
        </div>
      </div>

      <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2 italic">Últimos Recaudos</h3>
      <div id="historialPagos" class="space-y-3 pb-24">
          <div class="text-center py-10 opacity-20 text-[10px] font-black uppercase animate-pulse italic">Escaneando registros bancarios...</div>
      </div>

    </div>
  `;

  const histDiv = document.getElementById("historialPagos");

  async function cargarPagos() {
    try {
      const q = query(collection(db, "pagos"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"), limit(20));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        histDiv.innerHTML = `<div class="p-10 text-center text-slate-700 text-[10px] font-black uppercase tracking-widest italic">Cero movimientos registrados</div>`;
        return;
      }

      histDiv.innerHTML = snap.docs.map(docSnap => {
        const p = docSnap.data();
        const icon = p.metodo === 'efectivo' ? 'fa-money-bill-wave' : 'fa-university';
        return `
          <div class="bg-[#0f172a] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center animate-fade-in transition-all active:bg-white/5">
              <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-emerald-500/50">
                      <i class="fas ${icon} text-xs"></i>
                  </div>
                  <div>
                      <p class="text-xs font-black text-white uppercase tracking-tighter">ORDEN #${p.ordenId.substring(0,5)}</p>
                      <p class="text-[8px] text-slate-500 font-bold uppercase tracking-widest">${p.metodo}</p>
                  </div>
              </div>
              <div class="text-right">
                  <p class="text-sm font-black text-emerald-400 tracking-tighter">+$${fmt(p.monto)}</p>
                  <p class="text-[7px] text-slate-600 font-black uppercase tracking-widest">Sincronizado</p>
              </div>
          </div>
        `;
      }).join("");

    } catch (e) {
      console.error(e);
      histDiv.innerHTML = "❌ Error en Gateway";
    }
  }

  document.getElementById("procesarPago").onclick = async () => {
    const ordenId = document.getElementById("ordenId").value.trim();
    const monto = Number(document.getElementById("monto").value);
    const metodo = document.getElementById("metodo").value;

    if (!ordenId || monto <= 0) return alert("Verifica ID y Monto");

    const btn = document.getElementById("procesarPago");
    btn.innerText = "VALIDANDO CON NEXUS-X...";
    btn.disabled = true;

    try {
      // 1. REGISTRAR PAGO
      await addDoc(collection(db, "pagos"), {
        empresaId,
        ordenId,
        monto,
        metodo,
        creadoEn: serverTimestamp(),
        estado: "completado"
      });

      // 2. ACTUALIZAR ORDEN (Integración con módulo Órdenes)
      const ordenesQuery = query(collection(db, `empresas/${empresaId}/ordenes`), where("__name__", "==", ordenId));
      const ordenSnap = await getDocs(ordenesQuery);
      
      if (!ordenSnap.empty) {
        await updateDoc(doc(db, `empresas/${empresaId}/ordenes`, ordenId), {
           estado: "PAGADA",
           pagadoEn: serverTimestamp()
        });
      }

      // 3. REGISTRAR EN CONTABILIDAD (Integración con módulo Contabilidad)
      await addDoc(collection(db, `empresas/${empresaId}/contabilidad`), {
          concepto: `PAGO ORDEN #${ordenId}`,
          monto: monto,
          tipo: "ingreso",
          creadoEn: serverTimestamp(),
          metodo: metodo
      });

      hablar(`Excelente. Recaudo de ${monto} pesos completado. La orden ha sido cerrada satisfactoriamente.`);
      
      // Reset
      document.getElementById("ordenId").value = "";
      document.getElementById("monto").value = "";
      btn.innerText = "REGISTRAR Y FINALIZAR ORDEN";
      btn.disabled = false;
      cargarPagos();

    } catch (e) {
      console.error(e);
      btn.innerText = "ERROR - REINTENTAR";
      btn.disabled = false;
    }
  };

  // Exportaciones Tesla
  document.getElementById("btnXL").onclick = async () => {
    await LOAD_XLSX();
    const snap = await getDocs(query(collection(db, "pagos"), where("empresaId", "==", empresaId)));
    const data = snap.docs.map(d => d.data());
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recaudos");
    XLSX.writeFile(wb, `Caja_Nexus_${empresaId}.xlsx`);
  };

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }
  cargarPagos();
}
