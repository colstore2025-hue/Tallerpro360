import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

    alert("Orden creada con ID: " + docRef.id);

  } catch (e) {
    console.error("Error creando orden: ", e);
  }
}