export async function diagnosticoIA(texto){

const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.firebasestorage.app",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};

try{

const prompt = `
Eres un mecánico automotriz experto con 25 años de experiencia.

Analiza el siguiente problema reportado por un técnico:

"${texto}"

Responde en español con este formato:

POSIBLES CAUSAS:
• causa 1
• causa 2
• causa 3
• causa 4

PRUEBAS RECOMENDADAS:
• prueba 1
• prueba 2

SEVERIDAD:
Baja / Media / Alta

No des explicaciones largas.
`;

const respuesta = await fetch(
"https://api.openai.com/v1/chat/completions",
{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+API_KEY
},
body:JSON.stringify({
model:"gpt-4o-mini",
messages:[
{
role:"user",
content:prompt
}
],
temperature:0.3,
max_tokens:300
})
});

if(!respuesta.ok){
throw new Error("Error en API OpenAI");
}

const data = await respuesta.json();

return data.choices?.[0]?.message?.content || "No se pudo generar diagnóstico.";

}catch(error){

console.error("Error IA:", error);

return "Error generando diagnóstico.";

}

}