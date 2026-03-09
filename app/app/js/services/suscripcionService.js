import { db } from "./firebase.js";
import { obtenerTallerId } from "./tallerContext.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function verificarSuscripcion(){

const tallerId = obtenerTallerId();

const ref = doc(db,"talleres",tallerId);

const snap = await getDoc(ref);

if(!snap.exists()) return false;

const data = snap.data();

if(data.estado !== "activo"){

alert("Suscripción inactiva");

return false;

}

return true;

}