document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const inputUsuario = document.getElementById("usuario");
  const inputContrasena = document.getElementById("contrasena");
  const mensajeError = document.getElementById("mensaje-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      usuario: inputUsuario.value,
      contrasena: inputContrasena.value
    };

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(datos)
      });

      const resultado = await res.json();

      if (res.ok) {
        window.location.href = "productos-admin.html";
      } else {
        mensajeError.textContent = resultado.error || "Error al iniciar sesión";
        mensajeError.classList.remove("hidden");
      }

    } catch (error) {
      mensajeError.textContent = "Error de conexión con el servidor";
      mensajeError.classList.remove("hidden");
    }
  });
});
