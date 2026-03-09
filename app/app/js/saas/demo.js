import { db } from "./firebase.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===============================
   USUARIOS DEMO
=============================== */

// Cargar usuarios demo de la empresa
export async function cargarUsuariosDemo() {
  const empresaId = localStorage.getItem("empresaId") || "demo-empresa";
  const lista = document.getElementById("userList");
  lista.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "empresas", empresaId, "usuarios"));
    if (snapshot.empty) {
      lista.innerHTML = "<p>No hay usuarios registrados</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "user-item";
      div.innerHTML = `
        <span>${data.nombre}</span>
        <button class="btn-main" onclick="alert('Editar ${data.nombre}')">Editar</button>
      `;
      lista.appendChild(div);
    });
  } catch (e) {
    console.error("Error cargando usuarios demo:", e);
    lista.innerHTML = "<p>Error al cargar usuarios</p>";
  }
}

// Agregar usuario demo local
export function agregarUsuarioDemo() {
  const list = document.getElementById("userList");
  const item = document.createElement("div");
  item.className = "user-item";
  item.innerHTML = `<span>Nuevo Usuario</span>
    <button class="btn-main" onclick="alert('Editar demo')">Editar</button>`;
  list.appendChild(item);
}

// Crear un usuario demo en Firestore
export async function crearUsuarioDemo(nombre = "Usuario Demo") {
  const empresaId = localStorage.getItem("empresaId") || "demo-empresa";

  try {
    await addDoc(collection(db, "empresas", empresaId, "usuarios"), {
      nombre,
      fechaCreacion: new Date(),
      rol: "demo"
    });
    console.log("Usuario demo creado correctamente");
    cargarUsuariosDemo();
  } catch (e) {
    console.error("Error creando usuario demo:", e);
  }
}