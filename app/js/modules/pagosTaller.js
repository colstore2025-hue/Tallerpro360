/**
 * pagosTaller.js - NEXUS-X PAY_HUB V33.2 💳
 * Terminal de Recaudo Híbrido + Hoja de Vida Sync
 * @author William Jeffry Urquijo Cubillos
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, increment 
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
                  <p class="text-[10px] orbitron font-black text-white">PASARELA: BOLD_API_SYNC</p>
              </div>
          </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div class="lg:col-span-7 space-y-8">
              <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500 transition-all">
                          <label class="text-[8px] text-slate-500 font-black orbitron mb-3 block tracking-widest uppercase">Escanear Placa</label>
                          <div class="flex items-center gap-4">
                              <input id="refIn" placeholder="ABC123" class="bg-transparent border-none outline-none text-4xl font-black text-white w-full uppercase" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-14 w-14 bg-cyan-500 text-black rounded-2xl hover:scale-110 transition-transform shadow-glow-cyan">
                                  <i class="fas fa-satellite"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5">
                          <label class="text-[8px] text-slate-500 font-black orbitron mb-3 block tracking-widest uppercase">Monto a Recibir</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-4xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="display-info" class="hidden mt-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] animate-in slide-in-from-top-4">
                      <div class="flex justify-between items-center">
                          <div>
                              <p id="txtCliente" class="text-white font-black orbitron text-sm uppercase">Cargando...</p>
                              <p id="txtMision" class="text-[9px] text-cyan-400 font-bold uppercase mt-1 tracking-widest">ESTADO: -</p>
                          </div>
                          <div class="text-right">
                              <p class="text-[8px] text-red-500 font-black orbitron mb-1 uppercase italic">Saldo pendiente</p>
                              <p id="label-monto" class="text-3xl font-black text-white orbitron">$ 0</p>
                          </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                      <button id="btnCobrarBold" class="group bg-cyan-500 text-black py-8 rounded-[2rem] font-black orbitron text-[10px] tracking-[0.3em] shadow-glow-cyan hover:bg-cyan-400 transition-all">
                          BOLDPAY <i class="fas fa-bolt ml-2"></i>
                      </button>
                      <button id="btnEfectivo" class="bg-white/5 text-slate-400 border border-white/10 py-8 rounded-[2rem] font-black orbitron text-[10px] tracking-[0.3em] hover:bg-white/10 transition-all">
                          REGISTRAR EFECTIVO <i class="fas fa-cash-register ml-2"></i>
                      </button>
                  </div>

                  <button id="btnSendLink" class="w-full mt-6 bg-emerald-500 text-black py-6 rounded-[2rem] font-black orbitron text-[10px] tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.01] transition-all">
                      ENVIAR LINK DE PAGO WHATSAPP <i class="fab fa-whatsapp text-lg"></i>
                  </button>
              </div>
          </div>

          <div class="lg:col-span-5">
              <div class="bg-gradient-to-br from-[#0d1117] to-black p-10 rounded-[3.5rem] border border-white/5 shadow-2xl">
                  <h4 class="text-[10px] font-black text-cyan-500 orbitron tracking-[0.4em] mb-8 uppercase italic underline">Resumen Contable</h4>
                  <div id="ledger-preview" class="space-y-4 text-[11px] text-slate-400 orbitron uppercase">
                      <p>Sincronización: <span class="text-emerald-500">Online</span></p>
                      <p>Destino: Ledger Nexus-X</p>
                      <p>Módulo: Hoja de Vida Sync</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
    `;

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
      const docs = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.updatedAt - a.updatedAt);
      ordenActiva = docs[0];
      
      const saldo = Number(ordenActiva.costos_totales?.saldo_pendiente || 0);
      
      document.getElementById("display-info").classList.remove("hidden");
      document.getElementById("txtCliente").innerText = ordenActiva.cliente || "OPERADOR_ANÓNIMO";
      document.getElementById("txtMision").innerText = `OT: ${ordenActiva.id.slice(-6)} | ESTATUS: ${ordenActiva.estado}`;
      document.getElementById("label-monto").innerText = `$ ${saldo.toLocaleString()}`;
      document.getElementById("montoIn").value = saldo;
      
      hablar(`Orden para placa ${placa} localizada.`);
    } else {
      Swal.fire('NEXUS-X', 'No hay misiones para esta placa', 'warning');
    }
  }

    async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    const btn = document.getElementById(metodo === 'BOLD' ? "btnCobrarBold" : "btnEfectivo");

    if (!ordenActiva || monto <= 0) {
      return Swal.fire('ERROR', 'Debe localizar la misión con el escáner antes de liquidar.', 'error');
    }

    try {
      btn.disabled = true;

      if (metodo === 'BOLD') {
        // --- FLUJO BOLD (RECAUDO EN SITIO) ---
        // Recuperamos la llave maestra de la empresa
        const empSnap = await getDoc(doc(db, "empresas", empresaId));
        const boldKey = empSnap.data()?.bold_api_key || localStorage.getItem("nexus_boldKey");

        if (!boldKey) throw new Error("Llave Bold no detectada en el nodo.");

        const bold = new window.BoldCheckout({
          orderId: `NXS-${ordenActiva.placa}-${Date.now().toString().slice(-5)}`,
          amount: monto,
          currency: 'COP',
          description: `TallerPRO360 - Cierre Misión ${ordenActiva.placa}`,
          apiKey: boldKey,
          redirectionUrl: 'https://tallerpro360.vercel.app/success',
          metadata: { empresaId, placa: ordenActiva.placa, ordenId: ordenActiva.id }
        });
        
        hablar("Desplegando pasarela Bold. Complete el pago para sincronizar.");
        bold.open();
        
      } else {
        // --- CIERRE EN EFECTIVO (REGISTRO EN HOJA DE VIDA Y DASHBOARD) ---
        Swal.fire({ title: 'Sincronizando Bóveda...', didOpen: () => Swal.showLoading(), background: '#010409', color: '#fff' });
        
        const ordenRef = doc(db, "ordenes", ordenActiva.id);
        const vehiculoRef = doc(db, "vehiculos", ordenActiva.placa);
        const nuevoSaldo = (ordenActiva.costos_totales?.saldo_pendiente || 0) - monto;

        // 1. Actualizar Orden (Dashboard Aegis)
        await updateDoc(ordenRef, { 
            "estado": (nuevoSaldo <= 0) ? "ENTREGADO" : ordenActiva.estado,
            "pagoStatus": (nuevoSaldo <= 0) ? "PAGADO" : "ABONADO",
            "finanzas.anticipo_cliente": increment(monto),
            "costos_totales.saldo_pendiente": increment(-monto),
            "fechaCierre": serverTimestamp()
        });

        // 2. Registrar en Contabilidad Global (Dashboard Principal)
        await addDoc(collection(db, "contabilidad"), {
            empresaId,
            referencia: ordenActiva.placa,
            monto: monto,
            tipo: 'INGRESO',
            metodo: 'EFECTIVO',
            concepto: `Liquidación Final Orden ${ordenActiva.placa}`,
            createdAt: serverTimestamp()
        });

        // 3. Inyectar en Hoja de Vida del Vehículo
        await addDoc(collection(vehiculoRef, "historial_servicios"), {
            fecha: serverTimestamp(),
            tipo_evento: "PAGO_REGISTRADO",
            monto: monto,
            descripcion: `Recaudo en efectivo - Liquidación en terminal PAY_NEXUS`,
            ordenId: ordenActiva.id
        });

        hablar("Misión liquidada y sincronizada con el Dashboard.");
        
        await Swal.fire({
            icon: 'success',
            title: 'CIERRE EXITOSO',
            text: `Misión ${ordenActiva.placa} sincronizada en Hoja de Vida y Contabilidad.`,
            background: '#0d1117', color: '#fff', confirmButtonColor: '#10b981'
        });

        buscarMision(); // Refrescar vista
      }

    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'FALLO DE NODO', text: err.message, background: '#0d1117', color: '#fff' });
    } finally {
      btn.disabled = false;
    }
  }

  async function enviarLinkPago() {
    if(!ordenActiva) return;
    const monto = document.getElementById("montoIn").value;
    const linkPago = `https://bold.co/pay/tallerpro360_${ordenActiva.placa}`;
    const mensaje = `*TallerPRO360 - NEXUS-X*%0A%0A` +
                    `Hola *${ordenActiva.cliente}*, el saldo de tu placa *${ordenActiva.placa}* es de *$${Number(monto).toLocaleString()}*.%0A` +
                    `Paga de forma segura aquí: ${linkPago}`;
    
    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
  }

  renderLayout();
  if(state?.placa) buscarMision();
}
