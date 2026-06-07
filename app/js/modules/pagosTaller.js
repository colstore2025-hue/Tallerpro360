/**
 * 💳 pagosTaller.js - NEXUS-X "THE STABILIZER" V21.0
 * PROTOCOLO: QUANTUM-SAP ATOMIC SYNC & CONTROL TEMPORAL RETROACTIVO
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 * CERTIFICACIÓN OPERATIVA: REFORMA INTEGRAL JUNIO 2026
 */
import { 
  collection, query, where, getDocs, doc, writeBatch, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
  let ordenActiva = null;

  const renderLayout = () => {
    // Definición de fecha por defecto del sistema local (YYYY-MM-DD)
    const fechaPorDefecto = new Date().toISOString().split('T')[0];

    container.innerHTML = `
    <div class="p-6 lg:p-12 animate-in fade-in duration-700 pb-40 bg-[#010409] min-h-screen text-white">
      <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-cyan-500/20 pb-12">
          <div>
              <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white">
                FINANCE<span class="text-cyan-400">_CORE</span><span class="text-red-600">.X</span>
              </h1>
              <p class="text-[9px] orbitron tracking-[0.8em] text-slate-500 uppercase mt-4 italic">Unidad de Liquidación Atómica // Protocolo 2030</p>
          </div>
          <div class="flex gap-4">
              <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 shadow-xl">
                  <div class="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p class="text-[9px] orbitron font-black text-slate-400 uppercase tracking-widest text-center">Batch Sync:<br><span class="text-emerald-400">HIGH_STABILITY_ACTIVE</span></p>
              </div>
          </div>
      </header>

      <div class="max-w-5xl mx-auto space-y-10">
          <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div class="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]"></div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                  <div class="space-y-6">
                      <div class="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500/50 transition-all group">
                          <label class="text-[9px] text-slate-500 font-black orbitron mb-2 block uppercase tracking-[0.3em]">ID_SATELLITE (PLACA)</label>
                          <div class="flex items-center gap-6">
                              <input id="refIn" placeholder="UYT564" class="bg-transparent border-none outline-none text-5xl font-black text-white w-full uppercase orbitron placeholder:opacity-10" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-16 w-16 bg-cyan-500 text-black rounded-2xl hover:rotate-90 hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                  <i class="fas fa-sync-alt text-xl"></i>
                              </button>
                          </div>
                      </div>

                      <!-- REFORMA TEMPORAL QUANTUM: SELECCIÓN DE FECHA FISCAL -->
                      <div class="bg-black/40 p-6 rounded-[2rem] border border-white/5 focus-within:border-amber-500/50 transition-all">
                          <label class="text-[9px] text-amber-500 font-black orbitron mb-2 block uppercase tracking-[0.2em]"><i class="fas fa-calendar-day"></i> Fecha Contable del Proceso</label>
                          <input type="date" id="f-fecha-pago" value="${fechaPorDefecto}" class="bg-transparent border-none outline-none text-xl font-black text-white w-full orbitron">
                      </div>

                      <div class="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 focus-within:border-emerald-500/50 transition-all">
                          <div class="flex justify-between items-center mb-2">
                              <label class="text-[9px] text-emerald-500 font-black orbitron block uppercase tracking-[0.3em]">CASH_INJECTION (COP)</label>
                              <span id="pago-tag" class="text-[8px] font-mono font-black px-2 py-0.5 rounded bg-white/5 text-slate-400">DIGITANDO...</span>
                          </div>
                          <input id="montoIn" type="number" placeholder="0.00" oninput="window.evaluarTipoDePago()" class="bg-transparent border-none outline-none text-5xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div class="flex flex-col justify-center">
                      <div id="ot-selector-container" class="hidden animate-in zoom-in duration-300">
                          <p class="text-[9px] orbitron text-cyan-500 font-black mb-4 uppercase tracking-widest ml-4">Misiones Activas Detectadas:</p>
                          <div id="ot-list" class="space-y-3"></div>
                      </div>

                      <div id="display-info" class="hidden space-y-6 animate-in slide-in-from-right-10 duration-500">
                          <div class="bg-gradient-to-br from-cyan-500/10 to-transparent p-10 rounded-[3.5rem] border border-cyan-500/20">
                              <p id="txtCliente" class="text-white font-black orbitron text-2xl uppercase tracking-tighter mb-2"></p>
                              <p id="txtMision" class="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.4em] mb-8"></p>
                              
                              <div class="pt-6 border-t border-white/10 flex justify-between items-end">
                                  <div>
                                      <p class="text-[8px] text-slate-500 font-black orbitron uppercase mb-1">Status Saldo Actual</p>
                                      <p id="label-monto" class="text-5xl font-black text-white orbitron tracking-tighter">$ 0</p>
                                  </div>
                                  <i class="fas fa-shield-alt text-4xl text-white/5"></i>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                  <button id="btnEfectivo" class="group relative overflow-hidden bg-emerald-500 text-black py-10 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-[0.3em] hover:bg-white transition-all duration-500">
                      <span class="relative z-10">REGISTRAR ENTRADA CASH <i class="fas fa-vault ml-3"></i></span>
                      <div class="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  </button>
                  
                  <button id="btnCobrarBold" class="bg-[#010409] text-cyan-400 border border-cyan-500/30 py-10 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-[0.3em] hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all">
                      PASARELA BOLD <i class="fas fa-bolt-lightning ml-3 animate-pulse"></i>
                  </button>
              </div>
          </div>
      </div>
    </div>
    `;

    document.getElementById("btnFetchOrden").onclick = buscarMisionesPlaca;
    document.getElementById("btnEfectivo").onclick = () => ejecutarPagoNexus("EFECTIVO");
    document.getElementById("btnCobrarBold").onclick = () => ejecutarPagoNexus("BOLD");
  };

  async function buscarMisionesPlaca() {
    const placa = document.getElementById("refIn").value.trim().toUpperCase();
    if(!placa) return;

    try {
        Swal.fire({ title: 'ESCANEANDO_NEXUS...', background: '#010409', color: '#fff', didOpen: () => Swal.showLoading() });
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", placa));
        const snap = await getDocs(q);

        if(snap.empty) return Swal.fire('SIN DATOS', 'No hay misiones activas para la placa ingresada.', 'error');

        // Filtra para no mostrar órdenes viejas ya cerradas
        const ordenes = snap.docs.map(d => ({id: d.id, ...d.data()}))
                            .filter(o => o.estado !== 'ENTREGADO');

        if(ordenes.length === 0) {
            return Swal.fire('MISIÓN CLASIFICADA', 'Las órdenes de esta placa ya se encuentran finalizadas y entregadas.', 'info');
        }

        if(ordenes.length === 1) {
            seleccionarOT(ordenes[0]);
            Swal.close();
        } else {
            renderSelector(ordenes);
            Swal.close();
        }
    } catch (e) { console.error(e); }
  }

  function renderSelector(ordenes) {
    const container = document.getElementById("ot-selector-container");
    const list = document.getElementById("ot-list");
    list.innerHTML = "";
    container.classList.remove("hidden");
    document.getElementById("display-info").classList.add("hidden");

    ordenes.forEach(ot => {
        const saldo = ot.saldo_pendiente ?? ot.costos_totales?.saldo_pendiente ?? 0;
        const btn = document.createElement("button");
        btn.className = "w-full p-6 bg-white/5 border border-white/5 rounded-2xl text-left flex justify-between items-center hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group";
        btn.innerHTML = `
            <div class="orbitron">
                <p class="text-[10px] font-black text-white group-hover:text-cyan-400">OT-${ot.id.slice(-6)}</p>
                <p class="text-[8px] text-slate-500 uppercase">${ot.tipo_orden || 'SERVICIO'}</p>
            </div>
            <b class="text-emerald-400 orbitron text-lg">$${Number(saldo).toLocaleString()}</b>
        `;
        btn.onclick = () => { seleccionarOT(ot); container.classList.add("hidden"); };
        list.appendChild(btn);
    });
  }

  function seleccionarOT(ot) {
    ordenActiva = ot;
    const saldo = ot.saldo_pendiente ?? ot.costos_totales?.saldo_pendiente ?? 0;
    
    document.getElementById("display-info").classList.remove("hidden");
    document.getElementById("txtCliente").innerText = ot.cliente || "CLIENTE_ANÓNIMO";
    document.getElementById("txtMision").innerText = `LOG_ID: ${ot.id.slice(-8)} // FASE: ${ot.estado}`;
    document.getElementById("label-monto").innerText = `$ ${Number(saldo).toLocaleString()}`;
    
    hablar(`Unidad ${ot.placa} vinculada.`);
    document.getElementById("montoIn").focus();
    window.evaluarTipoDePago();
  }

  /**
   * 📊 EVALUADOR FINANCIERO DINÁMICO
   * Detecta si la cifra digitada corresponde a un pago parcial o total.
   */
  window.evaluarTipoDePago = () => {
    if (!ordenActiva) return;
    const inputMonto = document.getElementById("montoIn");
    const tag = document.getElementById("pago-tag");
    if (!inputMonto || !tag) return;

    const montoDigitado = Number(inputMonto.value) || 0;
    const saldoActual = Number(ordenActiva.saldo_pendiente ?? ordenActiva.costos_totales?.saldo_pendiente ?? 0);

    if (montoDigitado <= 0) {
        tag.innerText = "ESPERANDO MONTO...";
        tag.className = "text-[8px] font-mono font-black px-2 py-0.5 rounded bg-white/5 text-slate-400";
    } else if (montoDigitado < saldoActual) {
        tag.innerText = "ABONO PARCIAL";
        tag.className = "text-[8px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20";
    } else if (montoDigitado === saldoActual) {
        tag.innerText = "LIQUIDACIÓN TOTAL (CIERRE)";
        tag.className = "text-[8px] font-mono font-black px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20";
    } else {
        tag.innerText = "SALDO A FAVOR (EXCEDENTE)";
        tag.className = "text-[8px] font-mono font-black px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20";
    }
  };

  /**
   * 🛠️ EJECUTAR PAGO NEXUS (PROTOCOLO ATÓMICO QUANTUM-SAP)
   * Sincroniza Orden y Contabilidad bajo una misma estampa cronológica manual o automática.
   */
  async function ejecutarPagoNexus(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    if(!ordenActiva || monto <= 0) return Swal.fire('ERROR_INPUT', 'Monto no válido o misión no seleccionada.', 'warning');

    const inputFecha = document.getElementById("f-fecha-pago").value;
    // Forzamos hora estática al mediodía para mitigar distorsiones de husos horarios locales
    const timestampContable = inputFecha ? new Date(inputFecha + "T12:00:00").toISOString() : new Date().toISOString();

    const batch = writeBatch(db);
    const ordenRef = doc(db, "ordenes", ordenActiva.id);
    const contabilidadRef = doc(collection(db, "contabilidad"));

    const totalOriginal = Number(ordenActiva.total || ordenActiva.costos_totales?.total || 0);
    const anticipoPrevio = Number(ordenActiva.anticipo || ordenActiva.costos_totales?.anticipo || 0);
    
    const nuevoAnticipo = anticipoPrevio + monto;
    const nuevoSaldo = totalOriginal - nuevoAnticipo;

    // Si liquida el 100% de la cuenta, mutamos automáticamente el estado a 'LISTO'
    let estadoActualizado = ordenActiva.estado;
    if (nuevoSaldo <= 0 && ordenActiva.estado !== 'LISTO') {
        estadoActualizado = 'LISTO';
    }

    try {
        Swal.fire({ title: 'EXECUTING_BATCH_SYNC...', background: '#010409', color: '#fff', didOpen: () => Swal.showLoading() });

        // A. MUTACIÓN INTEGRAL DE LA ORDEN
        batch.update(ordenRef, {
            anticipo: nuevoAnticipo,
            saldo_pendiente: nuevoSaldo,
            estado: estadoActualizado,
            "costos_totales.anticipo": nuevoAnticipo,
            "costos_totales.saldo_pendiente": nuevoSaldo,
            updatedAt: serverTimestamp()
        });

        // B. INYECCIÓN LOGÍSTICA EN LIBRO DE CONTABILIDAD
        const esCierreTotal = nuevoSaldo <= 0;
        batch.set(contabilidadRef, {
            empresaId,
            placa: ordenActiva.placa,
            monto: monto,
            tipo: "ingreso_ot", 
            metodo: metodo,
            concepto: esCierreTotal ? `LIQUIDACIÓN TOTAL OT: ${ordenActiva.placa} | ${metodo}` : `ABONO PARCIAL OT: ${ordenActiva.placa} | ${metodo}`,
            fecha: timestampContable, 
            creadoEn: serverTimestamp(),
            vendedor: "CAJA_NEXUS"
        });

        // C. COMMIT EN UN SÓLO PULSO
        await batch.commit();
        
        hablar("Transacción procesada correctamente.");

        // Captura de metadatos antes del reset para el comprobante externo
        const backupOrden = {
            placa: ordenActiva.placa,
            cliente: ordenActiva.cliente || "CLIENTE",
            telefono: ordenActiva.telefono || "",
            montoPagado: monto,
            saldoRestante: nuevoSaldo,
            metodo: metodo
        };

        // Reset Estructural de la UI
        document.getElementById("refIn").value = "";
        document.getElementById("montoIn").value = "";
        document.getElementById("display-info").classList.add("hidden");
        ordenActiva = null;

        // D. NOTIFICACIÓN INTEGRAL DE RECAUDO VIA WHATSAPP
        Swal.fire({
            title: '🛰️ SYNC_COMPLETE',
            text: `Capital inyectado: $${monto.toLocaleString()}. Nuevo Saldo: $${nuevoSaldo.toLocaleString()}`,
            icon: 'success',
            background: '#0d1117',
            color: '#06b6d4',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#334155',
            confirmButtonText: '<i class="fab fa-whatsapp"></i> ENVIAR RECIBO',
            cancelButtonText: 'CERRAR PANEL'
        }).then((result) => {
            if (result.isConfirmed) {
                despacharMensajeRecaudo(backupOrden);
            }
        });

    } catch (e) {
        console.error("CRITICAL_FINANCE_FAILURE:", e);
        Swal.fire('🚨 FALLO_CRÍTICO', 'La sincronización atómica ha fallado en la capa de datos Firebase.', 'error');
    }
  }

  /**
   * 📨 ENVIAR COMPROBANTE DIGITAL WA
   * Despacha un recibo con la estructura estética de TallerPRO360.
   */
  function despacharMensajeRecaudo(meta) {
    if (!meta.telefono) {
        Swal.fire({ title: 'SIN TELÉFONO', text: 'Esta cuenta no posee un número de contacto vinculado.', icon: 'warning' });
        return;
    }

    const cleanPhone = meta.telefono.toString().replace(/\D/g, '');
    if (cleanPhone.length < 10) return;

    let mensaje = "💳 *TALLERPRO360: CONFIRMACIÓN DE RECAUDO*%0A%0A";
    mensaje += "Estimado(a) *" + meta.cliente.toUpperCase() + "*,%0A";
    mensaje += "Hemos recibido satisfactoriamente un flujo de caja para su vehículo.%0A%0A";
    mensaje += "🛰️ *UNIDAD:* " + meta.placa.toUpperCase() + "%0A";
    mensaje += "💵 *MONTO INYECTADO:* $" + meta.montoPagado.toLocaleString() + "%0A";
    mensaje += "⚙️ *MÉTODO DE PAGO:* " + meta.metodo + "%0A";
    
    if (meta.saldoRestante <= 0) {
        mensaje += "✅ *SALDO RESTANTE:* $0 (CUENTA LIQUIDADA)%0A%0A";
        mensaje += "Su orden de servicio ha mutado a estado de entrega. ¡Gracias por su confianza!%0A";
    } else {
        mensaje += "📉 *SALDO PENDIENTE:* $" + meta.saldoRestante.toLocaleString() + "%0A%0A";
        mensaje += "El abono fue acreditado al saldo general de la orden en desarrollo.%0A";
    }
    
    mensaje += "%0A_Powered by Nexus-X Core System_";

    window.open("https://wa.me/57" + cleanPhone + "?text=" + mensaje, '_blank');
  }

  renderLayout();
}
