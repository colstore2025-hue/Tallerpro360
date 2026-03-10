import { db } from "../core/firebase-config.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function buscarRepuesto(nombre){

  if(!nombre) return null;

  const empresaId = localStorage.getItem("empresaId");

  const nombreNormalizado = nombre
    .trim()
    .toLowerCase();

  const q = query(
    collection(db,"repuestos"),
    where("empresaId","==",empresaId),
    where("nombreNormalizado","==",nombreNormalizado)
  );

  const snap = await getDocs(q);

  if(snap.empty){
    return null;
  }

  return {
    id: snap.docs[0].id,
    ...snap.docs[0].data()
  };

}