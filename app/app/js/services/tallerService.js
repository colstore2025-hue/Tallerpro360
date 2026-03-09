import { db } from "./firebase.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function crearTaller(data){

try{

const ref = await addDoc(
collection(db,"talleres"),
{
nombre:data.nombre,
ciudad:data.ciudad,
telefono:data.telefono,

plan:"starter",
estado:"activo",

fechaCreacion:serverTimestamp()
});

return ref.id;

}catch(error){

console.error("Error creando taller",error);

}

}