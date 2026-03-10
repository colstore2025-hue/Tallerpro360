/**
 * Firestore Helpers
 * TallerPRO360 ERP SaaS
 * Manejo de colecciones por taller (multiempresa)
 */

import { db } from "./firebase-config.js";
import { obtenerTallerId } from "../services/empresaService.js";

import {
  collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/**
 * Devuelve la referencia a una colección
 * dentro del taller actual
 *
 * Ejemplo:
 * coleccionTaller("ordenes")
 * -> talleres/{tallerId}/ordenes
 */

export function coleccionTaller(nombreColeccion) {

  const tallerId = obtenerTallerId();

  if (!tallerId) {
    throw new Error("No se encontró el tallerId activo");
  }

  return collection(
    db,
    "talleres",
    tallerId,
    nombreColeccion
  );

}