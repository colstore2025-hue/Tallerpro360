/**
 * ======================================================
 * detectarRepuestos.js
 * Motor simple de diagnóstico basado en palabras clave
 * Proyecto: TallerPRO360
 * ======================================================
 */

export async function detectarRepuestos(descripcion) {

  /* ======================================================
     NORMALIZAR TEXTO
  ====================================================== */

  const texto = (descripcion || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");


  /* ======================================================
     VARIABLES
  ====================================================== */

  const repuestos = new Set();
  const acciones = [];

  let diagnostico =
    "Diagnóstico preliminar generado por análisis automático.";


  /* ======================================================
     REGLAS DE DIAGNÓSTICO
  ====================================================== */

  if (texto.includes("freno")) {

    repuestos.add("Pastillas de freno");

    acciones.push({
      nombre: "Revisión sistema de frenos",
      costo: 40000
    });

  }


  if (
    texto.includes("bateria") ||
    texto.includes("no arranca")
  ) {

    repuestos.add("Batería");

    acciones.push({
      nombre: "Revisión sistema eléctrico",
      costo: 30000
    });

  }


  if (texto.includes("aceite")) {

    repuestos.add("Aceite de motor");

    acciones.push({
      nombre: "Cambio de aceite",
      costo: 50000
    });

  }


  if (
    texto.includes("ruido") ||
    texto.includes("vibracion")
  ) {

    acciones.push({
      nombre: "Revisión general de suspensión",
      costo: 40000
    });

  }


  /* ======================================================
     SI NO SE DETECTA NADA
  ====================================================== */

  if (acciones.length === 0) {

    acciones.push({
      nombre: "Diagnóstico general",
      costo: 30000
    });

  }


  /* ======================================================
     RESPUESTA
  ====================================================== */

  return {

    diagnostico,

    repuestos: [...repuestos],

    acciones

  };

}