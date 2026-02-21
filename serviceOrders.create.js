import {
  getFirestore,
  doc,
  getDoc,
  collection,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

export async function crearOrden(empresaId, data) {

  return await runTransaction(db, async (transaction) => {

    const tallerRef = doc(db, "talleres", empresaId);
    const counterRef = doc(db, "talleres", empresaId, "counters", "ordenes");
    const numeracionRef = doc(db, "talleres", empresaId, "counters", "numeracion");

    const ordenRef = doc(collection(db, "talleres", empresaId, "ordenes"));

    const tallerSnap = await transaction.get(tallerRef);
    const counterSnap = await transaction.get(counterRef);
    const numeracionSnap = await transaction.get(numeracionRef);

    if (!tallerSnap.exists()) throw "Taller no existe";
    if (!counterSnap.exists()) throw "Counter no existe";
    if (!numeracionSnap.exists()) throw "Numeración no existe";

    const limite = tallerSnap.data().limiteOrdenesMensuales;
    const totalMes = counterSnap.data().totalMesActual;
    const ultimoNumero = numeracionSnap.data().ultimoNumero;

    if (totalMes >= limite) {
      throw "Has alcanzado el límite mensual de órdenes";
    }

    const nuevoNumero = ultimoNumero + 1;
    const codigo = `TP360-${String(nuevoNumero).padStart(6, "0")}`;

    transaction.update(counterRef, {
      totalMesActual: totalMes + 1
    });

    transaction.update(numeracionRef, {
      ultimoNumero: nuevoNumero
    });

    transaction.set(ordenRef, {
      codigo,
      ...data,
      estado: "INGRESO",
      timeline: [
        { estado: "INGRESO", fecha: serverTimestamp() }
      ],
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    });

    return codigo;
  });
}