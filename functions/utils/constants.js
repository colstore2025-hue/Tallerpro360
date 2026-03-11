// /utils/constants.js
/************************************************
 * TallerPRO360 · Constantes Enterprise
 * Planes, roles y límites del ERP SaaS
 ************************************************/

// 🔹 Planes disponibles
const PLANES = {
  freemium: {
    sucursales: 1,
    ordenesMes: 30,
    facturacionElectronica: false,
    contabilidadAvanzada: false,
    duracion_dias: 7
  },
  basico: {
    sucursales: 1,
    ordenesMes: 200,
    facturacionElectronica: true,
    contabilidadAvanzada: false,
    duracion_dias: 30
  },
  pro: {
    sucursales: 3,
    ordenesMes: 500,
    facturacionElectronica: true,
    contabilidadAvanzada: true,
    duracion_dias: 30
  },
  elite: {
    sucursales: 5,
    ordenesMes: 1000,
    facturacionElectronica: true,
    contabilidadAvanzada: true,
    duracion_dias: 30
  },
  enterprise: {
    sucursales: 10,
    ordenesMes: 5000,
    facturacionElectronica: true,
    contabilidadAvanzada: true,
    duracion_dias: 30
  }
};

// 🔹 Roles dentro del ERP
const ROLES = {
  DUENO: "dueno",
  ADMIN: "admin",
  ASESOR: "asesor",
  TECNICO: "tecnico",
  RECEPCIONISTA: "recepcionista",
  CLIENTE: "cliente"
};

module.exports = {
  PLANES,
  ROLES
};