// voiceCore.js

export function iniciarVoz(onResult) {

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("❌ Navegador no soporta voz");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "es-CO";
  recognition.continuous = true;

  recognition.onresult = (event) => {
    const texto = event.results[event.results.length - 1][0].transcript;
    console.log("🎤 Voz:", texto);
    onResult(texto);
  };

  recognition.start();

  return recognition;
}