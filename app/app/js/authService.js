import {
getAuth,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";


const auth = getAuth();


export async function login(email,password){

const cred = await signInWithEmailAndPassword(
auth,
email,
password
);

const uid = cred.user.uid;

const userDoc = await getDoc(
doc(db,"usuarios",uid)
);

const data = userDoc.data();

localStorage.setItem("tallerId",data.tallerId);

}