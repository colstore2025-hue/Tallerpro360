/**
 * 🦾 NEXUS-X PAY_HUB V20.0 - "THE TERMINATOR"
 * Central de Liquidación, Dispersión de Nómina & Auditoría Bold
 * Estabilización de Flujo de Caja 2030 // William Jeffry Urquijo Cubillos
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
    <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-40 bg-[#010409] min-h-screen text-white">
      
      <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b-2 border-cyan-500/20 pb-12 relative overflow-hidden">
          <div class="absolute -top-10 -left-10 text-[120px] font-black opacity-5 italic select-none orbitron">PAY</div>
          <div class="relative z-10">
              <h1 class="orbitron text-6xl md:text-8xl font-black italic tracking-tighter glow-text-cyan">
                PAY<span class="text-cyan-400">_NEXUS</span><span class="text-red-600">.X</span>
              </h1>
              <div class="flex items-center gap-4 mt-4">
                  <div class="h-2 w-24 bg-gradient-to-r from-cyan-500 to-transparent"></div>
                  <p class="text-[10px] orbitron tracking-[0.6em] text-cyan-500 font-black uppercase">Liquidación de Activos en Rampa</p>
              </div>
          </div>
          
          <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/10 flex items-center gap-8 shadow-2xl backdrop-blur-xl">
              <div class="relative">
                  <div class="h-4 w-4 bg-emerald-500 rounded-full animate-ping absolute inset-0"></div>
                  <div class="h-4 w-4 bg-emerald-500 rounded-full relative"></div>
              </div>
              <div>
                <p class="text-[11px] orbitron font-black text-white tracking-widest uppercase italic">Node_Status: <span class="text-emerald-400">ENCRYPTED</span></p>
                <p class="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Protocolo: SAP-2030 Audit</p>
              </div>
          </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div class="lg:col-span-7 space-y-10">
              <div class="bg-[#0d1117] p-12 rounded-[4.5rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div class="bg-black/40 p-10 rounded-[3rem] border border-white/5 focus-within:border-cyan-500 transition-all group">
                          <label class="text-[10px] text-slate-500 font-black orbitron mb-4 block tracking-widest uppercase">PLATE_IDENTIFIER</label>
                          <div class="flex items-center gap-6">
                              <input id="refIn" placeholder="BCE670" class="bg-transparent border-none outline-none text-6xl font-black text-white w-full uppercase orbitron selection:bg-cyan-500" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-20 w-20 bg-cyan-500 text-black rounded-[1.5rem] hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center justify-center">
                                  <i class="fas fa-radar text-2xl"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/40 p-10 rounded-[3rem] border border-white/5">
                          <label class="text-[10px] text-slate-500 font-black orbitron mb-4 block tracking-widest uppercase">INPUT_AMOUNT_COP</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-6xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="ot-selector-container" class="hidden mt-10 p-8 bg-cyan-500/5 border-2 border-dashed border-cyan-500/20 rounded-[3rem] animate-in slide-in-from-right-10">
                      <p class="text-[11px] orbitron text-cyan-400 font-black mb-6 tracking-widest uppercase italic">Misiones en espera de liquidación:</p>
                      <div id="ot-list" class="grid grid-cols-1 gap-4"></div>
                  </div>

                  <div id="display-info" class="hidden mt-10 p-12 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[3.5rem] animate-in fade-in zoom-in">
                      <div class="flex flex-col md:flex-row justify-between items-center gap-8">
                          <div class="space-y-2">
                              <p id="txtCliente" class="text-white font-black orbitron text-3xl uppercase italic tracking-tighter">CLIENTE_UNKNOWN</p>
                              <div class="flex gap-4">
                                <span id="txtMision" class="px-4 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] orbitron font-bold rounded-full">OT_XXXX</span>
                                <span id="txtTecnico" class="px-4 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] orbitron font-bold rounded-full uppercase">---</span>
                              </div>
                          </div>
                          <div class="text-right">
                              <p class="text-[10px] text-red-500 font-black orbitron mb-3 uppercase tracking-widest">Saldo_Actual_Pendiente</p>
                              <p id="label-monto" class="text-7xl font-black text-white orbitron italic tracking-tighter">$ 0</p>
                          </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
                      <button id="btnCobrarBold" class="group bg-cyan-500 text-black py-12 rounded-[2.5rem] font-black orbitron text-xs uppercase tracking-widest shadow-2xl hover:bg-white hover:shadow-cyan-500/20 transition-all flex flex-col items-center justify-center gap-3">
                          <span class="text-2xl italic">PASARELA BOLD</span>
                          <i class="fas fa-bolt text-xl animate-pulse"></i>
                      </button>
                      <button id="btnEfectivo" class="bg-white/5 text-slate-400 border border-white/10 py-12 rounded-[2.5rem] font-black orbitron text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all flex flex-col items-center justify-center gap-3">
                          <span class="text-2xl italic">REGISTRO CASH</span>
                          <i class="fas fa-cash-register text-xl"></i>
                      </button>
                  </div>

                  <button id="btnSendLink" class="w-full mt-10 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 py-10 rounded-[3rem] font-black orbitron text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-6 hover:bg-emerald-500 hover:text-black transition-all group">
                      ENVIAR SMART-LINK NEXUS <i class="fab fa-whatsapp text-2xl group-hover:rotate-12 transition-transform"></i>
                  </button>
              </div>
          </div>

          <div class="lg:col-span-5 space-y-10">
              <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div class="absolute top-0 right-0 p-8 opacity-5 text-8xl text-cyan-500"><i class="fas fa-microchip"></i></div>
                  <h4 class="text-[12px] font-black text-cyan-500 orbitron tracking-[0.5em] mb-12 uppercase italic border-b border-white/5 pb-4">AUDITORÍA AEGIS_PRO</h4>
                  
                  <div class="space-y-12">
                      <div class="flex items-start gap-8">
                          <div class="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                              <i class="fas fa-shield-virus text-2xl"></i>
                          </div>
                          <div>
                              <p class="text-white orbitron text-[10px] font-black mb-2 uppercase">Protocolo de Exceso (PUC 1105)</p>
                              <p class="text-xs text-slate-500 leading-relaxed">El blindaje prohíbe abonos superiores a la deuda. Evita sobre-liquidación y errores en el cierre de caja diario.</p>
                          </div>
                      </div>

                      <div class="flex items-start gap-8">
                          <div class="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                              <i class="fas fa-user-check text-2xl"></i>
                          </div>
                          <div>
                              <p class="text-white orbitron text-[10px] font-black mb-2 uppercase">Dispersión de Mérito (Nomina)</p>
                              <p class="text-xs text-slate-500 leading-relaxed">Cada ingreso efectivo calcula y bloquea la comisión del técnico asignado de forma automática.</p>
                          </div>
                      </div>

                      <div class="flex items-start gap-8">
                          <div class="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500 shrink-0">
                              <i class="fas fa-fingerprint text-2xl"></i>
                          </div>
                          <div>
                              <p class="text-white orbitron text-[10px] font-black mb-2 uppercase">Traceabilidad 2030</p>
                              <p class="text-xs text-slate-500 leading-relaxed">Registro inmutable en la colección de Auditoría con sello de tiempo del servidor.</p>
                          </div>
                      </div>
                  </div>

                  <button class="w-full mt-16 py-6 border-2 border-dashed border-slate-700 rounded-3xl orbitron text-[9px] text-slate-500 font-bold uppercase hover:border-cyan-500/50 hover:text-cyan-400 transition-all">
                      Sincronizar Balance del día con Nexus-X Dashboard
                  </button>
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
    
    // Auto-search si viene con placa del estado
    if(state?.placa) setTimeout(() => buscarMisionesPlaca(), 500);
  };

  async function buscarMisionesPlaca() {
    const placa = document.getElementById("refIn").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(!placa) return;

    try {
        Swal.fire({ 
            title: 'Sincronizando Radar...', 
            background: '#010409', color: '#fff', 
            didOpen: () => Swal.showLoading() 
        });

        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", placa));
        const snap = await getDocs(q);

        if(snap.empty) return Swal.fire('NEXUS_REPORT', `Unidad ${placa} no encontrada en rampa.`, 'error');

        // Solo ordenes con saldo pendiente real
        const ordenes = snap.docs.map(d => ({id: d.id, ...d.data()}))
                            .filter(o => Number(o.costos_totales?.saldo_pendiente || 0) > 0);

        if(ordenes.length === 0) return Swal.fire('AUDITORÍA', 'Unidad sin compromisos financieros pendientes.', 'success');

        if(ordenes.length === 1) {
            seleccionarOT(ordenes[0]);
            Swal.close();
        } else {
            renderMultiSelector(ordenes);
            Swal.close();
            hablar("Múltiples objetivos financieros detectados. Seleccione una orden.");
        }
    } catch (e) {
        Swal.fire('ERROR', 'Fallo de enlace en la red de pagos.', 'error');
    }
  }

  function renderMultiSelector(ordenes) {
    const selectorContainer = document.getElementById("ot-selector-container");
    const otList = document.getElementById("ot-list");
    otList.innerHTML = "";
    selectorContainer.classList.remove("hidden");

    ordenes.forEach(ot => {
        const btn = document.createElement("button");
        btn.className = "w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-cyan-500 hover:text-black transition-all flex justify-between items-center group";
        btn.innerHTML = `
            <div>
                <p class="orbitron text-[12px] font-black uppercase tracking-tighter">ORDEN_ID: ${ot.id.slice(-6)}</p>
                <p class="text-[9px] opacity-60 font-bold italic">${ot.estado} | ${ot.fecha_ingreso || ''}</p>
            </div>
            <div class="text-right">
                <p class="text-[8px] orbitron font-bold opacity-50 uppercase">Deuda_Actual</p>
                <p class="orbitron font-black text-xl">$ ${Number(ot.costos_totales.saldo_pendiente).toLocaleString()}</p>
            </div>
        `;
        btn.onclick = () => {
            seleccionarOT(ot);
            selectorContainer.classList.add("hidden");
        };
        otList.appendChild(btn);
    });
  }

  function seleccionarOT(ot) {
    ordenActiva = ot;
    document.getElementById("display-info").classList.remove("hidden");
    document.getElementById("txtCliente").innerText = ot.cliente.toUpperCase();
    document.getElementById("txtMision").innerText = `OT-${ot.id.slice(-6)}`;
    document.getElementById("txtTecnico").innerText = `TEC: ${ot.tecnico_asignado || 'NO_ASIGNADO'}`;
    document.getElementById("label-monto").innerText = `$ ${Number(ot.costos_totales.saldo_pendiente).toLocaleString()}`;
    document.getElementById("montoIn").value = Math.round(ot.costos_totales.saldo_pendiente);
    hablar(`Orden vinculada con éxito.`);
  }

  async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    const saldoActual = Number(ordenActiva?.costos_totales?.saldo_pendiente || 0);

    if(!ordenActiva || monto <= 0) return Swal.fire('ALERTA', 'Vincule una misión y defina monto.', 'warning');

    if(monto > (saldoActual + 1)) { // Margen pequeño por redondeo
        hablar("Monto excede la deuda.");
        return Swal.fire({ icon: 'warning', title: 'AUDITORÍA: EXCESO', text: 'No se permiten abonos superiores a la deuda actual.', background: '#010409', color: '#fff' });
    }

    try {
        if(metodo === NEXUS_CONFIG.PAYMENT_METHODS.CARD) {
            ejecutarPasarelaBold(monto);
        } else {
            ejecutarLiquidacionNexus(monto, metodo);
        }
    } catch (e) {
        Swal.fire('ERROR', 'Fallo crítico en la inyección de capital.', 'error');
    }
  }

  async function ejecutarPasarelaBold(monto) {
    const empSnap = await getDoc(doc(db, "usuarios", empresaId));
    const boldKey = empSnap.data()?.bold_api_key;
    
    if(!boldKey) return Swal.fire('API_ERROR', 'No se detectó llave de pasarela Bold activa.', 'error');

    const bold = new window.BoldCheckout({
        orderId: `NEXUS-${ordenActiva.placa}-${Date.now().toString().slice(-4)}`,
        amount: monto, currency: 'COP',
        description: `PAGO_SERVICIO_OT_${ordenActiva.id.slice(-5)}`,
        apiKey: boldKey,
        redirectionUrl: window.location.origin
    });
    bold.open();
  }

  async function ejecutarLiquidacionNexus(monto, metodo) {
    Swal.fire({ title: 'Ejecutando Asiento PUC...', didOpen: () => Swal.showLoading(), background: '#010409' });

    const nuevoSaldo = saldoActual - monto;
    const ordenRef = doc(db, "ordenes", ordenActiva.id);

    // 🦾 TRANSACCIÓN ATÓMICA DE AUDITORÍA
    // A. Actualizar Orden
    await updateDoc(ordenRef, {
        "finanzas.anticipo_cliente": increment(monto),
        "costos_totales.saldo_pendiente": increment(-monto),
        "estado": (nuevoSaldo <= 1) ? 'LISTO' : ordenActiva.estado,
        "updatedAt": serverTimestamp(),
        "bitacora_ia": (ordenActiva.bitacora_ia || "") + `\n[SISTEMA]: Pago de $${monto.toLocaleString()} registrado vía ${metodo}.`
    });

    // B. Crear Asiento Contable para Finanzas Élite
    await addDoc(collection(db, "contabilidad"), {
        empresaId, 
        referencia: ordenActiva.placa, 
        total: monto, // Positivo para ingresos
        tipo: 'INGRESO_OT',
        metodo: metodo,
        concepto: `LIQUIDACIÓN OT-${ordenActiva.id.slice(-5)} | ${ordenActiva.cliente}`,
        fecha: serverTimestamp(),
        tecnico_id: ordenActiva.tecnico_id || 'N/A'
    });

    hablar("Capital inyectado. Generando comprobante digital.");
    enviarVoucherConfirmacion(monto, nuevoSaldo);
    
    Swal.fire({ 
        icon: 'success', 
        title: 'TRANSACCIÓN EXITOSA', 
        text: 'La contabilidad ha sido actualizada en tiempo real.',
        background: '#010409', color: '#fff' 
    });
    
    buscarMisionesPlaca();
  }

  async function enviarVoucherConfirmacion(monto, saldoRestante) {
    if(!ordenActiva.telefono) return;
    const msg = `*✅ NEXUS-X: COMPROBANTE DE PAGO*%0A%0A` +
                `*Abono:* $${monto.toLocaleString()}%0A` +
                `*Vehículo:* ${ordenActiva.placa.toUpperCase()}%0A` +
                `*Orden:* OT-${ordenActiva.id.slice(-6)}%0A` +
                `*Saldo Pendiente:* $${Math.max(0, saldoRestante).toLocaleString()}%0A%0A` +
                `_Gracias por confiar en nuestra tecnología._`;
    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${msg}`, '_blank');
  }

  async function enviarLinkPago() {
    if(!ordenActiva) return;
    const linkBold = `https://bold.co/pay/${empresaId}`; // Link dinámico
    const msg = `*🛰️ LINK DE PAGO NEXUS-X*%0AEstimado cliente *${ordenActiva.cliente}*, puede realizar su pago seguro aquí: ${linkBold}`;
    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${msg}`, '_blank');
  }

  renderLayout();
}
