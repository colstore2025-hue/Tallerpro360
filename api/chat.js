// /api/chat.js
export default async function handler(req, res) {
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // Vercel lee esto de tus Env Vars

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  // Aquí definimos el "Cerebro" de TallerPRO360
  const contextoManual = `
    Eres el experto de TallerPRO360. App PWA para talleres en Colombia.
    Nicho: Mecánica, Latonería, Pintura y Mecatrónica.
    Ventaja: No requiere descarga, seguimiento en tiempo real.
    Tono: Profesional, cercano al 'maestro' de taller colombiano.
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contextoManual + "\nPregunta: " + prompt }] }]
      })
    });

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    res.status(500).json({ error: "Error conectando con la IA" });
  }
}
