export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // CAMBIO CLAVE: Usamos v1 (estable) y el modelo pro con nombre simplificado
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Actúa como el experto de TallerPRO360. Responde al Comandante sobre: " + prompt }] }]
      })
    });

    const data = await response.json();
    
    // Diagnóstico en tiempo real si Google rechaza la clave o el modelo
    if (data.error) {
      return res.status(200).json({ 
        response: `Sincronización Fallida: ${data.error.message} (Código: ${data.error.code})` 
      });
    }

    // Extracción de datos con protección de nulidad
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiText) {
      return res.status(200).json({ response: aiText });
    } else {
      return res.status(200).json({ response: "Comandante, el Núcleo recibió los datos pero la respuesta está encriptada o vacía." });
    }

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el puente Nexus-X." });
  }
}
