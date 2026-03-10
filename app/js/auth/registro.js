/**
 * Registro de nueva empresa
 * TallerPRO360 SaaS
 */

import { auth, db } from "../core/firebase-config.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


window.registrar = async function(){

  const empresa = document.getElementById("empresa").value.trim();
  const ciudad = document.getElementById("ciudad").value.trim();
  const telefono = document.getElementById("telefono").value.trim();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const msg = document.getElementById("msg");

  msg.innerText = "";

  if(!empresa || !email || !password){
    msg.innerText = "Debe completar los campos obligatorios";
    return;
  }

  try{

    // Crear usuario Firebase Auth
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = cred.user;

    // Crear ID de empresa
    const empresaId = "empresa_" + user.uid;

    // Guardar empresa en Firestore
    await setDoc(doc(db,"empresas",empresaId),{

      nombre: empresa,
      ciudad: ciudad,
      telefono: telefono,

      plan: "trial",
      estado: "activa",

      owner: user.uid,

      fechaRegistro: serverTimestamp()

    });

    // Guardar sesión local
    localStorage.setItem("empresaId", empresaId);
    localStorage.setItem("uid", user.uid);

    // Redirigir al ERP
    window.location.href = "/app/index.html";

  }
  catch(err){

    console.error("Error registro:",err);

    if(err.code === "auth/email-already-in-use"){
      msg.innerText = "Este correo ya está registrado";
    }
    else if(err.code === "auth/weak-password"){
      msg.innerText = "La contraseña debe tener al menos 6 caracteres";
    }
    else{
      msg.innerText = "Error al registrar usuario";
    }

  }

}