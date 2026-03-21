/**
 * visionMechanicAI.js - TallerPRO360 V3
 * IA de visión para diagnóstico mecánico (Móvil-Optimizado)
 */

export async function analizarMotor(base64Image) {
  if (!base64Image) return { error: "No se capturó imagen." };

  try {
    console.log("👁️ Enviando imagen al cerebro Nexus-X...");

    // LLAMADA SEGURA: Usamos tu API interna para proteger la Key
    const response = await fetch("/api/vision-motor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        image: base64Image,
        prompt: "Analiza el compartimento del motor: detecta fugas, corrosión, mangueras sueltas o cables pelados. Sé técnico y breve."
      })
    });

    const data = await response.json();
    
    // Limpiador de formato (Regex para extraer solo el JSON si la IA se pone habladora)
    if (typeof data.content === "string") {
      const jsonMatch = data.content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: data.content };
    }

    return data;

  } catch (error) {
    console.error("❌ Fallo en Visión IA:", error);
    return { error: "Error de conexión con el satélite Nexus-X." };
  }
}

/**
 * PRO-TIP: Integra esto con el orquestador
 */
export async function procesarEvidencia(file, empresaId) {
  // 1. Convertir a Base64 (Optimizado para móvil)
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onloadend = async () => {
      const resultado = await analizarMotor(reader.result);
      resolve(resultado);
    };
    reader.readAsDataURL(file);
  });
}
