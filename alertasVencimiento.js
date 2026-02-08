<script type="module">
import { getAuth, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const userSnap = await getDoc(doc(db,"usuarios",user.uid));
  if (!userSnap.exists()) return;

  const { tallerId } = userSnap.data();
  if (!tallerId) return;

  const tallerRef = doc(db,"talleres",tallerId);
  const tallerSnap = await getDoc(tallerRef);
  if (!tallerSnap.exists()) return;

  const taller = tallerSnap.data();
  if (!taller.venceEn) return;

  const hoy = new Date();
  const vence = taller.venceEn.toDate();
  const dias = Math.ceil((vence - hoy) / (1000*60*60*24));

  const alertas = taller.alertas || { d7:false, d3:false, d1:false };

  if (dias <= 7 && dias > 3 && !alertas.d7) {
    mostrar(`⏳ Tu plan vence en ${dias} días`);
    await updateDoc(tallerRef, { "alertas.d7": true });
  }

  if (dias <= 3 && dias > 1 && !alertas.d3) {
    mostrar(`⚠️ Tu plan vence en ${dias} días`);
    await updateDoc(tallerRef, { "alertas.d3": true });
  }

  if (dias <= 1 && dias >= 0 && !alertas.d1) {
    mostrar(`🚨 Tu plan vence MAÑANA`);
    await updateDoc(tallerRef, { "alertas.d1": true });
  }
});

function mostrar(msg) {
  const div = document.createElement("div");
  div.innerHTML = `
    <div style="
      position:fixed;
      top:20px;
      right:20px;
      background:#f59e0b;
      color:black;
      padding:16px 20px;
      border-radius:12px;
      font-weight:bold;
      z-index:9999;
      box-shadow:0 10px 30px rgba(0,0,0,.4);
    ">
      ${msg}
    </div>
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 7000);
}
</script>