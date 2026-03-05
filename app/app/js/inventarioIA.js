import { db } from "./firebase.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function buscarRepuesto(nombre){

const q = query(
collection(db,"repuestos"),
where("nombre","==",nombre)
);

const snap = await getDocs(q);

if(snap.empty) return null;

return snap.docs[0].data();

}