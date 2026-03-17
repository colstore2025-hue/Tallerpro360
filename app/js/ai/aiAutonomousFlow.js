/**
 * IA AUTÓNOMA - Genera órdenes editables
 */

export async function generarOrdenIA(input) {
  try {
    console.log("🤖 IA procesando:", input);

    // 🔥 Simulación IA (luego conectas OpenAI o tu AI)
    const orden = {
      cliente: {
        nombre: "Cliente pendiente",
        clienteId: "cliente_001"
      },
      vehiculo: {
        marca: detectarMarca(input),
        modelo: detectarModelo(input),
        placa: detectarPlaca(input)
      },
      diagnostico: detectarDiagnostico(input),
      cotizacion: detectarRepuestos(input),
      valorTrabajo: 300000,
      total: 0,
      estado: "borrador_ia",
      editable: true
    };

    orden.total = calcularTotal(orden);

    return orden;

  } catch (e) {
    console.error("Error IA:", e);
    return null;
  }
}

// ----------------------
// Helpers simples (mejorables)
// ----------------------

function detectarMarca(texto) {
  if (texto.toLowerCase().includes("toyota")) return "Toyota";
  return "";
}

function detectarModelo(texto) {
  if (texto.toLowerCase().includes("corolla")) return "Corolla";
  return "";
}

function detectarPlaca(texto) {
  const match = texto.match(/[A-Z]{3}[0-9]{3}/);
  return match ? match[0] : "";
}

function detectarDiagnostico(texto) {
  if (texto.includes("freno")) return "Cambio de pastillas de freno";
  return "Diagnóstico general";
}

function detectarRepuestos(texto) {
  if (texto.includes("freno")) {
    return [
      {
        pieza: "Pastillas de freno",
        cantidad: 1,
        preciounitario: 120000
      }
    ];
  }
  return [];
}

function calcularTotal(orden) {
  let total = 0;

  orden.cotizacion.forEach(i => {
    total += i.cantidad * i.preciounitario;
  });

  total += Number(orden.valorTrabajo || 0);

  return total;
}