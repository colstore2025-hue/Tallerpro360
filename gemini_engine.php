<?php
/**
 * TallerPRO360 - Conector IA Gemini 1.5 Pro
 * Especializado en Sector Automotriz Colombia
 */

function consultarGemini($prompt) {
    $apiKey = "TU_API_KEY_AQUI"; // Sustituye por tu llave real
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" . $apiKey;

    // Contexto maestro para que la IA no alucine y sepa qué es TallerPRO360
    $contexto = "Actúa como el experto técnico de TallerPRO360. 
    Nuestra app es una PWA para talleres de mecánica, latonería y pintura en Colombia. 
    Beneficios: Sin descargas, gestión de órdenes en tiempo real y soporte mecatrónico. 
    Usa un lenguaje cercano al 'maestro' de taller colombiano, pero profesional.
    Responde a la siguiente consulta: ";

    $data = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $contexto . $prompt]
                ]
            ]
        ],
        "generationConfig" => [
            "temperature" => 0.7, // Balance entre creatividad y precisión
            "maxOutputTokens" => 800
        ]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        return "Error de conexión: " . $err;
    } else {
        $json = json_decode($response, true);
        return $json['candidates'][0]['content']['parts'][0]['text'] ?? "No pude procesar la respuesta.";
    }
}

// Ejemplo de uso para prospección:
// echo consultarGemini("Escribe un mensaje corto de WhatsApp para un taller de pintura en Medellín invitándolo a probar la app.");
?>
