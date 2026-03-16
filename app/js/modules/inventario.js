/*
================================================
INVENTARIO.JS - Versión Final
Gestión avanzada de inventario con voz - TallerPRO360
Ubicación: /app/js/modules/inventario.js
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function inventario(container) {

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">📦 Inventario Avanzado</h1>

<div class="card">
  <h3>Nuevo Producto</h3>
  <input id="productoNombre" placeholder="Nombre del producto" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <input id="productoCosto" placeholder="Costo compra" type="number" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <input id="productoMargen" placeholder="Margen utilidad (%)" type="number" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <input id="productoStock" placeholder="Stock inicial" type="number" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <button id="vozProducto" style="margin-top:10px;padding:10px 20px;background:#6366f1;border:none;border-radius:6px;color:white;cursor:pointer;">🎙 Dictar Producto</button>
  <button id="guardarProducto" style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Guardar Producto</button>
</div>

<div class="card">
  <h3>Buscar Producto</h3>
  <input id="buscarProducto" placeholder="Buscar por nombre..." style="width:100%;padding:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
</div>

<div class="card">
  <h3>Inventario del Taller</h3>
  <div id="listaInventario">Cargando inventario...</div>
</div>
`;

  // Eventos
  document.getElementById("guardarProducto").onclick = guardarProducto;
  document.getElementById("buscarProducto").oninput = filtrarInventario;
  document.getElementById("vozProducto").onclick = dictarProductoVoz;

  // Cargar inventario
  await cargarInventario();
}

/* ===========================
GUARDAR / EDITAR PRODUCTO
=========================== */
async function guardarProducto(editId = null) {
  const nombre = document.getElementById("productoNombre").value.trim();
  const costo = Number(document.getElementById("productoCosto").value);
  const margen = Number(document.getElementById("productoMargen").value);
  const stock = Number(document.getElementById("productoStock").value);

  if(!nombre) return alert("Nombre requerido");
  if(costo <= 0) return alert("Costo inválido");
  if(margen < 0) return alert("Margen inválido");
  if(stock < 0) return alert("Stock inválido");

  const precio = costo + (costo * margen / 100);

  try{
    if(editId){
      const ref = doc(db,"inventario",editId);
      await updateDoc(ref,{nombre,costo,margen,precio,stock});
      hablar("Producto actualizado exitosamente");
    } else {
      await addDoc(collection(db,"inventario"),{nombre,costo,margen,precio,stock,fecha: new Date()});
      hablar("Producto guardado exitosamente");
    }
    limpiarFormulario();
    await cargarInventario();
  }catch(e){
    console.error("Error guardando producto:", e);
    hablar("Ocurrió un error al guardar el producto");
    alert("❌ Error guardando producto");
  }
}

/* ===========================
CARGAR INVENTARIO
=========================== */
async function cargarInventario() {
  const lista = document.getElementById("listaInventario");
  try{
    const snapshot = await getDocs(query(collection(db,"inventario"), orderBy("fecha","desc")));
    if(snapshot.empty){ lista.innerHTML = "No hay productos registrados"; return; }

    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;">
        <th>Producto</th><th>Costo</th><th>Margen</th><th>Precio</th><th>Stock</th><th>Acciones</th>
      </tr>`;

    snapshot.forEach(docSnap=>{
      const p = docSnap.data();
      html += `<tr>
        <td>${p.nombre}</td>
        <td>$${p.costo}</td>
        <td>${p.margen}%</td>
        <td>$${p.precio}</td>
        <td>${p.stock}</td>
        <td>
          <button onclick="editarProducto('${docSnap.id}')" style="margin-right:5px;">✏️</button>
          <button onclick="eliminarProducto('${docSnap.id}')">🗑️</button>
        </td>
      </tr>`;
    });

    html += "</table>";
    lista.innerHTML = html;

    // Funciones globales
    window.editarProducto = async (id) => {
      const pSnap = await getDocs(collection(db,"inventario"));
      const p = (await getDocs(doc(db,"inventario",id))).data();
      document.getElementById("productoNombre").value = p.nombre;
      document.getElementById("productoCosto").value = p.costo;
      document.getElementById("productoMargen").value = p.margen;
      document.getElementById("productoStock").value = p.stock;
      document.getElementById("guardarProducto").onclick = () => guardarProducto(id);
    }

    window.eliminarProducto = async (id) => {
      if(!confirm("¿Deseas eliminar este producto?")) return;
      await deleteDoc(doc(db,"inventario",id));
      hablar("Producto eliminado exitosamente");
      await cargarInventario();
    }

  }catch(e){
    console.error("Error cargando inventario:", e);
    lista.innerHTML = "❌ Error cargando inventario";
    hablar("Ocurrió un error al cargar el inventario");
  }
}

/* ===========================
FILTRAR INVENTARIO
=========================== */
function filtrarInventario(){
  const input = document.getElementById("buscarProducto").value.toLowerCase();
  const rows = document.querySelectorAll("#listaInventario table tr");
  rows.forEach((row,index)=>{
    if(index===0) return;
    row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

/* ===========================
LIMPIAR FORMULARIO
=========================== */
function limpiarFormulario(){
  document.getElementById("productoNombre").value = "";
  document.getElementById("productoCosto").value = "";
  document.getElementById("productoMargen").value = "";
  document.getElementById("productoStock").value = "";
  document.getElementById("guardarProducto").onclick = guardarProducto;
}

/* ===========================
DICTADO POR VOZ
=========================== */
function dictarProductoVoz(){
  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!recognition) return hablar("Tu navegador no soporta dictado por voz");
  
  const rec = new recognition();
  rec.lang = "es-ES";
  rec.continuous = false;
  rec.interimResults = false;

  rec.onstart = () => hablar("Dictando producto, por favor hable ahora");
  rec.onresult = (e) => {
    const texto = e.results[0][0].transcript.trim();
    document.getElementById("productoNombre").value += texto;
    hablar(`Se agregó el producto: ${texto}`);
  };
  rec.onerror = () => hablar("Ocurrió un error durante el dictado");
  rec.start();
}

/* ===========================
FUNCIÓN DE SÍNTESIS DE VOZ
=========================== */
function hablar(texto){
  if(!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}