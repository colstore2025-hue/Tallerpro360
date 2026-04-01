export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const incomingMsg = req.body.entry[0].changes[0].value.messages[0];
    const from = incomingMsg.from; // Número del cliente
    const text = incomingMsg.text.body.toLowerCase();

    let responseText = "";

    // Lógica de respuesta automática
    if (text.includes("demo") || text.includes("plan")) {
        responseText = "¡Hola! 🚀 Bienvenido al ecosistema Nexus-X. He preparado un acceso demo para ti.\n\n" +
                       "🔗 Entra aquí: https://tallerpro360.vercel.app/login\n" +
                       "👤 Usuario: demo_taller\n" +
                       "🔑 Clave: Nexus2026\n\n" +
                       "¿Te gustaría que te ayude a configurar tu pasarela Bold para empezar a cobrar hoy mismo?";
    } else {
        responseText = "Soy el asistente de TallerPRO360. Si quieres una demo, escribe 'DEMO'. Para soporte técnico, un asesor te contactará pronto.";
    }

    // Aquí iría la llamada a la API de WhatsApp para enviar el mensaje
    await sendWhatsAppMessage(from, responseText);

    res.status(200).send("EVENT_RECEIVED");
}
