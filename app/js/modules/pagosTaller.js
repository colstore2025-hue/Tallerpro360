/**
 * pagosTaller.js - NEXUS-X PAY_HUB V4.0 💳
 * PROTOCOLO DE RECAUDO INTELIGENTE TALLERPRO360
 * Integración Real Bold + Sincronía Aegis + Auditoría 
 * @author William Jeffry Urquijo Cubillos
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, increment, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  const empresaId = localStorage.getItem("empresaId"); // Clave corregida
  let ordenActiva = null;

  // --- 🏗️ RENDERIZADO DE INTERFAZ HOLOGRÁFICA ---
  const renderLayout = () => {
    container.innerHTML = `
    <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-700 pb-40 bg-[#010409] min-h-screen">
      
      <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-white/5 pb-12">
          <div class="space-y-2">
              <h1 class="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-white">
                PAY<span class="text-cyan-400">_NEXUS</span><span class="text-red-500">.X</span>
              </h1>
              <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic">Neural Payment Terminal // TallerPRO360</p>
          </div>
          <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6 shadow-glow-cyan">
              <div class="h-3 w-3 bg-emerald-500 rounded-full animate-ping"></div>
              <div class="text-left">
                <p class="text-[10px] orbitron font-black text-white">SISTEMA: OPERATIVO</p>
                <p class="text-[8px] text-slate-500 font-bold uppercase">Nodo: Charlotte-Ibague</p>
              </div>
          </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div class="lg:col-span-7 space-y-8">
              <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="bg-black/60 p-10 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500 transition-all group">
                          <label class="text-[9px] text-slate-500 font-black orbitron mb-4 block tracking-[0.3em] uppercase italic">ID_VEHÍCULO (PLACA)</label>
                          <div class="flex items-center gap-4">
                              <input id="refIn" placeholder="BCE670" class="bg-transparent border-none outline-none text-5xl font-black text-white w-full uppercase orbitron" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-16 w-16 bg-cyan-500 text-black rounded-2xl hover:scale-110 transition-transform shadow-glow-cyan">
                                  <i class="fas fa-satellite-dish text-xl"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/60 p-10 rounded-[2.5rem] border border-white/5">
                          <label class="text-[9px] text-slate-500 font-black orbitron mb-4 block tracking-[0.3em] uppercase italic">MONTO_ABONO (COP)</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-5xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="display-info" class="hidden mt-10 p-10 bg-white/5 border border-white/10 rounded-[3rem] animate-in slide-in-from-top-10">
                      <div class="flex justify-between items-center">
                          <div>
                              <p id="txtCliente" class="text-white font-black orbitron text-xl uppercase tracking-tighter">BUSCANDO OPERADOR...</p>
                              <p id="txtMision" class="text-[10px] text-cyan-400 font-bold uppercase mt-2 tracking-widest italic"></p>
                          </div>
                          <div class="text-right">
                              <p class="text-[9px] text-red-500 font-black orbitron mb-2 uppercase tracking-widest">Saldo_Pendiente</p>
                              <p id="label-monto" class="text-5xl font-black text-white orbitron italic">$ 0</p>
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
                  <h4 class="text-[11px] font-black text-cyan-500 orbitron tracking-[0.5em] mb-10 uppercase italic">AUDITORÍA AEGIS_PRO</h4>
                  <ul class="space-y-8">
                      <li class="flex items-start gap-6">
                          <i class="fas fa-shield-alt text-emerald-500 text-xl mt-1"></i>
                          <p class="text-xs text-slate-400 leading-relaxed"><b>Inyectando datos:</b> Cada abono se amarra a la Hoja de Vida imborrable del vehículo.</p>
                      </li>
                      <li class="flex items-start gap-6">
                          <i class="fas fa-chart-pie text-cyan-500 text-xl mt-1"></i>
                          <p class="text-xs text-slate-400 leading-relaxed"><b>Caja en Tiempo Real:</b> El Dashboard actualiza ingresos brutos y saldo deudor al instante.</p>
                      </li>
                  </ul>
              </div>
          </div>
      </div>
    </div>
    `;

    // Vincular Eventos
    document.getElementById("btnFetchOrden").onclick = buscarMision;
    document.getElementById("btnCobrarBold").onclick = () => procesarPago('BOLD');
    document.getElementById("btnEfectivo").onclick = () => procesarPago('EFECTIVO');
    document.getElementById("btnSendLink").onclick = enviarLinkPago;
  };

  // --- 🛰️ FUNCIÓN: BUSQUEDA RADIAL DE MISIÓN ---
  async function buscarMision() {
    const placaRaw = document.getElementById("refIn").value;
    const placa = placaRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); 
    
    if(!placa) return;

    try {
        const q = query(collection(db, "ordenes"), 
                  where("empresaId", "==", empresaId), 
                  where("placa", "==", placa),
                  where("estado", "!=", "FINALIZADO"));
        
        const snap = await getDocs(q);

        if(!snap.empty) {
            // Ordenar por fecha para traer la más reciente
            const docs = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.updatedAt - a.updatedAt);
            ordenActiva = docs[0];
            
            const saldo = Number(ordenActiva.costos_totales?.saldo_pendiente || 0);
            
            document.getElementById("display-info").classList.remove("hidden");
            document.getElementById("txtCliente").innerText = (ordenActiva.cliente || "OPERADOR_DESCONOCIDO").toUpperCase();
            document.getElementById("txtMision").innerText = `OT: ${ordenActiva.id.slice(-6)} // FASE: ${ordenActiva.estado}`;
            document.getElementById("label-monto").innerText = `$ ${saldo.toLocaleString()}`;
            document.getElementById("montoIn").value = saldo;
            
            hablar(`Vehículo ${placa} enlazado. Saldo detectado.`);
        } else {
            ordenActiva = null;
            Swal.fire('NEXUS-X', `No hay misiones activas para la placa ${placa}.`, 'error');
        }
    } catch (e) {
        console.error(e);
        Swal.fire('ERROR DE NODO', 'Fallo en la conexión con la base de datos.', 'error');
    }
  }

  // --- 💳 FUNCIÓN: PROCESADOR DE PAGOS HÍBRIDO ---
  async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    
    if(!ordenActiva || monto <= 0) {
        hablar("Protocolo incompleto. Ingrese placa y monto.");
        return Swal.fire('ERROR', 'Seleccione una misión y un monto válido.', 'warning');
    }

    try {
      if(metodo === 'BOLD') {
        const empSnap = await getDoc(doc(db, "empresas", empresaId));
        const boldKey = empSnap.data()?.bold_api_key || localStorage.getItem("nexus_boldKey");

        if(!boldKey) throw new Error("API KEY de Bold no detectada.");

        const bold = new window.BoldCheckout({
          orderId: `NXS-${ordenActiva.placa}-${Date.now().toString().slice(-4)}`,
          amount: monto,
          currency: 'COP',
          description: `TallerPRO360 - Abono ${ordenActiva.placa}`,
          apiKey: boldKey,
          redirectionUrl: 'https://tallerpro360.vercel.app/success'
        });
        
        hablar("Desplegando pasarela segura Bold.");
        bold.open();
        
      } else {
        // --- PROCESO EFECTIVO (SINCRO TOTAL) ---
        Swal.fire({ title: 'Sincronizando Bóveda Aegis...', didOpen: () => Swal.showLoading(), background: '#010409', color: '#fff' });

        const ordenRef = doc(db, "ordenes", ordenActiva.id);
        const vehiculoRef = doc(db, "vehiculos", ordenActiva.placa);
        const nuevoSaldo = (ordenActiva.costos_totales?.saldo_pendiente || 0) - monto;

        // 1. Actualización de Orden (Abonos de Cliente)
        await updateDoc(ordenRef, {
            "finanzas.anticipo_cliente": increment(monto),
            "costos_totales.saldo_pendiente": increment(-monto),
            "pagoStatus": (nuevoSaldo <= 0) ? "PAGADO" : "ABONADO",
            "updatedAt": serverTimestamp()
        });

        // 2. Registro Contable para Dashboard
        await addDoc(collection(db, "contabilidad"), {
            empresaId,
            referencia: ordenActiva.placa,
            monto: monto,
            tipo: 'INGRESO',
            metodo: 'EFECTIVO',
            concepto: `RECAUDO_CASH: Orden ${ordenActiva.id.slice(-5)}`,
            createdAt: serverTimestamp()
        });

        // 3. Persistencia en Hoja de Vida
        await addDoc(collection(vehiculoRef, "historial_servicios"), {
            fecha: serverTimestamp(),
            tipo_evento: "RECAUDO_FINANCIERO",
            monto: monto,
            descripcion: `Abono recibido en terminal PAY_NEXUS. Saldo restante: $${nuevoSaldo.toLocaleString()}`,
            ordenId: ordenActiva.id
        });

        hablar("Abono registrado con éxito en el ecosistema.");
        
        await Swal.fire({
            icon: 'success',
            title: 'REGISTRO EXITOSO',
            text: `Se abonaron $${monto.toLocaleString()} a la cuenta de ${ordenActiva.placa}.`,
            background: '#0d1117', color: '#fff', confirmButtonColor: '#00f2ff'
        });

        buscarMision(); // Refrescar vista
      }
    } catch (err) {
      console.error(err);
      Swal.fire('FALLO CRÍTICO', err.message, 'error');
    }
  }

  // --- 📱 FUNCIÓN: WHATSAPP SMART-LINK ---
  async function enviarLinkPago() {
    if(!ordenActiva) return Swal.fire('AVISO', 'Busque una placa primero.', 'warning');

    const monto = document.getElementById("montoIn").value;
    const nombre = (ordenActiva.cliente || "Cliente").trim().toUpperCase();
    const linkPago = `https://bold.co/pay/tallerpro360`; 

    const mensaje = `*TallerPRO360 - NOTIFICACIÓN DE PAGO*%0A%0A` +
                    `Hola *${nombre}*, se ha generado el reporte de pago para el vehículo *${ordenActiva.placa}*.%0A%0A` +
                    `💰 *Monto Sugerido:* $${Number(monto).toLocaleString()}%0A%0A` +
                    `✅ *Paga aquí de forma segura:*%0A${linkPago}%0A%0A` +
                    `_Gestión financiera por Nexus-X System_`;
    
    if(!ordenActiva.telefono) return Swal.fire('ERROR', 'No hay teléfono de contacto.', 'error');

    hablar("Enviando enlace de pago vía WhatsApp.");
    window.open(`https://wa.me/57${ordenActiva.telefono.trim()}?text=${mensaje}`, '_blank');
  }

  // --- 🏁 INICIO DE PROTOCOLO ---
  renderLayout();
  if(state?.placa) setTimeout(() => buscarMision(), 500);
}
