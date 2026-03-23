/**
 * pagosTaller.js - TallerPRO360 V4.2 💳
 * Integración Dinámica de Pasarela (Mercado Pago Individual)
 */
import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  
  // 1. Obtener credenciales de la empresa antes de renderizar
  const empSnap = await getDoc(doc(db, "empresas", empresaId));
  const configEmpresa = empSnap.exists() ? empSnap.data() : {};

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
      <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter uppercase text-white">
                TERMINAL <span class="text-emerald-400">PAGOS</span>
            </h1>
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Nexus-X Gateway Individual</p>
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
                <div class="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <label class="text-[8px] text-slate-500 font-black uppercase mb-1 block">ID Orden / Placa</label>
                    <input id="ordenId" placeholder="EJ: ABC-123" class="bg-transparent border-none outline-none text-sm font-black text-emerald-400 w-full uppercase">
                </div>
                <div class="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <label class="text-[8px] text-slate-500 font-black uppercase mb-1 block">Valor a Cobrar</label>
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

            <div id="phoneField" class="hidden bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                <label class="text-[8px] text-emerald-500 font-black uppercase mb-1 block">Celular del Cliente (Nequi)</label>
                <input id="celular" type="tel" placeholder="3000000000" class="bg-transparent border-none outline-none text-sm font-black text-white w-full">
            </div>

            <button id="procesarPago" class="w-full bg-emerald-500 text-black py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                Iniciar Cobro Seguro
            </button>
        </div>
      </div>

      <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic px-2">Caja de Hoy</h3>
      <div id="historialPagos" class="space-y-3">
         <div class="animate-pulse text-center p-10 text-[8px] font-black uppercase text-slate-700 tracking-[0.5em]">Sincronizando...</div>
      </div>
    </div>
  `;

  // --- LÓGICA DE CONTROL ---
  const metodoSelect = document.getElementById("metodo");
  const phoneField = document.getElementById("phoneField");
  const btn = document.getElementById("procesarPago");

  metodoSelect.onchange = () => {
    phoneField.classList.toggle("hidden", metodoSelect.value !== "nequi");
    btn.innerText = metodoSelect.value === "efectivo" ? "Registrar en Caja" : "Enviar Solicitud de Pago";
  };

  btn.onclick = async () => {
    const data = {
      ordenId: document.getElementById("ordenId").value.trim().toUpperCase(),
      monto: Number(document.getElementById("monto").value),
      metodo: metodoSelect.value,
      celular: document.getElementById("celular").value,
      tokenEmpresa: configEmpresa.mp_access_token // Importante: Se usa el token del taller
    };

    if (!data.ordenId || data.monto <= 0) return alert("⚠️ Verifica Orden y Monto");
    
    if (data.metodo !== "efectivo" && !data.tokenEmpresa) {
        hablar("Error. El taller no ha configurado sus credenciales de Mercado Pago.");
        return alert("❌ Error: Debes configurar tu Access Token en el módulo de Configuración.");
    }

    btn.innerText = "⚡ PROCESANDO PROTOCOLO...";
    btn.disabled = true;

    try {
      // 1. REGISTRO EN CONTABILIDAD (Ingreso Inmediato)
      await addDoc(collection(db, "empresas", empresaId, "contabilidad"), {
        concepto: `COBRO ORDEN ${data.ordenId}`,
        monto: data.monto,
        tipo: "ingreso",
        metodo: data.metodo,
        creadoEn: serverTimestamp()
      });

      // 2. REGISTRO EN LOG DE PAGOS
      await addDoc(collection(db, "pagos"), {
        empresaId,
        ...data,
        creadoEn: serverTimestamp(),
        estado: data.metodo === "efectivo" ? "completado" : "pendiente_verificacion"
      });

      // 3. ACTUALIZAR ORDEN A "PAGADA"
      // Buscamos la orden por su número o placa
      const qOrden = query(collection(db, "empresas", empresaId, "ordenes"), where("numero", "==", data.ordenId));
      const snapOrden = await getDocs(qOrden);
      
      for (const s of snapOrden.docs) {
        await updateDoc(doc(db, "empresas", empresaId, "ordenes", s.id), { 
            estado: "PAGADA",
            fechaPago: serverTimestamp()
        });
      }

      hablar(`Excelente. Recaudo por ${data.monto} pesos procesado correctamente.`);
      alert("✅ Transacción Exitosa");
      cargarPagos(); // Recargar lista sin refrescar página completa
      
      // Limpiar campos
      document.getElementById("ordenId").value = "";
      document.getElementById("monto").value = "";
      btn.disabled = false;
      btn.innerText = "Iniciar Cobro Seguro";

    } catch (e) {
      console.error(e);
      btn.innerText = "ERROR - REINTENTAR";
      btn.disabled = false;
    }
  };

  async function cargarPagos() {
    const hist = document.getElementById("historialPagos");
    const q = query(collection(db, "pagos"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"), limit(10));
    const snap = await getDocs(q);
    
    if (snap.empty) {
        hist.innerHTML = `<p class="text-center p-10 text-[9px] text-slate-700 font-black uppercase italic">Sin movimientos hoy</p>`;
        return;
    }

    hist.innerHTML = snap.docs.map(d => {
        const p = d.data();
        return `
            <div class="bg-[#0f172a] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center animate-fade-in">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center text-emerald-500">
                        <i class="fas ${p.metodo === 'efectivo' ? 'fa-money-bill-wave' : 'fa-mobile-alt'} text-xs"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-white uppercase tracking-tighter">ORDEN ${p.ordenId}</p>
                        <p class="text-[7px] text-slate-500 font-bold uppercase">${p.metodo}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs font-black text-emerald-400">${fmt(p.monto)}</p>
                    <p class="text-[6px] text-slate-600 font-black uppercase">Sincronizado</p>
                </div>
            </div>
        `;
    }).join("");
  }

  function fmt(v) { return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v); }
  cargarPagos();
}
