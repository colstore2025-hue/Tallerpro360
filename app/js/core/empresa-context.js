/**
 * empresa-context.js
 * TallerPRO360 SaaS
 * Manejo central de empresa activa
 */


/* ===============================
   OBTENER EMPRESA ACTIVA
=============================== */

export function obtenerEmpresaId(){

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){

    console.warn("empresaId no encontrado en localStorage");

    return null;

  }

  return empresaId;

}


/* ===============================
   ESTABLECER EMPRESA ACTIVA
=============================== */

export function establecerEmpresaId(empresaId){

  if(!empresaId){

    console.error("empresaId inválido");

    return;

  }

  localStorage.setItem("empresaId",empresaId);

}


/* ===============================
   LIMPIAR EMPRESA ACTIVA
=============================== */

export function limpiarEmpresaId(){

  localStorage.removeItem("empresaId");

}


/* ===============================
   VALIDAR CONTEXTO DE EMPRESA
=============================== */

export function validarEmpresa(){

  const empresaId = obtenerEmpresaId();

  if(!empresaId){

    console.warn("No hay empresa activa");

    return false;

  }

  return true;

}