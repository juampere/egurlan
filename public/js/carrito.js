// Obtener carrito del localStorage o crear uno vacío
function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

// Guardar carrito en localStorage
function guardarCarrito(carrito) {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// Agrupar productos por id para mostrar cantidad
function agruparProductos(carrito) {
  const resumen = {};
  carrito.forEach(prod => {
    if (!resumen[prod.id]) {
      resumen[prod.id] = { ...prod, cantidad: 1 };
    } else {
      resumen[prod.id].cantidad++;
    }
  });
  return Object.values(resumen);
}

// Mostrar carrito en el DOM
function mostrarCarrito() {
  const carrito = obtenerCarrito();
  const contenedor = document.getElementById("lista-carrito");
  const vacio = document.getElementById("carrito-vacio");
  const resumen = document.getElementById("resumen");
  const btnVaciar = document.getElementById("vaciar-carrito");

  contenedor.innerHTML = "";

  if (carrito.length === 0) {
    vacio.classList.remove("hidden");
    resumen.textContent = "";
    btnVaciar.classList.add("hidden");
    return;
  }

  vacio.classList.add("hidden");
  btnVaciar.classList.remove("hidden");

  const productosAgrupados = agruparProductos(carrito);
  let total = 0;

  productosAgrupados.forEach(prod => {
    const subtotal = prod.precio * prod.cantidad;
    total += subtotal;

    const urlMiniatura = prod.fotos?.[0]
      ? (prod.fotos[0].startsWith("/uploads/")
          ? "http://localhost:3000" + prod.fotos[0]
          : prod.fotos[0])
      : "https://placehold.co/600x400?text=Sin+Imagen";

    const div = document.createElement("div");
    div.className = "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 pt-4";

    div.innerHTML = `
      <div class="flex items-start gap-4 w-full md:w-2/3">
        <img src="${urlMiniatura}" alt="${prod.nombre}" class="w-20 h-20 object-cover rounded shadow shrink-0">
        <div>
          <h3 class="text-lg font-semibold">${prod.nombre}</h3>
          <p class="text-gray-700">Precio unitario: $${prod.precio.toLocaleString()}</p>
          <p class="text-gray-700 mt-1 md:hidden font-semibold">Subtotal: $${subtotal.toLocaleString()}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" data-id="${prod.id}" data-action="eliminar" aria-label="Eliminar una unidad de ${prod.nombre}">-</button>
        <span class="text-lg">${prod.cantidad}</span>
        <button class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700" data-id="${prod.id}" data-action="agregar" aria-label="Agregar una unidad de ${prod.nombre}">+</button>
      </div>

      <div class="text-gray-700 font-semibold hidden md:block">
        Subtotal: $${subtotal.toLocaleString()}
      </div>
    `;


    contenedor.appendChild(div);
  });

  resumen.textContent = `Total: $${total.toLocaleString()}`;

  // Botones + y -
  contenedor.querySelectorAll("button").forEach(btn => {
    const id = parseInt(btn.dataset.id);
    const action = btn.dataset.action;
    btn.onclick = () => {
      if (action === "agregar") agregarUnidad(id);
      else if (action === "eliminar") eliminarUnidad(id);
    };
  });
}

// Agregar una unidad del producto
function agregarUnidad(id) {
  const carrito = obtenerCarrito();
  const idx = carrito.findIndex(p => p.id === id);
  if (idx !== -1) {
    carrito.push(carrito[idx]); // duplicar
    guardarCarrito(carrito);
    mostrarCarrito();
  }
}

// Eliminar una unidad del producto
function eliminarUnidad(id) {
  let carrito = obtenerCarrito();
  const idx = carrito.findIndex(p => p.id === id);
  if (idx !== -1) {
    carrito.splice(idx, 1);
    guardarCarrito(carrito);
    mostrarCarrito();
  }
}

// Vaciar todo el carrito
function vaciarCarrito() {
  localStorage.removeItem("carrito");
  mostrarCarrito();
}

// Al cargar
window.addEventListener("DOMContentLoaded", () => {
  mostrarCarrito();
  document.getElementById("vaciar-carrito").onclick = vaciarCarrito;
});
