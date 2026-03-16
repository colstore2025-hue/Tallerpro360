/*
=====================================
moduleloader.js
cargador de módulos erp
tallerpro360
=====================================
*/

class moduleloader{

constructor(){

this.modules={};

}

register(name,fn){

this.modules[name]=fn;

console.log("📦 módulo registrado:",name);

}

async load(name,container,userId){

const mod=this.modules[name];

if(!mod){

container.innerHTML=`
<h2>Módulo ${name} no encontrado</h2>
`;

return;

}

try{

console.log("🚀 cargando módulo:",name);

await mod(container,userId);

console.log("✅ módulo cargado:",name);

}
catch(e){

console.error("❌ error módulo:",name,e);

container.innerHTML=`

<h2>Error cargando módulo</h2>

<p>${name}</p>

<p>Revisa consola del sistema</p>

`;

}

}

}

export const moduleLoader=new moduleloader();