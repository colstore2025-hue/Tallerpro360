import { db } from "../core/firebase-config.js";
import {
doc,
updateDoc,
increment,
addDoc,
collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function usarRepuesto(
ordenId,
repuestoId,
cantidad
){

const ref = doc(db,"repuestos",repuestoId);

await updateDoc(ref,{
stock:increment(-cantidad)
});

await addDoc(
collection(db,"inventario_movimientos"),
{
ordenId,
repuestoId,
cantidad,
tipo:"salida",
fecha:new Date()
});

}