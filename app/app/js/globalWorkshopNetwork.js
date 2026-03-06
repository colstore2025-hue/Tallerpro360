/**
 * globalWorkshopNetwork.js
 * TallerPRO360
 * Red global inteligente de talleres
 */

import { db } from "./firebase.js";

import {
collection,
doc,
setDoc,
getDocs,
query,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
REGISTRAR TALLER EN RED GLOBAL
=============================== */

export async function registrarTallerGlobal(taller){

try{

const ref = doc(collection(db,"redGlobalTalleres"));

await setDoc(ref,{

nombre:taller.nombre || "",
ciudad:taller.ciudad || "",
pais:taller.pais || "",
especialidad:taller.especialidad || "general",
rating:0,
trabajos:0,
fechaRegistro:Date.now()

});

return true;

}
catch(e){

console.error("Error registrando taller global:",e);

return false;

}

}


/* ===============================
OBTENER TALLERES TOP
=============================== */

export async function obtenerTopTalleres(){

try{

const q = query(
collection(db,"redGlobalTalleres"),
orderBy("rating","desc"),
limit(10)
);

const snapshot = await getDocs(q);

let talleres = [];

snapshot.forEach(doc=>{

talleres.push({

id:doc.id,
...doc.data()

});

});

return talleres;

}
catch(e){

console.error("Error obteniendo talleres:",e);

return [];

}

}


/* ===============================
BUSCAR TALLERES POR CIUDAD
=============================== */

export async function buscarTalleresCiudad(ciudad){

try{

const q = query(
collection(db,"redGlobalTalleres")
);

const snapshot = await getDocs(q);

let resultados = [];

snapshot.forEach(doc=>{

const t = doc.data();

if(t.ciudad?.toLowerCase() === ciudad.toLowerCase()){

resultados.push({
id:doc.id,
...t
});

}

});

return resultados;

}
catch(e){

console.error("Error buscando talleres:",e);

return [];

}

}


/* ===============================
ACTUALIZAR RATING
=============================== */

export async function actualizarRating(tallerId,nuevoRating){

try{

const ref = doc(db,"redGlobalTalleres",tallerId);

await setDoc(ref,{
rating:nuevoRating
},{merge:true});

return true;

}
catch(e){

console.error("Error actualizando rating:",e);

return false;

}

}


/* ===============================
SISTEMA DE REPUTACIÓN
=============================== */

export function calcularReputacion(taller){

const base = taller.rating || 0;

const experiencia = (taller.trabajos || 0) * 0.01;

return Number((base + experiencia).toFixed(2));

}