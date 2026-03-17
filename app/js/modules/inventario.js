/**
 * inventario.js
 * Inventario inteligente + IA
 * TallerPRO360 ERP SaaS
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  increment,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";

export default async function inventarioModule(container, state) {

  container.innerHTML = `
    <h1>📦 Inventario Inteligente</h1>

    <div style="margin-bottom:20px;">
      <input id="nombre" placeholder="Nombre repuesto"/>
      <input id="stock" placeholder="Stock inicial" type="number"/>
      <input id="minimo" placeholder="Stock mínimo" type="number"/>
      <input id="compra" placeholder="Precio compra" type="number"/>
      <input id="venta" placeholder="Precio venta" type="number"/>
      <button id="crear">Crear Repuesto</button>
    </div>

    <div id="alertas"></div>
    <div id="lista"></div>
    <div id="advisorInventario"></div>
  `;

  const lista = document.getElementById("lista");
  const alertasDiv = document.getElementById("alertas");

  let repuestos = [];

  // 🔄 Cargar inventario (SaaS)
  async function cargarInventario() {
    try {
      const q = query(
        collection(window.db, "repuestos"),
        where("empresaId", "==", state.empresaId)
      );

      const snap = await getDocs(q);

      repuestos = [];
      let alertas = [];

      snap.forEach(docSnap => {
        const r = docSnap.data();
        const id = docSnap.id;
        repuestos.push({ id, ...r });

        const stock = Number(r.stock || 0);
        const minimo = Number(r.stockMinimo || 0);

        if (stock <= minimo) {
          alertas.push(`⚠️ Bajo stock: ${r.nombre}`);
        }
      });

      renderLista(repuestos);
      renderAlertas(alertas);

      // 🔮 IA sugerencias
      const sugerencias = await generarSugerencias({ inventario: repuestos });
      renderSugerencias("advisorInventario", sugerencias);

    } catch (e) {
      console.error(e);
      lista.innerHTML = "❌ Error cargando inventario";
    }
  }

  // 🎨 Render lista de repuestos
  function renderLista(data) {
    lista.innerHTML = data.map(r => `
      <div style="background:#111;padding:15px;margin:10px 0;border-radius:10px;">
        📦 ${r.nombre} <br/>
        Stock: ${r.stock || 0} | Min: ${r.stockMinimo || 0} <br/>
        💰 Compra: $${formatear(r.precioCompra)} | Venta: $${formatear(r.precioVenta)}

        <div style="margin-top:10px;">
          <button data-id="${r.id}" class="entrada">➕ Entrada</button>
          <button data-id="${r.id}" class="salida">➖ Salida</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".entrada").forEach(btn => {
      btn.onclick = () => agregarStock(btn.dataset.id);
    });

    document.querySelectorAll(".salida").forEach(btn => {
      btn.onclick = () => usarStock(btn.dataset.id);
    });
  }

  // 🚨 Alertas de stock
  function renderAlertas(alertas) {
    if (alertas.length > 0) {
      alertasDiv.innerHTML = `
        <h3 style="color:#ff4d4d;">🚨 Alertas</h3>
        ${alertas.map(a => `<div>${a}</div>`).join("")}
      `;
    } else {
      alertasDiv.innerHTML = `<h3>✅ Stock OK</h3>`;
    }
  }

  // ➕ Crear repuesto
  document.getElementById("crear").onclick = async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const stock = Number(document.getElementById("stock").value) || 0;
    const minimo = Number(document.getElementById("minimo").value) || 0;
    const compra = Number(document.getElementById("compra").value) || 0;
    const venta = Number(document.getElementById("venta").value) || 0;

    if (!nombre) {
      alert("Nombre obligatorio");
      return;
    }

    try {
      await addDoc(collection(window.db, "repuestos"), {
        empresaId: state.empresaId,
        nombre,
        stock,
        stockMinimo: minimo,
        precioCompra: compra,
        precioVenta: venta,
        creadoEn: new Date()
      });

      limpiarInputs();
      cargarInventario();
    } catch (e) {
      console.error(e);
      alert("❌ Error creando repuesto");
    }
  };

  function limpiarInputs() {
    ["nombre","stock","minimo","compra","venta"].forEach(id => {
      document.getElementById(id).value = "";
    });
  }

  // ➕ Entrada de stock
  async function agregarStock(id) {
    const cantidad = Number(prompt("Cantidad a ingresar:"));
    if (!cantidad || cantidad <= 0) return;

    try {
      await updateDoc(doc(window.db, "repuestos", id), {
        stock: increment(cantidad)
      });

      await addDoc(collection(window.db, "movimientosInventario"), {
        empresaId: state.empresaId,
        repuestoId: id,
        tipo: "entrada",
        cantidad,
        fecha: new Date()
      });

      cargarInventario();
    } catch (e) {
      console.error(e);
      alert("❌ Error actualizando stock");
    }
  }

  // ➖ Salida de stock
  async function usarStock(id) {
    const cantidad = Number(prompt("Cantidad a usar:"));
    if (!cantidad || cantidad <= 0) return;

    try {
      await updateDoc(doc(window.db, "repuestos", id), {
        stock: increment(-cantidad)
      });

      await addDoc(collection(window.db, "movimientosInventario"), {
        empresaId: state.empresaId,
        repuestoId: id,
        tipo: "salida",
        cantidad,
        fecha: new Date()
      });

      cargarInventario();
    } catch (e) {
      console.error(e);
      alert("❌ Error descontando stock");
    }
  }

  // INIT
  cargarInventario();
}

// 💰 Formatear dinero
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}