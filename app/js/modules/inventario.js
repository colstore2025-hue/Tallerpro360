/**
 * inventario.js - CRM PRO360
 * Gestión de Stock y Repuestos
 */
import { 
  collection, getDocs, addDoc, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function inventarioModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div style="padding:20px; background:#0a0f1a; min-height:100vh; color:white;">
      <h1 style="color:#facc15; font-size:28px; font-weight:900;">📦 Inventario</h1>
      
      <div style="background:#0f172a; padding:15px; border-radius:12px; margin-bottom:20px; border:1px solid #1e293b;">
        <input id="prodNombre" placeholder="Nombre del repuesto" style="width:100%; padding:12px; margin-bottom:10px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:8px;"/>
        <div style="display:flex; gap:10px;">
          <input id="prodStock" type="number" placeholder="Cant." style="flex:1; padding:12px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:8px;"/>
          <input id="prodPrecio" type="number" placeholder="Precio" style="flex:2; padding:12px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:8px;"/>
        </div>
        <button id="btnGuardarProd" style="width:100%; margin-top:10px; background:#facc15; color:#000; font-weight:bold; padding:12px; border:none; border-radius:8px;">➕ AGREGAR PRODUCTO</button>
      </div>

      <div id="listaInventario"></div>
    </div>
  `;

  async function cargarInventario() {
    const listado = document.getElementById("listaInventario");
    listado.innerHTML = "⌛ Cargando almacén...";
    try {
      const q = query(collection(db, `empresas/${empresaId}/inventario`), orderBy("nombre", "asc"));
      const snap = await getDocs(q);
      
      if(snap.empty) {
        listado.innerHTML = "<p style='color:#64748b;'>No hay productos en stock.</p>";
        return;
      }

      listado.innerHTML = snap.docs.map(doc => {
        const item = doc.data();
        const colorStock = item.cantidad < 5 ? "#ef4444" : "#22c55e";
        return `
          <div style="background:#111827; padding:15px; margin-bottom:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:bold;">${item.nombre}</div>
              <div style="font-size:12px; color:#94a3b8;">Precio: $${item.precio || 0}</div>
            </div>
            <div style="text-align:right;">
              <span style="color:${colorStock}; font-weight:bold; font-size:18px;">${item.cantidad}</span>
              <div style="font-size:10px; color:#64748b;">UND</div>
            </div>
          </div>
        `;
      }).join("");
    } catch(e) {
      listado.innerHTML = "❌ Error al cargar inventario.";
    }
  }

  document.getElementById("btnGuardarProd").onclick = async () => {
    const nombre = document.getElementById("prodNombre").value;
    const cantidad = Number(document.getElementById("prodStock").value);
    const precio = Number(document.getElementById("prodPrecio").value);

    if(!nombre || isNaN(cantidad)) return;

    try {
      await addDoc(collection(db, `empresas/${empresaId}/inventario`), {
        nombre, cantidad, precio, actualizadoEn: serverTimestamp()
      });
      hablar("Producto registrado en almacén");
      cargarInventario();
    } catch(e) { alert("Error al guardar"); }
  };

  cargarInventario();
}
