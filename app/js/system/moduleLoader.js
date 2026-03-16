/**
 * moduleLoader.js
 * Gestor central de módulos
 * TallerPRO360 ERP
 */

class ModuleLoader {

constructor(){

this.modules = {};

}

/* =========================
REGISTRAR MÓDULO
========================= */

register(name,module){

if(!name || !module){

console.warn("⚠ módulo inválido:",name);
return;

}

const key = name.toLowerCase();

this.modules[key] = module;

console.log("📦 módulo registrado:",key);

}

/* =========================
CARGAR MÓDULO
========================= */

async load(name,container,userId){

const key = name.toLowerCase();

const module = this.modules[key];

if(!module){

console.error("❌ módulo no encontrado:",key);

container.innerHTML = `
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

console.error("Error cargando módulo:",error);

container.innerHTML = `
<h2 style="color:red">
Error cargando módulo
</h2>
`;

}

}

/* =========================
DIAGNÓSTICO
========================= */

diagnostic(){

console.log("===== MÓDULOS REGISTRADOS =====");

console.table(Object.keys(this.modules));

}

}

export const moduleLoader = new ModuleLoader();