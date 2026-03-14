/**
 * ordenes.js
 * Órdenes de trabajo con repuestos
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";
import { calcularUtilidadOrden } from "../finanzas/calcularUtilidadOrden.js";
import { generarFactura } from "../finanzas/generarFactura.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


let inventario = [];
let itemsOrden = [];


export async function ordenes(container){

  container.innerHTML = `

<h1 style="font-size:26px;margin-bottom:20px;">
🛠 Órdenes de Trabajo
</h1>

<div class="card">
<h3>Datos de la Orden</h3>
<input id="clienteOrden" placeholder="Cliente"
style="width:100%;padding:10px;margin:6px 0;background:#020617;color:white;border:1px solid #333;border-radius:6px;">
<input id="vehiculoOrden" placeholder="Vehículo"
style="width:100%;padding:10px;margin:6px 0;background:#020617;color:white;border:1px solid #333;border-radius:6px;">
<textarea id="diagnosticoOrden"
placeholder="Diagnóstico"
style="width:100%;padding:10px;margin:6px 0;background:#020617;color:white;border:1px solid #333;border-radius:6px;"></textarea>
</div>

<div class="card">
<h3>Agregar Repuesto</h3>
<select id="productoSelect"
style="width:100%;padding:10px;margin:6px 0;background:#020617;color:white;border:1px solid #333;border-radius:6px;">
</select>
<input id="cantidadProducto"
type="number"
placeholder="Cantidad"
style="width:100%;padding:10px;margin:6px 0;background:#020617;color:white;border:1px solid #333;border-radius:6px;">
<button id="agregarProducto"
style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">
Agregar
</button>
</div>

<div class="card">
<h3>Mano de obra</h3>
<input id="manoObra"
type="number"
placeholder="Valor mano de obra"
style="width:100%;padding:10px;background:#020617;color:white;border:1px solid #333;border-radius:6px;">
</div>

<div class="card">
<h3>Items de la Orden</h3>
<div id="itemsOrden"></div>
<h2 id="totalOrden">Total: $0</h2>
<button id="guardarOrden"
style="margin-top:10px;padding:12px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">
Guardar Orden
</button>
</div>
`;

  await cargarInventario();

  document.getElementById("agregarProducto").onclick = agregarProducto;
  document.getElementById("guardarOrden").onclick = guardarOrden;

}


/* ===============================
CARGAR INVENTARIO
=============================== */
async function cargarInventario(){
  const select = document.getElementById("productoSelect");
  const querySnapshot = await getDocs(collection(db,"inventario"));
  inventario = [];
  select.innerHTML = "";

  querySnapshot.forEach(doc=>{
    const data = doc.data();
    inventario.push(data);
    const option = document.createElement("option");
    option.value = inventario.length - 1;
    option.textContent = `${data.nombre} ($${data.precio})`;
    select.appendChild(option);
  });
}


/* ===============================
AGREGAR PRODUCTO
=============================== */
function agregarProducto(){
  const index = document.getElementById("productoSelect").value;
  const cantidad = Number(document.getElementById("cantidadProducto").value);
  if(cantidad <= 0) return alert("Ingrese cantidad válida");

  const producto = inventario[index];
  const total = producto.precio * cantidad;

  itemsOrden.push({
    nombre: producto.nombre,
    costoInterno: producto.costo || 0,
    precio: producto.precio,
    cantidad,
    total,
    utilidad: producto.precio - (producto.costo || 0)
  });

  renderItems();
}


/* ===============================
RENDER ITEMS
=============================== */
function renderItems(){
  const container = document.getElementById("itemsOrden");
  let html = `<table style="width:100%">
  <tr>
    <th>Producto</th>
    <th>Cant</th>
    <th>Precio</th>
    <th>Total</th>
  </tr>`;

  let total = 0;
  itemsOrden.forEach(item=>{
    total += item.total;
    html += `
    <tr>
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.precio}</td>
      <td>$${item.total}</td>
    </tr>`;
  });

  const manoObra = Number(document.getElementById("manoObra").value || 0);
  total += manoObra;

  html += "</table>";
  container.innerHTML = html;
  document.getElementById("totalOrden").innerText = "Total: $" + total;
}


/* ===============================
GUARDAR ORDEN
=============================== */
async function guardarOrden(){
  const cliente = document.getElementById("clienteOrden").value;
  const vehiculo = document.getElementById("vehiculoOrden").value;
  const diagnostico = document.getElementById("diagnosticoOrden").value;
  const manoObra = Number(document.getElementById("manoObra").value || 0);

  if(!cliente || !vehiculo) return alert("Complete cliente y vehículo");

  let total = itemsOrden.reduce((s,i)=>s+i.total,0) + manoObra;

  const nuevaOrden = {
    cliente,
    vehiculo,
    diagnostico,
    acciones: itemsOrden,
    manoObra,
    total,
    fecha: new Date()
  };

  try{
    await addDoc(collection(db,"ordenes"), nuevaOrden);
    alert("✅ Orden guardada");

    // Calcular utilidad y generar factura
    const utilidad = calcularUtilidadOrden(nuevaOrden);
    console.log("Utilidad calculada:", utilidad);
    generarFactura(nuevaOrden);

    // Limpiar orden
    itemsOrden = [];
    document.getElementById("clienteOrden").value = "";
    document.getElementById("vehiculoOrden").value = "";
    document.getElementById("diagnosticoOrden").value = "";
    document.getElementById("manoObra").value = 0;
    renderItems();

  }catch(e){
    console.error("Error guardando orden:", e);
    alert("❌ Error al guardar la orden");
  }
}