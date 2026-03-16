/*
=====================================
moduleloader.js
cargador de módulos
tallerpro360
=====================================
*/

class moduleloader{

constructor(){

this.modules={};

}

/* ==============================
registrar módulo
============================== */

register(name,fn){

this.modules[name]=fn;

console.log("módulo registrado:",name);

}

/* ==============================
cargar módulo
============================== */

async load(name,container,userid){

const mod=this.modules[name];

if(!mod){

container.innerHTML=`
<h2>módulo ${name} no encontrado</h2>
`;

return;

}

try{

await mod(container,userid);

}
catch(error){

console.error("error cargando módulo:",name,error);

container.innerHTML=`
<h2>error cargando módulo ${name}</h2>
`;

}

}

}

export const moduleLoader=new moduleloader();