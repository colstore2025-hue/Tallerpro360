/**
 * pagosTaller.js
 * Gestión de pagos inteligente (PSE, tarjeta, efectivo, billeteras)
 * Nivel Tesla · Última generación
 */

import { collection, addDoc, updateDoc, doc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { optimizarPrecio } from "./pricingOptimizerAI.js";
import { hablar } from "../voice/voiceCore.js";

export default async function pagosTaller(container, state) {
  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 8px #0ff;">💳 Pagos Inteligentes PRO360</h1>

    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:15px;">
      <input id="ordenId" placeholder="ID Orden" style="flex:1; padding:6px;"/>
      <input id="monto" placeholder="Monto a pagar" type="number" style="flex:1; padding:6px;"/>
      <select id="metodo" style="flex:1; padding:6px;">
        <option value="pse">PSE / Transferencia</option>
        <option value="tarjeta">Tarjeta</option>
        <option value="efectivo">Efectivo</option>
        <option value="nequi">Nequi</option>
        <option value="daviplata">Daviplata</option>
      </select>
      <button id="procesarPago" style="background:#16a34a; padding:8px; color:#000; font-weight:bold; border-radius:6px;">🚀 Procesar Pago</button>
    </div>

    <h3>Historial de Pagos</h3>
    <div id="historialPagos" style="background:#111; padding:10px; border-radius:10px; min-height:100px;"></div>

    <div style="margin-top:15px;">
      <button id="exportPDF" style="padding:6px 10px; background:#0ff; border:none; border-radius:6px;">📄 Exportar PDF</button>
      <button id="exportExcel" style="padding:6px 10px; background:#16a34a; border:none; border-radius:6px;">📊 Exportar Excel</button>
    </div>
  `;

  const historialDiv = document.getElementById("historialPagos");

  // 🔄 Cargar historial de pagos filtrado por empresa
  async function cargarHistorial() {
    try {
      const q = query(collection(db, "pagos"), where("empresaId", "==", state.empresaId));
      const snap = await getDocs(q);

      if (snap.empty) {
        historialDiv.innerHTML = "<p style='color:#0ff;'>No hay pagos registrados</p>";
        return;
      }

      historialDiv.innerHTML = snap.docs.map(docSnap => {
        const p = docSnap.data();
        return `
          <div style="padding:8px; border-bottom:1px solid #222; color:#0ff;">
            Orden: ${p.ordenId} | Monto: $${formatear(p.monto)} | Método: ${p.metodo} | Estado: ${p.estado}
          </div>
        `;
      }).join("");

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

    if (!ordenId || monto <= 0) { alert("Datos incompletos"); return; }

    try {
      // 🔮 IA Pricing Optimizer
      const montoOptimizado = await optimizarPrecio(ordenId, monto);

      // ➕ Guardar pago
      await addDoc(collection(db, "pagos"), {
        empresaId: state.empresaId,
        ordenId,
        monto: montoOptimizado,
        metodo,
        creadoEn: new Date(),
        estado: "completado"
      });

      // 🔄 Actualizar estado orden
      const ordenRef = doc(db, "ordenes", ordenId);
      await updateDoc(ordenRef, { estado: "pagada" });

      hablar(`✅ Pago de $${montoOptimizado} registrado correctamente por ${metodo}`);
      alert(`✅ Pago registrado: $${montoOptimizado}`);
      cargarHistorial();

    } catch (e) {
      console.error(e);
      hablar("❌ Error procesando el pago");
      alert("Error: " + e.message);
    }
  };

  // ➡️ Exportar PDF
  document.getElementById("exportPDF").onclick = async () => {
    const { jsPDF } = await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    const docPDF = new jsPDF.jsPDF();
    docPDF.text("Historial de Pagos - TallerPRO360", 10, 10);

    const pagosSnap = await getDocs(query(collection(db, "pagos"), where("empresaId", "==", state.empresaId)));
    let y = 20;
    pagosSnap.forEach(d => {
      const p = d.data();
      docPDF.text(`Orden: ${p.ordenId} | Monto: $${formatear(p.monto)} | Método: ${p.metodo} | Estado: ${p.estado}`, 10, y);
      y += 10;
    });

    docPDF.save(`Pagos_${state.empresaId}.pdf`);
  };

  // ➡️ Exportar Excel
  document.getElementById("exportExcel").onclick = async () => {
    const { writeFile, utils } = await import("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.mjs");
    const pagosSnap = await getDocs(query(collection(db, "pagos"), where("empresaId", "==", state.empresaId)));
    const data = pagosSnap.docs.map(d => {
      const p = d.data();
      return { Orden: p.ordenId, Monto: p.monto, Método: p.metodo, Estado: p.estado, Fecha: p.creadoEn?.toDate?.()?.toISOString() || "" };
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Pagos");
    writeFile(wb, `Pagos_${state.empresaId}.xlsx`);
  };

  // INIT
  cargarHistorial();
}

// 💰 Formatear dinero
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}