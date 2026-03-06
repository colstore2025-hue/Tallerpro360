import { db } from "./firebase.js";

import {
collection,
query,
orderBy,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const empresaId = localStorage.getItem("empresaId");


/* =========================
ESCUCHAR ÓRDENES EN TIEMPO REAL
========================= */

export function escucharOrdenes(callback){

const q = query(
collection(db,"empresas",empresaId,"ordenes"),
orderBy("fecha","desc")
);

onSnapshot(q,(snapshot)=>{

const ordenes=[];

snapshot.forEach(doc=>{

ordenes.push({
id:doc.id,
...doc.data()
});

});

callback(ordenes);

});

}