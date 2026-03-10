import { db } from "../../firebase-config.js";
import { collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function coleccionTaller(nombre){

const empresaId = localStorage.getItem("empresaId") || "demo-empresa";

return collection(db,"empresas",empresaId,nombre);

}