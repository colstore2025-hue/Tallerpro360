// serviceOrders.voice.js
import { db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function addVoiceNote(orderId, voiceUrl, text) {
  const ref = doc(db, "serviceOrders", orderId);

  await updateDoc(ref, {
    voiceNotes: arrayUnion({
      url: voiceUrl,
      text,
      at: new Date().toISOString()
    })
  });
}