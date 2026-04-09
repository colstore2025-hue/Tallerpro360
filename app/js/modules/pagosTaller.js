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
                              <button id="btnFetchOrden" class="h-14 w-14 bg-cyan-500 text-black rounded-2xl hover:scale-110 transition-transform">
                                  <i class="fas fa-satellite"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5">
                          <label class="text-[8px] text-slate-500 font-black orbitron mb-3 block tracking-widest uppercase">Monto a Recibir</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-4xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="display-info" class="hidden mt-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                      <div class="flex justify-between items-center">
                          <div>
                              <p id="txtCliente" class="text-white font-black orbitron text-sm uppercase">...</p>
                              <p id="txtMision" class="text-[9px] text-cyan-400 font-bold uppercase mt-1 tracking-widest">ESTADO: -</p>
                          </div>
                          <div class="text-right">
                              <p class="text-[8px] text-red-500 font-black orbitron mb-1 uppercase italic">Saldo deudor</p>
                              <p id="label-monto" class="text-3xl font-black text-white orbitron">$ 0</p>
                          </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                      <button id="btnCobrarBold" class="group bg-cyan-500 text-black py-8 rounded-[2rem] font-black orbitron text-[10px] tracking-[0.3em] shadow-glow-cyan hover:bg-white transition-all">
                          BOLDPAY <i class="fas fa-bolt ml-2"></i>
                      </button>
                      <button id="btnEfectivo" class="bg-white/5 text-slate-400 border border-white/10 py-8 rounded-[2rem] font-black orbitron text-[10px] tracking-[0.3em] hover:bg-white/10 transition-all">
                          REGISTRAR EFECTIVO <i class="fas fa-cash-register ml-2"></i>
                      </button>
                  </div>

                  <button id="btnSendLink" class="w-full mt-6 bg-emerald-500 text-black py-6 rounded-[2rem] font-black orbitron text-[10px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-emerald-400 transition-all">
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
                      <p>Módulo: Facturación Final</p>
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

    // Buscamos cualquier orden que NO esté finalizada aún o que tenga saldo
    const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("placa", "==", placa));
    const snap = await getDocs(q);

    if(!snap.empty) {
      // Tomamos la más reciente
      const docs = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.updatedAt - a.updatedAt);
      ordenActiva = docs[0];
      
      const saldo = Number(ordenActiva.costos_totales?.saldo_pendiente || 0);
      
      document.getElementById("display-info").classList.remove("hidden");
      document.getElementById("txtCliente").innerText = ordenActiva.cliente || "CLIENTE NO REGISTRADO";
      document.getElementById("txtMision").innerText = `ORDEN: ${ordenActiva.id.slice(-6)} | ESTADO: ${ordenActiva.estado}`;
      document.getElementById("label-monto").innerText = `$ ${saldo.toLocaleString()}`;
      document.getElementById("montoIn").value = saldo;
      
      hablar(`Orden para placa ${placa} lista para recaudo.`);
    } else {
      Swal.fire('NEXUS-X', 'No hay órdenes activas para esta placa', 'warning');
    }
  }

  async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    if(!ordenActiva || monto <= 0) return Swal.fire('ERROR', 'Monto inválido', 'error');

    if(metodo === 'BOLD') {
        const linkBold = `https://bold.co/pay/tallerpro360_${ordenActiva.placa}`; 
        window.open(linkBold, '_blank');
        hablar("Redirigiendo a terminal Bold.");
    } else {
        Swal.fire({ title: 'Sincronizando Libros...', didOpen: () => Swal.showLoading(), background: '#010409', color: '#fff' });

                // --- 📥 INICIO BLOQUE QUIRÚRGICO DE RECAUDO ---
        try {
            const batch = [];
            const ordenRef = doc(db, "ordenes", ordenActiva.id);
            const vehiculoRef = doc(db, "vehiculos", ordenActiva.placa);
            
            // 1. Actualizar Saldo y Estado en la Orden
            // Usamos increment para que sea matemáticamente exacto en Firebase
            await updateDoc(ordenRef, {
                "finanzas.anticipo_cliente": increment(monto),
                "costos_totales.saldo_pendiente": increment(-monto),
                "estado": (monto >= (ordenActiva.costos_totales?.saldo_pendiente || 0)) ? "LISTO" : ordenActiva.estado,
                "pagoStatus": (monto >= (ordenActiva.costos_totales?.saldo_pendiente || 0)) ? "PAGADO" : "ABONADO",
                updatedAt: serverTimestamp()
            });

            // 2. Registrar el Ingreso en el Ledger de Contabilidad
            await addDoc(collection(db, "contabilidad"), {
                concepto: `LIQUIDACIÓN EFECTIVO - PLACA: ${ordenActiva.placa}`,
                tipo: 'ingreso',
                monto: monto,
                metodo: 'EFECTIVO',
                ordenId: ordenActiva.id,
                empresaId,
                creadoEn: serverTimestamp()
            });

            // 3. Inyectar el hito en la Hoja de Vida del Vehículo
            // Esto crea una sub-colección cronológica para el vehículo
            await addDoc(collection(vehiculoRef, "historial_servicios"), {
                fecha: serverTimestamp(),
                tipo_evento: "PAGO_REGISTRADO",
                monto: monto,
                descripcion: `Abono/Pago de servicio vía PAY_NEXUS`,
                ordenId: ordenActiva.id
            });

            hablar("Recaudo sincronizado con éxito. Hoja de vida y libros contables actualizados.");
            
            Swal.fire({
                icon: 'success',
                title: 'NEXUS-X SYNC OK',
                text: 'El pago ha sido inyectado en la hoja de vida del vehículo.',
                background: '#010409',
                color: '#fff',
                confirmButtonColor: '#00f2ff'
            });

            buscarMision(); // Refrescamos la pantalla para mostrar el nuevo saldo

        } catch (e) {
            console.error("Error en Protocolo de Cierre:", e);
            Swal.fire('FALLO_SISTEMA', 'No se pudo replicar el pago en la hoja de vida.', 'error');
        }
        // --- 📤 FIN BLOQUE QUIRÚRGICO ---

  async function enviarLinkPago() {
    if(!ordenActiva) return;
    const monto = document.getElementById("montoIn").value;
    const linkPago = `https://bold.co/pay/tallerpro360_${ordenActiva.placa}`;
    const mensaje = `*TallerPRO360 - NEXUS-X*%0A%0A` +
                    `Hola *${ordenActiva.cliente}*, puedes realizar el pago de tu servicio (Placa: ${ordenActiva.placa}) por un valor de *$${Number(monto).toLocaleString()}* aquí:%0A%0A` +
                    `🔗 ${linkPago}%0A%0A` +
                    `_Gracias por confiar en nuestra ingeniería._`;
    
    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
  }

  renderLayout();
  if(state?.placa) buscarMision();
}
