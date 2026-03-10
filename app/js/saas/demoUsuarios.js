/**
 * demoUsuarios.js
 * TallerPRO360 SaaS
 * Gestión de usuarios demo
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
   OBTENER EMPRESA ACTUAL
=============================== */

function obtenerEmpresaId(){

  const empresaId = localStorage.getItem("empresaId") || "demo-empresa";

  return empresaId;

}


/* ===============================
   CARGAR USUARIOS DEMO
=============================== */

export async function cargarUsuariosDemo(){

  const empresaId = obtenerEmpresaId();

  const lista = document.getElementById("userList");

  if(!lista) return;

  lista.innerHTML = "";

  try{

    const snapshot = await getDocs(
      collection(db,"empresas",empresaId,"usuarios")
    );

    if(snapshot.empty){

      lista.innerHTML = "<p>No hay usuarios registrados</p>";
      return;

    }

    snapshot.forEach((docSnap)=>{

      const data = docSnap.data();

      const div = document.createElement("div");

      div.className = "user-item";

      div.innerHTML = `
        <span>${data.nombre || "Usuario"}</span>
        <button class="btn-main" onclick="alert('Editar ${data.nombre}')">
          Editar
        </button>
      `;

      lista.appendChild(div);

    });

  }
  catch(e){

    console.error("Error cargando usuarios demo:",e);

    lista.innerHTML = "<p>Error al cargar usuarios</p>";

  }

}


/* ===============================
   AGREGAR USUARIO DEMO LOCAL
=============================== */

export function agregarUsuarioDemo(){

  const list = document.getElementById("userList");

  if(!list) return;

  const item = document.createElement("div");

  item.className = "user-item";

  item.innerHTML = `
    <span>Nuevo Usuario</span>
    <button class="btn-main" onclick="alert('Editar demo')">
      Editar
    </button>
  `;

  list.appendChild(item);

}


/* ===============================
   CREAR USUARIO DEMO EN FIRESTORE
=============================== */

export async function crearUsuarioDemo(nombre = "Usuario Demo"){

  const empresaId = obtenerEmpresaId();

  try{

    await addDoc(
      collection(db,"empresas",empresaId,"usuarios"),
      {
        nombre,
        rol: "demo",
        fechaCreacion: serverTimestamp()
      }
    );

    console.log("Usuario demo creado correctamente");

    await cargarUsuariosDemo();

  }
  catch(e){

    console.error("Error creando usuario demo:",e);

  }

}