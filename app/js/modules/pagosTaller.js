/**
 * pagosTaller.js - TallerPRO360 V10.7.1 💳
 * Módulo: Terminal de Recaudo Nexus-X (Bold Core)
 */
import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { procesarSalidaInventario } from "../services/stockService.js";

export default async function pagosTaller(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  
  // Renderizado de Interfaz 2030
  container.innerHTML = `
    <div class="p-4 bg-[#020617] min-h-screen text-white animate-in fade-in duration-500">
      <div class="flex justify-between items-center mb-8">
          <div>
              <h1 class="text-2xl font-black italic tracking-tighter uppercase">NEXUS <span class="text-emerald-400">TERMINAL</span></h1>
              <p class="text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em]">Protocolo de Recaudo Activo</p>
          </div>
          <div class="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span class="text-[7px] font-black text-emerald-400 uppercase tracking-widest">● Sistema Online</span>
          </div>
      </div>

      <div class="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl shadow-2xl">
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block">Placa del Vehículo</label>
                    <input id="placaIn" placeholder="ABC123" class="bg-transparent border-none outline-none text-base font-black text-emerald-400 w-full uppercase">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block">Valor Total</label>
                    <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-base font-black text-white w-full">
                </div>
            </div>

            <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block">Pasarela de Cobro</label>
                <select id="metodoIn" class="bg-transparent border-none outline-none text-xs font-black text-emerald-400 w-full uppercase cursor-pointer">
                    <option value="efectivo">💵 Efectivo (Caja)</option>
                    <option value="bold">⚡ Bold (Tarjeta/PSE/Nequi)</option>
                </select>
            </div>

            <button id="btnCobrar" class="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                Ejecutar Cierre de Orden
            </button>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById("btnCobrar");

  btn.onclick = async () => {
    const placa = document.getElementById("placaIn").value.trim().toUpperCase();
    const monto = Number(document.getElementById("montoIn").value);
    const metodo = document.getElementById("metodoIn").value;

    if (!placa || monto <= 0) return alert("Error: Placa o Monto inválidos.");

    btn.disabled = true;
    btn.innerText = "Sincronizando Stock...";

    try {
      // 1. Localizar Orden y Procesar Inventario
      const q = query(collection(db, `empresas/${empresaId}/ordenes`), where("placa", "==", placa), where("estado", "==", "EN_TALLER"));
      const snap = await getDocs(q);

      if (!snap.empty) {
          const docRef = snap.docs[0];
          const d = docRef.data();
          if (d.items) await procesarSalidaInventario(empresaId, d.items);
          await updateDoc(doc(db, `empresas/${empresaId}/ordenes`, docRef.id), { estado: "PAGADA", fechaPago: serverTimestamp() });
      }

      // 2. Lógica de Pago Digital (Bold)
      if (metodo === 'bold') {
          const emp = await getDoc(doc(db, "empresas", empresaId));
          const key = emp.data().bold_api_key; 
          
          if(!key) throw new Error("API Key de Bold no configurada en este taller.");

          const bold = new BoldCheckout({
              orderId: `BOL-${placa}-${Date.now()}`,
              amount: monto,
              currency: 'COP',
              description: `Pago Taller - Placa ${placa}`,
              apiKey: key, 
              redirectionUrl: 'https://tallerpro360.vercel.app/app/success.html'
          });
          bold.open();
      }

      // 3. Registro en Contabilidad del Taller
      await addDoc(collection(db, `empresas/${empresaId}/contabilidad`), {
          concepto: `Recaudo Orden ${placa}`,
          monto,
          tipo: "ingreso",
          metodo,
          fecha: serverTimestamp()
      });

      alert("Protocolo Completado. Orden cerrada con éxito.");
      location.reload();

    } catch (err) {
      console.error(err);
      alert("Nexus Error: " + err.message);
      btn.disabled = false;
      btn.innerText = "Reintentar Protocolo";
    }
  };
}
