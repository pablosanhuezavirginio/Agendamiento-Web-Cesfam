const el = (id) => document.getElementById(id);
const form = el("formulario-ingreso");
const rut = el("rut");
const password = el("clave");
const error = el("error-ingreso");
const passwordButton = el("boton-clave");

function clearError() {
  error.hidden = true;
  rut.removeAttribute("aria-invalid");
  password.removeAttribute("aria-invalid");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const normalizedRut = window.normalizarRutDemo(rut.value);
  const user = window.CESFAM_DEMO_USERS.find((account) =>
    window.normalizarRutDemo(account.rut) === normalizedRut
    && account.password === password.value
  );

  if (!user) {
    error.hidden = false;
    rut.setAttribute("aria-invalid", "true");
    password.setAttribute("aria-invalid", "true");
    return;
  }

  sessionStorage.setItem("cesfam-demo-user", user.rut);
  window.location.assign("portal.html");
});

form.addEventListener("input", clearError);
passwordButton.addEventListener("click", () => {
  const show = password.type === "password";
  password.type = show ? "text" : "password";
  passwordButton.textContent = show ? "Ocultar" : "Mostrar";
  passwordButton.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
  passwordButton.setAttribute("aria-pressed", String(show));
});
