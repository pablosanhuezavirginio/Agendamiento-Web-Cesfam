function mostrarClave() {
  const clave = document.getElementById("clave");
  const boton = document.getElementById("boton-clave");
  if (clave.type === "password") {
    clave.setAttribute("type", "text");
    boton.innerText = "Ocultar";
  } else {
    clave.setAttribute("type", "password");
    boton.innerText = "Mostrar";
  }
}
