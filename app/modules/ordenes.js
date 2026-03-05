import { db } from "./firebase.js";
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { detectarRepuestos } from "./iaMecanica.js";
import { generarFactura } from "./facturacion.js";
import { enviarWhatsApp } from "./whatsappService.js";

export async function crearOrden(orden){
  // Crear orden en Firestore
  const docRef = await addDoc(collection(db,"ordenes"),{
    ...orden, estado:"activa", acciones:[], total:0, fecha:serverTimestamp()
  });
  return docRef.id;
}

export async function agregarAccionOrden(ordenId, accion){
  const ref = doc(db,"ordenes",ordenId);
  const ordenSnap = await getDocs(collection(db,"ordenes"));
  // Detectar repuestos
  const ia = await detectarRepuestos(accion.descripcion);
  accion.repuestosIA = ia.repuestos;
  // Actualizar Firestore
  await updateDoc(ref,{acciones:[...ordenSnap.data().acciones, accion]});
  // Notificar cliente
  enviarWhatsApp(ordenSnap.data().telefonoCliente, `Nueva acción agregada: ${accion.descripcion}`);
  // Actualizar total
  const totalActual = ordenSnap.data().total || 0;
  const totalNuevo = totalActual + (accion.costo || 0);
  await updateDoc(ref,{total:totalNuevo});
  // Generar factura PDF
  generarFactura({...ordenSnap.data(), acciones:[...ordenSnap.data().acciones, accion], total:totalNuevo});
}