/**
 * dataService.js
 * Servicio central de acceso a Firestore
 */

import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/**
 * Obtener todos los clientes de la empresa
 */
export async function getClientes(empresaId) {
  const snap = await getDocs(query(
    collection(db, `empresas/${empresaId}/clientes`),
    orderBy("creadoEn", "desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Obtener todos los vehículos
 */
export async function getVehiculos(empresaId) {
  const snap = await getDocs(query(
    collection(db, `empresas/${empresaId}/vehiculos`)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Obtener todas las órdenes
 */
export async function getOrdenes(empresaId) {
  const snap = await getDocs(query(
    collection(db, `empresas/${empresaId}/ordenes`),
    orderBy("creadoEn", "desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Obtener inventario
 */
export async function getInventario(empresaId) {
  const snap = await getDocs(query(
    collection(db, `empresas/${empresaId}/inventario`)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Obtener feedback de clientes
 */
export async function getFeedback(empresaId) {
  const snap = await getDocs(query(
    collection(db, `empresas/${empresaId}/feedback`),
    orderBy("fecha", "desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}