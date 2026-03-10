/**
 * partsFraudDetector.js
 * TallerPRO360 ERP
 * Detector de fraude o anomalías en repuestos
 */

export function detectarFraudeRepuestos(lista = []){

  const alertas = [];

  lista.forEach(p => {

    const nombre = p.nombre || "Repuesto desconocido";
    const precio = Number(p.precio || 0);
    const compatible = p.compatible !== false;

    /* ===============================
    PRECIO EXCESIVO
    =============================== */

    if(precio > 500000){

      alertas.push({

        tipo: "precio_alto",

        repuesto: nombre,

        mensaje: `El repuesto "${nombre}" tiene un precio inusualmente alto.`

      });

    }

    /* ===============================
    INCOMPATIBILIDAD
    =============================== */

    if(!compatible){

      alertas.push({

        tipo: "incompatible",

        repuesto: nombre,

        mensaje: `El repuesto "${nombre}" no es compatible con el vehículo.`

      });

    }

  });

  return alertas;

}