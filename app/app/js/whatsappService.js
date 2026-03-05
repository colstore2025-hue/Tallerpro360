export function enviarWhatsApp(clienteTelefono,mensaje){

const texto = encodeURIComponent(mensaje);

const url = `https://wa.me/57${clienteTelefono}?text=${texto}`;

window.open(url,"_blank");

}