/**
 * vehiculos.js
 * Gestión de vehículos + órdenes + IA
 * TallerPRO360 ERP SaaS
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { generarOrdenIA } from "../ai/aiAutonomousFlow.js";
import { hablar } from "../voice/voiceCore.js";

export default async function vehiculosModule(container, state) {

  container.innerHTML = `
    <h1>🚗 Vehículos</h1>

    <div id="vehiculosList"></div>
    <div id="detalleVehiculo"></div>
  `;

  const lista = document.getElementById("vehiculosList");
  const detalle = document.getElementById("detalleVehiculo");

  let vehiculos = [];

  // 🔄 Cargar vehículos (filtrado SaaS)
  async function cargarVehiculos() {
    try {
      const q = query(
        collection(window.db, "vehiculos"),
        where("empresaId", "==", state.empresaId)
      );

      const snap = await getDocs(q);

      vehiculos = [];
      snap.forEach(doc => {
        vehiculos.push({ id: doc.id, ...doc.data() });
      });

      renderVehiculos(vehiculos);

    } catch (e) {
      console.error(e);
      lista.innerHTML = "❌ Error cargando vehículos";
    }
  }

  // 🎨 Render lista
  function renderVehiculos(data) {
    lista.innerHTML = data.map(v => `
      <div 
        data-id="${v.id}" 
        class="vehiculoItem"
        style="background:#111;padding:15px;margin:10px 0;border-radius:10px;cursor:pointer;transition:0.2s;border:1px solid #0f172a;"
      >
        ${v.marca || ""} ${v.modelo || ""} (${v.placa || ""}) <br/>
        Propietario: ${v.clienteNombre || "Desconocido"}
      </div>
    `).join("");

    document.querySelectorAll(".vehiculoItem").forEach(el => {
      el.onclick = () => verVehiculo(el.dataset.id);
    });
  }

  // 👁️ Ver detalle vehículo
  async function verVehiculo(vehiculoId) {

    detalle.innerHTML = "Cargando...";

    try {
      const vehiculo = vehiculos.find(v => v.id === vehiculoId);

      if (!vehiculo) {
        detalle.innerHTML = "❌ Vehículo no encontrado";
        return;
      }

      // 🧾 Órdenes del vehículo
      const ordenesSnap = await getDocs(
        query(
          collection(window.db, "ordenes"),
          where("vehiculoId", "==", vehiculo.placa),
          where("empresaId", "==", state.empresaId)
        )
      );

      let ordenesHTML = "<h3>🧾 Órdenes</h3>";
      ordenesSnap.forEach(doc => {
        const o = doc.data();
        ordenesHTML += `
          <div style="margin-bottom:10px;">
            ${o.numero || "ORD"} - ${o.estado || "-"} - $${formatear(o.total || o.valorTrabajo || 0)}
          </div>
        `;
      });

      // Botones de acción
      const accionesHTML = `
        <button id="crearOrdenManual" style="margin-right:10px;padding:8px 12px;background:#00ff99;border:none;border-radius:6px;cursor:pointer;">
          🧾 Crear Orden
        </button>
        <button id="crearOrdenIA" style="padding:8px 12px;background:#0ff;border:none;border-radius:6px;cursor:pointer;">
          🤖 Orden IA
        </button>
      `;

      detalle.innerHTML = `
        <div style="background:#0f172a;padding:20px;border-radius:12px;margin-top:20px;">
          <h2>${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa})</h2>
          <p>Propietario: ${vehiculo.clienteNombre || "Desconocido"}</p>
          ${accionesHTML}
          ${ordenesHTML}
        </div>
      `;

      // ➕ Crear orden manual
      document.getElementById("crearOrdenManual").onclick = () => {
        window.location.href = `/app/ordenes.html?vehiculo=${vehiculo.placa}&cliente=${vehiculo.clienteId}`;
      };

      // 🤖 Crear orden con IA
      document.getElementById("crearOrdenIA").onclick = async () => {
        const input = prompt("Describe la orden para IA:");

        if (!input) return;

        try {
          const ordenIA = await generarOrdenIA(input);

          if (!ordenIA) {
            alert("❌ IA no pudo generar orden");
            hablar("No entendí la orden");
            return;
          }

          alert("✅ Orden IA generada, revisa la lista de órdenes");
          hablar("Orden generada por IA");
          // Opcional: redirigir a pantalla de revisión
          window.location.href = `/app/ordenes.html?vehiculo=${vehiculo.placa}&cliente=${vehiculo.clienteId}`;
        } catch (e) {
          console.error(e);
          alert("❌ Error IA");
          hablar("Error procesando IA");
        }
      };

    } catch (e) {
      console.error(e);
      detalle.innerHTML = "❌ Error cargando detalle del vehículo";
    }
  }

  // 💰 Formatear dinero
  function formatear(valor) {
    return new Intl.NumberFormat("es-CO").format(valor || 0);
  }

  // INIT
  cargarVehiculos();
}