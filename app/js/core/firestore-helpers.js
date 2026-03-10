/**
 * firestore-helpers.js
 * TallerPRO360 ERP SaaS
 * Helpers para acceder a Firestore en arquitectura multiempresa
 */

import { db } from "./firebase-config.js";
import { obtenerEmpresaId } from "./empresa-context.js";

import {
  collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
   COLECCIÓN DE EMPRESA
=============================== */

/**
 * Devuelve la referencia a una colección
 * dentro de la empresa activa
 *
 * Ejemplo:
 * coleccionEmpresa("ordenes")
 * -> empresas/{empresaId}/ordenes
 */

export function coleccionEmpresa(nombreColeccion){

  const empresaId = obtenerEmpresaId();

  if(!empresaId){

    throw new Error("No se encontró empresaId activo");

  }

  return collection(
    db,
    "empresas",
    empresaId,
    nombreColeccion
  );

}