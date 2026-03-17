import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

const PLANES_VALIDOS = ["freemium", "basico", "pro", "elite", "enterprise"];

export async function pagarPlan(planId) {
  try {
    if (!PLANES_VALIDOS.includes(planId)) {
      alert("Plan inválido");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      alert("Debes iniciar sesión para continuar");
      window.location.href = "/login.html";
      return;
    }

    // Mostrar indicador de carga (opcional)
    const btn = document.querySelector(`[onclick="pagarPlan('${planId}')"]`);
    const btnText = btn?.innerText;
    if (btn) btn.innerText = "Procesando...";

    // Obtener token Firebase para backend
    const token = await user.getIdToken();

    const resp = await fetch("/api/crearPago", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        uid: user.uid,
        planId: planId
      })
    });

    const data = await resp.json();

    if (data.init_point) {
      window.location.href = data.init_point; // Redirige a MercadoPago
    } else {
      alert(data.error || "No se pudo iniciar el pago");
    }

    // Restaurar botón
    if (btn) btn.innerText = btnText;

  } catch (error) {
    console.error("Error procesando pago:", error);
    alert("Ocurrió un error al procesar tu pago. Intenta nuevamente.");
    const btn = document.querySelector(`[onclick="pagarPlan('${planId}')"]`);
    if (btn) btn.innerText = btn?.innerText || "Elegir plan";
  }
}