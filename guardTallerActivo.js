<script type="module">
import { getAuth, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userRef = doc(db, "usuarios", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    bloquear("Usuario no autorizado");
    return;
  }

  const userData = userSnap.data();

  if (!userData.activo) {
    bloquear("Usuario inactivo. Contacte soporte.");
    return;
  }

  const tallerRef = doc(db, "talleres", userData.tallerId);
  const tallerSnap = await getDoc(tallerRef);

  if (!tallerSnap.exists()) {
    bloquear("Taller no registrado");
    return;
  }

  const taller = tallerSnap.data();
  const hoy = new Date();
  const vence = taller.venceEn?.toDate?.() || null;

  if (!taller.activo) {
    bloquear("Su plan está suspendido");
    return;
  }

  if (vence && vence < hoy) {
    bloquear("Su plan ha vencido. Renueve para continuar.");
    return;
  }

  // ✅ Todo OK → la app continúa
  console.log("✅ Taller activo:", taller.nombre);
});

function bloquear(mensaje) {
  document.body.innerHTML = `
    <div style="
      display:flex;
      height:100vh;
      justify-content:center;
      align-items:center;
      background:#0f172a;
      color:white;
      font-family:sans-serif;
      text-align:center;
    ">
      <div>
        <h1>🔒 Acceso restringido</h1>
        <p>${mensaje}</p>
        <p>📞 Contacte a TallerPRO360</p>
      </div>
    </div>
  `;
}
</script>