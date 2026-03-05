import { db } from "./firebase.js";

import {
doc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { enviarWhatsApp } from "./whatsappService.js";


export async function cambiarEstadoOrden(
ordenId,
nuevoEstado,
telefonoCliente
){

const ref = doc(db,"ordenes",ordenId);

await updateDoc(ref,{
estado:nuevoEstado
});

const mensaje = `
TallerPRO360

Su vehículo ha cambiado de estado:

${nuevoEstado}

Gracias por confiar en nosotros.
`;

enviarWhatsApp(telefonoCliente,mensaje);

}