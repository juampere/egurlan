let todosLosProductos = []; // Guardamos productos destacados acá

// Mostrar productos en el contenedor
function mostrarProductos(productos) {
  const container = document.getElementById("productos-destacados");
  if (!container) return;

  container.innerHTML = ""; // Limpiar contenido

  productos.forEach(prod => {
    const card = crearCardProducto(prod);
    container.appendChild(card);
  });
}

// Mostrar los 3 últimos productos (novedades)
function mostrarNovedades(productos) {
  const container = document.getElementById("productos-novedades");
  if (!container) return;

  container.innerHTML = "";

  const ultimos = [...productos]
    .sort((a, b) => b.id - a.id)
    .slice(0, 4);

  ultimos.forEach(prod => {
    const card = crearCardProducto(prod);
    container.appendChild(card);
  });
}

// Crear una card reutilizable
function crearCardProducto(prod) {
  const card = document.createElement("div");
  card.className = "bg-white rounded shadow flex flex-col relative";

  const imagenWrapper = document.createElement("div");
  imagenWrapper.className = "relative";

  const img = document.createElement("img");
  img.src = prod.fotos?.[0]?.url?.startsWith("/uploads/")
    ? `http://localhost:3000${prod.fotos[0].url}`
    : prod.fotos?.[0]?.url || "https://placehold.co/400x300?text=Sin+imagen";
  img.alt = prod.nombre;
  img.className = "w-full h-48 object-cover";

  if (prod.precioPromocional && prod.precioPromocional < prod.precio) {
    const badge = document.createElement("span");
    badge.textContent = "Oferta";
    badge.className = "absolute -top-2 -left-2 bg-secundario text-white text-xs px-2 py-1 rounded shadow z-10";
    imagenWrapper.appendChild(badge);
  }

  imagenWrapper.appendChild(img);
  card.appendChild(imagenWrapper);

  const contenido = document.createElement("div");
  contenido.className = "p-4 flex flex-col gap-2 flex-grow";

  const nombre = document.createElement("h3");
  nombre.textContent = prod.nombre;
  nombre.className = "text-lg font-semibold text-texto hover:underline cursor-pointer";
  nombre.onclick = () => window.location.href = `producto.html?id=${prod.id}`;

  const precio = document.createElement("p");
  precio.className = "text-secundario font-bold";
  if (prod.precioPromocional && prod.precioPromocional < prod.precio) {
    precio.innerHTML = `
      <span class="line-through text-gray-500 mr-2">$${prod.precio.toLocaleString()}</span>
      <span>$${prod.precioPromocional.toLocaleString()}</span>
    `;
  } else {
    precio.textContent = `$${prod.precio.toLocaleString()}`;
  }

  const boton = document.createElement("a");
  boton.textContent = "Ver más";
  boton.href = `producto.html?id=${prod.id}`;
  boton.className = "mt-auto bg-secundario hover:opacity-90 text-fondo px-4 py-2 rounded text-center block";

  contenido.appendChild(nombre);
  contenido.appendChild(precio);
  contenido.appendChild(boton);

  card.appendChild(contenido);
  return card;
}


// Cargar productos y mostrar destacados + novedades
fetch('http://localhost:3000/api/productos')
  .then(res => res.json())
  .then(productos => {
    todosLosProductos = productos.filter(p => p.destacado).slice(0, 4);
    mostrarProductos(todosLosProductos);
    mostrarNovedades(productos);
    window.productos = productos;
  })
  .catch(err => {
    console.error('Error al cargar productos:', err);
  });

// Búsqueda en tiempo real dentro del home
const inputBusqueda = document.getElementById("input-busqueda");
if (inputBusqueda) {
  inputBusqueda.addEventListener("input", e => {
    const valor = e.target.value.toLowerCase();
    const filtrados = todosLosProductos.filter(p =>
      p.nombre.toLowerCase().includes(valor)
    );
    mostrarProductos(filtrados);
  });
}

// Redirección buscador desktop
const formBuscar = document.getElementById("formBuscar");
if (formBuscar && inputBusqueda) {
  formBuscar.addEventListener("submit", e => {
    e.preventDefault();
    const valor = inputBusqueda.value.trim();
    if (valor) {
      window.location.href = `productos.html?busqueda=${encodeURIComponent(valor)}`;
    }
  });
}

// Redirección buscador mobile
const formBuscarMobile = document.getElementById("formBuscarMobile");
const inputBusquedaMobile = document.getElementById("input-busqueda-mobile");

if (formBuscarMobile && inputBusquedaMobile) {
  formBuscarMobile.addEventListener("submit", e => {
    e.preventDefault();
    const valor = inputBusquedaMobile.value.trim();
    if (valor) {
      window.location.href = `productos.html?busqueda=${encodeURIComponent(valor)}`;
    }
  });
}

// Menú hamburguesa móvil
const btnMenu = document.getElementById('btnMenu');
const menuMobile = document.getElementById('menuMobile');

if (btnMenu && menuMobile) {
  btnMenu.addEventListener('click', () => {
    menuMobile.classList.toggle('hidden');
  });
}
