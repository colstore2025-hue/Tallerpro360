import { auth, db } from "./firebase.js";

import {
createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


window.registrar = async function(){

const empresa = document.getElementById("empresa").value;
const ciudad = document.getElementById("ciudad").value;
const telefono = document.getElementById("telefono").value;

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{

const cred = await createUserWithEmailAndPassword(auth,email,password);

const user = cred.user;

const empresaId = "empresa_"+user.uid;

await setDoc(doc(db,"empresas",empresaId),{

nombre:empresa,
ciudad:ciudad,
telefono:telefono,

plan:"trial",

fechaRegistro:new Date(),

owner:user.uid

});

localStorage.setItem("empresaId",empresaId);

window.location.href="/app/index.html";

}
catch(err){

document.getElementById("msg").innerText = err.message;

}

}