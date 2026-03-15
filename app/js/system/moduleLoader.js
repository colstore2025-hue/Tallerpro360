/**
 * moduleLoader.js
 * Cargador inteligente de módulos
 * TallerPRO360 ERP
 */

export const moduleLoader = {

modules:{},

/* ===========================
Registrar módulo
=========================== */

register(name,fn){

this.modules[name]=fn;

console.log("📦 módulo registrado:",name);

},

/* ===========================
Cargar módulo
=========================== */

async load(name,container){

if(!container){

console.error("Contenedor no válido");

return;

}

container.innerHTML="Cargando módulo...";

try{

const module=this.modules[name];

if(!module){

throw new Error("Módulo no registrado: "+name);

}

await module(container);

console.log("✅ módulo cargado:",name);

}
catch(e){

console.error("Error cargando módulo:",name,e);

container.innerHTML=`

<div style="padding:30px">

<h3>Error cargando módulo</h3>

<p>${name}</p>

<button onclick="location.reload()">

Reiniciar sistema

</button>

</div>

`;

}

},

/* ===========================
Diagnóstico de módulos
=========================== */

diagnostic(){

console.table(Object.keys(this.modules));

}

};