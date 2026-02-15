export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  console.log("Webhook recibido:", req.body);

  // Aquí luego validaremos pago aprobado
  // Y activaremos plan en Firestore

  res.status(200).send("OK");
}