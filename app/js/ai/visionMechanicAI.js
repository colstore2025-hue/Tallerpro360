// visionMechanicAI.js
// IA que analiza fotos de motores

export async function analizarMotor(base64Image){

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
Analiza esta imagen de un motor automotriz.

Detecta:

- fugas de aceite
- piezas desgastadas
- mangueras dañadas
- corrosión

Devuelve JSON:

{
problemas:[
{tipo:"",descripcion:"",gravedad:""}
]
}
`;

const response = await fetch("https://api.openai.com/v1/chat/completions",{

method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+API_KEY
},

body:JSON.stringify({

model:"gpt-4.1",

messages:[
{
role:"user",
content:[
{type:"text",text:prompt},
{type:"image_url",image_url:{url:base64Image}}
]
}
],

max_tokens:500

})

});

const data = await response.json();

return data;

}