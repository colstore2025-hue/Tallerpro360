// ==============================
// TallerPRO360 Voice Assistant
// ==============================

export function iniciarVoz() {

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Tu navegador no soporta reconocimiento de voz");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "es-CO";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.start();

  recognition.onstart = () => {
    console.log("🎙️ Escuchando...");
  };

  recognition.onresult = (event) => {

    const texto = event.results[0][0].transcript;

    console.log("Voz detectada:", texto);

    procesarComando(texto);

  };

  recognition.onerror = (event) => {
    console.error("Error voz:", event.error);
  };

}


// ==============================
// Procesar comandos
// ==============================

function procesarComando(texto) {

  texto = texto.toLowerCase();

  if (texto.includes("crear orden")) {

    alert("🛠️ Comando detectado: crear orden");

    // Aquí después conectaremos con Firestore
  }

  else if (texto.includes("abrir inventario")) {

    alert("📦 Abrir módulo inventario");

  }

  else {

    alert("No entendí el comando: " + texto);

  }

}