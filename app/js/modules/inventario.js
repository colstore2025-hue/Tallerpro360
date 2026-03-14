/**
 * inventario.js
 * Gestión de inventario avanzada
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let inventario = [];

export async function inventario(container){

  container.innerHTML = `
<h1 style="font-size:26px;margin-bottom:20px;">📦 Inventario</h1>

<div class="card">
<h3>Nuevo Producto</h3>
<input id="productoNombre" placeholder="Nombre del producto" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="productoCosto" placeholder="Costo compra" type="number" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="productoMargen" placeholder="Margen utilidad (%)" type="number" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="productoStock" placeholder="Stock inicial" type="number" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<button id="guardarProducto" style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Guardar Producto</button>
</div>

<div class="card">
<h3>Inventario del Taller</h3>
<div id="listaInventario">Cargando inventario...</div>
</div>
`;

document.getElementById("guardarProducto").onclick = guardarProducto;

await cargarInventario();

}


/* ===============================
GUARDAR PRODUCTO
=============================== */
async function guardarProducto(editId = null){
  const nombre = document.getElementById("productoNombre").value;
  const costo = Number(document.getElementById("productoCosto").value);
  const margen = Number(document.getElementById("productoMargen").value);
  const stock = Number(document.getElementById("productoStock").value);

  if(!nombre || costo <= 0 || margen < 0 || stock < 0){
    return alert("Complete todos los campos correctamente");
  }

  const precio = costo + (costo * margen / 100);

  try{
    if(editId){
      const ref = doc(db,"inventario",editId);
      await updateDoc(ref,{nombre,costo,margen,precio,stock});
      alert("Producto actualizado");
    } else {
      await addDoc(collection(db,"inventario"),{nombre,costo,margen,precio,stock,fecha:new Date()});
      alert("Producto guardado");
    }

    limpiarFormulario();
    await cargarInventario();

  } catch(error){
    console.error("Error guardando producto",error);
    alert("Error al guardar producto");
  }
}


/* ===============================
CARGAR INVENTARIO
=============================== */
async function cargarInventario(){
  const lista = document.getElementById("listaInventario");
  try{
    const querySnapshot = await getDocs(collection(db,"inventario"));
    inventario = [];
    let html = `<table style="width:100%;border-collapse:collapse;">
    <tr style="border-bottom:1px solid #1e293b;">
      <th>Producto</th><th>Costo</th><th>Margen</th><th>Precio</th><th>Stock</th><th>Acciones</th>
    </tr>`;

    querySnapshot.forEach(docSnap=>{
      const p = docSnap.data();
      p.id = docSnap.id;
      inventario.push(p);

      html += `<tr>
        <td>${p.nombre}</td>
        <td>$${p.costo}</td>
        <td>${p.margen}%</td>
        <td>$${p.precio}</td>
        <td>${p.stock}</td>
        <td>
          <button onclick="editarProducto('${p.id}')" style="margin-right:5px;">✏️</button>
          <button onclick="eliminarProducto('${p.id}')" style="color:red;">🗑️</button>
        </td>
      </tr>`;
    });

    html += "</table>";
    lista.innerHTML = html;

  } catch(error){
    console.error(error);
    lista.innerHTML = "Error cargando inventario";
  }
}


/* ===============================
EDITAR PRODUCTO
=============================== */
window.editarProducto = async function(id){
  const p = inventario.find(i=>i.id===id);
  if(!p) return alert("Producto no encontrado");

  document.getElementById("productoNombre").value = p.nombre;
  document.getElementById("productoCosto").value = p.costo;
  document.getElementById("productoMargen").value = p.margen;
  document.getElementById("productoStock").value = p.stock;

  document.getElementById("guardarProducto").onclick = ()=>guardarProducto(id);
}


/* ===============================
ELIMINAR PRODUCTO
=============================== */
window.eliminarProducto = async function(id){
  if(!confirm("¿Desea eliminar este producto?")) return;
  try{
    await deleteDoc(doc(db,"inventario",id));
    alert("Producto eliminado");
    await cargarInventario();
  } catch(e){
    console.error(e);
    alert("Error eliminando producto");
  }
}


/* ===============================
LIMPIAR FORMULARIO
=============================== */
function limpiarFormulario(){
  document.getElementById("productoNombre").value="";
  document.getElementById("productoCosto").value="";
  document.getElementById("productoMargen").value="";
  document.getElementById("productoStock").value="";
  document.getElementById("guardarProducto").onclick = guardarProducto;
}