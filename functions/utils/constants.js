// utils/constants.js

const PLANES = {
  trial: {
    sucursales: 1,
    ordenesMes: 50,
    facturacionElectronica: false,
    contabilidadAvanzada: false
  },
  pro_mensual: {
    sucursales: 2,
    ordenesMes: 300,
    facturacionElectronica: false,
    contabilidadAvanzada: true
  },
  pro_anual: {
    sucursales: 5,
    ordenesMes: 1000,
    facturacionElectronica: true,
    contabilidadAvanzada: true
  }
};

const ROLES = {
  DUENO: "dueno",
  ADMIN: "admin",
  ASESOR: "asesor",
  TECNICO: "tecnico"
};

module.exports = {
  PLANES,
  ROLES
};