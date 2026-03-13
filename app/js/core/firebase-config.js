/**
 * firebase-config.js
 * TallerPRO360 ERP SaaS
 * Configuración central Firebase
 * Compatible PWA / Offline / SDK v10+
 */


/* ======================================================
IMPORTS FIREBASE
====================================================== */

import { initializeApp, getApps, getApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getAuth,
setPersistence,
browserLocalPersistence
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
getFirestore,
enableIndexedDbPersistence
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
getAnalytics,
isSupported
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

import { getStorage }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


/* ======================================================
CONFIGURACIÓN FIREBASE
====================================================== */

const firebaseConfig = {

apiKey: "AIzaSyAdk-s-OXu57MiobzRGBRu-TlF2KYeicWQ",

authDomain: "tallerpro360.firebaseapp.com",

projectId: "tallerpro360",

storageBucket: "tallerpro360.appspot.com",

messagingSenderId: "636224778184",

appId: "1:636224778184:web:9bd7351b6458a1ef625afd",

measurementId: "G-VEC2C0QX2G"

};


/* ======================================================
INICIALIZACIÓN SEGURA FIREBASE
====================================================== */

const app = getApps().length
? getApp()
: initializeApp(firebaseConfig);


/* ======================================================
AUTHENTICATION
====================================================== */

export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
.then(() => {

console.log("🔐 Auth persistente activado");

})
.catch((error) => {

console.warn("⚠️ Error persistencia Auth:", error);

});


/* ======================================================
FIRESTORE DATABASE
====================================================== */

export const db = getFirestore(app);


/* ======================================================
STORAGE
====================================================== */

export const storage = getStorage(app);


/* ======================================================
OFFLINE MODE (PWA)
====================================================== */

async function activarOffline(){

try{

await enableIndexedDbPersistence(db);

console.log("📦 Firestore offline habilitado");

}catch(err){

if(err.code === "failed-precondition"){

console.warn("⚠️ Offline ya activo en otra pestaña");

}
else if(err.code === "unimplemented"){

console.warn("⚠️ Navegador no soporta IndexedDB");

}
else{

console.warn("⚠️ Offline no disponible:",err);

}

}

}

activarOffline();


/* ======================================================
ANALYTICS
====================================================== */

let analytics = null;

async function iniciarAnalytics(){

try{

const supported = await isSupported();

if(supported){

analytics = getAnalytics(app);

console.log("📊 Firebase Analytics activo");

}

}catch(e){

console.warn("⚠️ Analytics no disponible");

}

}

iniciarAnalytics();

export { analytics };


/* ======================================================
EXPORT APP
====================================================== */

export default app;