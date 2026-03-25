/**
 * pagosTaller.js - TallerPRO360 V11.0.0 💳
 * Terminal de Recaudo Nexus-X: Bold Integration Core
 */
import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function pagosTaller(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  
  container.innerHTML = `
    <div class="p-6 bg-[#020617] min-h-screen text-white animate-in fade-in duration-500 pb-32">
      <header class="flex justify-between items-center mb-10">
          <div>
              <h1 class="text-3xl font-black italic tracking-tighter uppercase text-white">NEXUS <span class="text-emerald-400">TERMINAL</span></h1>
              <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.4em] italic">Protocolo de Recaudo Starlink</p>
          </div>
          <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <i class="fas fa-satellite-dish text-emerald-400 animate-pulse"></i>
          </div>
      </header>

      <div class="max-w-xl mx-auto space-y-6">
          <div class="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
              <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-black/40 p-5 rounded-[1.5rem] border border-white/5 focus-within:border-emerald-500/50 transition-all">
                      <label class="text-[8px] text-emerald-500 font-black uppercase mb-2 block tracking-widest">Placa</label>
                      <input id="placaIn" placeholder="ABC123" class="bg-transparent border-none outline-none text-xl font-black text-white w-full uppercase">
                  </div>
                  <div class="bg-black/40 p-5 rounded-[1.5rem] border border-white/5 focus-within:border-emerald-500/50 transition-all">
                      <label class="text-[8px] text-slate-500 font-black uppercase mb-2 block tracking-widest">Valor COP</label>
                      <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-xl font-black text-white w-full">
                  </div>
              </div>

              <div class="bg-black/40 p-5 rounded-[1.5rem] border border-white/5 mb-8">
                  <label class="text-[8px] text-slate-500 font-black uppercase mb-2 block tracking-widest">Método de Recaudo</label>
                  <select id="metodoIn" class="bg-transparent border-none outline-none text-sm font-black text-emerald-400 w-full uppercase appearance-none cursor-pointer">
                      <option value="efectivo">💵 Efectivo en Caja</option>
                      <option value="bold">⚡ Bold (Datáfono / Link)</option>
                  </select>
              </div>

              <button id="btnCobrar" class="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all">
                  Sincronizar y Cerrar Orden
              </button>
          </div>
      </div>
    </div>
  `;

  document.getElementById("btnCobrar").onclick = async () => {
    const btn = document.getElementById("btnCobrar");
    const placa = document.getElementById("placaIn").value.trim().toUpperCase();
    const monto = Number(document.getElementById("montoIn").value);
    const metodo = document.getElementById("metodoIn").value;

    if (!placa || monto <= 0) return alert("Datos insuficientes.");

    btn.disabled = true;
    btn.innerText = "ACCEDIENDO A NEXUS CORE...";

    try {
      const q = query(collection(db, `empresas/${empresaId}/ordenes`), where("placa", "==", placa), where("estado", "==", "EN_TALLER"));
      const snap = await getDocs(q);

      if (snap.empty) throw new Error("No hay órdenes activas para esta placa.");
      
      const docOrden = snap.docs[0];
      const idOrden = docOrden.id;

      if (metodo === 'bold') {
          const empDoc = await getDoc(doc(db, "empresas", empresaId));
          const apiKey = empDoc.data()?.bold_api_key;
          
          if(!apiKey) throw new Error("El taller no ha configurado su Bold API Key.");

          const bold = new BoldCheckout({
              orderId: `NEXUS-${placa}-${Date.now()}`,
              amount: monto,
              currency: 'COP',
              description: `Servicio Técnico Placa ${placa}`,
              apiKey: apiKey,
              integritySignature: "", // Opcional según tu nivel de seguridad Bold
              redirectionUrl: 'https://tallerpro360.vercel.app/app/success.html',
              metadata: { empresaId, placa, idOrden } // DATOS PARA EL WEBHOOK
          });
          bold.open();
      } else {
          // EFECTIVO: Cierre directo
          await updateDoc(doc(db, `empresas/${empresaId}/ordenes`, idOrden), { 
            estado: "PAGADA", 
            metodoPago: "EFECTIVO",
            fechaPago: serverTimestamp() 
          });
          
          await addDoc(collection(db, `empresas/${empresaId}/contabilidad`), {
              concepto: `Recaudo Efectivo - Placa ${placa}`,
              monto, tipo: "ingreso", metodo: "efectivo", fecha: serverTimestamp()
          });

          alert("Cierre de Caja Exitoso.");
          location.reload();
      }
    } catch (err) {
      alert("Error: " + err.message);
      btn.disabled = false;
      btn.innerText = "REINTENTAR";
    }
  };
}
