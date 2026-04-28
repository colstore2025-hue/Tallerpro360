/**
 * pagosTaller.js - NEXUS-X PAY_HUB V20.3 💳 "THE REINFORCED TERMINATOR"
 * Restauración de Flujo de Anticipos + Sincronización Total Órdenes/Contabilidad
 * William Jeffry Urquijo Cubillos // Nexus-X Starlink
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
              <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white">
                PAY<span class="text-cyan-400">_NEXUS</span><span class="text-red-600">.X</span>
              </h1>
              <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic">Neural Payment Terminal // Flujo de Caja Maestro</p>
          </div>
          <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
              <div class="h-3 w-3 bg-emerald-500 rounded-full animate-ping"></div>
              <p class="text-[10px] orbitron font-black uppercase">Sincronización: <span class="text-emerald-400">ACTIVA</span></p>
          </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div class="lg:col-span-7 space-y-8">
              <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 shadow-2xl">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500 transition-all">
                          <label class="text-[9px] text-slate-500 font-black orbitron mb-4 block uppercase tracking-widest">PLACA / VEHÍCULO</label>
                          <div class="flex items-center gap-4">
                              <input id="refIn" placeholder="BCE670" class="bg-transparent border-none outline-none text-5xl font-black text-white w-full uppercase orbitron" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-16 w-16 bg-cyan-500 text-black rounded-2xl hover:scale-110 transition-all">
                                  <i class="fas fa-search text-xl"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5">
                          <label class="text-[9px] text-slate-500 font-black orbitron mb-4 block uppercase tracking-widest italic text-emerald-500">MONTO A INGRESAR (COP)</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-5xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="ot-selector-container" class="hidden mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-[2.5rem]">
                      <p class="text-[9px] orbitron text-cyan-500 font-black mb-4 uppercase">Misiones detectadas:</p>
                      <div id="ot-list" class="grid grid-cols-1 gap-3"></div>
                  </div>

                  <div id="display-info" class="hidden mt-10 p-10 bg-white/5 border border-white/10 rounded-[3rem] animate-in zoom-in">
                      <div class="flex justify-between items-center">
                          <div>
                              <p id="txtCliente" class="text-white font-black orbitron text-2xl uppercase italic tracking-tighter"></p>
                              <p id="txtMision" class="text-[10px] text-cyan-400 font-bold uppercase mt-2 tracking-widest italic"></p>
                          </div>
                          <div class="text-right">
                              <p class="text-[9px] text-red-500 font-black orbitron mb-2 uppercase tracking-widest">DEUDA ACTUAL</p>
                              <p id="label-monto" class="text-5xl font-black text-white orbitron italic">$ 0</p>
                          </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                      <button id="btnCobrarBold" class="bg-cyan-500 text-black py-10 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-4">
                          PASARELA BOLD <i class="fas fa-bolt"></i>
                      </button>
                      <button id="btnEfectivo" class="bg-white/5 text-slate-400 border border-white/10 py-10 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                          REGISTRO CASH <i class="fas fa-money-bill-wave ml-3"></i>
                      </button>
                  </div>
              </div>
          </div>

          <div class="lg:col-span-5">
              <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 h-full">
                  <h4 class="text-[11px] font-black text-cyan-500 orbitron tracking-[0.5em] mb-8 uppercase italic">CONTROL DE CAJA</h4>
                  <p class="text-xs text-slate-400 leading-relaxed italic">
                      <b>Nota de Flujo:</b> El sistema permite anticipos en cualquier estado. Los ingresos se verán reflejados en "Órdenes" (Sección Finanzas) y en el módulo de "Contabilidad" como ingreso operacional.
                  </p>
              </div>
          </div>
      </div>
    </div>
    `;

    document.getElementById("btnFetchOrden").onclick = buscarMisionesPlaca;
    document.getElementById("btnCobrarBold").onclick = () => procesarPago(NEXUS_CONFIG.PAYMENT_METHODS.CARD);
    document.getElementById("btnEfectivo").onclick = () => procesarPago(NEXUS_CONFIG.PAYMENT_METHODS.CASH);
  };

  async function buscarMisionesPlaca() {
    const placa = document.getElementById("refIn").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(!placa) return;

    try {
        Swal.fire({ title: 'Rastreando Unidad...', didOpen: () => Swal.showLoading(), background: '#010409', color: '#fff' });
        
        // ELIMINADO EL FILTRO DE SALDO > 0 para que aparezcan órdenes en diagnóstico
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", placa));
        const snap = await getDocs(q);

        if(snap.empty) return Swal.fire('SISTEMA', 'No hay órdenes activas para esta placa.', 'error');

        // Filtrar solo las que no están cerradas
        const ordenes = snap.docs.map(d => ({id: d.id, ...d.data()}))
                            .filter(o => !['ENTREGADO', 'ANULADO'].includes(o.estado));

        if(ordenes.length === 1) {
            seleccionarOT(ordenes[0]);
            Swal.close();
        } else {
            renderSelector(ordenes);
            Swal.close();
        }
    } catch (e) { Swal.fire('ERROR', 'Error de conexión Firebase.', 'error'); }
  }

  function renderSelector(ordenes) {
    const container = document.getElementById("ot-selector-container");
    const list = document.getElementById("ot-list");
    list.innerHTML = "";
    container.classList.remove("hidden");
    ordenes.forEach(ot => {
        const btn = document.createElement("button");
        btn.className = "w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left flex justify-between";
        btn.innerHTML = `<span class="orbitron text-xs">OT-${ot.id.slice(-6)} [${ot.estado}]</span> <b>$${(ot.costos_totales?.saldo_pendiente || 0).toLocaleString()}</b>`;
        btn.onclick = () => { seleccionarOT(ot); container.classList.add("hidden"); };
        list.appendChild(btn);
    });
  }

  function seleccionarOT(ot) {
    ordenActiva = ot;
    const saldo = ot.costos_totales?.saldo_pendiente || 0;
    document.getElementById("display-info").classList.remove("hidden");
    document.getElementById("txtCliente").innerText = ot.cliente.toUpperCase();
    document.getElementById("txtMision").innerText = `FASE ACTUAL: ${ot.estado} / ID: ${ot.id.slice(-6)}`;
    document.getElementById("label-monto").innerText = `$ ${saldo.toLocaleString()}`;
    document.getElementById("montoIn").value = saldo > 0 ? saldo : "";
    document.getElementById("montoIn").focus();
    hablar(`Orden vinculada para ingreso.`);
  }

  async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    if(!ordenActiva || monto <= 0) return Swal.fire('ALERTA', 'Ingresa un monto válido.', 'warning');

    try {
        Swal.fire({ title: 'Inyectando Capital...', didOpen: () => Swal.showLoading(), background: '#010409' });

        const ordenRef = doc(db, "ordenes", ordenActiva.id);
        const saldoActual = Number(ordenActiva.costos_totales?.saldo_pendiente || 0);

        // 🛡️ ACTUALIZACIÓN DE ORDEN: Usamos las dos rutas para asegurar compatibilidad
        await updateDoc(ordenRef, {
            "finanzas.anticipo_cliente": increment(monto), // Ruta nueva
            "costos_totales.anticipo": increment(monto),   // Ruta espejo para ordenes.js
            "costos_totales.saldo_pendiente": increment(-monto),
            "updatedAt": serverTimestamp(),
            "bitacora": (ordenActiva.bitacora || "") + `\n[${new Date().toLocaleDateString()}]: Recibido anticipo de $${monto} vía ${metodo}.`
        });

        // 💰 ASIENTO EN CONTABILIDAD
        await addDoc(collection(db, "contabilidad"), {
            empresaId,
            referencia: ordenActiva.placa,
            total: monto,
            tipo: 'INGRESO_OT',
            metodo: metodo,
            concepto: `ANTICIPO OT-${ordenActiva.id.slice(-5)} - ${ordenActiva.cliente}`,
            fecha: serverTimestamp()
        });

        Swal.fire('ÉXITO', 'Anticipo registrado en Caja y Orden.', 'success');
        buscarMisionesPlaca(); // Refrescar
    } catch (e) { Swal.fire('ERROR', 'Error en el proceso contable.', 'error'); }
  }

  renderLayout();
}
