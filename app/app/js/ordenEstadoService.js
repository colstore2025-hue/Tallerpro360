import { db } from "./firebase.js";

import {
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { enviarWhatsApp } from "./whatsappService.js";


export async function cambiarEstadoOrden(
  empresaId,
  ordenId,
  nuevoEstado
){

  try{

    if(!ordenId || !empresaId){
      throw new Error("Datos inválidos");
    }

    const ref = doc(
      db,
      "empresas",
      empresaId,
      "ordenes",
      ordenId
    );

    const snap = await getDoc(ref);

    if(!snap.exists()){
      throw new Error("La orden no existe");
    }

    const data = snap.data();

    const telefonoCliente = data.telefono || null;
    const cliente = data.cliente || "Cliente";
    const vehiculo = data.vehiculo || "";

    await updateDoc(ref,{
      estado:nuevoEstado
    });

    console.log("Estado actualizado:",nuevoEstado);

    if(telefonoCliente){

      const mensaje = `
Hola ${cliente}

Su vehículo:

🚗 ${vehiculo}

cambió de estado:

📊 ${nuevoEstado}

Gracias por confiar en nosotros.

TallerPRO360
Servicio automotriz
`;

      enviarWhatsApp(telefonoCliente,mensaje);

    }

  }catch(error){

    console.error("Error cambiando estado de orden:",error);

    alert("No fue posible actualizar el estado");

  }

}