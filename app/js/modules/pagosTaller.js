/**
 * pagosTaller.js - TallerPRO360 V15.0.0 💳
 * Terminal de Recaudo Nexus-X: Bold Integration & Stock Intelligence
 * Protocolo Starlink: Sincronización en Tiempo Real
 */
import { 
  collection, addDoc, updateDoc, doc, query, where, 
  getDocs, serverTimestamp, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function pagosTaller(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  
  // RENDERIZADO DE INTERFAZ AERO-SPATIAL
  container.innerHTML = `
    <div class="p-6 bg-[#020617] min-h-screen text-white animate-in fade-in duration-700 pb-40 font-sans">
      
      <header class="max-w-xl mx-auto flex justify-between items-center mb-12">
          <div class="space-y-1">
              <h1 class="orbitron text-2xl font-black italic tracking-tighter uppercase text-white">
                NEXUS <span class="text-emerald-400">TERMINAL</span>
              </h1>
              <p class="text-[7px] text-emerald-500/50 font-black uppercase tracking-[0.5em] italic">Secure Payment Protocol v15.0</p>
          </div>
          <div class="relative">
              <div class="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
              <div class="relative w-12 h-12 bg-black border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                  <i class="fas fa-microchip text-emerald-400 text-lg"></i>
              </div>
          </div>
      </header>

      <div class="max-w-xl mx-auto">
          <div class="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-[3rem] p-1 shadow-2xl backdrop-blur-3xl">
              <div class="bg-[#020617]/90 rounded-[2.9rem] p-8">
                  
                  <div class="grid grid-cols-2 gap-4 mb-6">
                      <div class="bg-black/60 p-5 rounded-3xl border border-white/5 focus-within:border-emerald-500/40 transition-all group">
                          <label class="text-[7px] text-emerald-500 font-black uppercase mb-2 block tracking-widest italic">Identificador Placa</label>
                          <input id="placaIn" placeholder="ABC123" class="bg-transparent border-none outline-none text-2xl font-black text-white w-full uppercase orbitron placeholder:text-slate-800">
                      </div>
                      <div class="bg-black/60 p-5 rounded-3xl border border-white/5 focus-within:border-emerald-500/40 transition-all">
                          <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block tracking-widest italic">Monto de Recaudo</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-2xl font-black text-white w-full orbitron">
                      </div>
                  </div>

                  <div class="bg-black/60 p-6 rounded-3xl border border-white/5 mb-10 relative group">
                      <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block tracking-widest italic">Canal de Transmisión (Método)</label>
                      <select id="metodoIn" class="bg-transparent border-none outline-none text-[11px] font-black text-emerald-400 w-full uppercase appearance-none cursor-pointer orbitron">
                          <option value="efectivo">💵 Efectivo (Caja Local)</option>
                          <option value="bold">⚡ Bold (Link / Datáfono Digital)</option>
                      </select>
                      <i class="fas fa-chevron-down absolute right-6 bottom-7 text-[8px] text-emerald-500/50"></i>
                  </div>

                  <button id="btnCobrar" class="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-7 rounded-[2.5rem] font-black orbitron text-[10px] uppercase tracking-[0.4em] shadow-[0_15px_40px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3">
                      Ejecutar Cierre <i class="fas fa-bolt"></i>
                  </button>
              </div>
          </div>
          
          <div class="mt-8 flex justify-center gap-6">
              <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span class="text-[7px] text-slate-500 font-black uppercase tracking-widest">Encripción SSL Activa</span>
              </div>
              <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                  <span class="text-[7px] text-slate-500 font-black uppercase tracking-widest">Nexus-X Cloud Sync</span>
              </div>
          </div>
      </div>
    </div>

    <style>
        .orbitron { font-family: 'Orbitron', sans-serif; }
    </style>
  `;

  const btn = document.getElementById("btnCobrar");

  btn.onclick = async () => {
    const placa = document.getElementById("placaIn").value.trim().toUpperCase();
    const monto = Number(document.getElementById("montoIn").value);
    const metodo = document.getElementById("metodoIn").value;

    if (!placa || monto <= 0) {
        return alert("⚠️ SISTEMA: Ingrese Placa y Monto válidos para continuar.");
    }

    btn.disabled = true;
    btn.innerHTML = `SINCRONIZANDO CON EL NODO... <i class="fas fa-sync fa-spin"></i>`;

    try {
      // 1. LOCALIZAR ORDEN ACTIVA (RENGINERÍA DE BÚSQUEDA)
      const q = query(
        collection(db, "empresas", empresaId, "ordenes"), 
        where("placa", "==", placa), 
        where("estado", "==", "EN_TALLER")
      );
      
      const snap = await getDocs(q);

      if (snap.empty) {
          throw new Error(`No se encontró ninguna orden activa para la placa: ${placa}`);
      }
      
      const docOrden = snap.docs[0];
      const idOrden = docOrden.id;

      // 2. LÓGICA SEGÚN MÉTODO DE PAGO
      if (metodo === 'bold') {
          // Extraer la llave del taller desde su propia configuración Core
          const empSnap = await getDoc(doc(db, "empresas", empresaId));
          const boldKey = empSnap.data()?.bold_api_key;
          
          if(!boldKey) {
              throw new Error("El taller no ha configurado su API KEY de Bold en el menú Configuración.");
          }

          const bold = new BoldCheckout({
              orderId: `NXS-${placa}-${Date.now().toString().slice(-6)}`,
              amount: monto,
              currency: 'COP',
              description: `Servicio TallerPRO360 - Placa ${placa}`,
              apiKey: boldKey,
              redirectionUrl: 'https://tallerpro360.vercel.app/app/success.html',
              metadata: { 
                  empresaId, 
                  placa, 
                  idOrden,
                  engine: "Nexus-X-V15" 
              }
          });
          
          btn.innerHTML = `ABRIENDO GATEWAY SEGURO...`;
          bold.open();
          btn.disabled = false;
          btn.innerHTML = `EJECUTAR CIERRE <i class="fas fa-bolt"></i>`;

      } else {
          // CIERRE EFECTIVO (Caja Local)
          await updateDoc(doc(db, "empresas", empresaId, "ordenes", idOrden), { 
            estado: "PAGADA", 
            metodoPago: "EFECTIVO",
            valorPagado: monto,
            fechaPago: serverTimestamp() 
          });
          
          // Registro contable automatizado
          await addDoc(collection(db, "empresas", empresaId, "contabilidad"), {
              concepto: `Recaudo Efectivo: Orden ${placa}`,
              monto: monto,
              tipo: "ingreso",
              metodo: "efectivo",
              fecha: serverTimestamp(),
              ordenId: idOrden
          });

          btn.innerHTML = `ORDEN FINALIZADA <i class="fas fa-check"></i>`;
          btn.classList.replace("bg-emerald-500", "bg-cyan-500");
          
          setTimeout(() => {
              alert(`🚀 ¡Éxito! La orden ${placa} ha sido cerrada y el ingreso registrado.`);
              location.reload();
          }, 1000);
      }

    } catch (err) {
      console.error("CRITICAL ERROR [TERMINAL]:", err);
      alert("❌ ERROR DE ENLACE: " + err.message);
      btn.disabled = false;
      btn.innerHTML = `REINTENTAR PROTOCOLO`;
    }
  };
}
