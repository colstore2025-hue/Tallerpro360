export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  // 1. Extracción de energía del núcleo (API KEY)
  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // 2. RUTA QUIRÚRGICA: gemini-1.5-flash-latest es el estándar de máxima compatibilidad
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Actúa como el experto de TallerPRO360. Responde al Comandante de forma breve sobre: " + prompt }] }]
      })
    });

    const data = await response.json();

    // 3. Captura y traducción de errores de Google
    if (data.error) {
      return res.status(200).json({ 
        response: `Aviso del Núcleo: El satélite de Google denegó el acceso (${data.error.message}). Comandante, verifique la clave en el proyecto TallerPRO360.` 
      });
    }

    // 4. Entrega de datos al usuario
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ response: aiText || "Señal recibida sin datos legibles." });

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X. Reintente el comando." });
  }
}
