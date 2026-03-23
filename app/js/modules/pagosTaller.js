/**
 * pagosTaller.js - TallerPRO360 V5.0 💳
 * Integración de Pasarela + Descuento Automático de Inventario
 */
import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { procesarSalidaInventario } from "../services/stockService.js"; // IMPORTANTE: El motor de stock

export default async function pagosTaller(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  
  const empSnap = await getDoc(doc(db, "empresas", empresaId));
  const configEmpresa = empSnap.exists() ? empSnap.data() : {};

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
      <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter uppercase text-white">
                TERMINAL <span class="text-emerald-400">PAGOS</span>
            </h1>
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Nexus-X Transaction Engine</p>
        </div>
        <div id="statusMP" class="px-3 py-1 rounded-full border border-white/10 bg-black/40">
            <span class="text-[7px] font-black uppercase tracking-widest ${configEmpresa.mp_access_token ? 'text-emerald-500' : 'text-yellow-500 animate-pulse'}">
                ${configEmpresa.mp_access_token ? '● Link Activo' : '● Configurar MP'}
            </span>
        </div>
      </div>

      <div class="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[2.5rem] border border-white/10 shadow-2xl mb-8">
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block">Placa del Vehículo</label>
                    <input id="ordenId" placeholder="ABC-123" class="bg-transparent border-none outline-none text-base font-black text-emerald-400 w-full uppercase">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block">Valor Total</label>
                    <input id="monto" type="number" placeholder="0" class="bg-transparent border-none outline-none text-base font-black text-white w-full">
                </div>
            </div>

            <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block">Método de Pago</label>
                <select id="metodo" class="bg-transparent border-none outline-none text-xs font-black text-emerald-400 w-full appearance-none uppercase cursor-pointer">
                    <option value="efectivo" selected>💵 EFECTIVO (Caja Física)</option>
                    <option value="nequi">🟣 NEQUI / DAVIPLATA</option>
                    <option value="pse">🏦 PSE / TRANSFERENCIA</option>
                </select>
            </div>

            <button id="procesarPago" class="w-full bg-emerald-500 text-black py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                Finalizar Venta & Descontar Stock
            </button>
        </div>
      </div>

      <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic px-2 tracking-[0.3em]">Flujo de Caja Hoy</h3>
      <div id="historialPagos" class="space-y-3"></div>
    </div>
  `;

  const btn = document.getElementById("procesarPago");

  btn.onclick = async () => {
    const placaIngresada = document.getElementById("ordenId").value.trim().toUpperCase();
    const monto = Number(document.getElementById("monto").value);
    const metodo = document.getElementById("metodo").value;

    if (!placaIngresada || monto <= 0) {
        hablar("Por favor, verifica la placa y el monto antes de continuar.");
        return;
    }

    btn.innerText = "⚡ EJECUTANDO NEXUS-SYNC...";
    btn.disabled = true;

    try {
      // 1. BUSCAR LA ORDEN PARA OBTENER LOS REPUESTOS
      const qOrden = query(collection(db, `empresas/${empresaId}/ordenes`), where("placa", "==", placaIngresada), where("estado", "==", "EN_TALLER"));
      const snapOrden = await getDocs(qOrden);

      if (snapOrden.empty) {
          hablar("Atención. No encontré una orden activa para esa placa.");
          btn.innerText = "REINTENTAR";
          btn.disabled = false;
          return;
      }

      const ordenDoc = snapOrden.docs[0];
      const ordenData = ordenDoc.data();

      // 2. DESCONTAR INVENTARIO (Solo los de origen TALLER)
      if (ordenData.items && ordenData.items.length > 0) {
          await procesarSalidaInventario(empresaId, ordenData.items);
      }

      // 3. REGISTRO EN CONTABILIDAD (Ingreso)
      await addDoc(collection(db, "empresas", empresaId, "contabilidad"), {
        concepto: `PAGO ORDEN: ${placaIngresada}`,
        monto: monto,
        tipo: "ingreso",
        metodo: metodo,
        fecha: serverTimestamp()
      });

      // 4. REGISTRO EN LOG GLOBAL DE PAGOS
      await addDoc(collection(db, "pagos"), {
        empresaId,
        ordenId: placaIngresada,
        monto,
        metodo,
        creadoEn: serverTimestamp(),
        estado: "completado"
      });

      // 5. MARCAR ORDEN COMO PAGADA
      await updateDoc(doc(db, `empresas/${empresaId}/ordenes`, ordenDoc.id), { 
          estado: "PAGADA",
          fechaPago: serverTimestamp()
      });

      hablar(`Transacción completada. Inventario actualizado y placa ${placaIngresada} liberada.`);
      
      Swal.fire({
          icon: 'success',
          title: 'PAGO PROCESADO',
          text: 'Stock descontado y orden cerrada.',
          background: '#0a0f1d',
          color: '#fff',
          confirmButtonColor: '#10b981'
      });

      // Limpiar y Recargar
      document.getElementById("ordenId").value = "";
      document.getElementById("monto").value = "";
      btn.disabled = false;
      btn.innerText = "Iniciar Cobro Seguro";
      cargarPagos();

    } catch (e) {
      console.error(e);
      hablar("Error en el protocolo de cierre.");
      btn.innerText = "ERROR - REINTENTAR";
      btn.disabled = false;
    }
  };

  async function cargarPagos() {
    const hist = document.getElementById("historialPagos");
    const q = query(collection(db, "pagos"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"), limit(10));
    const snap = await getDocs(q);
    
    hist.innerHTML = snap.docs.map(d => {
        const p = d.data();
        return `
            <div class="bg-[#0f172a] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center animate-fade-in">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-emerald-400 border border-white/5">
                        <i class="fas ${p.metodo === 'efectivo' ? 'fa-wallet' : 'fa-bolt'} text-[10px]"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-white uppercase tracking-tighter">${p.ordenId}</p>
                        <p class="text-[7px] text-slate-500 font-bold uppercase tracking-widest">${p.metodo}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs font-black text-emerald-400">$${new Intl.NumberFormat().format(p.monto)}</p>
                </div>
            </div>
        `;
    }).join("");
  }

  cargarPagos();
}
