/**
 * pagosTaller.js - NEXUS-X PAY_HUB V33.5 FINAL 💳
 * Integración Real Bold 2.0 + Hoja de Vida + Dashboard Aegis
 * @author William Jeffry Urquijo Cubillos
 */
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, increment, getDoc 
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
              <p class="text-[9px] orbitron tracking-[0.5em] text-slate-500 uppercase mt-4 italic">Terminal de Recaudo Real TallerPRO360</p>
          </div>
          <div class="flex gap-4">
              <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div class="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <p class="text-[10px] orbitron font-black text-white">ESTADO: NODO_OPERATIVO</p>
              </div>
          </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div class="lg:col-span-7 space-y-8">
              <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500 transition-all">
                          <label class="text-[8px] text-slate-500 font-black orbitron mb-3 block tracking-widest uppercase">Escanear Placa (ID Vehículo)</label>
                          <div class="flex items-center gap-4">
                              <input id="refIn" placeholder="BCE670" class="bg-transparent border-none outline-none text-4xl font-black text-white w-full uppercase" value="${state?.placa || ''}">
                              <button id="btnFetchOrden" class="h-14 w-14 bg-cyan-500 text-black rounded-2xl hover:scale-110 transition-transform shadow-glow-cyan">
                                  <i class="fas fa-satellite"></i>
                              </button>
                          </div>
                      </div>

                      <div class="bg-black/60 p-8 rounded-[2.5rem] border border-white/5">
                          <label class="text-[8px] text-slate-500 font-black orbitron mb-3 block tracking-widest uppercase">Monto de Liquidación</label>
                          <input id="montoIn" type="number" placeholder="0" class="bg-transparent border-none outline-none text-4xl font-black text-emerald-400 w-full orbitron">
                      </div>
                  </div>

                  <div id="display-info" class="hidden mt-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] animate-in slide-in-from-top-4">
                      <div class="flex justify-between items-center">
                          <div>
                              <p id="txtCliente" class="text-white font-black orbitron text-sm uppercase">Cargando Operador...</p>
                              <p id="txtMision" class="text-[9px] text-cyan-400 font-bold uppercase mt-1 tracking-widest italic">Buscando Registro...</p>
                          </div>
                          <div class="text-right">
                              <p class="text-[8px] text-red-500 font-black orbitron mb-1 uppercase">Saldo Pendiente</p>
                              <p id="label-monto" class="text-3xl font-black text-white orbitron">$ 0</p>
                          </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                      <button id="btnCobrarBold" class="group bg-cyan-500 text-black py-8 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-4">
                          PASARELA BOLD <i class="fas fa-bolt group-hover:scale-125 transition-transform"></i>
                      </button>
                      <button id="btnEfectivo" class="bg-white/5 text-slate-400 border border-white/10 py-8 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                          REGISTRO EFECTIVO <i class="fas fa-cash-register ml-2"></i>
                      </button>
                  </div>

                  <button id="btnSendLink" class="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-400 text-black py-6 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-[0.3em] shadow-lg flex items-center justify-center gap-4 hover:scale-[1.02] transition-all">
                      ENVIAR SMART-LINK WHATSAPP <i class="fab fa-whatsapp text-lg"></i>
                  </button>
              </div>
          </div>

          <div class="lg:col-span-5 space-y-8">
              <div class="bg-gradient-to-br from-[#0d1117] to-black p-10 rounded-[3.5rem] border border-white/5 shadow-2xl">
                  <h4 class="text-[10px] font-black text-cyan-500 orbitron tracking-[0.4em] mb-8 uppercase italic">Sincronización Aegis</h4>
                  <ul class="space-y-6">
                      <li class="flex items-start gap-4">
                          <i class="fas fa-database text-emerald-500 mt-1"></i>
                          <p class="text-[11px] text-slate-400 leading-relaxed">Actualización inmediata en <b>Hoja de Vida</b> del vehículo.</p>
                      </li>
                      <li class="flex items-start gap-4">
                          <i class="fas fa-chart-line text-emerald-500 mt-1"></i>
                          <p class="text-[11px] text-slate-400 leading-relaxed">Registro en tiempo real en el <b>Dashboard de Contabilidad</b>.</p>
                      </li>
                  </ul>
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
      // Tomamos la última orden creada
      const docs = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.updatedAt - a.updatedAt);
      ordenActiva = docs[0];
      
      const saldo = Number(ordenActiva.costos_totales?.saldo_pendiente || 0);
      
      document.getElementById("display-info").classList.remove("hidden");
      document.getElementById("txtCliente").innerText = ordenActiva.cliente || "CLIENTE SIN NOMBRE";
      document.getElementById("txtMision").innerText = `ORDEN: ${ordenActiva.id.slice(-6)} | ESTADO: ${ordenActiva.estado}`;
      document.getElementById("label-monto").innerText = `$ ${saldo.toLocaleString()}`;
      document.getElementById("montoIn").value = saldo;
      
      hablar(`Orden para placa ${placa} localizada.`);
    } else {
      Swal.fire('NEXUS-X', 'No se encontraron misiones para esta placa.', 'error');
    }
  }

    async function procesarPago(metodo) {
    const monto = Number(document.getElementById("montoIn").value);
    
    // 1. VALIDACIÓN DE SEGURIDAD (Cero Informalidad)
    if(!ordenActiva || monto <= 0) {
        hablar("Error de protocolo. Localice la placa antes de registrar un movimiento.");
        return Swal.fire('ERROR DE NODO', 'No hay una misión activa vinculada.', 'error');
    }

    try {
      Swal.fire({ title: 'Sincronizando Bóveda Aegis...', didOpen: () => Swal.showLoading(), background: '#010409', color: '#fff' });

      if(metodo === 'BOLD') {
        // --- LÓGICA BOLD REAL ---
        const empSnap = await getDoc(doc(db, "empresas", empresaId));
        const boldKey = empSnap.data()?.bold_api_key || localStorage.getItem("nexus_boldKey");

        if(!boldKey) throw new Error("API KEY de Bold no configurada en este taller.");

        const bold = new window.BoldCheckout({
          orderId: `NXS-${ordenActiva.placa}-${Date.now().toString().slice(-4)}`,
          amount: monto,
          currency: 'COP',
          description: `TallerPRO360 - Abono Placa ${ordenActiva.placa}`,
          apiKey: boldKey,
          redirectionUrl: 'https://tallerpro360.vercel.app/success'
        });
        
        hablar("Desplegando pasarela Bold. El abono se registrará al confirmar la transacción.");
        bold.open();
        
      } else {
        // --- CIERRE EFECTIVO / ANTICIPO (REGISTRO DETALLADO) ---
        const ordenRef = doc(db, "ordenes", ordenActiva.id);
        const vehiculoRef = doc(db, "vehiculos", ordenActiva.placa);
        const saldoActual = Number(ordenActiva.costos_totales?.saldo_pendiente || 0);
        const nuevoSaldo = saldoActual - monto;

        // A. Actualizamos la Orden (Para que la factura final reste estos valores)
        await updateDoc(ordenRef, {
            "finanzas.anticipo_cliente": increment(monto),
            "costos_totales.saldo_pendiente": increment(-monto),
            "estado": (nuevoSaldo <= 0) ? "ENTREGADO" : ordenActiva.estado,
            "pagoStatus": (nuevoSaldo <= 0) ? "PAGADO" : "ABONADO",
            "updatedAt": serverTimestamp()
        });

        // B. Registro en Libro Mayor (Para el Dashboard del Taller)
        await addDoc(collection(db, "contabilidad"), {
            empresaId,
            referencia: ordenActiva.placa,
            monto: monto,
            tipo: 'INGRESO',
            metodo: 'EFECTIVO',
            concepto: `ABONO/LIQUIDACIÓN - Orden: ${ordenActiva.id.slice(-5)}`,
            createdAt: serverTimestamp()
        });

        // C. Registro en Hoja de Vida (La prueba para el cliente)
        await addDoc(collection(vehiculoRef, "historial_servicios"), {
            fecha: serverTimestamp(),
            tipo_evento: "PAGO_RECIBIDO",
            monto: monto,
            descripcion: `Abono registrado en efectivo. Saldo restante: $${nuevoSaldo.toLocaleString()}`,
            ordenId: ordenActiva.id
        });

        hablar("Sincronización exitosa. El abono ha sido inyectado en la hoja de vida.");
        
        Swal.fire({
            icon: 'success',
            title: 'PAGO REGISTRADO',
            text: `Se abonaron $${monto.toLocaleString()} a la placa ${ordenActiva.placa}. Confianza total Nexus.`,
            background: '#0d1117', color: '#fff', confirmButtonColor: '#00f2ff'
        });

        // --- CORRECCIÓN DE BÚSQUEDA Y RECAUDO ---
async function buscarMision() {
    // Limpieza radical de la placa para evitar fallos de coincidencia
    const placaRaw = document.getElementById("refIn").value;
    const placa = placaRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); 
    
    if(!placa) return;

    // Buscamos en la colección de órdenes del taller
    const q = query(collection(db, "ordenes"), 
              where("empresaId", "==", empresaId), 
              where("placa", "==", placa),
              where("estado", "!=", "FINALIZADO")); // Solo misiones activas
    
    const snap = await getDocs(q);

    if(!snap.empty) {
        ordenActiva = { id: snap.docs[0].id, ...snap.docs[0].data() };
        
        // Sincronización con la interfaz
        document.getElementById("display-info").classList.remove("hidden");
        document.getElementById("label-monto").innerText = `$ ${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`;
        document.getElementById("montoIn").value = ordenActiva.costos_totales.saldo_pendiente;
        
        hablar(`Misión ${placa} vinculada. Saldo pendiente detectado.`);
    } else {
        ordenActiva = null;
        Swal.fire('NEXUS-X', `La placa ${placa} no tiene misiones activas.`, 'error');
    }
}

    async function enviarLinkPago() {
    if(!ordenActiva) {
        return Swal.fire('NEXUS-X', 'Primero localice la placa del vehículo.', 'warning');
    }

    const monto = document.getElementById("montoIn").value;
    
    // Limpieza de datos para un mensaje estético y funcional
    const nombreCliente = (ordenActiva.cliente || "Cliente").trim();
    const placaLimpia = (ordenActiva.placa || "").trim().toUpperCase();
    const telefonoLimpio = (ordenActiva.telefono || "").trim().replace(/\s+/g, '');

    // Link real del negocio
    const linkPago = `https://bold.co/pay/tallerpro360`; 

    const mensaje = `*TallerPRO360 - INFORME DE PAGO*%0A%0A` +
                    `Hola *${nombreCliente}*, el saldo actual de tu vehículo *${placaLimpia}* es de *$${Number(monto).toLocaleString()}*.%0A%0A` +
                    `✅ *Paga de forma segura aquí:*%0A${linkPago}%0A%0A` +
                    `_Misión gestionada por Nexus-X Command Center_`;
    
    // Validamos que exista un teléfono antes de intentar abrir WhatsApp
    if(!telefonoLimpio) {
        return Swal.fire('DATOS FALTANTES', 'El cliente no tiene un número de contacto registrado.', 'error');
    }

    hablar("Abriendo canal de WhatsApp para envío de link de recaudo.");
    window.open(`https://wa.me/57${telefonoLimpio}?text=${mensaje}`, '_blank');
  }

  // --- RENDERIZADO FINAL DEL MÓDULO ---
  renderLayout();
  
  // Si el estado ya trae una placa (desde otra pantalla), ejecutamos la búsqueda automática
  if(state?.placa) {
      setTimeout(() => buscarMision(), 500); // Pequeño delay para asegurar que el DOM esté listo
  }
}
