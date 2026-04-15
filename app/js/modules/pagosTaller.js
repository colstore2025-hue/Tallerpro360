/**
 * pagosTaller.js - NEXUS-X PAY_HUB V4.5 💳 "THE TERMINATOR"
 * Integración Real Bold + Selector de OT Inteligente + Blindaje de Deuda
 * @author William Jeffry Urquijo Cubillos
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, increment, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { initNexusHelp } from './modules/nexus-help-engine.js';

// Cuando cargue el documento o la vista:
initNexusHelp('ordenes'); // Le pasas el ID del módulo actual

export default async function pagosTaller(container, state) {
  const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
  let ordenActiva = null;

  const renderLayout = () => {
    container.innerHTML = `
    <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-700 pb-40 bg-[#010409] min-h-screen">
      
      <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-white/5 pb-12">
          <div class="space-y-2">
              <h1 class="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-white">
                PAY<span class="text-cyan-400">_NEXUS</span><span class="text-red-500">.X</span>
              </h1>
              <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic italic">Neural Payment Terminal // TallerPRO360</p>
          </div>
          <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6 shadow-glow-cyan">
              <div class="h-3 w-3 bg-emerald-500 rounded-full animate-ping"></div>
              <div class="text-left">
                <p class="text-[10px] orbitron font-black text-white uppercase tracking-widest">SISTEMA: OPERATIVO 2030</p>
                <p class="text-[8px] text-slate-500 font-bold uppercase">Nodo: Charlotte-Ibague</p>
              </div>
          </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div class="lg:col-span-7 space-y-8">
              <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="bg-black/60 p-10 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500 transition-all group">
                          <label class="text-[9px] text-slate-500 font-black orbitron mb-4 block tracking-[0.3em] uppercase italic italic">ID_VEHÍCULO (PLACA)</label>
                          <div class="flex items-center gap-4">
                              <input id="refIn" placeholder="BCE670" class="bg-transparent border-none outline-none text-5xl font-black text-white w-full uppercase orbitron" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-16 w-16 bg-cyan-500 text-black rounded-2xl hover:scale-110 transition-transform shadow-glow-cyan">
                                  <i class="fas fa-satellite-dish text-xl"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/60 p-10 rounded-[2.5rem] border border-white/5">
                          <label class="text-[9px] text-slate-500 font-black orbitron mb-4 block tracking-[0.3em] uppercase italic italic">MONTO_ABONO (COP)</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-5xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="ot-selector-container" class="hidden mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-[2.5rem] animate-in slide-in-from-right-4">
                      <p class="text-[9px] orbitron text-cyan-500 font-black mb-4 tracking-widest">DETECTADAS MÚLTIPLES MISIONES ACTIVAS:</p>
                      <div id="ot-list" class="grid grid-cols-1 gap-3"></div>
                  </div>

                  <div id="display-info" class="hidden mt-10 p-10 bg-white/5 border border-white/10 rounded-[3rem] animate-in slide-in-from-top-10">
                      <div class="flex justify-between items-center">
                          <div>
                              <p id="txtCliente" class="text-white font-black orbitron text-xl uppercase tracking-tighter italic">CARGANDO...</p>
                              <p id="txtMision" class="text-[10px] text-cyan-400 font-bold uppercase mt-2 tracking-widest italic"></p>
                          </div>
                          <div class="text-right">
                              <p class="text-[9px] text-red-500 font-black orbitron mb-2 uppercase tracking-widest">Saldo_Pendiente</p>
                              <p id="label-monto" class="text-5xl font-black text-white orbitron italic italic">$ 0</p>
                          </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                      <button id="btnCobrarBold" class="group bg-cyan-500 text-black py-10 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-5">
                          PASARELA BOLD <i class="fas fa-bolt group-hover:scale-125 transition-transform"></i>
                      </button>
                      <button id="btnEfectivo" class="bg-white/5 text-slate-400 border border-white/10 py-10 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all">
                          REGISTRO CASH <i class="fas fa-cash-register ml-3"></i>
                      </button>
                  </div>

                  <button id="btnSendLink" class="w-full mt-8 bg-gradient-to-r from-emerald-600 to-emerald-400 text-black py-8 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-[0.4em] shadow-lg flex items-center justify-center gap-5 hover:scale-[1.02] transition-all">
                      ENVIAR SMART-LINK PAGO <i class="fab fa-whatsapp text-xl"></i>
                  </button>
              </div>
          </div>

          <div class="lg:col-span-5 space-y-8">
              <div class="bg-gradient-to-br from-[#0d1117] to-black p-12 rounded-[4rem] border border-white/5 shadow-2xl">
                  <h4 class="text-[11px] font-black text-cyan-500 orbitron tracking-[0.5em] mb-10 uppercase italic italic">AUDITORÍA AEGIS_PRO</h4>
                  <ul class="space-y-8">
                      <li class="flex items-start gap-6">
                          <i class="fas fa-shield-alt text-emerald-500 text-xl mt-1"></i>
                          <p class="text-xs text-slate-400 leading-relaxed"><b>Protocolo Anti-Exceso:</b> El sistema bloquea abonos que superen la deuda de la OT.</p>
                      </li>
                      <li class="flex items-start gap-6">
                          <i class="fas fa-check-double text-cyan-500 text-xl mt-1"></i>
                          <p class="text-xs text-slate-400 leading-relaxed"><b>Confirmación Instantánea:</b> Generación de voucher digital post-pago para WhatsApp.</p>
                      </li>
                  </ul>
              </div>
          </div>
      </div>
    </div>
    `;

    document.getElementById("btnFetchOrden").onclick = buscarMisionesPlaca;
    document.getElementById("btnCobrarBold").onclick = () => procesarPago('BOLD');
    document.getElementById("btnEfectivo").onclick = () => procesarPago('EFECTIVO');
    document.getElementById("btnSendLink").onclick = enviarLinkPago;
  };

  // --- 🛰️ LOGICA 1: SELECTOR DE OT INTELIGENTE ---
  async function buscarMisionesPlaca() {
    const placa = document.getElementById("refIn").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(!placa) return;

    try {
        Swal.fire({ title: 'Escaneando Red Nexus...', didOpen: () => Swal.showLoading(), background: '#010409', color: '#fff' });

        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", placa));
        const snap = await getDocs(q);

        if(snap.empty) {
            return Swal.fire('NEXUS-X', `Sin misiones para ${placa}.`, 'error');
        }

        const ordenes = snap.docs.map(d => ({id: d.id, ...d.data()}))
                            .filter(o => (o.costos_totales?.saldo_pendiente || 0) > 0)
                            .sort((a,b) => b.updatedAt - a.updatedAt);

        if(ordenes.length === 0) {
            return Swal.fire('COMPLETADO', 'Este vehículo no tiene saldos pendientes.', 'success');
        }

        if(ordenes.length === 1) {
            seleccionarOT(ordenes[0]);
            Swal.close();
        } else {
            // MOSTRAR SELECTOR
            const selectorContainer = document.getElementById("ot-selector-container");
            const otList = document.getElementById("ot-list");
            otList.innerHTML = "";
            selectorContainer.classList.remove("hidden");

            ordenes.forEach(ot => {
                const btn = document.createElement("button");
                btn.className = "w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-cyan-500 hover:text-black transition-all group flex justify-between items-center";
                btn.innerHTML = `
                    <div>
                        <p class="orbitron text-[10px] font-black italic italic">OT: ${ot.id.slice(-6)}</p>
                        <p class="text-[9px] uppercase opacity-70">${ot.estado} - ${new Date(ot.updatedAt?.seconds*1000).toLocaleDateString()}</p>
                    </div>
                    <p class="orbitron font-black">$ ${ot.costos_totales.saldo_pendiente.toLocaleString()}</p>
                `;
                btn.onclick = () => {
                    seleccionarOT(ot);
                    selectorContainer.classList.add("hidden");
                };
                otList.appendChild(btn);
            });
            Swal.close();
            hablar("Se han detectado múltiples misiones. Seleccione la OT a liquidar.");
        }
    } catch (e) {
        Swal.fire('ERROR', 'Fallo de enlace satelital.', 'error');
    }
  }

  function seleccionarOT(ot) {
    ordenActiva = ot;
    document.getElementById("display-info").classList.remove("hidden");
    document.getElementById("txtCliente").innerText = ot.cliente.toUpperCase();
    document.getElementById("txtMision").innerText = `MISIÓN ACTIVA: OT-${ot.id.slice(-6)}`;
    document.getElementById("label-monto").innerText = `$ ${ot.costos_totales.saldo_pendiente.toLocaleString()}`;
    document.getElementById("montoIn").value = ot.costos_totales.saldo_pendiente;
    hablar(`Orden ${ot.id.slice(-6)} vinculada.`);
  }

  // --- 💳 LOGICA 2: PROCESO CON BLINDAJE DE DEUDA ---
  async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    const saldoActual = Number(ordenActiva?.costos_totales?.saldo_pendiente || 0);

    if(!ordenActiva || monto <= 0) return Swal.fire('AVISO', 'Seleccione una misión válida.', 'warning');

    // 🛡️ BLINDAJE DE DESBORDAMIENTO
    if(monto > saldoActual) {
        hablar("Error de seguridad. El monto supera la deuda actual.");
        return Swal.fire({
            icon: 'warning',
            title: 'EXCESO DE ABONO',
            text: `El saldo máximo permitido es $${saldoActual.toLocaleString()}.`,
            background: '#0d1117', color: '#fff'
        });
    }

    try {
        if(metodo === 'BOLD') {
            const empSnap = await getDoc(doc(db, "empresas", empresaId));
            const boldKey = empSnap.data()?.bold_api_key;
            
            const bold = new window.BoldCheckout({
                orderId: `NXS-${ordenActiva.placa}-${Date.now().toString().slice(-4)}`,
                amount: monto,
                currency: 'COP',
                description: `TallerPRO360 - OT:${ordenActiva.id.slice(-5)}`,
                apiKey: boldKey,
                redirectionUrl: 'https://tallerpro360.vercel.app/success'
            });
            bold.open();
        } else {
            Swal.fire({ title: 'Inyectando Capital...', didOpen: () => Swal.showLoading(), background: '#010409' });

            const nuevoSaldo = saldoActual - monto;
            const ordenRef = doc(db, "ordenes", ordenActiva.id);

            // A. Actualización OT
            await updateDoc(ordenRef, {
                "finanzas.anticipo_cliente": increment(monto),
                "costos_totales.saldo_pendiente": increment(-monto),
                "estado": (nuevoSaldo <= 0) ? "LISTO" : ordenActiva.estado,
                "pagoStatus": (nuevoSaldo <= 0) ? "PAGADO" : "ABONADO",
                "updatedAt": serverTimestamp()
            });

            // B. Auditoría Aegis
            await addDoc(collection(db, "contabilidad"), {
                empresaId, referencia: ordenActiva.placa, monto, tipo: 'INGRESO', metodo: 'EFECTIVO',
                concepto: `ABONO OT-${ordenActiva.id.slice(-5)}`, createdAt: serverTimestamp()
            });

            hablar("Transacción finalizada. Generando voucher.");
            
            // C. VOUCHER DE CONFIRMACIÓN
            await enviarVoucherConfirmacion(monto, nuevoSaldo);

            Swal.fire({ icon: 'success', title: 'PAGO REGISTRADO', background: '#0d1117', color: '#fff' });
            buscarMisionesPlaca(); // Recargar
        }
    } catch (e) {
        Swal.fire('ERROR', 'Fallo en la inyección de datos.', 'error');
    }
  }

  // --- 📱 LOGICA 3: VOUCHER DIGITAL WHATSAPP ---
  async function enviarVoucherConfirmacion(monto, saldoRestante) {
    if(!ordenActiva.telefono) return;

    const mensaje = `*✅ NEXUS-X: COMPROBANTE DE PAGO*%0A%0A` +
                    `Recibimos un abono de: *$${monto.toLocaleString()}*%0A` +
                    `Para el vehículo: *${ordenActiva.placa.toUpperCase()}*%0A` +
                    `Referencia OT: *${ordenActiva.id.slice(-6)}*%0A%0A` +
                    `💰 *Saldo Restante:* $${saldoRestante.toLocaleString()}%0A%0A` +
                    `_Gracias por confiar en TallerPRO360_`;

    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
  }

  async function enviarLinkPago() {
    if(!ordenActiva) return Swal.fire('AVISO', 'Primero enlace una misión.', 'warning');
    const linkPago = `https://bold.co/pay/tallerpro360`; 
    const mensaje = `*🛰️ LINK DE PAGO SATELITAL*%0A%0A` +
                    `Hola *${ordenActiva.cliente.toUpperCase()}*, puedes pagar tu abono de *$${Number(document.getElementById("montoIn").value).toLocaleString()}* aquí:%0A%0A` +
                    `🔗 ${linkPago}%0A%0A` +
                    `_Misión: ${ordenActiva.placa}_`;
    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
  }

  renderLayout();
  if(state?.placa) setTimeout(() => buscarMisionesPlaca(), 500);
}
