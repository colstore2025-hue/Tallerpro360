export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ response: "Acceso Denegado." });

  // Usamos la clave de OpenAI que ya tiene en Vercel
  const apiKey = process.env.OPENAI_API_KEY;
  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // O "gpt-4" si su cuenta lo permite
        messages: [
          { role: "system", content: "Eres el experto técnico de TallerPRO360. Responde al Comandante de forma profesional." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ 
        response: `Aviso de OpenAI: ${data.error.message}. Comandante, revise el saldo en su cuenta de OpenAI.` 
      });
    }

    const aiText = data.choices[0].message.content;
    return res.status(200).json({ response: aiText });

  } catch (error) {
    return res.status(500).json({ response: "Falla crítica en el hardware Nexus-X (OpenAI Bridge)." });
  }
}
