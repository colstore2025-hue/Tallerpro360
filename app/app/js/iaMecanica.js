// iaMecanica.js
import { db } from "./firebase.js";

// API_KEY debe estar en entorno seguro o .env
const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.firebasestorage.app",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

/**
 * Detecta repuestos y acciones recomendadas a partir de la descripción de la falla.
 * @param {string} descripcion - Descripción de la falla del vehículo.
 * @returns {Promise<Object>} - JSON con diagnóstico, repuestos y acciones.
 */
export async function detectarRepuestos(descripcion) {
  if (!descripcion) throw new Error("Debe proporcionar una descripción de la falla");

  const prompt = `
Eres un mecánico experto.
Analiza esta falla: "${descripcion}"
Devuelve JSON: { 
  "diagnostico": "", 
  "repuestos": [{"nombre": "", "prioridad": "alta/media/baja"}], 
  "acciones": [] 
}
Solo JSON, nada más.
  `;

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    const data = await resp.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("No se recibió respuesta válida de OpenAI");
    }

    // Convertir la respuesta en JSON
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error("Error detectando repuestos:", err);
    return { diagnostico: "", repuestos: [], acciones: [] };
  }
}

/**
 * Inicia la creación de orden por voz (placeholder para integración con Web Speech API)
 */
export function iniciarVoz() {
  alert("Función de creación de órdenes por voz activada (pendiente integración Web Speech API)");
}