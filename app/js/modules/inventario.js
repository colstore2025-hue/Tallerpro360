/**
 * inventario.js
 * Inventario PRO360 · Producción estable (Modo SaaS limpio 🚀)
 * Integrado con voz y alertas 🔊
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  increment,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;
import { hablar } from "../voice/voiceCore.js";

export default async function inventarioModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `
      <h2 style="color:red;text-align:center;">❌ Empresa no definida</h2>
    `;
    hablar("Error: empresa no definida");
    return;
  }

  const base = `empresas/${state.empresaId}`;
  let repuestos = [];

  /* ================= HTML ================= */
  container.innerHTML = `
    <h1 style="color:#00ffff;font-size:34px;font-weight:900;">📦 Inventario PRO360</h1>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input id="nombre" placeholder="Nombre repuesto" style="flex:2;padding:10px;border-radius:8px;"/>
      <input id="stock" type="number" placeholder="Stock" style="flex:1;padding:10px;border-radius:8px;"/>
      <input id="minimo" type="number" placeholder="Mínimo" style="flex:1;padding:10px;border-radius:8px;"/>
      <input id="compra" type="number" placeholder="Compra" style="flex:1;padding:10px;border-radius:8px;"/>
      <input id="venta" type="number" placeholder="Venta" style="flex:1;padding:10px;border-radius:8px;"/>
      <button id="crear" style="flex:1;background:#22c55e;color:#000;border-radius:8px;">➕ Crear</button>
    </div>

    <div id="alertas" style="margin-bottom:15px;"></div>
    <div id="lista"></div>
  `;

  const lista = document.getElementById("lista");
  const alertasDiv = document.getElementById("alertas");

  /* ================= LOAD ================= */
  async function cargarInventario() {
    lista.innerHTML = "🔄 Cargando inventario...";
    try {
      const snap = await getDocs(
        query(collection(db, `${base}/inventario`), orderBy("creadoEn","desc"))
      );

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

      if (alertas.length) hablar("Alerta: bajo stock en algunos repuestos");

    } catch (e) {
      console.error("🔥 ERROR INVENTARIO:", e);
      lista.innerHTML = `<p style="color:red;text-align:center;">❌ Error cargando inventario</p>`;
      hablar("Error cargando inventario");
    }
  }

  /* ================= RENDER ================= */
  function renderLista(data) {
    if (!data.length) {
      lista.innerHTML = `<p style="text-align:center;">📭 Sin repuestos</p>`;
      return;
    }

    lista.innerHTML = data.map(r => `
      <div style="
        background:#111827;
        padding:15px;
        margin:10px 0;
        border-radius:12px;
        display:flex;
        justify-content:space-between;
        align-items:center;
        border:1px solid #1f2937;
      ">
        <div>
          📦 <strong>${r.nombre}</strong><br/>
          Stock: ${r.stock || 0} | Min: ${r.stockMinimo || 0}<br/>
          💰 Compra: $${fmt(r.precioCompra)} | Venta: $${fmt(r.precioVenta)}
        </div>

        <div style="display:flex;gap:5px;">
          <button data-id="${r.id}" class="entrada" style="background:#00ffff;border:none;border-radius:6px;padding:6px;">➕</button>
          <button data-id="${r.id}" class="salida" style="background:#ef4444;border:none;border-radius:6px;padding:6px;">➖</button>
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

  /* ================= ALERTAS ================= */
  function renderAlertas(alertas) {
    if (alertas.length) {
      alertasDiv.innerHTML = `
        <h3 style="color:#ef4444;">🚨 Alertas</h3>
        ${alertas.map(a => `<div>${a}</div>`).join("")}
      `;
    } else {
      alertasDiv.innerHTML = `<h3>✅ Stock OK</h3>`;
    }
  }

  /* ================= CREAR ================= */
  document.getElementById("crear").onclick = async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const stock = Number(document.getElementById("stock").value) || 0;
    const minimo = Number(document.getElementById("minimo").value) || 0;
    const compra = Number(document.getElementById("compra").value) || 0;
    const venta = Number(document.getElementById("venta").value) || 0;

    if (!nombre) {
      alert("Nombre obligatorio");
      hablar("Nombre obligatorio para crear repuesto");
      return;
    }

    try {
      await addDoc(collection(db, `${base}/inventario`), {
        nombre,
        stock,
        stockMinimo: minimo,
        precioCompra: compra,
        precioVenta: venta,
        creadoEn: new Date()
      });

      ["nombre","stock","minimo","compra","venta"].forEach(id => document.getElementById(id).value = "");
      hablar("Repuesto creado");
      cargarInventario();

    } catch (e) {
      console.error(e);
      alert("Error creando repuesto");
      hablar("Error creando repuesto");
    }
  };

  /* ================= ENTRADA ================= */
  async function agregarStock(id) {
    const cantidad = Number(prompt("Cantidad a ingresar:"));
    if (!cantidad || cantidad <= 0) return;

    try {
      await updateDoc(doc(db, `${base}/inventario`, id), { stock: increment(cantidad) });
      await addDoc(collection(db, `${base}/movimientosInventario`), {
        repuestoId: id,
        tipo: "entrada",
        cantidad,
        fecha: new Date()
      });
      hablar(`Stock aumentado en ${cantidad}`);
      cargarInventario();
    } catch (e) {
      console.error(e);
      alert("Error actualizando stock");
      hablar("Error actualizando stock");
    }
  }

  /* ================= SALIDA ================= */
  async function usarStock(id) {
    const cantidad = Number(prompt("Cantidad a usar:"));
    if (!cantidad || cantidad <= 0) return;

    try {
      await updateDoc(doc(db, `${base}/inventario`, id), { stock: increment(-cantidad) });
      await addDoc(collection(db, `${base}/movimientosInventario`), {
        repuestoId: id,
        tipo: "salida",
        cantidad,
        fecha: new Date()
      });
      hablar(`Stock descontado en ${cantidad}`);
      cargarInventario();
    } catch (e) {
      console.error(e);
      alert("Error descontando stock");
      hablar("Error descontando stock");
    }
  }

  /* ================= UTILS ================= */
  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v||0); }

  /* ================= INIT ================= */
  cargarInventario();
}