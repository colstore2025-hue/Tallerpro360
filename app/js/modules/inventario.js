/**
 * inventario.js
 * Módulo Inventario PRO360 · ULTRA NASA/TESLA 🔥
 * Integración completa con Guardian Dios y Orquestador Supremo
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

import { hablar } from "../voice/voiceCore.js";
import { activarModoDiosGuardian } from "../ai/firestoreGuardianGod.js";

export default async function inventarioModule(container, state) {
  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red;text-align:center;">❌ empresaId no definido</h2>`;
    return;
  }

  let repuestos = [];

  container.innerHTML = `
    <h1 style="color:#00ffff;font-size:34px;font-weight:900;">
      📦 Inventario PRO360
    </h1>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input id="nombreRepuesto" placeholder="Nombre repuesto"
        style="flex:2;padding:10px;border-radius:8px;"/>
      <input id="precioCompra" placeholder="Precio compra"
        style="flex:1;padding:10px;border-radius:8px;"/>
      <input id="precioVenta" placeholder="Precio venta"
        style="flex:1;padding:10px;border-radius:8px;"/>
      <input id="stockMinimo" placeholder="Stock mínimo"
        style="flex:1;padding:10px;border-radius:8px;"/>
      <button id="crearRepuesto"
        style="flex:1;background:#22c55e;color:#000;border-radius:8px;">
        ➕ Crear
      </button>
    </div>

    <input id="busquedaRepuesto"
      placeholder="Buscar repuesto..."
      style="width:100%;padding:12px;margin-bottom:15px;border-radius:8px;"/>

    <div id="listaRepuestos"></div>
  `;

  const lista = document.getElementById("listaRepuestos");

  /* ================= CARGAR ================= */
  async function cargarRepuestos() {
    lista.innerHTML = "🔄 Cargando repuestos...";

    try {
      const snap = await getDocs(
        collection(db, `empresas/${state.empresaId}/repuestos`)
      );

      repuestos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      repuestos.sort((a,b) => (a.nombre || "").localeCompare(b.nombre));

      renderRepuestos(repuestos);

      // 🔹 Activar modo Dios sobre este módulo
      activarModoDiosGuardian(state.empresaId);

    } catch(e) {
      console.error("🔥 ERROR REPUESTOS:", e);
      lista.innerHTML = `<p style="color:red;text-align:center;">❌ Error cargando repuestos</p>`;
    }
  }

  /* ================= RENDER ================= */
  function renderRepuestos(data) {
    if (!data.length) {
      lista.innerHTML = `<p style="text-align:center;">📭 Sin repuestos</p>`;
      return;
    }

    lista.innerHTML = data.map(r => `
      <div class="repuestoItem" data-id="${r.id}"
        style="background:#111827;padding:12px;margin:8px 0;border-radius:12px;display:flex;justify-content:space-between;align-items:center;border:1px solid #1f2937;cursor:pointer;">
        <span>${r.nombre || "Sin nombre"} | 💰 ${fmt(r.precioVenta)} | 📦 ${r.stock || 0}</span>
        <button class="editarBtn" style="background:#00ffff;border:none;border-radius:6px;padding:4px 8px;">✏️ Editar</button>
      </div>
    `).join("");

    document.querySelectorAll(".editarBtn").forEach(btn => {
      btn.onclick = e => {
        const id = btn.parentElement.dataset.id;
        editarRepuesto(id);
        e.stopPropagation();
      };
    });
  }

  /* ================= BUSCAR ================= */
  document.getElementById("busquedaRepuesto").oninput = e => {
    const texto = e.target.value.toLowerCase();
    const filtrados = repuestos.filter(r => (r.nombre || "").toLowerCase().includes(texto));
    renderRepuestos(filtrados);
  };

  /* ================= CREAR ================= */
  document.getElementById("crearRepuesto").onclick = async () => {
    const nombre = document.getElementById("nombreRepuesto").value.trim();
    const precioCompra = parseFloat(document.getElementById("precioCompra").value) || 0;
    const precioVenta = parseFloat(document.getElementById("precioVenta").value) || 0;
    const stockMinimo = parseInt(document.getElementById("stockMinimo").value) || 0;

    if (!nombre) return alert("Nombre obligatorio");

    try {
      await addDoc(collection(db, `empresas/${state.empresaId}/repuestos`), {
        nombre,
        precioCompra,
        precioVenta,
        stockMinimo,
        stock: 0,
        creadoEn: new Date()
      });

      hablar("Repuesto creado");

      ["nombreRepuesto","precioCompra","precioVenta","stockMinimo"].forEach(id => document.getElementById(id).value = "");

      cargarRepuestos();
    } catch(e) {
      console.error(e);
      alert("Error creando repuesto");
    }
  };

  /* ================= EDITAR ================= */
  async function editarRepuesto(id) {
    const r = repuestos.find(x => x.id === id);
    if (!r) return;

    const nombre = prompt("Nombre:", r.nombre) || r.nombre;
    const precioCompra = parseFloat(prompt("Precio compra:", r.precioCompra)) || r.precioCompra;
    const precioVenta = parseFloat(prompt("Precio venta:", r.precioVenta)) || r.precioVenta;
    const stockMinimo = parseInt(prompt("Stock mínimo:", r.stockMinimo)) || r.stockMinimo;

    await updateDoc(doc(db, `empresas/${state.empresaId}/repuestos`, id), {
      nombre, precioCompra, precioVenta, stockMinimo
    });

    hablar("Repuesto actualizado");
    cargarRepuestos();
  }

  /* ================= UTILS ================= */
  function fmt(v) {
    return new Intl.NumberFormat("es-CO").format(v || 0);
  }

  /* ================= INIT ================= */
  cargarRepuestos();
}