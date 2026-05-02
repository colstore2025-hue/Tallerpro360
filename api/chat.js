export default async function handler(req, res) {
  // 1. Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ response: "Método no permitido" });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ response: "Error: Configuración de API ausente en el servidor." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    // Contexto Maestro de TallerPRO360
    const contextoManual = `
      Eres el experto técnico y comercial de TallerPRO360. 
      CONTEXTO: App PWA para talleres en Colombia (Mecánica, Latonería, Pintura, Mecatrónica).
      VENTAJAS: No requiere descarga, seguimiento Starlink en tiempo real, registro fotográfico para evitar reclamos.
      TONO: Profesional, servicial, dirigiéndote al usuario como 'Comandante' o 'Jefe'. 
      OBJETIVO: Resolver dudas y motivar a la digitalización del taller.
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: contextoManual + "\nPREGUNTA DEL CLIENTE: " + prompt }] 
        }]
      })
    });

    const data = await response.json();

    // 2. Extracción segura (Evita el error 'undefined')
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ response: aiResponse });
    } else {
      console.error("Estructura de Gemini inesperada:", data);
      return res.status(500).json({ response: "El núcleo de IA no pudo procesar la respuesta. Intente de nuevo." });
    }

  } catch (error) {
    console.error("Falla en Servidor API:", error);
    return res.status(500).json({ response: "Interrupción en el enlace Nexus-X. Verifique su conexión." });
  }
}
