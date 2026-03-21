/**
 * aiCoreLoader.js - TallerPRO360 AI Engine
 */
const coreSystems = [
  "../ai/predictiveMaintenanceAI.js",
  "../ai/autoRepairLearningAI.js",
  "../ai/autonomousWorkshopAI.js"
];

export async function loadAICore() {
  console.log("🧠 Iniciando IA Core...");
  const promises = coreSystems.map(async (path) => {
    try {
      await import(path);
      console.log(`✅ ${path.split('/').pop()} cargado`);
    } catch (err) {
      console.warn(`⚠️ Módulo IA omitido: ${path}`);
    }
  });
  
  await Promise.all(promises);
  console.log("🧠 Núcleo IA en espera de datos.");
}
