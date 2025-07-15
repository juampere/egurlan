// Obtener carrito desde localStorage
function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

// Obtener ID de producto desde la URL (para compra directa)
function getIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get("id"));
}

// Mostrar resumen de compra directa (un solo producto)
function mostrarResumenDirecto(producto) {
  const resumen = document.getElementById("resumen-carrito");
  const texto = `${producto.nombre} - $${producto.precio.toLocaleString()}`;
  resumen.innerHTML = `
    <p>${texto}</p>
    <div class="pt-4 font-bold text-lg">Total: $${producto.precio.toLocaleString()}</div>
  `;
  return {
    resumenTexto: texto,
    total: producto.precio
  };
}

// Mostrar resumen de productos del carrito
function mostrarResumenCarrito() {
  const resumen = document.getElementById("resumen-carrito");
  const carrito = obtenerCarrito();
  if (carrito.length === 0) {
    resumen.innerHTML = "<p>Tu carrito está vacío.</p>";
    return null;
  }

  const agrupado = {};
  let total = 0;

  carrito.forEach(p => {
    if (!agrupado[p.id]) {
      agrupado[p.id] = { ...p, cantidad: 1 };
    } else {
      agrupado[p.id].cantidad++;
    }
    total += p.precio;
  });

  const resumenTexto = Object.values(agrupado).map(p =>
    `${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toLocaleString()}`
  ).join("\n");

  resumen.innerHTML = resumenTexto.replace(/\n/g, "<br>") + `
    <div class="pt-4 font-bold text-lg">Total: $${total.toLocaleString()}</div>
  `;

  return { resumenTexto, total };
}

// Evento de envío del formulario
document.getElementById("form-checkout").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const localidad = document.getElementById("localidad").value.trim();

  if (!nombre || !telefono || !localidad) {
    alert("Por favor completá nombre, teléfono y localidad.");
    return;
  }

  const idDirecto = getIdFromURL();
  let resumenData;

  if (idDirecto) {
    const producto = productos.find(p => p.id === idDirecto);
    if (!producto) {
      alert("Producto no encontrado para compra directa.");
      return;
    }
    resumenData = mostrarResumenDirecto(producto);
  } else {
    resumenData = mostrarResumenCarrito();
    if (!resumenData) {
      alert("El carrito está vacío.");
      return;
    }
  }

  // Armar mensaje de WhatsApp
  let mensaje = `
Hola, quiero hacer un pedido:

Nombre: ${nombre}
Teléfono: ${telefono}
Localidad: ${localidad}
${email ? `Email: ${email}` : ""}

Pedido:
${resumenData.resumenTexto}

Total: $${resumenData.total.toLocaleString()}
  `.trim();

  const numeroWhatsApp = "5493446374568";
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");

  // Vaciar carrito solo si no es compra directa
  if (!idDirecto) localStorage.removeItem("carrito");

  this.reset();
  document.getElementById("resumen-carrito").innerHTML = "<p>Gracias por tu pedido 🙌</p>";
  document.getElementById("mensaje-gracias").classList.remove("hidden");
});

// Cargar resumen al entrar
window.addEventListener("DOMContentLoaded", () => {
  const idDirecto = getIdFromURL();
  if (idDirecto) {
    const producto = productos.find(p => p.id === idDirecto);
    if (producto) {
      mostrarResumenDirecto(producto);
    } else {
      document.getElementById("resumen-carrito").innerHTML = "<p>Producto no encontrado.</p>";
    }
    document.getElementById("formas-pago").classList.remove("hidden");
  } else {
    mostrarResumenCarrito();
  }
});
