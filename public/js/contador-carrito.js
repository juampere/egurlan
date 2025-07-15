// contador-carrito.js

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

function actualizarContadorCarrito() {
  const carrito = obtenerCarrito();
  const cantidad = carrito.length;

  const contadorDesktop = document.getElementById("contadorCarrito");
  const contadorMobile = document.getElementById("contadorCarritoMobile");

  if (contadorDesktop) contadorDesktop.textContent = cantidad;
  if (contadorMobile) contadorMobile.textContent = cantidad;
}

// Actualizo contador cuando se carga el script
document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);

