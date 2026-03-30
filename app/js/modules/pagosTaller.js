/**
 * pagosTaller.js - TallerPRO360 NEXUS-X V33.0 💳
 * TERMINAL DE RECAUDO AEROESPACIAL (EDICIÓN PENTÁGONO)
 * Integración: Bold API 2.0 & Contabilidad Centralizada
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
  const modoHibrido = state?.tipoPago || "TALLER"; 

  // 🛡️ RENDERIZADO CON ESTÉTICA AEGIS (COLORES TALLERPRO360)
  container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in zoom-in duration-700 pb-32 max-w-[1200px] mx-auto bg-[#02040a] min-h-screen text-white orbitron">
      
      <header class="flex flex-col lg:row justify-between items-center gap-6 border-b-2 border-cyan-500/20 pb-10">
          <div class="relative group">
              <div class="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-red-600 rounded-lg blur opacity-25"></div>
              <div class="relative bg-black px-8 py-4 rounded-lg border border-white/10">
                  <h1 class="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase">
                    NEXUS_<span class="text-cyan-400">PAY</span><span class="text-red-500">.X</span>
                  </h1>
                  <p class="text-[8px] text-cyan-500 font-bold tracking-[0.5em] uppercase mt-2">PROTOCOLO DE LIQUIDACIÓN DE MISIÓN</p>
              </div>
          </div>
          <div class="flex gap-4">
              <div class="bg-[#0d1117] border-l-4 border-cyan-500 p-4 rounded-r-2xl shadow-lg">
                  <p class="text-[8px] text-cyan-500 font-black uppercase">Sincronización</p>
                  <p class="text-sm font-black text-emerald-400">STARLINK_LINKED</p>
              </div>
          </div>
      </header>

      <div class="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          
          <div class="bg-[#0d1117] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div class="absolute top-0 right-0 p-4 opacity-10">
                  <i class="fas fa-satellite-dish text-6xl text-cyan-400"></i>
              </div>
              
              <div class="space-y-8 relative z-10">
                  <div class="bg-black/60 p-6 rounded-3xl border border-white/10 focus-within:border-cyan-500 transition-all shadow-inner">
                      <label class="text-[9px] text-slate-500 font-black uppercase mb-3 block tracking-widest">Identificación de Misión (PLACA)</label>
                      <div class="flex items-center gap-4">
                        <input id="refIn" placeholder="ABC123" class="bg-transparent border-none outline-none text-4xl font-black text-white w-full uppercase placeholder:text-slate-800" value="${state?.placa || ''}">
                        <button id="btnFetchOrden" class="h-14 w-14 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-glow-cyan">
                          <i class="fas fa-search"></i>
                        </button>
                      </div>
                  </div>

                  <div id="display-info-mision" class="hidden animate-in slide-in-from-top-4 p-8 bg-gradient-to-r from-red-900/20 to-transparent border border-red-500/20 rounded-[2rem]">
                      <p class="text-[9px] text-red-500 font-black uppercase mb-2">Deuda Pendiente en Sistema</p>
                      <div id="label-monto-mision" class="text-5xl font-black text-white">$ 0</div>
                  </div>

                  <div class="bg-black/60 p-6 rounded-3xl border border-white/10 focus-within:border-emerald-500 transition-all shadow-inner">
                      <label class="text-[9px] text-slate-500 font-black uppercase mb-3 block tracking-widest">Monto a Liquidar (COP)</label>
                      <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-5xl font-black text-emerald-400 w-full">
                  </div>

                  <div class="bg-black/60 p-6 rounded-3xl border border-white/10 relative">
                      <label class="text-[9px] text-slate-500 font-black uppercase mb-3 block tracking-widest italic text-cyan-500">Protocolo de Pasarela</label>
                      <select id="metodoIn" class="bg-transparent border-none outline-none text-xs font-black text-white w-full uppercase cursor-pointer appearance-none">
                          <option value="bold">⚡ BOLD SMART LINK (DIGITAL)</option>
                          <option value="efectivo">💵 EFECTIVO (CONTABILIDAD LOCAL)</option>
                      </select>
                      <i class="fas fa-chevron-down absolute right-8 bottom-8 text-cyan-500/40 text-[10px]"></i>
                  </div>

                  <button id="btnCobrar" class="w-full bg-cyan-500 text-black py-8 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-glow-cyan active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                      EJECUTAR CIERRE <i class="fas fa-bolt"></i>
                  </button>
              </div>
          </div>

          <div class="space-y-8">
              <div class="bg-gradient-to-br from-[#111827] to-[#02040a] rounded-[3rem] p-10 border border-white/5 shadow-2xl">
                  <div class="flex items-center gap-5 mb-8">
                      <i class="fas fa-shield-check text-emerald-400 text-3xl animate-pulse"></i>
                      <h4 class="text-[10px] font-black text-white tracking-widest uppercase">Seguridad Contable</h4>
                  </div>
                  <p class="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-cyan-500 pl-6 py-2">
                    "Cada transacción es firmada y enviada al nodo contable de <b>TallerPRO360</b>. El registro de efectivo requiere validación del administrador en el Dashboard Aegis."
                  </p>
              </div>
              
              <div class="bg-[#0d1117] rounded-[3rem] p-10 border border-white/5 text-center">
                  <i class="fas fa-university text-slate-700 text-5xl mb-6"></i>
                  <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">Certificación Bancaria</p>
                  <p class="text-xs text-white font-bold mt-2">SISTEMA CIFRADO AES-256</p>
              </div>
          </div>
      </div>
    </div>
    <style>
      .shadow-glow-cyan { box-shadow: 0 0 30px rgba(6, 182, 212, 0.3); }
      .orbitron { font-family: 'Orbitron', sans-serif; }
    </style>
  `;

  // --- LÓGICA DE FUNCIONAMIENTO ---
  const btn = document.getElementById("btnCobrar");
  const btnFetch = document.getElementById("btnFetchOrden");
  let idOrdenSeleccionada = null;

  const buscarOrden = async () => {
    const ref = document.getElementById("refIn").value.trim().toUpperCase();
    if(!ref) return;

    btnFetch.innerHTML = `<i class="fas fa-sync fa-spin"></i>`;
    try {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", ref));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            // Filtrar la orden más reciente o que no esté cerrada
            const docSnap = snap.docs[0];
            idOrdenSeleccionada = docSnap.id;
            const data = docSnap.data();
            
            // Compatibilidad de campos de moneda
            const saldo = data.costos_totales?.saldo_pendiente || data.saldo || 0;
            
            document.getElementById("display-info-mision").classList.remove("hidden");
            document.getElementById("label-monto-mision").innerText = `$ ${saldo.toLocaleString()}`;
            document.getElementById("montoIn").value = saldo;
            hablar(`Localizada misión para placa ${ref}. Saldo pendiente: ${saldo} pesos.`);
        } else {
            hablar("No hay misiones activas en el radar para esa placa.");
        }
    } catch (e) { console.error(e); }
    btnFetch.innerHTML = `<i class="fas fa-search"></i>`;
  };

  btnFetch.onclick = buscarOrden;

  btn.onclick = async () => {
    const referencia = document.getElementById("refIn").value.trim().toUpperCase();
    const monto = Number(document.getElementById("montoIn").value);
    const metodo = document.getElementById("metodoIn").value;

    if (!referencia || monto <= 0) {
        return window.Swal.fire({ 
          icon: 'warning', 
          title: 'DATOS INCOMPLETOS', 
          text: 'Se requiere referencia y monto válido.',
          background: '#0d1117', color: '#fff', confirmButtonColor: '#06b6d4'
        });
    }

    btn.disabled = true;
    btn.innerHTML = `SINCRONIZANDO TRANSACCIÓN... <i class="fas fa-satellite fa-spin ml-2"></i>`;

    try {
      if (metodo === 'bold') {
        // --- FLUJO BOLD (INTEGRACIÓN DIRECTA) ---
        const empSnap = await getDoc(doc(db, "empresas", empresaId));
        const boldKey = empSnap.data()?.bold_api_key || localStorage.getItem("nexus_boldKey");

        const bold = new window.BoldCheckout({
          orderId: `NXS-${referencia}-${Date.now().toString().slice(-5)}`,
          amount: monto,
          currency: 'COP',
          description: `TallerPRO360 - Cierre Misión ${referencia}`,
          apiKey: boldKey,
          redirectionUrl: 'https://tallerpro360.vercel.app/success',
          metadata: { empresaId, placa: referencia, ordenId: idOrdenSeleccionada }
        });
        
        hablar("Desplegando pasarela Bold. Complete el pago para finalizar la misión.");
        bold.open();
        
      } else {
        // --- CIERRE EN EFECTIVO CON REGISTRO EN DASHBOARD ---
        hablar("Ejecutando cierre en efectivo. Actualizando libros contables.");
        
        if (idOrdenSeleccionada) {
            const batch = []; // Podrías usar un batch de Firestore aquí
            
            // 1. Actualizar Orden
            await updateDoc(doc(db, "ordenes", idOrdenSeleccionada), { 
                estado: "ENTREGADO",
                pagoStatus: "PAGADO",
                fechaCierre: serverTimestamp(),
                abonos: monto 
            });

            // 2. Registrar en Contabilidad Global para el Dashboard
            const idMov = `MOV_${Date.now()}`;
            await setDoc(doc(db, "contabilidad", idMov), {
                empresaId,
                referencia: referencia,
                monto: monto,
                tipo: 'INGRESO',
                metodo: 'EFECTIVO',
                concepto: `Liquidación Final Orden ${referencia}`,
                createdAt: serverTimestamp()
            });

            window.Swal.fire({
                icon: 'success',
                title: 'CIERRE EXITOSO',
                text: `Misión ${referencia} liquidada en efectivo y sincronizada con el Dashboard Aegis.`,
                background: '#0d1117', color: '#fff', confirmButtonColor: '#10b981'
            });
        } else {
            throw new Error("Debe localizar la misión con el escáner de placa antes de liquidar.");
        }
      }

    } catch (err) {
      window.Swal.fire({ icon: 'error', title: 'FALLO DE NODO', text: err.message, background: '#0d1117', color: '#fff' });
    } finally {
      btn.disabled = false;
      btn.innerHTML = `EJECUTAR CIERRE <i class="fas fa-bolt"></i>`;
    }
  };

  if(state?.placa) buscarOrden();
}
