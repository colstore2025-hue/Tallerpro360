/**
 * pagosTaller.js - NEXUS-X PAY_HUB V33.0 💳
 * Terminal de Recaudo Híbrido (Bold 2.0 + WhatsApp Links)
 * @author William Jeffry Urquijo Cubillos
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  const empresaId = localStorage.getItem("nexus_empresaId");
  let ordenActiva = null;

  const renderLayout = () => {
    container.innerHTML = `
    <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-right-10 duration-700 pb-40 bg-[#010409] min-h-screen">
      
      <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-white/5 pb-12">
          <div>
              <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white">
                PAY<span class="text-cyan-400">_NEXUS</span><span class="text-red-500">.X</span>
              </h1>
              <p class="text-[9px] orbitron tracking-[0.5em] text-slate-500 uppercase mt-4 italic">Protocolo de Recaudo Aeroespacial</p>
          </div>
          <div class="flex gap-4">
              <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div class="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <p class="text-[10px] orbitron font-black text-white">PASARELA_ACTIVA: BOLD_V2</p>
              </div>
          </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div class="lg:col-span-7 space-y-8">
              <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500 transition-all">
                          <label class="text-[8px] text-slate-500 font-black orbitron mb-3 block tracking-widest uppercase">Escanear Misión (PLACA)</label>
                          <div class="flex items-center gap-4">
                              <input id="refIn" placeholder="ABC123" class="bg-transparent border-none outline-none text-4xl font-black text-white w-full uppercase" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-14 w-14 bg-cyan-500 text-black rounded-2xl hover:scale-110 transition-transform shadow-glow-cyan">
                                  <i class="fas fa-satellite"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5">
                          <label class="text-[8px] text-slate-500 font-black orbitron mb-3 block tracking-widest uppercase">Monto a Liquidar</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-4xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="display-info" class="hidden mt-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] animate-in slide-in-from-top-4">
                      <div class="flex justify-between items-center">
                          <div>
                              <p id="txtCliente" class="text-white font-black orbitron text-sm uppercase">Cargando Operador...</p>
                              <p id="txtMision" class="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest italic">Estado: DIAGNÓSTICO</p>
                          </div>
                          <div class="text-right">
                              <p class="text-[8px] text-red-500 font-black orbitron mb-1 uppercase">Saldo en Sistema</p>
                              <p id="label-monto" class="text-3xl font-black text-white orbitron">$ 0</p>
                          </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                      <button id="btnCobrarBold" class="group bg-cyan-500 text-black py-8 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-4">
                          BOLDPAY <i class="fas fa-bolt group-hover:scale-125 transition-transform"></i>
                      </button>
                      <button id="btnEfectivo" class="bg-white/5 text-slate-400 border border-white/10 py-8 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                          EFECTIVO <i class="fas fa-cash-register ml-2"></i>
                      </button>
                  </div>

                  <button id="btnSendLink" class="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-400 text-black py-6 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-[0.3em] shadow-lg flex items-center justify-center gap-4 hover:scale-[1.02] transition-all">
                      ENVIAR SMART-LINK WHATSAPP <i class="fab fa-whatsapp text-lg"></i>
                  </button>
              </div>
          </div>

          <div class="lg:col-span-5 space-y-8">
              <div class="bg-gradient-to-br from-[#0d1117] to-black p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div class="absolute -right-10 -top-10 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                      <i class="fas fa-shield-alt text-9xl"></i>
                  </div>
                  <h4 class="text-[10px] font-black text-cyan-500 orbitron tracking-[0.4em] mb-8 uppercase italic">Protocolos de Seguridad</h4>
                  <ul class="space-y-6">
                      <li class="flex items-start gap-4">
                          <i class="fas fa-check-circle text-emerald-500 mt-1"></i>
                          <p class="text-[11px] text-slate-400 leading-relaxed font-medium">Sincronización automática con <b>Ledger Nexus</b> (Módulo Contabilidad).</p>
                      </li>
                      <li class="flex items-start gap-4">
                          <i class="fas fa-check-circle text-emerald-500 mt-1"></i>
                          <p class="text-[11px] text-slate-400 leading-relaxed font-medium">Firma digital de transacción vía <b>Bold API 2.0</b> certificada.</p>
                      </li>
                      <li class="flex items-start gap-4">
                          <i class="fas fa-check-circle text-emerald-500 mt-1"></i>
                          <p class="text-[11px] text-slate-400 leading-relaxed font-medium">Actualización inmediata de estatus de orden a <b>ENTREGADO</b>.</p>
                      </li>
                  </ul>
              </div>

              <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 flex items-center gap-8">
                  <div class="w-16 h-16 bg-black rounded-3xl border border-white/10 flex items-center justify-center">
                      <i class="fas fa-university text-slate-700 text-2xl"></i>
                  </div>
                  <div>
                      <p class="text-[8px] text-slate-500 orbitron font-black uppercase tracking-widest">Respaldo Bancario</p>
                      <p class="text-[10px] text-white font-bold orbitron uppercase mt-1">Cifrado Militar AES-256</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
    `;

    // Event Listeners
    document.getElementById("btnFetchOrden").onclick = buscarMision;
    document.getElementById("btnCobrarBold").onclick = () => procesarPago('BOLD');
    document.getElementById("btnEfectivo").onclick = () => procesarPago('EFECTIVO');
    document.getElementById("btnSendLink").onclick = enviarLinkPago;
  };

  async function buscarMision() {
    const placa = document.getElementById("refIn").value.toUpperCase().trim();
    if(!placa) return;

    const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", placa));
    const snap = await getDocs(q);

    if(!snap.empty) {
      const docSnap = snap.docs[0];
      ordenActiva = { id: docSnap.id, ...docSnap.data() };
      
      const saldo = Number(ordenActiva.costos_totales?.saldo_pendiente || ordenActiva.total || 0);
      
      document.getElementById("display-info").classList.remove("hidden");
      document.getElementById("txtCliente").innerText = ordenActiva.cliente || "OPERADOR_DESCONOCIDO";
      document.getElementById("txtMision").innerText = `ESTADO: ${ordenActiva.estado}`;
      document.getElementById("label-monto").innerText = `$ ${saldo.toLocaleString()}`;
      document.getElementById("montoIn").value = saldo;
      
      hablar(`Misión de placa ${placa} localizada. Proceda con el recaudo.`);
    } else {
      hablar("No se encontraron misiones activas para esa placa.");
    }
  }

  async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    if(!ordenActiva || monto <= 0) return Swal.fire('ERROR', 'Seleccione una misión válida', 'error');

    if(metodo === 'BOLD') {
        const bold = new window.BoldCheckout({
            orderId: `NXS-${ordenActiva.placa}-${Date.now().toString().slice(-4)}`,
            amount: monto,
            currency: 'COP',
            description: `TallerPRO360 - Cierre Misión ${ordenActiva.placa}`,
            apiKey: localStorage.getItem("nexus_boldKey"),
            redirectionUrl: 'https://tallerpro360.vercel.app/success'
        });
        bold.open();
    } else {
        // CIERRE EFECTIVO
        Swal.fire({ title: 'Sincronizando Bóveda...', didOpen: () => Swal.showLoading(), background: '#010409', color: '#fff' });

        try {
            // 1. Actualizar Orden
            await updateDoc(doc(db, "ordenes", ordenActiva.id), {
                estado: "FINALIZADO",
                pagoStatus: "PAGADO",
                fechaCierre: serverTimestamp()
            });

            // 2. Inyectar en Contabilidad (Ledger Nexus)
            await addDoc(collection(db, "contabilidad"), {
                concepto: `LIQUIDACIÓN ORDEN: ${ordenActiva.placa}`,
                tipo: 'ingreso',
                monto: monto,
                metodo: 'EFECTIVO',
                empresaId,
                creadoEn: serverTimestamp()
            });

            hablar("Pago en efectivo procesado. Misión finalizada y libros actualizados.");
            Swal.fire('ÉXITO', 'Libro Mayor actualizado correctamente', 'success');
        } catch (e) {
            Swal.fire('FALLO_NODO', 'Error en la sincronización contable', 'error');
        }
    }
  }

  async function enviarLinkPago() {
    if(!ordenActiva) return;
    const link = `https://tallerpro360.vercel.app/pay/${ordenActiva.id}`;
    const mensaje = `Hola ${ordenActiva.cliente}, tu misión con la placa ${ordenActiva.placa} está lista. Puedes pagar tu saldo de $${Number(ordenActiva.total).toLocaleString()} aquí: ${link}`;
    window.open(`https://wa.me/${ordenActiva.telefono}?text=${encodeURIComponent(mensaje)}`);
  }

  renderLayout();
  if(state?.placa) buscarMision();
}
