/**
 * 🦾 NEXUS-X PAY_HUB V20.2 - "THE TERMINATOR: QUANTUM EDITION"
 * Reingeniería Total: Anticipos Multiestado + Auditoría PUC + Bold Real
 * @author William Jeffry Urquijo Cubillos & Gemini AI
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
    <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-700 pb-40 bg-[#010409] min-h-screen text-white">
      
      <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b-2 border-cyan-500/20 pb-12 relative overflow-hidden">
          <div class="absolute -top-10 -left-10 text-[120px] font-black opacity-5 italic select-none orbitron">PAY</div>
          <div class="relative z-10">
              <h1 class="orbitron text-6xl md:text-8xl font-black italic tracking-tighter glow-text-cyan">
                PAY<span class="text-cyan-400">_NEXUS</span><span class="text-red-600">.X</span>
              </h1>
              <p class="text-[10px] orbitron tracking-[0.6em] text-cyan-500 font-black uppercase mt-4 italic">Neural Payment Terminal // SAP-2030 Audit</p>
          </div>
          <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/10 flex items-center gap-8 shadow-2xl backdrop-blur-xl">
              <div class="h-4 w-4 bg-emerald-500 rounded-full animate-ping"></div>
              <div>
                <p class="text-[11px] orbitron font-black text-white uppercase italic">Node_Status: <span class="text-emerald-400">ONLINE</span></p>
                <p class="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Protocolo: ANTICIPO_FLOW_V2</p>
              </div>
          </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div class="lg:col-span-7 space-y-10">
              <div class="bg-[#0d1117] p-12 rounded-[4.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div class="bg-black/40 p-10 rounded-[3rem] border border-white/5 focus-within:border-cyan-500 transition-all group">
                          <label class="text-[10px] text-slate-500 font-black orbitron mb-4 block tracking-widest uppercase italic">PLATE_IDENTIFIER</label>
                          <div class="flex items-center gap-6">
                              <input id="refIn" placeholder="BCE670" class="bg-transparent border-none outline-none text-6xl font-black text-white w-full uppercase orbitron" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-20 w-20 bg-cyan-500 text-black rounded-[1.5rem] hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                                  <i class="fas fa-satellite-dish text-2xl"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/40 p-10 rounded-[3rem] border border-white/5">
                          <label class="text-[10px] text-slate-500 font-black orbitron mb-4 block tracking-widest uppercase italic">INPUT_AMOUNT_COP</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-6xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="ot-selector-container" class="hidden mt-10 p-8 bg-cyan-500/5 border-2 border-dashed border-cyan-500/20 rounded-[3rem] animate-in slide-in-from-right-10">
                      <p class="text-[11px] orbitron text-cyan-400 font-black mb-6 tracking-widest uppercase italic">Misiones detectadas (Seleccione para abono):</p>
                      <div id="ot-list" class="grid grid-cols-1 gap-4"></div>
                  </div>

                  <div id="display-info" class="hidden mt-10 p-12 bg-white/5 border border-white/10 rounded-[3.5rem] animate-in zoom-in">
                      <div class="flex flex-col md:flex-row justify-between items-center gap-8">
                          <div class="space-y-2">
                              <p id="txtCliente" class="text-white font-black orbitron text-3xl uppercase italic tracking-tighter">CLIENTE</p>
                              <div class="flex gap-4">
                                <span id="txtMision" class="px-4 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] orbitron font-bold rounded-full uppercase italic">OT_XXXX</span>
                                <span id="txtEstado" class="px-4 py-1 bg-amber-500/10 text-amber-500 text-[10px] orbitron font-bold rounded-full uppercase italic">ESTADO</span>
                              </div>
                          </div>
                          <div class="text-right">
                              <p class="text-[10px] text-red-500 font-black orbitron mb-3 uppercase tracking-widest italic">Saldo_Pendiente</p>
                              <p id="label-monto" class="text-7xl font-black text-white orbitron italic tracking-tighter">$ 0</p>
                          </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
                      <button id="btnCobrarBold" class="group bg-cyan-500 text-black py-12 rounded-[2.5rem] font-black orbitron text-xs uppercase tracking-widest shadow-2xl hover:bg-white transition-all flex flex-col items-center justify-center gap-3">
                          <span class="text-2xl italic">PASARELA BOLD</span>
                          <i class="fas fa-bolt text-xl"></i>
                      </button>
                      <button id="btnEfectivo" class="bg-white/5 text-slate-400 border border-white/10 py-12 rounded-[2.5rem] font-black orbitron text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all flex flex-col items-center justify-center gap-3">
                          <span class="text-2xl italic">REGISTRO CASH</span>
                          <i class="fas fa-cash-register text-xl"></i>
                      </button>
                  </div>

                  <button id="btnSendLink" class="w-full mt-10 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 py-10 rounded-[3rem] font-black orbitron text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-6 hover:bg-emerald-500 hover:text-black transition-all">
                      LINK DE PAGO WHATSAPP <i class="fab fa-whatsapp text-2xl"></i>
                  </button>
              </div>
          </div>

          <div class="lg:col-span-5 space-y-10">
              <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <h4 class="text-[12px] font-black text-cyan-500 orbitron tracking-[0.5em] mb-12 uppercase italic border-b border-white/5 pb-4">AUDITORÍA TERMINATOR_X</h4>
                  <div class="space-y-12">
                      <div class="flex items-start gap-8">
                          <i class="fas fa-shield-alt text-emerald-500 text-2xl"></i>
                          <div>
                              <p class="text-white orbitron text-[10px] font-black mb-2 uppercase">Anticipo de Seguridad</p>
                              <p class="text-xs text-slate-500 leading-relaxed italic">Habilitado para capturar capital en Diagnóstico, Ingreso o Taller.</p>
                          </div>
                      </div>
                      <div class="flex items-start gap-8">
                          <i class="fas fa-file-invoice-dollar text-cyan-500 text-2xl"></i>
                          <div>
                              <p class="text-white orbitron text-[10px] font-black mb-2 uppercase">Sincronización P&G</p>
                              <p class="text-xs text-slate-500 leading-relaxed italic">Cada ingreso genera automáticamente un asiento en el Balance Élite.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
    `;

    setupEventListeners();
  };

  const setupEventListeners = () => {
    document.getElementById("btnFetchOrden").onclick = buscarMisionesPlaca;
    document.getElementById("btnCobrarBold").onclick = () => procesarPago(NEXUS_CONFIG.PAYMENT_METHODS.CARD);
    document.getElementById("btnEfectivo").onclick = () => procesarPago(NEXUS_CONFIG.PAYMENT_METHODS.CASH);
    document.getElementById("btnSendLink").onclick = enviarLinkPago;
    if(state?.placa) setTimeout(() => buscarMisionesPlaca(), 500);
  };

  async function buscarMisionesPlaca() {
    const placa = document.getElementById("refIn").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(!placa) return;

    try {
        Swal.fire({ title: 'Sincronizando Radar...', background: '#010409', color: '#fff', didOpen: () => Swal.showLoading() });
        
        // Búsqueda real sin filtros de estado restrictivos
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", placa));
        const snap = await getDocs(q);

        if(snap.empty) return Swal.fire('NEXUS_REPORT', `Unidad ${placa} no encontrada.`, 'error');

        // Filtro: Solo misiones que no estén entregadas o anuladas
        const ordenes = snap.docs.map(d => ({id: d.id, ...d.data()}))
                            .filter(o => !['ENTREGADO', 'ANULADO'].includes(o.estado));

        if(ordenes.length === 0) return Swal.fire('AUDITORÍA', 'Esta unidad no tiene misiones activas.', 'info');

        if(ordenes.length === 1) {
            seleccionarOT(ordenes[0]);
            Swal.close();
        } else {
            const container = document.getElementById("ot-selector-container");
            const list = document.getElementById("ot-list");
            list.innerHTML = "";
            container.classList.remove("hidden");
            ordenes.forEach(ot => {
                const btn = document.createElement("button");
                btn.className = "w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-cyan-500 hover:text-black transition-all flex justify-between items-center group";
                btn.innerHTML = `<div><p class="orbitron text-[11px] font-black uppercase">OT-${ot.id.slice(-6)}</p><p class="text-[9px] opacity-60 italic uppercase">${ot.estado}</p></div><p class="orbitron font-black text-xl">$ ${Number(ot.costos_totales?.saldo_pendiente || 0).toLocaleString()}</p>`;
                btn.onclick = () => { seleccionarOT(ot); container.classList.add("hidden"); };
                list.appendChild(btn);
            });
            Swal.close();
            hablar("Múltiples misiones. Seleccione el objetivo.");
        }
    } catch (e) {
        Swal.fire('ERROR', 'Fallo de enlace satelital.', 'error');
    }
  }

  function seleccionarOT(ot) {
    ordenActiva = ot;
    const saldo = Number(ot.costos_totales?.saldo_pendiente || 0);
    document.getElementById("display-info").classList.remove("hidden");
    document.getElementById("txtCliente").innerText = ot.cliente.toUpperCase();
    document.getElementById("txtMision").innerText = `OT-${ot.id.slice(-6)}`;
    document.getElementById("txtEstado").innerText = ot.estado;
    document.getElementById("label-monto").innerText = saldo > 0 ? `$ ${saldo.toLocaleString()}` : "ANTICIPO";
    document.getElementById("montoIn").value = saldo > 0 ? Math.round(saldo) : "";
    document.getElementById("montoIn").focus();
    hablar(`Misión vinculada en fase de ${ot.estado}.`);
  }

  async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    const saldoActual = Number(ordenActiva?.costos_totales?.saldo_pendiente || 0);

    if(!ordenActiva || monto <= 0) return Swal.fire('AVISO', 'Seleccione misión y monto válido.', 'warning');

    try {
        if(metodo === NEXUS_CONFIG.PAYMENT_METHODS.CARD) {
            ejecutarPasarelaBold(monto);
        } else {
            ejecutarLiquidacionNexus(monto, metodo, saldoActual);
        }
    } catch (e) {
        Swal.fire('ERROR', 'Fallo crítico en la inyección de capital.', 'error');
    }
  }

  async function ejecutarPasarelaBold(monto) {
    const empSnap = await getDoc(doc(db, "usuarios", empresaId));
    const boldKey = empSnap.data()?.bold_api_key;
    if(!boldKey) return Swal.fire('API_ERROR', 'No hay llave Bold configurada.', 'error');

    const bold = new window.BoldCheckout({
        orderId: `NEXUS-${ordenActiva.placa}-${Date.now().toString().slice(-4)}`,
        amount: monto, currency: 'COP',
        description: `ABONO_OT_${ordenActiva.id.slice(-5)}`,
        apiKey: boldKey,
        redirectionUrl: window.location.origin
    });
    bold.open();
  }

  async function ejecutarLiquidacionNexus(monto, metodo, saldoActual) {
    Swal.fire({ title: 'Ejecutando Asiento PUC...', didOpen: () => Swal.showLoading(), background: '#010409' });

    const nuevoSaldo = saldoActual - monto;
    const ordenRef = doc(db, "ordenes", ordenActiva.id);

    // 🦾 ACTUALIZACIÓN DUAL DE SALDOS
    await updateDoc(ordenRef, {
        "finanzas.anticipo_cliente": increment(monto),
        "costos_totales.saldo_pendiente": increment(-monto),
        // Solo pasar a LISTO si ya no es Diagnóstico/Ingreso y el saldo se salda
        "estado": (nuevoSaldo <= 1 && !['DIAGNOSTICO', 'INGRESO'].includes(ordenActiva.estado)) ? 'LISTO' : ordenActiva.estado,
        "updatedAt": serverTimestamp(),
        "bitacora_ia": (ordenActiva.bitacora_ia || "") + `\n[SISTEMA]: Pago de $${monto.toLocaleString()} vía ${metodo}.`
    });

    // ASIENTO CONTABLE PARA FINANZAS ELITE
    await addDoc(collection(db, "contabilidad"), {
        empresaId, 
        referencia: ordenActiva.placa, 
        total: monto,
        tipo: 'INGRESO_OT',
        metodo: metodo,
        concepto: `PAGO OT-${ordenActiva.id.slice(-5)} | ${ordenActiva.cliente}`,
        fecha: serverTimestamp(),
        tecnico_id: ordenActiva.tecnico_id || 'N/A'
    });

    hablar("Capital inyectado exitosamente.");
    enviarVoucherConfirmacion(monto, nuevoSaldo);
    Swal.fire({ icon: 'success', title: 'TRANSACCIÓN EXITOSA', background: '#010409', color: '#fff' });
    buscarMisionesPlaca();
  }

  async function enviarVoucherConfirmacion(monto, saldoRestante) {
    if(!ordenActiva.telefono) return;
    const msg = `*✅ NEXUS-X: COMPROBANTE DE PAGO*%0A%0A*Abono:* $${monto.toLocaleString()}%0A*Vehículo:* ${ordenActiva.placa.toUpperCase()}%0A*Orden:* OT-${ordenActiva.id.slice(-6)}%0A*Saldo Pendiente:* $${Math.max(0, saldoRestante).toLocaleString()}`;
    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${msg}`, '_blank');
  }

  async function enviarLinkPago() {
    if(!ordenActiva) return;
    const link = `https://bold.co/pay/${empresaId}`;
    const msg = `*🛰️ LINK DE PAGO NEXUS-X*%0A*${ordenActiva.cliente}*, puedes pagar aquí: ${link}`;
    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${msg}`, '_blank');
  }

  renderLayout();
}
