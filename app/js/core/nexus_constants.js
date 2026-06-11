// Add to: ../core/nexus_constants.js o donde manejes tus constantes globales
export const CATEGORIAS_CONTABLES_MASTER = [
  { id: "ingreso_ot", label: "4135 - VENTA SERVICIO / MANO DE OBRA", tipo: 'INGRESO', puc: "4135", cuenta: "413505", naturaleza: "DEBITO" },
  { id: "venta_repuestos", label: "4135 - VENTA DE REPUESTOS", tipo: 'INGRESO', puc: "4135", cuenta: "413510", naturaleza: "DEBITO" },
  { id: "cta_cobrar_repuesto", label: "1305 - CARTERA (POR COBRAR)", tipo: 'ACTIVO', puc: "1305", cuenta: "130505", naturaleza: "DEBITO" },
  { id: "saneamiento_deuda", label: "1105 - PAGO RECIBIDO (SANEAMIENTO)", tipo: 'INGRESO', puc: "1105", cuenta: "110505", naturaleza: "DEBITO" },
  { id: "anticipo_cliente", label: "2805 - ANTICIPOS RECIBIDOS", tipo: 'INGRESO', puc: "2805", cuenta: "280505", naturaleza: "DEBITO" },
  { id: "gasto_operativo", label: "5195 - GASTOS DIVERSOS (OPERATIVOS)", tipo: 'GASTO', puc: "5195", cuenta: "519595", naturaleza: "CREDITO" },
  { id: "compra_repuestos", label: "6135 - COMPRA INSUMOS / REPUESTOS", tipo: 'GASTO', puc: "6135", cuenta: "613505", naturaleza: "CREDITO" }, // Homologado a Clase 6 (Costos) o 5195 según tu régimen
  { id: "pago_nomina", label: "5105 - GASTOS DE PERSONAL (NÓMINA)", tipo: 'GASTO', puc: "5105", cuenta: "510506", naturaleza: "CREDITO" },
  { id: "pago_servicios", label: "5135 - SERVICIOS PÚBLICOS", tipo: 'GASTO', puc: "5135", cuenta: "513505", naturaleza: "CREDITO" },
  { id: "arrendamientos", label: "5120 - ARRENDAMIENTOS", tipo: 'GASTO', puc: "5120", cuenta: "512005", naturaleza: "CREDITO" },
  { id: "inyeccion_capital", label: "3115 - APORTES DE CAPITAL", tipo: 'INGRESO', puc: "3115", cuenta: "311505", naturaleza: "DEBITO" },
  { id: "ajuste_auditoria", label: "9999 - AJUSTE DE AUDITORÍA", tipo: 'AJUSTE', puc: "9999", cuenta: "999999", naturaleza: "AJUSTE" }
];
