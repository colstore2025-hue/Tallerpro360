import { db } from "./firebase.js";
import { obtenerTallerId } from "./tallerContext.js";
import { collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function coleccionTaller(nombre) {
  const tallerId = obtenerTallerId();
  return collection(db, "talleres", tallerId, nombre);
}