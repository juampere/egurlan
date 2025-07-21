let productos = [];
let productosTotales = [];
const productosPorPagina = 20;
let paginaActual = 1;

const tabla = document.getElementById("tabla-productos");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroSku = document.getElementById("filtro-sku");

// Manejo del botón cerrar sesión
document.getElementById("btn-logout").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/logout", {
      method: "GET",
      credentials: "include"
    });

    if (res.ok) {
      window.location.href = "/panel/login.html";
    } else {
      alert("No se pudo cerrar sesión.");
    }
  } catch {
    alert("Error al conectar con el servidor.");
  }
});


// Cargar categorías
fetch('http://localhost:3000/api/categorias')
  .then(res => res.json())
  .then(categorias => {
    categorias.forEach(cat => {
      const nombre = typeof cat === 'string' ? cat : cat.nombre;
      const option = document.createElement('option');
      option.value = nombre.toLowerCase();
      option.textContent = nombre;
      filtroCategoria.appendChild(option);
    });
  })

  .catch(err => {
    console.error('Error al cargar categorías:', err);
  });

function mostrarProductos(pagina) {
  tabla.innerHTML = "";
  const inicio = (pagina - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productosTotales.slice(inicio, fin);

  productosPagina.forEach(prod => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="border-t px-4 py-2">${prod.sku || "—"}</td>
      <td class="border-t px-4 py-2">${prod.nombre}</td>
      <td class="border-t px-4 py-2">$${prod.precio.toLocaleString()}</td>
      <td class="border-t px-4 py-2">${prod.categoria || "—"}</td>
      <td class="border-t px-4 py-2 flex gap-2">
          <a href="editar-producto.html?id=${prod.id}" class="text-blue-600 hover:underline">Editar</a>
          <button class="text-red-600 hover:underline" onclick="eliminarProducto(${prod.id})">Eliminar</button>
      </td>
    `;
    tabla.appendChild(fila);
  });
}

function mostrarPaginacion() {
  const paginacionDiv = document.getElementById("paginacion");
  paginacionDiv.innerHTML = "";

  const totalPaginas = Math.ceil(productosTotales.length / productosPorPagina);

  const btnAnterior = document.createElement("button");
  btnAnterior.textContent = "Anterior";
  btnAnterior.disabled = paginaActual === 1;
  btnAnterior.className = "bg-gray-300 px-3 py-1 rounded disabled:opacity-50";
  btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) {
      paginaActual--;
      mostrarProductos(paginaActual);
      mostrarPaginacion();
    }
  });
  paginacionDiv.appendChild(btnAnterior);

  for (let i = 1; i <= totalPaginas; i++) {
    const btnPagina = document.createElement("button");
    btnPagina.textContent = i;
    btnPagina.className = `px-3 py-1 rounded ${
      i === paginaActual ? "bg-primario text-white" : "bg-gray-200"
    }`;
    btnPagina.addEventListener("click", () => {
      paginaActual = i;
      mostrarProductos(paginaActual);
      mostrarPaginacion();
    });
    paginacionDiv.appendChild(btnPagina);
  }

  const btnSiguiente = document.createElement("button");
  btnSiguiente.textContent = "Siguiente";
  btnSiguiente.disabled = paginaActual === totalPaginas;
  btnSiguiente.className = "bg-gray-300 px-3 py-1 rounded disabled:opacity-50";
  btnSiguiente.addEventListener("click", () => {
    if (paginaActual < totalPaginas) {
      paginaActual++;
      mostrarProductos(paginaActual);
      mostrarPaginacion();
    }
  });
  paginacionDiv.appendChild(btnSiguiente);
}

function aplicarFiltros() {
  const categoria = filtroCategoria.value.toLowerCase();
  const sku = filtroSku.value.toLowerCase();

  const filtrados = productos.filter(prod => {
    const prodCategoria = (prod.categoria || "").toLowerCase();
    const prodSku = (prod.sku || "").toLowerCase();
    const matchCategoria = categoria === "" || prodCategoria === categoria;
    const matchSku = sku === "" || prodSku.includes(sku);
    return matchCategoria && matchSku;
  });

  productosTotales = filtrados;
  paginaActual = 1;
  mostrarProductos(paginaActual);
  mostrarPaginacion();
}

function eliminarProducto(id) {
  if (confirm("¿Estás seguro de eliminar este producto?")) {
    fetch(`http://localhost:3000/api/productos/${id}`, {
      method: "DELETE"
    })
      .then(res => {
        if (!res.ok) throw new Error("No se pudo eliminar");

        productos = productos.filter(prod => prod.id !== id);
        productosTotales = productosTotales.filter(prod => prod.id !== id);

        const totalPaginas = Math.ceil(productosTotales.length / productosPorPagina);
        if (paginaActual > totalPaginas) {
          paginaActual = totalPaginas || 1;
        }

        mostrarProductos(paginaActual);
        mostrarPaginacion();
      })
      .catch(err => {
        console.error("Error al eliminar:", err);
        alert("Error al eliminar el producto.");
      });
  }
}

fetch("http://localhost:3000/api/productos")
  .then(res => res.json())
  .then(data => {
    let productosOrdenados = Array.isArray(data) ? data : [];
    productosOrdenados.sort((a, b) => b.id - a.id);

    productos = productosOrdenados;
    productosTotales = [...productosOrdenados];

    mostrarProductos(paginaActual);
    mostrarPaginacion();
  })
  .catch(err => {
    console.error("Error al cargar productos:", err);
  });

filtroCategoria.addEventListener("change", aplicarFiltros);
filtroSku.addEventListener("input", aplicarFiltros);
