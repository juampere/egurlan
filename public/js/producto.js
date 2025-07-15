const BASE_URL = "http://localhost:3000";

function getIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get("id"));
}

function getFiltrosDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const filtros = {};
  if (params.has("busqueda")) filtros.busqueda = params.get("busqueda");
  if (params.has("categoria")) filtros.categoria = params.get("categoria");
  if (params.has("orden")) filtros.orden = params.get("orden");
  if (params.has("pagina")) filtros.pagina = params.get("pagina");
  return filtros;
}

function construirURLConFiltros(baseUrl, filtros) {
  const params = new URLSearchParams();
  for (const key in filtros) {
    if (filtros[key]) params.set(key, filtros[key]);
  }
  return `${baseUrl}?${params.toString()}`;
}

async function fetchProductos() {
  try {
    const res = await fetch(`${BASE_URL}/api/productos`);
    if (!res.ok) throw new Error("Error al obtener productos");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

function formatearPrecio(precio) {
  return `$${precio.toLocaleString()}`;
}

function crearTag(texto) {
  const span = document.createElement("span");
  span.textContent = texto;
  span.className = "bg-secundario text-fondo text-sm px-3 py-1 rounded-full select-none";
  return span;
}

function crearMiniatura(src, alt, activo = false) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.className =
    "w-24 h-16 object-cover rounded border-2 cursor-pointer hover:border-secundario transition-colors duration-300";
  if (activo) img.classList.add("border-secundario", "shadow-md");
  return img;
}

function actualizarFotoPrincipal(url) {
  const fotoPrincipal = document.getElementById("foto-principal");
  fotoPrincipal.src = url;
  fotoPrincipal.alt = "Foto producto";
}

function mostrarAlertaCarrito() {
  const alerta = document.getElementById("alertaCarrito");
  if (!alerta) return;

  alerta.classList.remove("hidden");
  setTimeout(() => alerta.classList.add("opacity-100"), 10);

  setTimeout(() => {
    alerta.classList.remove("opacity-100");
    setTimeout(() => alerta.classList.add("hidden"), 500);
  }, 2500);
}

function agregarAlCarrito(producto) {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  // Buscar si ya existe el producto en el carrito (por id)
  const index = carrito.findIndex((item) => item.id === producto.id);
  if (index > -1) {
    carrito[index].cantidad = (carrito[index].cantidad || 1) + 1;
  } else {
    const prodConCantidad = { ...producto, cantidad: 1 };
    carrito.push(prodConCantidad);
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContadorCarrito();
  mostrarAlertaCarrito();
}

function mostrarProducto() {
  const id = getIdFromURL();
  if (!id) {
    document.querySelector("main").innerHTML = "<p class='text-center p-10'>ID de producto inválido.</p>";
    return;
  }

  fetchProductos().then((productos) => {
    if (!productos) {
      document.querySelector("main").innerHTML = "<p class='text-center p-10'>No se pudieron cargar los productos.</p>";
      return;
    }

    const producto = productos.find((p) => p.id === id);
    if (!producto) {
      document.querySelector("main").innerHTML = "<p class='text-center p-10'>Producto no encontrado.</p>";
      return;
    }

    document.title = `${producto.nombre} - Tienda Ganadera`;

    document.getElementById("nombre-producto").textContent = producto.nombre;
    document.getElementById("descripcion-producto").innerHTML = producto.descripcion || "";

    const preciosDiv = document.getElementById("precios-producto");
    preciosDiv.innerHTML = "";
    if (producto.precioPromocional > 0 && producto.precioPromocional < producto.precio) {
      const precioOriginal = document.createElement("span");
      precioOriginal.textContent = formatearPrecio(producto.precio);
      precioOriginal.className = "text-gray-500 line-through mr-2";

      const precioPromo = document.createElement("span");
      precioPromo.textContent = formatearPrecio(producto.precioPromocional);
      precioPromo.className = "text-secundario font-bold";

      preciosDiv.append(precioOriginal, precioPromo);
    } else {
      preciosDiv.textContent = formatearPrecio(producto.precio);
      preciosDiv.className = "text-secundario font-semibold text-2xl";
    }

    const tagsDiv = document.getElementById("tags-producto");
    tagsDiv.innerHTML = "";
    if (producto.tags && producto.tags.length) {
      producto.tags.forEach((tag) => {
        tagsDiv.appendChild(crearTag(tag));
      });
    }

    const galeriaDiv = document.getElementById("galeria");
    galeriaDiv.innerHTML = "";

    const fotos = Array.isArray(producto.fotos) && producto.fotos.length ? producto.fotos : ["https://placehold.co/400x300?text=Sin+imagen"];

    fotos.forEach((foto, i) => {
      const urlFoto = foto.startsWith("/uploads/") ? `${BASE_URL}${foto}` : foto;
      const miniatura = crearMiniatura(urlFoto, `${producto.nombre} detalle ${i + 1}`, i === 0);
      miniatura.addEventListener("click", () => {
        actualizarFotoPrincipal(urlFoto);
        galeriaDiv.querySelectorAll("img").forEach((img) => img.classList.remove("border-secundario", "shadow-md"));
        miniatura.classList.add("border-secundario", "shadow-md");
      });
      galeriaDiv.appendChild(miniatura);
    });

    actualizarFotoPrincipal(fotos[0].startsWith("/uploads/") ? `${BASE_URL}${fotos[0]}` : fotos[0]);

    document.getElementById("btn-agregar").onclick = () => agregarAlCarrito(producto);

    const botonesDiv = document.getElementById("botones-producto");
    if (producto.ventaDirecta) {
      botonesDiv.innerHTML = `<a href="checkout.html?id=${producto.id}" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">Comprar ahora</a>`;
    } else {
      botonesDiv.innerHTML = `
        <a href="consultar.html" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold inline-flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.15-.198.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.134.297-.347.446-.52.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.52-.075-.149-.672-1.614-.921-2.21-.242-.579-.487-.5-.672-.51-.173-.007-.372-.009-.571-.009s-.52.075-.793.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.488 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12.004 2C6.479 2 2 6.478 2 12.004c0 1.957.509 3.789 1.392 5.405L2 22l4.722-1.357c1.565.853 3.355 1.33 5.282 1.33 5.524 0 10.004-4.478 10.004-10.004S17.528 2 12.004 2zm.001 18.338c-1.711 0-3.3-.498-4.637-1.354l-.333-.199-2.804.805.746-2.737-.216-.347a8.281 8.281 0 01-1.297-4.449c0-4.59 3.72-8.309 8.31-8.309 4.59 0 8.309 3.719 8.309 8.309s-3.719 8.309-8.309 8.309z"/>
          </svg>
          Consultar por WhatsApp
        </a>`;
    }
  });
}

function setVolverConFiltros() {
  const btnVolver = document.getElementById("btn-volver");
  const filtros = getFiltrosDesdeURL();
  const urlIndexConFiltros = construirURLConFiltros("productos.html", filtros);
  btnVolver.href = urlIndexConFiltros;
}

mostrarProducto();
setVolverConFiltros();
