export async function detectarRepuestos(descripcion){
  const firebaseConfig = {
  apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
  authDomain: "tallerpro360.firebaseapp.com",
  projectId: "tallerpro360",
  storageBucket: "tallerpro360.firebasestorage.app",
  messagingSenderId: "636224778184",
  appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
  measurementId: "G-VEC2C0QX2G"
};
  const prompt = `
Eres un mecánico experto.
Analiza esta falla: "${descripcion}"
Devuelve JSON: { "diagnostico":"", "repuestos":[{"nombre":"","prioridad":"alta/media/baja"}], "acciones":[] }
Solo JSON.
  `;
  const resp = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{ "Content-Type":"application/json","Authorization":"Bearer "+API_KEY },
    body:JSON.stringify({ model:"gpt-4o-mini", messages:[{role:"user",content:prompt}], temperature:0.2 })
  });
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.content);
}