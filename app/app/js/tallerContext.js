export function setTallerId(tallerId){
  localStorage.setItem("tallerId",tallerId);
}

export function obtenerTallerId(){
  return localStorage.getItem("tallerId");
}

export function limpiarTaller(){
  localStorage.removeItem("tallerId");
}