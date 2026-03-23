import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
      <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter text-white uppercase">TERMINAL <span class="text-emerald-400">PAGOS</span></h1>
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">Nexus-X Gateway Colombia</p>
        </div>
      </div>

      <div class="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[2.5rem] border border-white/10 shadow-2xl mb-8">
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <label class="text-[8px] text-slate-500 font-black uppercase mb-1 block">ID Orden / Placa</label>
                    <input id="ordenId" placeholder="ABC-123" class="bg-transparent border-none outline-none text-sm font-black text-emerald-400 w-full uppercase">
                </div>
                <div class="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <label class="text-[8px] text-slate-500 font-black uppercase mb-1 block">Valor Total</label>
                    <input id="monto" type="number" placeholder="0.00" class="bg-transparent border-none outline-none text-sm font-black text-white w-full">
                </div>
            </div>

            <div class="bg-black/40 p-3 rounded-2xl border border-white/5">
                <label class="text-[8px] text-slate-500 font-black uppercase mb-1 block">Método de Recaudo</label>
                <select id="metodo" class="bg-transparent border-none outline-none text-xs font-black text-emerald-400 w-full appearance-none uppercase">
                    <option value="nequi">🟣 NEQUI / DAVIPLATA (Directo)</option>
                    <option value="pse">🏦 PSE / TRANSFERENCIA</option>
                    <option value="efectivo" selected>💵 EFECTIVO (Caja Física)</option>
                </select>
            </div>

            <div id="phoneField" class="hidden bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 animate-bounce">
                <label class="text-[8px] text-emerald-500 font-black uppercase mb-1 block">Celular del Cliente</label>
                <input id="celular" type="tel" placeholder="300 000 0000" class="bg-transparent border-none outline-none text-sm font-black text-white w-full">
            </div>

            <button id="procesarPago" class="w-full bg-emerald-500 text-black py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                Generar Cobro Digital
            </button>
        </div>
      </div>

      <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic px-2">Historial de Caja</h3>
      <div id="historialPagos" class="space-y-3"></div>
    </div>
  `;

  const metodoSelect = document.getElementById("metodo");
  const phoneField = document.getElementById("phoneField");
  const btn = document.getElementById("procesarPago");

  // Mostrar campo de celular solo si es Nequi/Daviplata
  metodoSelect.onchange = () => {
    phoneField.classList.toggle("hidden", metodoSelect.value !== "nequi");
    btn.innerText = metodoSelect.value === "efectivo" ? "Registrar en Caja" : "Enviar Solicitud de Pago";
  };

  btn.onclick = async () => {
    const data = {
      ordenId: document.getElementById("ordenId").value.trim(),
      monto: Number(document.getElementById("monto").value),
      metodo: metodoSelect.value,
      celular: document.getElementById("celular").value
    };

    if (!data.ordenId || data.monto <= 0) return alert("⚠️ Error: Datos incompletos");

    btn.innerText = "⚡ PROCESANDO CON NEXUS-GATEWAY...";
    btn.disabled = true;

    try {
      // 1. Lógica Mercado Pago / Nequi Mock (Aquí se integraría la API)
      if (data.metodo === 'nequi') {
        hablar(`Iniciando cobro a Nequi por ${data.monto} pesos. Por favor, pida al cliente que apruebe la notificación en su celular.`);
      }

      // 2. REGISTRAR PAGO EN FIRESTORE
      await addDoc(collection(db, "pagos"), {
        empresaId,
        ...data,
        creadoEn: serverTimestamp(),
        estado: data.metodo === "efectivo" ? "completado" : "pendiente_verificacion"
      });

      // 3. REGISTRAR EN CONTABILIDAD AUTOMÁTICAMENTE
      await addDoc(collection(db, "empresas", empresaId, "contabilidad"), {
        concepto: `INGRESO ORDEN #${data.ordenId}`,
        monto: data.monto,
        tipo: "ingreso",
        metodo: data.metodo,
        creadoEn: serverTimestamp()
      });

      // 4. ACTUALIZAR ESTADO DE LA ORDEN
      const q = query(collection(db, `empresas/${empresaId}/ordenes`), where("numero", "==", data.ordenId));
      const snap = await getDocs(q);
      snap.forEach(async (s) => await updateDoc(doc(db, `empresas/${empresaId}/ordenes`, s.id), { estado: "PAGADA" }));

      hablar("Operación finalizada con éxito.");
      alert("✅ ¡Pago Procesado!");
      location.reload();

    } catch (e) {
      console.error(e);
      btn.innerText = "ERROR - REINTENTAR";
      btn.disabled = false;
    }
  };

  cargarPagos();
}

function fmt(v) { return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v); }
