/*
=====================================
login.js
sistema de login
tallerpro360
=====================================
*/

import { auth } from "../core/firebase-config.js";

import {
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const form=document.getElementById("loginForm");

if(form){

form.addEventListener("submit",async(e)=>{

e.preventDefault();

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

try{

const cred=await signInWithEmailAndPassword(
auth,
email,
password
);

const user=cred.user;

console.log("usuario autenticado:",user.uid);

/* ===============================
guardar sesión
=============================== */

localStorage.setItem("uid",user.uid);

/* empresa demo temporal */

if(!localStorage.getItem("empresaId")){
localStorage.setItem("empresaId","demoEmpresa");
}

/* ===============================
entrar al ERP
=============================== */

window.location.href="/index.html";

}
catch(error){

console.error("error login:",error);

alert("error de autenticación");

}

});

}