/**
 * moduleLoader.js
 * CORE ERP - Gestor de módulos
 */

class ModuleLoader {

constructor(){

this.modules = {};

}

/* ==========================
REGISTRAR
========================== */

register(name,module){

if(!name || !module){

console.warn("Módulo inválido:",name);
return;

}

const key = name.toLowerCase();

this.modules[key] = module;

console.log("📦 módulo registrado:",key);

}

/* ==========================
CARGAR
========================== */

async load(name,container,userId){

const key = name.toLowerCase();

const module = this.modules[key];

if(!module){

console.error("❌ módulo no encontrado:",key);

container.innerHTML=`
<h2 style="color:red">
Módulo no disponible
</h2>
`;

return;

}

try{

container.innerHTML="Cargando módulo...";

await module(container,userId);

console.log("✅ módulo cargado:",key);

}
catch(error){

console.error("Error módulo:",error);

container.innerHTML=`
<h2 style="color:red">
Error cargando módulo
</h2>
`;

}

}

/* ==========================
DIAGNÓSTICO
========================== */

diagnostic(){

console.log("===== MODULOS ERP =====");

console.table(Object.keys(this.modules));

}

}

export const moduleLoader = new ModuleLoader();