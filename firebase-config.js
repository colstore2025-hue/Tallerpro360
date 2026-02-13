// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PEGA_AQUI_TU_APIKEY_REAL",
  authDomain: "PEGA_AQUI_TU_AUTHDOMAIN",
  projectId: "PEGA_AQUI_TU_PROJECTID",
  storageBucket: "PEGA_AQUI_TU_STORAGE",
  messagingSenderId: "PEGA_AQUI_TU_SENDERID",
  appId: "PEGA_AQUI_TU_APPID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);