/**
 * 📦 INVENTARIO INTELIGENTE PRO360
 * Última Generación
 * Autor: PRO360 / Nexus-Starlink SAS
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
    <h1 style="color:#0ff;text-shadow:0 0 8px #0ff;">📦 Inventario Inteligente PRO360</h1>

    <div style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
      <input id="nombre" placeholder="Nombre repuesto" style="flex:2;padding:8px;border-radius:6px;border:none;"/>
      <input id="stock" placeholder="Stock inicial" type="number" style="flex:1;padding:8px;border-radius:6px;border:none;"/>
      <input id="minimo" placeholder="Stock mínimo" type="number" style="flex:1;padding:8px;border-radius:6px;border:none;"/>
      <input id="compra" placeholder="Precio compra" type="number" style="flex:1;padding:8px;border-radius:6px;border:none;"/>
      <input id="venta" placeholder="Precio venta" type="number" style="flex:1;padding:8px;border-radius:6px;border:none;"/>
      <button id="crear" style="flex:1;background:#16a34a;color:#000;font-weight:bold;border-radius:6px;">➕ Crear</button>
    </div>

    <div id="alertas" style="margin-bottom:15px;"></div>
    <div id="lista"></div>
    <div id="advisorInventario" style="margin-top:20px;"></div>
  `;

  const lista = document.getElementById("lista");
  const alertasDiv = document.getElementById("alertas");
  const advisorPanel = document.getElementById("advisorInventario");

  let repuestos = [];

  // 🔄 Cargar inventario (multi-empresa)
  async function cargarInventario() {
    try {
      const q = query(collection(db, "repuestos"), where("empresaId", "==", state.empresaId));
      const snap = await getDocs(q);

      repuestos = [];
      let alertas = [];

      snap.forEach(docSnap => {
        const r = docSnap.data();
        const id = docSnap.id;
        repuestos.push({ id, ...r });

        const stock = Number(r.stock || 0);
        const minimo = Number(r.stockMinimo || 0);
        if (stock <= minimo) alertas.push(`⚠️ Bajo stock: ${r.nombre}`);
      });

      renderLista(repuestos);
      renderAlertas(alertas);

      // 🔮 Sugerencias IA inventario
      const sugerencias = await generarSugerencias({ inventario: repuestos, empresaId: state.empresaId });
      renderSugerencias("advisorInventario", sugerencias);

    } catch (e) {
      console.error(e);
      lista.innerHTML = "❌ Error cargando inventario";
    }
  }

  // 🎨 Render lista repuestos
  function renderLista(data) {
    lista.innerHTML = data.map(r => `
      <div style="
        background:#111;padding:15px;margin:10px 0;
        border-radius:10px;box-shadow:0 0 10px #0ff33c40;
      ">
        📦 ${r.nombre} <br/>
        Stock: ${r.stock || 0} | Mín: ${r.stockMinimo || 0} <br/>
        💰 Compra: $${formatear(r.precioCompra)} | Venta: $${formatear(r.precioVenta)}

        <div style="margin-top:10px; display:flex; gap:5px;">
          <button data-id="${r.id}" class="entrada" style="flex:1;background:#0ff;border:none;border-radius:6px;">➕ Entrada</button>
          <button data-id="${r.id}" class="salida" style="flex:1;background:#ff0044;border:none;border-radius:6px;">➖ Salida</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".entrada").forEach(btn => btn.onclick = () => agregarStock(btn.dataset.id));
    document.querySelectorAll(".salida").forEach(btn => btn.onclick = () => usarStock(btn.dataset.id));
  }

  // 🚨 Render alertas
  function renderAlertas(alertas) {
    if (alertas.length > 0) {
      alertasDiv.innerHTML = `
        <h3 style="color:#ff4d4d;text-shadow:0 0 6px #ff4d4d;">🚨 Alertas</h3>
        ${alertas.map(a => `<div style="margin-left:10px;">${a}</div>`).join("")}
      `;
    } else {
      alertasDiv.innerHTML = `<h3 style="color:#0ff;">✅ Stock OK</h3>`;
    }
  }

  // ➕ Crear repuesto
  document.getElementById("crear").onclick = async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const stock = Number(document.getElementById("stock").value) || 0;
    const minimo = Number(document.getElementById("minimo").value) || 0;
    const compra = Number(document.getElementById("compra").value) || 0;
    const venta = Number(document.getElementById("venta").value) || 0;

    if (!nombre) { alert("Nombre obligatorio"); return; }

    try {
      await addDoc(collection(db, "repuestos"), {
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
    ["nombre","stock","minimo","compra","venta"].forEach(id => document.getElementById(id).value = "");
  }

  // ➕ Entrada de stock
  async function agregarStock(id) {
    const cantidad = Number(prompt("Cantidad a ingresar:")) || 0;
    if (cantidad <= 0) return;

    try {
      await updateDoc(doc(db, "repuestos", id), { stock: increment(cantidad) });
      await addDoc(collection(db, "movimientosInventario"), {
        empresaId: state.empresaId,
        repuestoId: id,
        tipo: "entrada",
        cantidad,
        fecha: new Date()
      });
      cargarInventario();
    } catch(e) {
      console.error(e);
      alert("❌ Error actualizando stock");
    }
  }

  // ➖ Salida de stock
  async function usarStock(id) {
    const cantidad = Number(prompt("Cantidad a usar:")) || 0;
    if (cantidad <= 0) return;

    try {
      await updateDoc(doc(db, "repuestos", id), { stock: increment(-cantidad) });
      await addDoc(collection(db, "movimientosInventario"), {
        empresaId: state.empresaId,
        repuestoId: id,
        tipo: "salida",
        cantidad,
        fecha: new Date()
      });
      cargarInventario();
    } catch(e) {
      console.error(e);
      alert("❌ Error descontando stock");
    }
  }

  // 💰 Formatear dinero
  function formatear(valor) {
    return new Intl.NumberFormat("es-CO").format(valor || 0);
  }

  // INIT
  cargarInventario();
}