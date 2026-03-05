export function notificarCliente(
telefono,
cliente,
estado,
vehiculo
){

const mensaje = `
Hola ${cliente}

Su vehículo:

${vehiculo}

Estado actual:

${estado}

TallerPRO360
`;

const url = `
https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}
`;

window.open(url,"_blank");

}