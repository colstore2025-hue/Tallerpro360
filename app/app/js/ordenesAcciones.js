import { db } from "./firebase.js";

import {
doc,
updateDoc,
arrayUnion,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function agregarAccionOrden(ordenId, accion, costo = 0){

const ref = doc(db,"ordenes",ordenId);

await updateDoc(ref,{
acciones: arrayUnion({
descripcion:accion,
costo:costo,
fecha:new Date(),
estado:"pendiente"
})
});

await recalcularTotal(ordenId);

}



export async function recalcularTotal(ordenId){

const ref = doc(db,"ordenes",ordenId);

const snap = await getDoc(ref);

const data = snap.data();

let total = 0;

if(data.acciones){

data.acciones.forEach(a=>{
total += Number(a.costo || 0);
});

}

await updateDoc(ref,{
total:total
});

}