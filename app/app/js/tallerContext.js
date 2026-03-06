// tallerContext.js
export function setTallerId(tallerId) {
  localStorage.setItem("tallerId", tallerId);
}

export function obtenerTallerId() {
  return localStorage.getItem("tallerId");
}