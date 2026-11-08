function mostrarSiguientePaso() {
  const mensaje = document.getElementById("mensaje-agendamiento");
  mensaje.innerText = "El siguiente paso sería elegir día y hora";
}
function seleccionarEspecialidad(especialidadSeleccionada) {
  const especialidades = document.getElementsByClassName("service-option");
  for (let i = 0; i < especialidades.length; i++) {
    especialidades[i].className = "service-option";
    especialidades[i].setAttribute("aria-pressed", "false");
  }
  especialidadSeleccionada.className += " selected";
  especialidadSeleccionada.setAttribute("aria-pressed", "true");
}
