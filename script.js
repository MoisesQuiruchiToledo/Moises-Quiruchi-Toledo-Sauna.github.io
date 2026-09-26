  // ===== Configuración =====
  const WHATSAPP = "59164742191"; // EDITA: número con código de país, sin + ni espacios

  // ===== Menú móvil =====
  const links = document.getElementById("links");
  document.getElementById("menu").addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));

  // ===== Reserva por WhatsApp (solo en reservar.html) =====
  const form = document.getElementById("form");
  if (form) {
    document.getElementById("fecha").min = new Date().toISOString().split("T")[0];
    form.addEventListener("submit", e => {
      e.preventDefault();
      const v = id => document.getElementById(id).value.trim();
      let msg = `Hola, soy ${v("nombre")}. Quiero reservar: ${v("servicio")} el ${v("fecha")} a las ${v("hora")}.`;
      if (v("coment")) msg += ` Comentarios: ${v("coment")}`;
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  }
