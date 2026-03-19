export function hablar(texto) {
  try {
    const speech = new SpeechSynthesisUtterance(texto);
    speech.lang = "es-CO";
    window.speechSynthesis.speak(speech);
  } catch (e) {
    console.warn("Error voz:", e);
  }
}

export function iniciarVoz(callback) {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "es-CO";

  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript;
    callback(texto);
  };

  recognition.start();
}