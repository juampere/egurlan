const busquedaInput = document.getElementById("busqueda");
const filtroSelect = document.getElementById("filtroCategoria");
const ordenPrecioSelect = document.getElementById("ordenPrecio");
const contenedor = document.getElementById("lista-productos");
const paginacionContainer = document.getElementById("paginacion");

let productosGlobal = [];
let paginaActual = 1;
const productosPorPagina = 12;

// Leer parámetros de la URL
function obtenerParametros() {
  const params = new URLSearchParams(window.location.search);
  return {
    busqueda: params.get("busqueda")?.toLowerCase() || "",
    categoria: params.get("categoria")?.toLowerCase() || "",
    orden: params.get("orden") || "",
    pagina: parseInt(params.get("pagina")) || 1,
  };
}

const parametros = obtenerParametros();
paginaActual = parametros.pagina;

fetch('http://localhost:3000/api/productos')
  .then(res => res.json())
  .then(productos => {
    productosGlobal = productos;

    if (parametros.busqueda) busquedaInput.value = parametros.busqueda;
    if (parametros.orden) ordenPrecioSelect.value = parametros.orden;

    cargarCategoriasDesdeBackend();
  })
  .catch(err => {
    console.error('Error al cargar productos:', err);
  });

// --- función para cargar categorías desde el backend ---
function cargarCategoriasDesdeBackend() {
  const optionDefault = document.createElement("option");
  optionDefault.value = "";
  optionDefault.textContent = "Todas las categorías";
  filtroSelect.appendChild(optionDefault);

  fetch("http://localhost:3000/api/categorias")
    .then(res => res.json())
    .then(categorias => {
      categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.nombre.toLowerCase();     // 👈 usamos cat.nombre
        option.textContent = cat.nombre;
        filtroSelect.appendChild(option);
      });

      if (parametros.categoria) {
        const existe = categorias.some(c => c.nombre.toLowerCase() === parametros.categoria);
        if (existe) filtroSelect.value = parametros.categoria;
      }

      filtrarYMostrar();
    })

    .catch(err => {
      console.error("Error al cargar categorías:", err);
      filtrarYMostrar(); // mostrar productos igual
    });
}

function mostrarProductos(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = "<p class='text-center col-span-full text-gray-500'>No se encontraron productos.</p>";
    return;
  }

  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = lista.slice(inicio, fin);

  productosPagina.forEach(producto => {
    const card = document.createElement("div");
    card.className = "bg-white rounded shadow p-4 flex flex-col hover:shadow-lg transition relative";

    if (producto.precioPromocional && producto.precioPromocional < producto.precio) {
      const badge = document.createElement("span");
      badge.textContent = "Oferta";
      badge.className = "absolute top-2 left-2 bg-secundario text-white text-xs px-2 py-1 rounded shadow";
      card.appendChild(badge);
    }

    const img = document.createElement("img");
    img.src = producto.fotos?.[0]?.startsWith("/uploads/")
      ? `http://localhost:3000${producto.fotos[0]}`
      : producto.fotos?.[0] || "https://placehold.co/400x300?text=Sin+imagen";
    img.alt = producto.nombre;
    img.className = "w-full h-48 object-cover rounded mb-3";

    const nombre = document.createElement("h3");
    nombre.className = "text-lg font-semibold mb-1 text-texto";
    nombre.textContent = producto.nombre;

    const precio = document.createElement("p");
    precio.className = "text-secundario font-bold mb-2";

    if (producto.precioPromocional && producto.precioPromocional < producto.precio) {
      precio.innerHTML = `<span class="line-through text-gray-500 mr-2">$${producto.precio.toLocaleString()}</span> <span>$${producto.precioPromocional.toLocaleString()}</span>`;
    } else {
      precio.textContent = `$${producto.precio.toLocaleString()}`;
    }

    const boton = document.createElement("a");
    boton.href = `producto.html?id=${producto.id}`;
    boton.textContent = "Ver más";
    boton.className = "bg-secundario hover:opacity-90 text-fondo py-2 px-4 rounded text-center mt-auto block";

    card.appendChild(img);
    card.appendChild(nombre);
    card.appendChild(precio);
    card.appendChild(boton);

    contenedor.appendChild(card);
  });
}

function filtrarYMostrar() {
  const texto = busquedaInput.value.toLowerCase();
  const categoria = filtroSelect.value;
  const orden = ordenPrecioSelect.value;

  let filtrados = productosGlobal.filter(p => {
    const matchNombre = p.nombre.toLowerCase().includes(texto);
    const matchCategoria = categoria === "" || (typeof p.categoria === "string" && p.categoria.toLowerCase() === categoria);
    return matchNombre && matchCategoria;
  });

  if (orden === "asc") {
    filtrados.sort((a, b) => a.precio - b.precio);
  } else if (orden === "desc") {
    filtrados.sort((a, b) => b.precio - a.precio);
  } else {
    filtrados.sort((a, b) => b.id - a.id);
  }

  actualizarURL(texto, categoria, orden, paginaActual);
  mostrarProductos(filtrados);
  mostrarPaginacion(filtrados);
}


function mostrarPaginacion(lista) {
  if (!paginacionContainer) return;

  paginacionContainer.innerHTML = "";
  const totalPaginas = Math.ceil(lista.length / productosPorPagina);

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `px-3 py-1 rounded ${i === paginaActual ? 'bg-primario text-fondo' : 'bg-fondo text-primario border'}`;
    btn.addEventListener("click", () => {
      paginaActual = i;
      filtrarYMostrar();
      window.scrollTo({ top: 0 });
    });
    paginacionContainer.appendChild(btn);
  }
}

function actualizarURL(busqueda, categoria, orden, pagina) {
  const params = new URLSearchParams();
  if (busqueda) params.set("busqueda", busqueda);
  if (categoria) params.set("categoria", categoria);
  if (orden) params.set("orden", orden);
  if (pagina > 1) params.set("pagina", pagina);
  const nuevaURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nuevaURL);
}

// Eventos para filtros
busquedaInput.addEventListener("input", () => {
  paginaActual = 1;
  filtrarYMostrar();
});
filtroSelect.addEventListener("change", () => {
  paginaActual = 1;
  filtrarYMostrar();
});
ordenPrecioSelect.addEventListener("change", () => {
  paginaActual = 1;
  filtrarYMostrar();
});
