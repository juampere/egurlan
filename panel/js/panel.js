const btnGuardar = document.getElementById("btnGuardar");
const inputImagen = document.getElementById("inputImagen");
const mensaje = document.getElementById("mensaje");
const grupoImagen = document.getElementById("grupoImagen");
const previewImagenes = document.getElementById("previewImagenes");
const selectCategoria = document.getElementById("categoria");
const inputNuevaCategoria = document.getElementById("nuevaCategoria");
const btnAgregarCategoria = document.getElementById("btnAgregarCategoria");
const formulario = document.getElementById("formulario-producto");

let archivosSeleccionados = [];
let urlImagenesSubidas = [];

const quill = new Quill('#editorDescripcion', {
  theme: 'snow',
  placeholder: 'Escribe la descripción aquí...',
  modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'bullet' }], ['clean']] }
});

async function cargarCategorias() {
  try {
    const res = await fetch("http://localhost:3000/api/categorias");
    if (!res.ok) throw new Error("Error al cargar categorías");
    const categorias = await res.json();

    selectCategoria.innerHTML = `<option value="">Seleccionar categoría</option>`;
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.nombre;
      option.textContent = cat.nombre;
      selectCategoria.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    selectCategoria.innerHTML = `<option value="">No se pudieron cargar las categorías</option>`;
  }
}
cargarCategorias();

btnAgregarCategoria.addEventListener("click", async () => {
  const nuevaCat = inputNuevaCategoria.value.trim();
  if (!nuevaCat) return alert("Escribí el nombre de la categoría.");

  try {
    const res = await fetch("http://localhost:3000/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevaCat })
    });

    if (!res.ok) {
      const data = await res.json();
      return alert(data.error || "Error al agregar categoría");
    }

    await cargarCategorias();
    selectCategoria.value = nuevaCat;
    inputNuevaCategoria.value = "";
  } catch (err) {
    alert("Error de conexión al agregar categoría");
  }
});

function mostrarMiniaturas() {
  previewImagenes.innerHTML = "";
  archivosSeleccionados.forEach((archivo, index) => {
    const contenedor = document.createElement("div");
    contenedor.className = "relative w-24 h-24 flex flex-col items-center";

    const img = document.createElement("img");
    img.className = "w-24 h-24 object-cover rounded shadow mb-1";
    img.src = archivo instanceof File ? URL.createObjectURL(archivo) : `http://localhost:3000${archivo}`;

    const controles = document.createElement("div");
    controles.className = "flex gap-1";

    const btnIzq = document.createElement("button");
    btnIzq.textContent = "←";
    btnIzq.className = "bg-gray-300 px-2 rounded hover:bg-gray-400";
    btnIzq.disabled = index === 0;
    btnIzq.onclick = () => {
      if (index > 0) {
        [archivosSeleccionados[index - 1], archivosSeleccionados[index]] =
          [archivosSeleccionados[index], archivosSeleccionados[index - 1]];
        mostrarMiniaturas();
      }
    };

    const btnDer = document.createElement("button");
    btnDer.textContent = "→";
    btnDer.className = "bg-gray-300 px-2 rounded hover:bg-gray-400";
    btnDer.disabled = index === archivosSeleccionados.length - 1;
    btnDer.onclick = () => {
      if (index < archivosSeleccionados.length - 1) {
        [archivosSeleccionados[index], archivosSeleccionados[index + 1]] =
          [archivosSeleccionados[index + 1], archivosSeleccionados[index]];
        mostrarMiniaturas();
      }
    };

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "×";
    btnEliminar.className = "bg-red-600 text-white rounded px-2 ml-1 hover:bg-red-700";
    btnEliminar.onclick = () => {
      archivosSeleccionados.splice(index, 1);
      mostrarMiniaturas();
    };

    controles.append(btnIzq, btnDer, btnEliminar);
    contenedor.append(img, controles);
    previewImagenes.appendChild(contenedor);
  });
}

inputImagen.addEventListener("change", () => {
  const nuevosArchivos = Array.from(inputImagen.files);

  for (const archivo of nuevosArchivos) {
    if (!archivo.type.startsWith("image/")) {
      alert(`El archivo "${archivo.name}" no es una imagen válida.`);
      continue;
    }
    if (archivo.size > 1.5 * 1024 * 1024) {
      alert(`La imagen "${archivo.name}" supera los 1.5MB.`);
      continue;
    }
    if (archivosSeleccionados.length >= 5) {
      alert("Solo se permiten hasta 5 imágenes por producto.");
      break;
    }
    archivosSeleccionados.push(archivo);
  }

  mostrarMiniaturas();
  inputImagen.value = "";
});

formulario.addEventListener("submit", async e => {
  e.preventDefault();

  const contenidoDescripcion = quill.root.innerHTML.trim();
  document.getElementById('inputDescripcion').value = contenidoDescripcion;

  const datos = new FormData(formulario);
  const nombre = datos.get("nombre");
  const sku = datos.get("sku");
  const precio = parseFloat(datos.get("precio"));
  const precioPromo = datos.get("precioPromocional") ? parseFloat(datos.get("precioPromocional")) : null;
  const descripcionTextoPlano = quill.getText().trim();
  const ventaDirecta = datos.get("ventaDirecta") === "on";
  const destacado = datos.get("destacado") === "on";
  const categoria = datos.get("categoria");
  const tags = (datos.get("tags") || "").split(",").map(t => t.trim()).filter(t => t);

  let errores = [];
  if (!nombre) errores.push("nombre");
  if (!sku) errores.push("sku");
  if (!precio || precio <= 0) errores.push("precio");
  if (precioPromo !== null && (precioPromo < 0 || precioPromo >= precio)) errores.push("precioPromocional");
  if (descripcionTextoPlano.length === 0) errores.push("descripcion");
  if (!categoria) errores.push("categoria");
  if (archivosSeleccionados.length === 0) errores.push("imagen");

  mensaje.classList.add("hidden");
  grupoImagen.classList.remove("border", "border-red-500", "p-2", "rounded");
  document.querySelectorAll("[name]").forEach(el => el.classList.remove("border-red-500"));

  if (errores.length > 0) {
    const legibles = {
      nombre: "Nombre",
      sku: "SKU",
      descripcion: "Descripción",
      precio: "Precio",
      precioPromocional: "Precio promocional inválido",
      categoria: "Categoría",
      imagen: "Imágenes (mínimo 1, máximo 5)"
    };
    mensaje.textContent = `Faltan completar: ${errores.map(e => legibles[e] || e).join(", ")}`;
    mensaje.className = "mt-4 px-4 py-2 text-sm rounded bg-red-100 text-red-700 border border-red-300";
    mensaje.classList.remove("hidden");

    if (errores.includes("imagen")) grupoImagen.classList.add("border", "border-red-500", "p-2", "rounded");
    errores.forEach(e => {
      const el = document.querySelector(`[name="${e}"]`);
      if (el) el.classList.add("border-red-500");
    });
    return;
  }

  btnGuardar.disabled = true;
  urlImagenesSubidas = [];

  for (const archivo of archivosSeleccionados) {
    if (archivo instanceof File) {
      const formData = new FormData();
      formData.append("imagen", archivo);
      try {
        const res = await fetch("http://localhost:3000/api/upload", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        urlImagenesSubidas.push(data.url);
      } catch (err) {
        mensaje.textContent = "Error al subir imágenes";
        mensaje.className = "mt-4 px-4 py-2 text-sm rounded bg-red-100 text-red-700 border border-red-300";
        mensaje.classList.remove("hidden");
        btnGuardar.disabled = false;
        return;
      }
    } else {
      urlImagenesSubidas.push(archivo);
    }
  }

  const producto = {
    nombre,
    sku,
    precio,
    precioPromocional: precioPromo,
    descripcion: contenidoDescripcion,
    ventaDirecta,
    destacado,
    categoria,
    fotos: urlImagenesSubidas,
    tags
  };

  try {
    const res = await fetch("http://localhost:3000/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto)
    });
    if (!res.ok) throw new Error("Error al guardar el producto");

    mensaje.textContent = "Producto guardado con éxito ✅";
    mensaje.className = "mt-4 text-sm px-4 py-2 rounded bg-green-100 text-green-700 border border-green-300";
    mensaje.classList.remove("hidden");

    formulario.reset();
    archivosSeleccionados = [];
    urlImagenesSubidas = [];
    previewImagenes.innerHTML = "";
    quill.setText('');
  } catch (err) {
    mensaje.textContent = "Error al guardar el producto ❌";
    mensaje.className = "mt-4 text-sm px-4 py-2 rounded bg-red-100 text-red-700 border border-red-300";
    mensaje.classList.remove("hidden");
  } finally {
    btnGuardar.disabled = false;
    setTimeout(() => mensaje.classList.add("hidden"), 4000);
  }
});

formulario.addEventListener("input", () => mensaje.classList.add("hidden"));
