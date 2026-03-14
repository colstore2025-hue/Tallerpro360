/**
 * aiCoreLoader.js
 * AI Core Loader
 * TallerPRO360 ERP
 */

console.log("🧠 AI Core Loader iniciado");


/* =====================================
SISTEMAS A CARGAR
===================================== */

const coreSystems = [

"/js/ai/predictiveMaintenanceAI.js",
"/js/ai/autoRepairLearningAI.js",
"/js/ai/autonomousWorkshopAI.js"

];


/* =====================================
CARGAR SISTEMAS IA
===================================== */

export async function loadAICore(){

console.log("⚙️ Cargando núcleo de IA...");

for(const path of coreSystems){

try{

await import(path);

console.log("✅ IA cargada:",path);

}
catch(error){

console.warn("⚠️ IA no cargada:",path,error);

}

}

console.log("🧠 Núcleo IA activo");

}