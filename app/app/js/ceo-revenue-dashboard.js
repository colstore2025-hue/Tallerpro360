// ceo-revenue-dashboard.js

import { db } from "./firebase-config.js";

import{
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function cargarRevenueDashboard(){

try{

const snap = await getDocs(collection(db,"ordenes"));

let totalIngresos=0;
let ordenes=0;
let ticketPromedio=0;

snap.forEach(doc=>{

const data = doc.data();

ordenes++;

totalIngresos += data.total || 0;

});

if(ordenes>0){

ticketPromedio = totalIngresos/ordenes;

}

return{

ordenes,
totalIngresos,
ticketPromedio

};

}catch(error){

console.error("Error cargando dashboard",error);

return null;

}

}