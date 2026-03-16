class ModuleLoader{

constructor(){

this.modules={};

}

/* =========================
REGISTRAR MÓDULO
========================= */

register(name,fn){

if(!name || typeof fn!=="function"){

console.error("❌ módulo inválido:",name);

return;

}

if(this.modules[name]){

console.warn("⚠ módulo ya registrado:",name);

}

this.modules[name]=fn;

console.log("📦 módulo registrado:",name);

}


/* =========================
CARGAR MÓDULO
========================= */

async load(name,container,userId){

if(!container){

console.error("❌ container no definido");

return;

}

const mod=this.modules[name];

if(!mod){

console.error("❌ módulo no encontrado:",name);

container.innerHTML=`
<h2>Módulo ${name} no encontrado</h2>
`;

return;

}

try{

console.log("🚀 cargando módulo:",name);

container.innerHTML="Cargando módulo...";

await mod(container,userId);

console.log("✅ módulo cargado:",name);

}
catch(e){

console.error("❌ Error módulo:",name,e);

container.innerHTML=`
<div style="padding:20px">

<h2>Error cargando módulo</h2>

<p><b>${name}</b></p>

<pre style="white-space:pre-wrap">
${e.message}
</pre>

</div>
`;

}

}


/* =========================
DEBUG (muy útil)
========================= */

listModules(){

return Object.keys(this.modules);

}

}

export const moduleLoader=new ModuleLoader();