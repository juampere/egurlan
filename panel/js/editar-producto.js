const params = new URLSearchParams(location.search);
const id = parseInt(params.get("id"));

const form = document.getElementById("form-editar");
const msg  = document.getElementById("msg");
const inputImagenNueva = document.getElementById("inputImagenNueva");
const previewNuevas = document.getElementById("previewNuevas");
const previewImagenes = document.getElementById("previewImagenes");
const selectCategoria = document.getElementById("selectCategoria");

let imagenesExistentes = [];
let nuevasImagenesSubidas = [];

const quill = new Quill('#editorDescripcion', {
  theme: 'snow',
  placeholder: 'Escribe la descripción aquí...',
  modules: {
    toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'bullet' }], ['clean']]
  }
});

function cargarCategorias() {
  return fetch('/api/categorias")
    .then(res => res.json())
    .then(lista => {
      selectCategoria.innerHTML = `<option value="">Seleccionar categoría</option>`;
      lista.forEach(cat => {
        const nombre = typeof cat === "string" ? cat : cat.nombre;
        const option = document.createElement("option");
        option.value = nombre;
        option.textContent = nombre;
        selectCategoria.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Error al cargar categorías:", err);
    });
}

async function cargarDatos() {
  await cargarCategorias();

  fetch('/api/productos/${id}`)
    .then(r => {
      if (!r.ok) throw new Error('Producto no encontrado o error de red');
      return r.json();
    })
    .then(p => {
      if (!p) {
        msg.textContent = "Producto no encontrado.";
        form.remove();
        return;
      }

      imagenesExistentes = (p.fotos || []);

      form.nombre.value         = p.nombre;
      form.sku.value            = p.sku || "";
      form.precio.value         = p.precio;
      form.precioPromocional.value = p.precioPromocional || "";
      selectCategoria.value     = p.categoria || "";
      form.ventaDirecta.checked = p.ventaDirecta === true;
      form.destacado.checked    = p.destacado === true;
      form.tags.value           = (p.tags || []).join(", ");
      quill.root.innerHTML      = p.descripcion || "";

      previewImagenes.innerHTML = "";
      imagenesExistentes.forEach(foto => {
        const contenedor = document.createElement("div");
        contenedor.className = "relative w-24 h-24";

        const img = document.createElement("img");
        img.src = foto.url;
        img.className = "w-24 h-24 object-cover rounded shadow";

        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "×";
        btnEliminar.className = "absolute top-0 right-0 bg-red-600 text-white rounded-bl px-1 cursor-pointer";
        btnEliminar.type = "button";
        btnEliminar.addEventListener("click", () => {
          contenedor.remove();
          imagenesExistentes = imagenesExistentes.filter(f => f !== foto);
        });

        contenedor.appendChild(img);
        contenedor.appendChild(btnEliminar);
        previewImagenes.appendChild(contenedor);
      });
    })
    .catch(err => {
      console.error("Error al cargar el producto:", err);
      msg.textContent = "Error al cargar los datos del producto. Intente de nuevo.";
    });
}

cargarDatos();

inputImagenNueva.addEventListener("change", async () => {
  const archivos = inputImagenNueva.files;
  if (!archivos || archivos.length === 0) return;

  if (imagenesExistentes.length + nuevasImagenesSubidas.length + archivos.length > 5) {
    alert(`Solo se permiten hasta 5 imágenes en total.`);
    inputImagenNueva.value = "";
    return;
  }

  for (const archivo of archivos) {
    if (!archivo.type.startsWith("image/")) {
      alert(`"${archivo.name}" no es una imagen válida.`);
      continue;
    }
    if (archivo.size > 1.5 * 1024 * 1024) {
      alert(`"${archivo.name}" supera los 1.5MB.`);
      continue;
    }

    const formData = new FormData();
    formData.append("imagen", archivo);

    try {
      const res = await fetch('/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      nuevasImagenesSubidas.push({ url: data.url, public_id: data.public_id });

      const contenedor = document.createElement("div");
      contenedor.className = "relative w-24 h-24";

      const img = document.createElement("img");
      img.src = data.url;
      img.className = "w-24 h-24 object-cover rounded shadow";

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "×";
      btnEliminar.className = "absolute top-0 right-0 bg-red-600 text-white rounded-bl px-1 cursor-pointer";
      btnEliminar.type = "button";
      btnEliminar.addEventListener("click", () => {
        const i = nuevasImagenesSubidas.findIndex(f => f.url === data.url);
        if (i > -1) nuevasImagenesSubidas.splice(i, 1);
        contenedor.remove();
      });

      contenedor.appendChild(img);
      contenedor.appendChild(btnEliminar);
      previewNuevas.appendChild(contenedor);
    } catch (err) {
      console.error("Error al subir imagen:", err);
      alert("Error al subir una imagen, intenta de nuevo.");
    }
  }

  inputImagenNueva.value = "";
});

form.addEventListener("submit", e => {
  e.preventDefault();

  const contenidoDescripcion = quill.root.innerHTML.trim();
  document.getElementById('inputDescripcion').value = contenidoDescripcion;

  const datos = new FormData(form);

  msg.textContent = "";
  msg.className = "hidden";
  form.querySelectorAll("[name]").forEach(el => el.classList.remove("border-red-500"));

  const nombre = datos.get("nombre")?.trim();
  const sku = datos.get("sku")?.trim();
  const precio = parseFloat(datos.get("precio"));
  const precioPromocional = datos.get("precioPromocional") ? parseFloat(datos.get("precioPromocional")) : null;
  const descripcionTextoPlano = quill.getText().trim();
  const categoria = datos.get("categoria")?.trim();
  const tags = (datos.get("tags") || "").split(",").map(t => t.trim()).filter(t => t);

  const ventaDirecta = datos.get("ventaDirecta") === "on";
  const destacado = datos.get("destacado") === "on";

  const errores = [];
  if (!nombre) errores.push("nombre");
  if (!sku) errores.push("sku");
  if (!precio || precio <= 0) errores.push("precio");
  if (precioPromocional !== null && (precioPromocional < 0 || precioPromocional >= precio)) errores.push("precioPromocional");
  if (descripcionTextoPlano.length === 0) errores.push("descripcion");
  if (!categoria) errores.push("categoria");
  if ((imagenesExistentes.length + nuevasImagenesSubidas.length) === 0) errores.push("fotos");

  if (errores.length > 0) {
    errores.forEach(nombre => {
      const el = form.querySelector(`[name="${nombre}"]`);
      if (el) el.classList.add("border-red-500");
    });
    msg.textContent = "Por favor completá los campos obligatorios correctamente.";
    msg.className = "mt-4 text-sm px-4 py-2 rounded bg-red-100 text-red-700 border border-red-300";
    return;
  }

  const productoEditado = {
    nombre,
    sku,
    precio,
    precioPromocional,
    descripcion: contenidoDescripcion,
    ventaDirecta,
    destacado,
    categoria,
    tags,
    fotos: [...imagenesExistentes, ...nuevasImagenesSubidas]
  };

  fetch('/api/productos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productoEditado)
  })
    .then(r => {
      if (!r.ok) throw new Error("Error al guardar");
      msg.textContent = "Cambios guardados ✅";
      msg.className = "mt-4 text-sm px-4 py-2 rounded bg-green-100 text-green-700 border border-green-300";
      nuevasImagenesSubidas = [];
      previewNuevas.innerHTML = "";
    })
    .catch(err => {
      console.error(err);
      msg.textContent = "No se pudo guardar ❌";
      msg.className = "mt-4 text-sm px-4 py-2 rounded bg-red-100 text-red-700 border border-red-300";
    });
});

form.addEventListener("input", () => {
  msg.classList.add("hidden");
});
