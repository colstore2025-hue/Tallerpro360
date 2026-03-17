import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
      apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",
      authDomain: "tallerpro360.firebaseapp.com",
      projectId: "tallerpro360",
      storageBucket: "tallerpro360.firebasestorage.app",
      messagingSenderId: "636224778184",
      appId: "1:636224778184:web:9bd7351b6458a1ef625afd",
      measurementId: "G-VEC2C0QX2G"
    };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
window.db = db; // acceso global