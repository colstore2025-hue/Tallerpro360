export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    // Conexión con el modelo 1.5 Flash (el mismo de tu Applet en AI Studio)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ 
            text: "INSTRUCCIÓN DE SISTEMA: Eres el agente oficial de TallerPRO360. Tu objetivo es ayudar a dueños de talleres mecánicos a gestionar sus negocios con tecnología. Responde al Comandante: " + prompt 
          }] 
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ response: `Aviso del Núcleo: ${data.error.message}` });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ response: aiText || "Conexión establecida, pero el núcleo está en silencio." });

  } catch (error) {
    return res.status(500).json({ response: "Error de enlace con el satélite Nexus-X." });
  }
}
