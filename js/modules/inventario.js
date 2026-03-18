/**
 * inventario.js
 * Inventario Inteligente + IA + Alertas + Movimientos
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
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";
import { hablar } from "../voice/voiceCore.js";

export default async function inventarioModule(container, state) {
  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 10px #0ff;">📦 Inventario Inteligente PRO360</h1>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
      <input id="nombre" placeholder="Nombre repuesto" style="flex:2; padding:8px; border-radius:6px;"/>
      <input id="stock" placeholder="Stock inicial" type="number" style="flex:1; padding:8px; border-radius:6px;"/>
      <input id="minimo" placeholder="Stock mínimo" type="number" style="flex:1; padding:8px; border-radius:6px;"/>
      <input id="compra" placeholder="Precio compra" type="number" style="flex:1; padding:8px; border-radius:6px;"/>
      <input id="venta" placeholder="Precio venta" type="number" style="flex:1; padding:8px; border-radius:6px;"/>
      <button id="crear" style="flex:1; background:#16a34a; border-radius:6px; font-weight:bold;">➕ Crear Repuesto</button>
    </div>

    <div id="alertas" style="margin-bottom:15px;"></div>
    <div id="lista"></div>
    <div id="advisorInventario" style="margin-top:20px;"></div>
  `;

  const lista = document.getElementById("lista");
  const alertasDiv = document.getElementById("alertas");

  let repuestos = [];

  // 🔄 Cargar inventario
  async function cargarInventario() {
    try {
      const q = query(
        collection(window.db,"repuestos"),
        where("empresaId","==",state.empresaId),
        orderBy("creadoEn","desc")
      );
      const snap = await getDocs(q);
      repuestos = [];
      let alertas = [];

      snap.forEach(docSnap=>{
        const r = docSnap.data();
        const id = docSnap.id;
        repuestos.push({ id, ...r });

        // ⚠️ Alertas de stock
        const stock = Number(r.stock || 0);
        const minimo = Number(r.stockMinimo || 0);
        if(stock <= minimo){
          alertas.push(`⚠️ Bajo stock: ${r.nombre}`);
        }
      });

      renderLista(repuestos);
      renderAlertas(alertas);

      // 🔮 IA: sugerencias de compra/venta
      const sugerencias = await generarSugerencias({ inventario: repuestos, empresaId: state.empresaId });
      renderSugerencias("advisorInventario", sugerencias);

    } catch(e){
      console.error(e);
      lista.innerHTML="❌ Error cargando inventario";
    }
  }

  // 🎨 Render lista de repuestos
  function renderLista(data){
    lista.innerHTML = data.map(r=>`
      <div style="background:#111;padding:15px;margin:10px 0;border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          📦 <strong>${r.nombre}</strong> <br/>
          Stock: ${r.stock || 0} | Min: ${r.stockMinimo || 0} <br/>
          💰 Compra: $${formatear(r.precioCompra)} | Venta: $${formatear(r.precioVenta)}
        </div>
        <div style="display:flex; gap:5px;">
          <button data-id="${r.id}" class="entrada" style="background:#0ff; border:none; border-radius:6px; padding:6px;">➕</button>
          <button data-id="${r.id}" class="salida" style="background:#f00; border:none; border-radius:6px; padding:6px;">➖</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".entrada").forEach(btn=>{
      btn.onclick=()=>agregarStock(btn.dataset.id);
    });
    document.querySelectorAll(".salida").forEach(btn=>{
      btn.onclick=()=>usarStock(btn.dataset.id);
    });
  }

  // 🚨 Alertas de stock
  function renderAlertas(alertas){
    if(alertas.length > 0){
      alertasDiv.innerHTML = `
        <h3 style="color:#ff4d4d;">🚨 Alertas de Inventario</h3>
        ${alertas.map(a=>`<div>${a}</div>`).join("")}
      `;
      hablar("⚠️ Algunos repuestos están bajo stock");
    } else {
      alertasDiv.innerHTML = `<h3>✅ Stock OK</h3>`;
    }
  }

  // ➕ Crear repuesto
  document.getElementById("crear").onclick = async ()=>{
    const nombre = document.getElementById("nombre").value.trim();
    const stock = Number(document.getElementById("stock").value) || 0;
    const minimo = Number(document.getElementById("minimo").value) || 0;
    const compra = Number(document.getElementById("compra").value) || 0;
    const venta = Number(document.getElementById("venta").value) || 0;

    if(!nombre){ alert("Nombre obligatorio"); return; }

    try {
      await addDoc(collection(window.db,"repuestos"),{
        empresaId: state.empresaId,
        nombre,
        stock,
        stockMinimo:minimo,
        precioCompra:compra,
        precioVenta:venta,
        creadoEn:new Date()
      });

      ["nombre","stock","minimo","compra","venta"].forEach(id=>document.getElementById(id).value="");
      hablar("✅ Repuesto creado correctamente");
      cargarInventario();
    } catch(e){ console.error(e); alert("❌ Error creando repuesto"); }
  };

  // ➕ Entrada de stock
  async function agregarStock(id){
    const cantidad = Number(prompt("Cantidad a ingresar:"));
    if(!cantidad || cantidad<=0) return;

    try {
      await updateDoc(doc(window.db,"repuestos",id), { stock: increment(cantidad) });
      await addDoc(collection(window.db,"movimientosInventario"),{
        empresaId: state.empresaId,
        repuestoId:id,
        tipo:"entrada",
        cantidad,
        fecha:new Date()
      });
      hablar(`✅ Se agregaron ${cantidad} unidades`);
      cargarInventario();
    } catch(e){ console.error(e); alert("❌ Error actualizando stock"); }
  }

  // ➖ Salida de stock
  async function usarStock(id){
    const cantidad = Number(prompt("Cantidad a usar:"));
    if(!cantidad || cantidad<=0) return;

    try {
      await updateDoc(doc(window.db,"repuestos",id), { stock: increment(-cantidad) });
      await addDoc(collection(window.db,"movimientosInventario"),{
        empresaId: state.empresaId,
        repuestoId:id,
        tipo:"salida",
        cantidad,
        fecha:new Date()
      });
      hablar(`✅ Se descontaron ${cantidad} unidades`);
      cargarInventario();
    } catch(e){ console.error(e); alert("❌ Error descontando stock"); }
  }

  // 💰 Formatear dinero
  function formatear(valor){
    return new Intl.NumberFormat("es-CO").format(valor||0);
  }

  // INIT
  cargarInventario();
}