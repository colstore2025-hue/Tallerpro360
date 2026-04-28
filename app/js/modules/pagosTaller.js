/**
 * pagosTaller.js - NEXUS-X V20.4 💳 "THE STABILIZER"
 * Objetivo: Sincronización total entre Contabilidad, Órdenes y Caja.
 * Basado en Auditoría de Firestore para placas UYT564 y BCE670.
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, increment, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function pagosTaller(container, state) {
  const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
  let ordenActiva = null;

  const renderLayout = () => {
    container.innerHTML = `
    <div class="p-6 lg:p-12 animate-in fade-in duration-700 pb-40 bg-[#010409] min-h-screen text-white">
      <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-cyan-500/20 pb-12">
          <div>
              <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white">
                PAY<span class="text-cyan-400">_NEXUS</span><span class="text-red-600">.X</span>
              </h1>
              <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic">Operación de Estabilización // Sincronización Firestore</p>
          </div>
          <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 shadow-lg shadow-cyan-500/5">
              <div class="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></div>
              <p class="text-[9px] orbitron font-black text-slate-400 uppercase tracking-widest">Contabilidad.js Link: <span class="text-emerald-400">ONLINE</span></p>
          </div>
      </header>

      <div class="max-w-4xl mx-auto space-y-8">
          <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500 transition-all">
                      <label class="text-[8px] text-slate-500 font-black orbitron mb-3 block uppercase tracking-widest">ID_VEHÍCULO (PLACA)</label>
                      <div class="flex items-center gap-4">
                          <input id="refIn" placeholder="UYT564" class="bg-transparent border-none outline-none text-4xl font-black text-white w-full uppercase orbitron" value="${state?.placa || ''}">
                          <button id="btnFetchOrden" class="h-14 w-14 bg-cyan-500 text-black rounded-2xl hover:scale-110 transition-all shadow-lg">
                              <i class="fas fa-satellite-dish"></i>
                          </button>
                      </div>
                  </div>
                  <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5">
                      <label class="text-[8px] text-emerald-500/70 font-black orbitron mb-3 block uppercase tracking-widest">MONTO ABONO (COP)</label>
                      <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-4xl font-black text-emerald-400 w-full orbitron">
                  </div>
              </div>

              <div id="ot-selector-container" class="hidden mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-3xl">
                  <p class="text-[8px] orbitron text-cyan-500 font-black mb-3 uppercase tracking-widest">Seleccione Misión:</p>
                  <div id="ot-list" class="grid grid-cols-1 gap-2"></div>
              </div>

              <div id="display-info" class="hidden mt-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] animate-in slide-in-from-bottom-5">
                  <div class="flex justify-between items-center">
                      <div>
                          <p id="txtCliente" class="text-white font-black orbitron text-xl uppercase italic"></p>
                          <p id="txtMision" class="text-[9px] text-cyan-400 font-bold uppercase mt-1 tracking-widest"></p>
                      </div>
                      <div class="text-right">
                          <p class="text-[8px] text-red-500 font-black orbitron mb-1 uppercase tracking-widest">SALDO EN ÓRDENES</p>
                          <p id="label-monto" class="text-4xl font-black text-white orbitron">$ 0</p>
                      </div>
                  </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                  <button id="btnEfectivo" class="bg-emerald-500 text-black py-8 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-widest hover:bg-white transition-all">
                      REGISTRAR CASH <i class="fas fa-cash-register ml-2"></i>
                  </button>
                  <button id="btnCobrarBold" class="bg-white/5 text-cyan-400 border border-cyan-500/30 py-8 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all">
                      PASARELA BOLD <i class="fas fa-bolt ml-2"></i>
                  </button>
              </div>
          </div>
      </div>
    </div>
    `;

    document.getElementById("btnFetchOrden").onclick = buscarMisionesPlaca;
    document.getElementById("btnEfectivo").onclick = () => procesarPago("efectivo");
    document.getElementById("btnCobrarBold").onclick = () => procesarPago("bold");
  };

  async function buscarMisionesPlaca() {
    const placa = document.getElementById("refIn").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(!placa) return;

    try {
        Swal.fire({ title: 'Escaneando Red Nexus...', didOpen: () => Swal.showLoading(), background: '#010409', color: '#fff' });
        
        // Búsqueda en colección raíz según V17/V20
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", placa));
        const snap = await getDocs(q);

        if(snap.empty) return Swal.fire('NEXUS-X', `No hay misiones para ${placa}.`, 'error');

        const ordenes = snap.docs.map(d => ({id: d.id, ...d.data()}))
                            .filter(o => !['ENTREGADO', 'ANULADO'].includes(o.estado));

        if(ordenes.length === 1) {
            seleccionarOT(ordenes[0]);
            Swal.close();
        } else {
            renderSelector(ordenes);
            Swal.close();
        }
    } catch (e) { Swal.fire('ERROR', 'Fallo de enlace satelital.', 'error'); }
  }

  function renderSelector(ordenes) {
    const container = document.getElementById("ot-selector-container");
    const list = document.getElementById("ot-list");
    list.innerHTML = "";
    container.classList.remove("hidden");
    ordenes.forEach(ot => {
        const btn = document.createElement("button");
        btn.className = "w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left flex justify-between hover:bg-cyan-500/20 transition-all";
        btn.innerHTML = `<span class="orbitron text-[10px]">OT-${ot.id.slice(-6)} [${ot.estado}]</span> <b class="text-emerald-400 font-black">$${(ot.costos_totales?.saldo_pendiente || 0).toLocaleString()}</b>`;
        btn.onclick = () => { seleccionarOT(ot); container.classList.add("hidden"); };
        list.appendChild(btn);
    });
  }

  function seleccionarOT(ot) {
    ordenActiva = ot;
    const saldo = ot.costos_totales?.saldo_pendiente || 0;
    document.getElementById("display-info").classList.remove("hidden");
    document.getElementById("txtCliente").innerText = ot.cliente.toUpperCase();
    document.getElementById("txtMision").innerText = `MODO: ${ot.estado} | REF: ${ot.id.slice(-6)}`;
    document.getElementById("label-monto").innerText = `$ ${saldo.toLocaleString()}`;
    document.getElementById("montoIn").value = "";
    document.getElementById("montoIn").focus();
    hablar(`Orden ${ot.id.slice(-6)} vinculada.`);
  }

  async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    if(!ordenActiva || monto <= 0) return Swal.fire('ALERTA', 'Monto no válido.', 'warning');

    try {
        Swal.fire({ title: 'Inyectando Capital...', didOpen: () => Swal.showLoading(), background: '#010409' });

        const ordenRef = doc(db, "ordenes", ordenActiva.id);

        // 🛡️ ACCIÓN 1: ACTUALIZAR ORDEN (Sincronización con ordenes.js)
        // Escribimos en costos_totales.anticipo que es lo que lee tu tabla de ordenes.js
        await updateDoc(ordenRef, {
            "costos_totales.anticipo": increment(monto), 
            "costos_totales.saldo_pendiente": increment(-monto),
            "updatedAt": serverTimestamp()
        });

        // 💰 ACCIÓN 2: REGISTRO EN CONTABILIDAD (Sincronización con contabilidad.js)
        // Usamos la palabra 'monto' en lugar de 'total' para que sume en tu Dashboard
        await addDoc(collection(db, "contabilidad"), {
            empresaId,
            referencia: ordenActiva.placa,
            monto: monto, // <--- PALABRA CLAVE SEGÚN TUS FOTOS
            concepto: `ABONO OT-${ordenActiva.id.slice(-5)} - ${ordenActiva.cliente}`,
            tipo: "ingreso", // <--- PALABRA CLAVE V17
            metodo: metodo,
            fecha: serverTimestamp()
        });

        hablar("Misión cumplida. Capital ingresado y saldo actualizado.");
        Swal.fire('PAGO EXITOSO', `Abono de $${monto.toLocaleString()} registrado.`, 'success');
        
        // Reset y recarga
        ordenActiva = null;
        document.getElementById("refIn").value = "";
        document.getElementById("display-info").classList.add("hidden");
        document.getElementById("montoIn").value = "";

    } catch (e) { 
        console.error(e);
        Swal.fire('ERROR', 'Fallo en la inyección de datos.', 'error'); 
    }
  }

  renderLayout();
}
