export async function cargarModulo(nombre){

const contenedor = document.getElementById("appContent");

contenedor.innerHTML="Cargando módulo...";

try{

const modulo = await import(`/app/modules/${nombre}.js`);

await modulo.init(contenedor);

}catch(e){

console.error(e);

contenedor.innerHTML="Error cargando módulo";

}

}