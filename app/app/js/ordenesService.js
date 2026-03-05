import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
CREAR ORDEN
========================= */

export async function crearOrden(data) {

  try {

    const docRef = await addDoc(collection(db, "ordenes"), {
      cliente: data.cliente,
      vehiculo: data.vehiculo,
      placa: data.placa,
      tecnico: data.tecnico,
      estado: "activa",
      total: 0,
      fecha: serverTimestamp()
    });

    alert("Orden creada: " + docRef.id);

  } catch (error) {

    console.error("Error creando orden", error);

  }

}

/* =========================
OBTENER ORDENES
========================= */

export async function obtenerOrdenes() {

  const snapshot = await getDocs(collection(db, "ordenes"));

  const ordenes = [];

  snapshot.forEach(doc => {
    ordenes.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return ordenes;

}