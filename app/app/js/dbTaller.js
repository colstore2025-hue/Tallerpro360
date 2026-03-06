import { db } from "./firebase.js";

import {
collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export function coleccionTaller(nombre){

const empresaId = localStorage.getItem("empresaId");

if(!empresaId){
throw new Error("Empresa no identificada");
}

return collection(
db,
"empresas",
empresaId,
nombre
);

}