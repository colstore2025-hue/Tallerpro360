import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { usarRepuesto } from "../services/inventarioService.js";
export default async function (container, state) {

  container.innerHTML = `
    <h1>🧾 Órdenes del Taller</h1>

    <div style="margin-bottom:20px;">
      <input id="placa" placeholder="Placa vehículo"/>
      <input id="diagnostico" placeholder="Diagnóstico mecánico"/>
      <button id="crearOrden">Crear Orden</button>
    </div>

    <div id="listaOrdenes"></div>
  `;

  const lista = document.getElementById("listaOrdenes");

  // 🔄 Cargar órdenes
  async function cargarOrdenes() {
    lista.innerHTML = "Cargando órdenes...";

    const snap = await getDocs(collection(window.db, "ordenes"));

    let html = "";

    snap.forEach(docSnap => {
      const o = docSnap.data();

      html += `
        <div style="background:#111; padding:15px; margin:10px 0; border-radius:10px;">
          <b>${o.numero || "ORD"}</b> - ${o.estado} <br/>
          🚗 ${o.vehiculoId || "-"} <br/>
          🔧 ${o.diagnostico || "-"} <br/>
          💰 $${o.valorTrabajo || 0}

          <br/><br/>
          <button onclick="cambiarEstado('${docSnap.id}','en_proceso')">▶ Iniciar</button>
          <button onclick="cambiarEstado('${docSnap.id}','finalizada')">✅ Finalizar</button>
        </div>
      `;
    });

    lista.innerHTML = html;
  }

  // ➕ Crear orden
  document.getElementById("crearOrden").onclick = async () => {
    const placa = document.getElementById("placa").value;
    const diagnostico = document.getElementById("diagnostico").value;

    await addDoc(collection(window.db, "ordenes"), {
      numero: "ORD-" + Date.now(),
      estado: "abierta",
      vehiculoId: placa,
      diagnostico,
      valorTrabajo: 0,

      creadoEn: serverTimestamp(),

      historialEstados: [
        {
          estado: "abierta",
          fecha: new Date()
        }
      ]
    });

    cargarOrdenes();
  };

  // 🔄 Cambiar estado
  window.cambiarEstado = async (id, nuevoEstado) => {
    const ref = doc(window.db, "ordenes", id);

    await updateDoc(ref, {
      estado: nuevoEstado
    });

    cargarOrdenes();
  };

  // INIT
  cargarOrdenes();
}