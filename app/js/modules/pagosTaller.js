/**
 * pagosTaller.js - TallerPRO360 NEXUS-X V18.0 "SUPERNOVA" 💳
 * Terminal de Recaudo Aeroespacial: Bold API 2.0 & Liquidación Automática.
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  const empresaId = localStorage.getItem("nexus_empresaId");
  const modoHibrido = state?.tipoPago || "TALLER"; 

  container.innerHTML = `
    <div class="p-6 bg-[#010409] min-h-screen text-white animate-in zoom-in duration-500 pb-40 font-sans">
      
      <header class="max-w-xl mx-auto flex justify-between items-center mb-12 border-b border-white/5 pb-8">
          <div class="space-y-2">
              <h1 class="orbitron text-3xl font-black italic tracking-tighter uppercase text-white">
                NEXUS_<span class="${modoHibrido === 'STARLINK_SaaS' ? 'text-cyan-400' : 'text-emerald-400'}">PAY</span>
              </h1>
              <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.4em] italic">
                Sincronización con Nodo Central Starlink
              </p>
          </div>
          <div class="h-14 w-14 bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-2xl flex items-center justify-center shadow-glow-emerald">
              <i class="fas ${modoHibrido === 'STARLINK_SaaS' ? 'fa-satellite text-cyan-400' : 'fa-credit-card text-emerald-400'} text-xl animate-pulse"></i>
          </div>
      </header>

      <div class="max-w-xl mx-auto space-y-6">
          <div class="bg-[#0d1117] border border-white/10 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden group">
              <div class="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[100px] rounded-full group-hover:bg-emerald-500/10 transition-all"></div>
              
              <div class="space-y-8 relative z-10">
                  <div class="grid grid-cols-1 gap-6">
                      <div class="bg-black/40 p-6 rounded-3xl border border-white/5 focus-within:border-emerald-500/50 transition-all">
                          <label class="text-[9px] text-slate-500 font-black uppercase mb-3 block tracking-widest">Referencia de Misión (PLACA / NIT)</label>
                          <div class="flex items-center gap-4">
                            <input id="refIn" placeholder="ABC123" class="bg-transparent border-none outline-none text-4xl font-black text-white w-full uppercase orbitron placeholder:text-slate-800" value="${state?.placa || ''}">
                            <button id="btnFetchOrden" class="h-12 w-12 bg-white/5 rounded-xl border border-white/10 hover:bg-emerald-500 hover:text-black transition-all"><i class="fas fa-search"></i></button>
                          </div>
                      </div>

                      <div id="display-info-mision" class="hidden animate-in slide-in-from-top-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                          <div class="flex justify-between items-center text-[10px] orbitron font-black uppercase">
                            <span class="text-slate-400">Deuda Pendiente:</span>
                            <span id="label-monto-mision" class="text-emerald-400 text-xl">$ 0</span>
                          </div>
                      </div>

                      <div class="bg-black/40 p-6 rounded-3xl border border-white/5 focus-within:border-emerald-500/50 transition-all">
                          <label class="text-[9px] text-slate-500 font-black uppercase mb-3 block tracking-widest">Monto a Liquidar ($)</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-5xl font-black text-white w-full orbitron">
                      </div>
                  </div>

                  <div class="bg-black/40 p-6 rounded-3xl border border-white/5 relative">
                      <label class="text-[9px] text-slate-500 font-black uppercase mb-3 block tracking-widest italic">Protocolo de Pago</label>
                      <select id="metodoIn" class="bg-transparent border-none outline-none text-xs font-black text-emerald-400 w-full uppercase cursor-pointer orbitron appearance-none">
                          <option value="bold">⚡ BOLD SMART LINK (DIGITAL)</option>
                          <option value="efectivo">💵 EFECTIVO (LIQUIDACIÓN LOCAL)</option>
                      </select>
                      <i class="fas fa-chevron-down absolute right-8 bottom-8 text-emerald-500/40 text-[10px]"></i>
                  </div>

                  <button id="btnCobrar" class="w-full bg-emerald-500 text-black py-8 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(16,185,129,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                      AUTORIZAR PAGO <i class="fas fa-shield-alt"></i>
                  </button>
              </div>
          </div>

          <div class="flex justify-between items-center px-8 text-slate-500">
              <div class="flex items-center gap-2">
                  <div class="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span class="text-[8px] orbitron font-black uppercase tracking-widest">Terminal Active</span>
              </div>
              <span class="text-[8px] orbitron font-black uppercase tracking-widest">v18.0 Supernova</span>
          </div>
      </div>
    </div>
  `;

  const btn = document.getElementById("btnCobrar");
  const btnFetch = document.getElementById("btnFetchOrden");
  let idOrdenSeleccionada = null;

  // ESCÁNER DE DEUDA EN TIEMPO REAL
  const buscarOrden = async () => {
    const ref = document.getElementById("refIn").value.trim().toUpperCase();
    if(!ref) return;

    btnFetch.innerHTML = `<i class="fas fa-sync fa-spin"></i>`;
    try {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", ref));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const data = snap.docs[0].data();
            idOrdenSeleccionada = snap.docs[0].id;
            const saldo = data.costos_totales?.saldo_pendiente || 0;
            
            document.getElementById("display-info-mision").classList.remove("hidden");
            document.getElementById("label-monto-mision").innerText = `$ ${saldo.toLocaleString()}`;
            document.getElementById("montoIn").value = saldo;
            hablar(`William, detectamos una deuda de ${saldo} pesos para la placa ${ref}`);
        } else {
            hablar("No encuentro misiones activas para esa referencia.");
        }
    } catch (e) { console.error(e); }
    btnFetch.innerHTML = `<i class="fas fa-search"></i>`;
  };

  btnFetch.onclick = buscarOrden;

  // LÓGICA DE COBRO Y CIERRE
  btn.onclick = async () => {
    const referencia = document.getElementById("refIn").value.trim().toUpperCase();
    const monto = Number(document.getElementById("montoIn").value);
    const metodo = document.getElementById("metodoIn").value;

    if (!referencia || monto <= 0) {
        return window.Swal.fire({ icon: 'error', title: 'DATOS INVÁLIDOS', text: 'Define referencia y monto mayor a cero.', background: '#0d1117', color: '#fff' });
    }

    btn.disabled = true;
    btn.innerHTML = `CONECTANDO AL SATÉLITE... <i class="fas fa-satellite-dish fa-spin ml-2"></i>`;

    try {
      if (metodo === 'bold') {
        const empSnap = await getDoc(doc(db, "empresas", empresaId));
        const boldKey = empSnap.data()?.bold_api_key || "TU_KEY_DEFAULT_AQUI";

        const bold = new window.BoldCheckout({
          orderId: `NXS-${referencia}-${Date.now().toString().slice(-4)}`,
          amount: monto,
          currency: 'COP',
          description: `Liquidación TallerPRO360 - ${referencia}`,
          apiKey: boldKey,
          redirectionUrl: 'https://tallerpro360.vercel.app/success',
          metadata: { empresaId, placa: referencia, tipo: "LIQUIDACION_ORDEN" }
        });
        
        hablar("Abriendo terminal digital Bold. Sigue las instrucciones en pantalla.");
        bold.open();
        
      } else {
        // --- CIERRE EN EFECTIVO CON PROTOCOLO CONTABLE ---
        hablar("Cerrando misión en efectivo. Generando registro contable.");
        
        if(idOrdenSeleccionada) {
            const ordenRef = doc(db, "ordenes", idOrdenSeleccionada);
            await updateDoc(ordenRef, { 
                estado: "LISTO", // Cambia a listo para entrega
                pagoStatus: "PAGADO",
                fechaCierre: serverTimestamp(),
                abonos: monto // Se registra el abono total
            });

            // Registro en Contabilidad Central (Punto 5)
            const idMov = `MOV_${Date.now()}`;
            await setDoc(doc(db, "contabilidad", idMov), {
                empresaId,
                referencia: referencia,
                monto: monto,
                tipo: 'INGRESO',
                metodo: 'EFECTIVO',
                concepto: `Liquidación Orden ${referencia}`,
                createdAt: serverTimestamp()
            });

            window.Swal.fire({
                icon: 'success',
                title: 'MISIÓN LIQUIDADA',
                text: `La orden ${referencia} ha sido cerrada exitosamente en el libro contable.`,
                background: '#0d1117', color: '#fff', confirmButtonColor: '#10b981'
            });
        } else {
            throw new Error("Primero busca la orden con el icono de la lupa.");
        }
      }

    } catch (err) {
      window.Swal.fire({ icon: 'error', title: 'FALLO DE NODO', text: err.message, background: '#0d1117', color: '#fff' });
    } finally {
      btn.disabled = false;
      btn.innerHTML = `AUTORIZAR PAGO <i class="fas fa-shield-alt"></i>`;
    }
  };

  // Auto-búsqueda si viene una placa desde el estado
  if(state?.placa) buscarOrden();
}
