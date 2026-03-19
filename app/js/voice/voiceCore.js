export function hablar(texto) {
  try {
    const speech = new SpeechSynthesisUtterance(texto);
    speech.lang = "es-CO";
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  } catch (e) {
    console.warn("Voice error:", e);
  }
}

export function iniciarVoz(callback) {
  try {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "es-CO";

    recognition.onresult = e => {
      const texto = e.results[0][0].transcript;
      callback(texto);
    };

    recognition.start();
  } catch (e) {
    console.warn("Voice recognition error:", e);
  }
}