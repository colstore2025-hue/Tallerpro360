/**
 * pagosTaller.js - TallerPRO360 NEXUS-X V17.0 💳
 * Terminal de Recaudo Híbrida: Bold Smart Integration & Starlink SaaS
 * Protocolo de Colección Raíz: Sincronización Global
 * @author William Jeffry Urquijo Cubillos
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";

export default async function pagosTaller(container, state) {
  const empresaId = localStorage.getItem("nexus_empresaId");
  const modoHibrido = state?.tipoPago || "TALLER"; // TALLER o STARLINK_SaaS

  // RENDERIZADO DE INTERFAZ NEXUS-X
  container.innerHTML = `
    <div class="p-6 bg-[#020617] min-h-screen text-white animate-in fade-in duration-700 pb-40 font-sans">
      
      <header class="max-w-xl mx-auto flex justify-between items-center mb-12">
          <div class="space-y-1">
              <h1 class="orbitron text-2xl font-black italic tracking-tighter uppercase text-white">
                NEXUS <span class="${modoHibrido === 'STARLINK_SaaS' ? 'text-cyan-400' : 'text-emerald-400'}">TERMINAL</span>
              </h1>
              <p class="text-[7px] text-slate-500 font-black uppercase tracking-[0.5em] italic">
                ${modoHibrido === 'STARLINK_SaaS' ? 'SaaS Subscription Protocol' : 'Secure Workshop Payment v17.0'}
              </p>
          </div>
          <div class="relative">
              <div class="absolute inset-0 ${modoHibrido === 'STARLINK_SaaS' ? 'bg-cyan-500/20' : 'bg-emerald-500/20'} blur-xl rounded-full"></div>
              <div class="relative w-12 h-12 bg-black border border-white/10 rounded-2xl flex items-center justify-center">
                  <i class="fas ${modoHibrido === 'STARLINK_SaaS' ? 'fa-satellite-dish text-cyan-400' : 'fa-bolt text-emerald-400'} text-lg"></i>
              </div>
          </div>
      </header>

      <div class="max-w-xl mx-auto">
          <div class="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-[3rem] p-1 shadow-2xl backdrop-blur-3xl">
              <div class="bg-[#020617]/90 rounded-[2.9rem] p-8">
                  
                  <div class="grid grid-cols-2 gap-4 mb-6">
                      <div class="bg-black/60 p-5 rounded-3xl border border-white/5 focus-within:border-emerald-500/40 transition-all group">
                          <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block tracking-widest italic">
                            ${modoHibrido === 'STARLINK_SaaS' ? 'ID Empresa / NIT' : 'Identificador Placa'}
                          </label>
                          <input id="refIn" placeholder="${modoHibrido === 'STARLINK_SaaS' ? 'EMP-001' : 'ABC123'}" 
                                 class="bg-transparent border-none outline-none text-2xl font-black text-white w-full uppercase orbitron placeholder:text-slate-800"
                                 value="${modoHibrido === 'STARLINK_SaaS' ? empresaId : ''}">
                      </div>
                      <div class="bg-black/60 p-5 rounded-3xl border border-white/5 focus-within:border-emerald-500/40 transition-all">
                          <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block tracking-widest italic">Monto de Recaudo</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-2xl font-black text-white w-full orbitron">
                      </div>
                  </div>

                  <div class="bg-black/60 p-6 rounded-3xl border border-white/5 mb-10 relative group">
                      <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block tracking-widest italic">Canal de Transmisión</label>
                      <select id="metodoIn" class="bg-transparent border-none outline-none text-[11px] font-black text-emerald-400 w-full uppercase appearance-none cursor-pointer orbitron">
                          <option value="bold">⚡ Bold (Link / Datáfono Digital)</option>
                          ${modoHibrido === 'TALLER' ? '<option value="efectivo">💵 Efectivo (Caja Local)</option>' : ''}
                      </select>
                      <i class="fas fa-chevron-down absolute right-6 bottom-7 text-[8px] text-emerald-500/50"></i>
                  </div>

                  <button id="btnCobrar" class="w-full ${modoHibrido === 'STARLINK_SaaS' ? 'bg-cyan-500 shadow-cyan-500/30' : 'bg-emerald-500 shadow-emerald-500/30'} text-black py-7 rounded-[2.5rem] font-black orbitron text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                      EJECUTAR CIERRE <i class="fas fa-bolt"></i>
                  </button>
              </div>
          </div>
          
          <div class="mt-8 flex justify-center gap-6">
              <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span class="text-[7px] text-slate-500 font-black uppercase tracking-widest">Gateway Bold v2.0</span>
              </div>
              <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                  <span class="text-[7px] text-slate-500 font-black uppercase tracking-widest">Nexus-X Shield Active</span>
              </div>
          </div>
      </div>
    </div>
  `;

  const btn = document.getElementById("btnCobrar");

  btn.onclick = async () => {
    const referencia = document.getElementById("refIn").value.trim().toUpperCase();
    const monto = Number(document.getElementById("montoIn").value);
    const metodo = document.getElementById("metodoIn").value;

    if (!referencia || monto <= 0) {
        return window.Swal.fire('SISTEMA', 'Ingrese Referencia y Monto válidos.', 'warning');
    }

    btn.disabled = true;
    btn.innerHTML = `CONECTANDO CON EL NODO... <i class="fas fa-sync fa-spin"></i>`;

    try {
      if (modoHibrido === "TALLER") {
        // --- LÓGICA DE RECAUDO PARA EL TALLER (COBRO A CLIENTE) ---
        
        // 1. Localizar Orden en Colección Raíz
        const q = query(
          collection(db, "ordenes"), 
          where("empresaId", "==", empresaId),
          where("placa", "==", referencia), 
          where("estado", "!=", "FINALIZADO") // No cerrada aún
        );
        
        const snap = await getDocs(q);
        if (snap.empty) throw new Error(`Misión no encontrada para la placa: ${referencia}`);
        
        const docOrden = snap.docs[0];
        const idOrden = docOrden.id;

        if (metodo === 'bold') {
            // Obtener API KEY del taller (Cada taller tiene la suya)
            const empSnap = await getDoc(doc(db, "empresas", empresaId));
            const boldKey = empSnap.data()?.bold_api_key;
            
            if(!boldKey) throw new Error("API KEY de Bold no configurada en el taller.");

            const bold = new window.BoldCheckout({
                orderId: `NXS-${referencia}-${Date.now().toString().slice(-6)}`,
                amount: monto,
                currency: 'COP',
                description: `TallerPRO360 - Placa ${referencia}`,
                apiKey: boldKey,
                redirectionUrl: 'https://tallerpro360.vercel.app/success',
                metadata: { empresaId, placa: referencia, idOrden, tipo: "RECAUDO_TALLER" }
            });
            
            bold.open();
        } else {
            // Cierre Efectivo Directo
            const ordenRef = doc(db, "ordenes", idOrden);
            await updateDoc(ordenRef, { 
                estado: "FINALIZADO", 
                pagoStatus: "PAGADO",
                metodoPago: "EFECTIVO",
                montoFinal: monto,
                fechaCierre: serverTimestamp() 
            });

            // Registro en Libro Mayor (Contabilidad Raíz)
            await createDocument("contabilidad", {
                concepto: `CIERRE CAJA: ORDEN ${referencia}`,
                monto: monto,
                tipo: "ingreso",
                metodo: "efectivo",
                referencia: idOrden
            });

            window.Swal.fire('MISIÓN CUMPLIDA', `Orden ${referencia} cerrada en efectivo.`, 'success');
        }

      } else {
        // --- LÓGICA NEXUS STARLINK SaaS (COBRO DE SUSCRIPCIÓN) ---
        
        // Para cobrar la mensualidad de la app, usamos TU API KEY DE BOLD (Starlink)
        const STARLINK_BOLD_KEY = "LLAVE_MAESTRA_WILLIAMS_AQ"; // Sustituir por tu llave maestra

        const boldSaaS = new window.BoldCheckout({
            orderId: `SaaS-${referencia}-${Date.now().toString().slice(-6)}`,
            amount: monto,
            currency: 'COP',
            description: `Suscripción Mensual TallerPRO360 - Empresa ${referencia}`,
            apiKey: STARLINK_BOLD_KEY,
            redirectionUrl: 'https://tallerpro360.vercel.app/billing/success',
            metadata: { empresaId: referencia, tipo: "SUSCRIPCION_NEXUS" }
        });

        boldSaaS.open();
      }

      btn.disabled = false;
      btn.innerHTML = `EJECUTAR CIERRE <i class="fas fa-bolt"></i>`;

    } catch (err) {
      console.error("TERMINAL ERROR:", err);
      window.Swal.fire('ERROR DE ENLACE', err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `REINTENTAR PROTOCOLO`;
    }
  };
}
