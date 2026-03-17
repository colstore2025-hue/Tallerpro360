import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function (container, state) {

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
  `;

  const lista = document.getElementById("lista");
  const alertasDiv = document.getElementById("alertas");

  async function cargarInventario() {

    const snap = await getDocs(collection(window.db, "repuestos"));

    let html = "";
    let alertas = [];

    snap.forEach(docSnap => {
      const r = docSnap.data();
      const id = docSnap.id;

      if (r.stock <= r.stockMinimo) {
        alertas.push(`⚠️ Bajo stock: ${r.nombre}`);
      }

      html += `
        <div style="background:#111;padding:15px;margin:10px 0;border-radius:10px;">
          📦 ${r.nombre} <br/>
          Stock: ${r.stock} | Min: ${r.stockMinimo} <br/>
          💰 Compra: $${r.precioCompra} | Venta: $${r.precioVenta}
          
          <div style="margin-top:10px;">
            <button onclick="window.agregarStock('${id}')">➕ Entrada</button>
            <button onclick="window.usarStock('${id}')">➖ Salida</button>
          </div>
        </div>
      `;
    });

    lista.innerHTML = html;

    // Alertas
    if (alertas.length > 0) {
      alertasDiv.innerHTML = `
        <h3 style="color:#ff4d4d;">🚨 Alertas</h3>
        ${alertas.map(a => `<div>${a}</div>`).join("")}
      `;
    } else {
      alertasDiv.innerHTML = `<h3>✅ Stock OK</h3>`;
    }
  }

  // Crear repuesto
  document.getElementById("crear").onclick = async () => {

    const nombre = document.getElementById("nombre").value;
    const stock = Number(document.getElementById("stock").value);
    const minimo = Number(document.getElementById("minimo").value);
    const compra = Number(document.getElementById("compra").value);
    const venta = Number(document.getElementById("venta").value);

    await addDoc(collection(window.db, "repuestos"), {
      nombre,
      stock,
      stockMinimo: minimo,
      precioCompra: compra,
      precioVenta: venta,
      creadoEn: new Date()
    });

    cargarInventario();
  };

  // ➕ Entrada de stock
  window.agregarStock = async (id) => {

    const cantidad = Number(prompt("Cantidad a ingresar:"));

    if (!cantidad) return;

    await updateDoc(doc(window.db, "repuestos", id), {
      stock: increment(cantidad)
    });

    await addDoc(collection(window.db, "movimientosInventario"), {
      repuestoId: id,
      tipo: "entrada",
      cantidad,
      fecha: new Date()
    });

    cargarInventario();
  };

  // ➖ Salida de stock
  window.usarStock = async (id) => {

    const cantidad = Number(prompt("Cantidad a usar:"));

    if (!cantidad) return;

    await updateDoc(doc(window.db, "repuestos", id), {
      stock: increment(-cantidad)
    });

    await addDoc(collection(window.db, "movimientosInventario"), {
      repuestoId: id,
      tipo: "salida",
      cantidad,
      fecha: new Date()
    });

    cargarInventario();
  };

  // INIT
  cargarInventario();
}