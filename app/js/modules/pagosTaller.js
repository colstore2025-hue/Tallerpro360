/**
 * pagosTaller.js
 * Gestión de pagos inteligente (PSE, tarjeta, efectivo)
 * TallerPRO360 · Nivel Tesla
 */

import { collection, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { optimizarPrecio } from "./pricingOptimizerAI.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 8px #0ff;">💳 Pagos TallerPRO360</h1>

    <div style="margin-bottom:20px;">
      <input id="ordenId" placeholder="ID Orden" style="flex:1; padding:6px;"/>
      <input id="monto" placeholder="Monto a pagar" type="number" style="flex:1; padding:6px;"/>
      <select id="metodo" style="flex:1; padding:6px;">
        <option value="pse">PSE / Transferencia</option>
        <option value="tarjeta">Tarjeta</option>
        <option value="efectivo">Efectivo</option>
      </select>
      <button id="procesarPago" style="background:#16a34a; padding:8px; color:#000; font-weight:bold; border-radius:6px;">🚀 Procesar Pago</button>
    </div>

    <div id="historialPagos" style="margin-top:20px;"></div>
  `;

  const historialDiv = document.getElementById("historialPagos");

  // 🔄 Cargar historial de pagos
  async function cargarHistorial() {
    try {
      const snapshot = await collection(db, "pagos");
      historialDiv.innerHTML = `<p style="color:#0ff;">Historial de pagos cargando...</p>`;
      // Aquí se puede agregar render de pagos filtrados por empresaId
    } catch (e) {
      console.error(e);
      historialDiv.innerHTML = "❌ Error cargando historial";
    }
  }

  // ➡️ Procesar pago
  document.getElementById("procesarPago").onclick = async () => {
    const ordenId = document.getElementById("ordenId").value.trim();
    const monto = Number(document.getElementById("monto").value) || 0;
    const metodo = document.getElementById("metodo").value;

    if (!ordenId || monto <= 0) {
      alert("Datos incompletos");
      return;
    }

    try {
      // 🔮 IA Pricing Optimizer
      const montoOptimizado = await optimizarPrecio(ordenId, monto);

      // ➕ Guardar pago en Firestore
      await addDoc(collection(db, "pagos"), {
        empresaId: state.empresaId,
        ordenId,
        monto: montoOptimizado,
        metodo,
        creadoEn: new Date(),
        estado: "completado"
      });

      // 🔄 Actualizar estado de orden
      const ordenRef = doc(db, "ordenes", ordenId);
      await updateDoc(ordenRef, { estado: "pagada" });

      // ✅ Notificación vía voz
      hablar(`Pago de $${montoOptimizado} registrado correctamente por ${metodo}`);

      alert(`✅ Pago registrado: $${montoOptimizado}`);
      cargarHistorial();

    } catch (e) {
      console.error(e);
      hablar("❌ Error procesando el pago");
      alert("Error: " + e.message);
    }
  };

  // INIT
  cargarHistorial();
}