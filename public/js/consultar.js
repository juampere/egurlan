document.getElementById("form-consultar").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const localidad = document.getElementById("localidad").value.trim();
  const motivo = document.getElementById("motivo").value.trim();

  const mensaje = `
*Consulta desde la tienda Egurlan:*

👤 *Nombre:* ${nombre}
📞 *Teléfono:* ${telefono}
📍 *Localidad:* ${localidad}
${email ? `✉️ *Email:* ${email}\n` : ""}
${motivo ? `📝 *Motivo de la consulta:* ${motivo}` : ""}
  `.trim();

  const mensajeCodificado = encodeURIComponent(mensaje);
  const telefonoDestino = "543446374568"; // con prefijo internacional
  const urlWhatsApp = `https://wa.me/${telefonoDestino}?text=${mensajeCodificado}`;

  window.open(urlWhatsApp, "_blank");

  document.getElementById("mensaje-gracias").classList.remove("hidden");
  document.getElementById("form-consultar").reset();
});
