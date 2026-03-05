import { db } from "./firebase.js";

import {
doc,
updateDoc,
arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function agregarAccionOrden(ordenId, accion){

const empresaId = localStorage.getItem("empresaId");

const ref = doc(
db,
"empresas",
empresaId,
"ordenes",
ordenId
);

await updateDoc(ref,{
acciones: arrayUnion({
descripcion:accion,
fecha:new Date(),
estado:"pendiente"
})
});

alert("Acción agregada a la orden");

}