import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { detectarRepuestos } from "./detectarRepuestos.js";


export async function crearOrdenIA(descripcion){

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){
    alert("Empresa no identificada");
    return;
  }

  try{

    const resultadoIA = await detectarRepuestos(descripcion);

    const diagnostico = resultadoIA.diagnostico || "";
    const repuestos = resultadoIA.repuestos || [];
    const accionesIA = resultadoIA.acciones || [];

    const acciones = accionesIA.map(a => {

      if(typeof a === "string"){

        return {
          descripcion:a,
          costo:0,
          costoInterno:0,
          estado:"pendiente"
        };

      }

      return {
        descripcion:a.nombre || "",
        costo:0,
        costoInterno:0,
        estado:"pendiente"
      };

    });


    await addDoc(
      collection(
        db,
        "empresas",
        empresaId,
        "ordenes"
      ),
      {
        cliente: "Pendiente",
        vehiculo: "Por definir",
        placa: "Sin placa",
        tecnico: "Sin asignar",

        estado: "activa",

        descripcionProblema: descripcion,

        diagnosticoIA: diagnostico,

        repuestosIA: repuestos,

        acciones: acciones,

        total: 0,

        fecha: serverTimestamp()
      }
    );

    alert("Orden creada con diagnóstico IA");

  }catch(error){

    console.error("Error IA orden:",error);

    alert("Error generando orden IA");

  }

}