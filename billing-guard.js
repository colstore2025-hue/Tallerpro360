<script type="module">
import { getAuth, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore, doc, getDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  const userSnap = await getDoc(doc(db, "usuarios", user.uid));
  if (!userSnap.exists()) {
    location.href = "pagos.html";
    return;
  }

  const { tallerId } = userSnap.data();
  if (!tallerId) {
    location.href = "pagos.html";
    return;
  }

  const tallerSnap = await getDoc(doc(db, "talleres", tallerId));
  if (!tallerSnap.exists()) {
    location.href = "pagos.html";
    return;
  }

  const taller = tallerSnap.data();

  if (taller.estadoPlan !== "activo") {
    location.href = "pagos.html";
    return;
  }

  const hoy = new Date();
  const vence = taller.venceEn?.toDate?.();

  if (!vence || vence < hoy) {
    location.href = "pagos.html";
    return;
  }

  // ✅ PLAN VÁLIDO → EL TALLER PUEDE USAR EL SISTEMA
  console.log("✅ Plan activo hasta:", vence.toLocaleDateString());
});
</script>