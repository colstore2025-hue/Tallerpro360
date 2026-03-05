import {
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { coleccionTaller } from "./dbTaller.js";


export async function crearOrden(data){

try{

await addDoc(
coleccionTaller("ordenes"),
{
cliente:data.cliente,
vehiculo:data.vehiculo,
placa:data.placa,
tecnico:data.tecnico || "Sin asignar",

estado:"activa",
total:0,
acciones:[],

fecha:serverTimestamp()
});

}catch(error){

console.error("Error creando orden",error);

}

}