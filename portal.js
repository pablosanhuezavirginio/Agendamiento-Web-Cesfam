const rutSesion = sessionStorage.getItem("cesfam-demo-user");
const usuarioSesion = window.CESFAM_DEMO_USERS.find(function (cuenta) {
  return window.normalizarRutDemo(cuenta.rut) === window.normalizarRutDemo(rutSesion || "");
});

if (!usuarioSesion) {
  sessionStorage.removeItem("cesfam-demo-user");
  window.location.replace("index.html");
} else {
  iniciarPortal(usuarioSesion);
}

function iniciarPortal(usuario) {
  const iniciales = usuario.name.split(/\s+/).map(function (parte) {
    return parte.charAt(0);
  }).join("").slice(0, 2).toUpperCase();

  document.getElementById("nombre-usuario").textContent = usuario.name;
  document.getElementById("avatar-usuario").textContent = iniciales;
  document.getElementById("nombre-bienvenida").textContent = usuario.name.split(/\s+/)[0];
  document.getElementById("fecha-actual").textContent = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date()).toUpperCase();
  document.getElementById("cerrar-sesion").addEventListener("click", function () {
    sessionStorage.removeItem("cesfam-demo-user");
  });

  const storageKey = "cesfam-demo-appointments-" + window.normalizarRutDemo(usuario.rut);
  const specialtyButtons = Array.from(document.querySelectorAll(".service-option"));
  const dateContainer = document.getElementById("fechas-disponibles");
  const timeContainer = document.getElementById("horarios-disponibles");
  const appointmentList = document.getElementById("lista-horas");
  const storageError = document.getElementById("error-almacenamiento");
  const appointmentError = document.getElementById("error-horas");
  const confirmButton = document.getElementById("confirmar-reserva");
  const cancelDialog = document.getElementById("dialogo-cancelacion");
  const cancelDetails = document.getElementById("detalle-cancelacion");
  const cancelError = document.getElementById("error-cancelacion");
  const dates = buildAvailableDates();
  let selectedSpecialty = "";
  let selectedDate = "";
  let selectedTime = "";
  let pendingCancellationId = "";
  let storageReady = true;
  let appointments = loadAppointments();

  renderAppointments();
  renderDates();
  updateStep(1);

  specialtyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      specialtyButtons.forEach(function (option) {
        const selected = option === button;
        option.classList.toggle("selected", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
      selectedSpecialty = button.dataset.specialty;
      document.getElementById("continuar-especialidad").disabled = false;
    });
  });

  document.getElementById("continuar-especialidad").addEventListener("click", function () {
    updateStep(2, true);
  });

  document.getElementById("volver-especialidad").addEventListener("click", function () {
    updateStep(1, true);
  });

  document.getElementById("continuar-horario").addEventListener("click", function () {
    if (!selectedDate || !selectedTime) return;
    document.getElementById("resumen-paciente").textContent = usuario.name;
    document.getElementById("resumen-especialidad").textContent = selectedSpecialty;
    document.getElementById("resumen-fecha").textContent = formatDate(selectedDate);
    document.getElementById("resumen-hora").textContent = selectedTime;
    storageError.hidden = true;
    updateStep(3, true);
  });

  document.getElementById("volver-horario").addEventListener("click", function () {
    updateStep(2, true);
  });

  document.getElementById("confirmar-reserva").addEventListener("click", confirmAppointment);
  appointmentList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-cancel-appointment]");
    if (!button) return;

    const appointment = appointments.find(function (item) {
      return appointmentId(item) === button.dataset.cancelAppointment
        && item.status !== "Cancelada";
    });
    if (!appointment) return;

    pendingCancellationId = appointmentId(appointment);
    cancelDetails.textContent = appointment.specialty + " · " + formatDate(appointment.date)
      + " · " + appointment.time;
    cancelError.hidden = true;
    cancelDialog.showModal();
    document.getElementById("mantener-hora").focus();
  });
  document.getElementById("mantener-hora").addEventListener("click", function () {
    cancelDialog.close();
  });
  document.getElementById("confirmar-cancelacion").addEventListener("click", cancelAppointment);
  cancelDialog.addEventListener("close", function () {
    pendingCancellationId = "";
  });

  document.getElementById("agendar-otra-hora").addEventListener("click", function () {
    selectedSpecialty = "";
    selectedDate = "";
    selectedTime = "";
    specialtyButtons.forEach(function (button) {
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    });
    document.getElementById("continuar-especialidad").disabled = true;
    document.getElementById("resumen-reserva").hidden = false;
    document.getElementById("reserva-confirmada").hidden = true;
    document.getElementById("continuar-horario").disabled = true;
    renderDates();
    renderTimes();
    updateStep(1, true);
  });

  function updateStep(step, moveFocus) {
    document.querySelectorAll("[data-booking-step]").forEach(function (panel) {
      panel.hidden = Number(panel.dataset.bookingStep) !== step;
    });
    document.querySelectorAll("[data-step-indicator]").forEach(function (indicator) {
      const indicatorStep = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("active", indicatorStep === step);
      indicator.classList.toggle("completed", indicatorStep < step);
      if (indicatorStep === step) {
        indicator.setAttribute("aria-current", "step");
      } else {
        indicator.removeAttribute("aria-current");
      }
    });
    document.getElementById("stepper").setAttribute("aria-label", "Paso " + step + " de 3");
    document.getElementById("step-caption").textContent = "Paso " + step + " de 3";
    document.getElementById("continuar-horario").disabled = !selectedDate || !selectedTime;
    confirmButton.disabled = !storageReady;
    if (moveFocus) {
      const heading = document.querySelector('[data-booking-step="' + step + '"] h3');
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }

  function appointmentId(appointment) {
    return appointment.id || appointment.date + "T" + appointment.time;
  }

  function buildAvailableDates() {
    const availableDates = [];
    const date = new Date();
    while (availableDates.length < 3) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        availableDates.push(dateKey(date));
      }
    }
    return availableDates;
  }

  function dateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function dateFromKey(key) {
    const parts = key.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12);
  }

  function formatDate(key) {
    const label = new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(dateFromKey(key));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function renderDates() {
    dateContainer.replaceChildren();
    dates.forEach(function (key) {
      const button = document.createElement("button");
      const label = formatDate(key);
      button.type = "button";
      button.className = "date-option";
      button.textContent = label;
      button.setAttribute("aria-pressed", String(key === selectedDate));
      button.addEventListener("click", function () {
        selectedDate = key;
        selectedTime = "";
        renderDates();
        renderTimes();
        document.getElementById("continuar-horario").disabled = true;
      });
      dateContainer.appendChild(button);
    });
  }

  function renderTimes() {
    timeContainer.replaceChildren();
    const message = document.getElementById("mensaje-horarios");
    if (!selectedDate) {
      message.textContent = "Seleccione un día para ver sus horarios.";
      return;
    }

    const bookedTimes = new Set(appointments
      .filter(function (appointment) {
        return appointment.date === selectedDate && appointment.status !== "Cancelada";
      })
      .map(function (appointment) { return appointment.time; }));
    const availableTimes = ["09:00", "10:30", "11:30", "15:00"].filter(function (time) {
      return !bookedTimes.has(time);
    });

    if (availableTimes.length === 0) {
      message.textContent = "No quedan horarios para ese día. Elija otra fecha.";
      return;
    }

    message.textContent = "Horarios disponibles para " + formatDate(selectedDate) + ".";
    availableTimes.forEach(function (time) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "time-option";
      button.textContent = time;
      button.setAttribute("aria-pressed", String(time === selectedTime));
      button.addEventListener("click", function () {
        selectedTime = time;
        renderTimes();
        document.getElementById("continuar-horario").disabled = false;
      });
      timeContainer.appendChild(button);
    });
  }

  function loadAppointments() {
    let stored;
    try {
      stored = localStorage.getItem(storageKey);
    } catch (error) {
      handleStorageError(error);
      return [];
    }
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      const valid = Array.isArray(parsed) && parsed.every(function (appointment) {
        return appointment
          && typeof appointment.specialty === "string"
          && /^\d{4}-\d{2}-\d{2}$/.test(appointment.date)
          && /^\d{2}:\d{2}$/.test(appointment.time);
      });
      if (!valid) {
        storageReady = false;
        showStorageError();
        console.error("La lista de horas guardadas tiene un formato inesperado.");
        return [];
      }
      const activeAppointments = parsed.filter(function (appointment) {
        return appointment.status !== "Cancelada";
      });
      if (activeAppointments.length !== parsed.length
        && !saveAppointments(activeAppointments)) return parsed;
      return activeAppointments;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      storageReady = false;
      showStorageError();
      console.error("No se pudieron leer las horas de demostración guardadas.", error);
      return [];
    }
  }

  function saveAppointments(updatedAppointments) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedAppointments));
      return true;
    } catch (error) {
      handleStorageError(error);
      return false;
    }
  }

  function handleStorageError(error) {
    if (!(error instanceof DOMException)) throw error;
    storageReady = false;
    showStorageError();
    console.error("No se pudo acceder al almacenamiento local del navegador.", error);
  }

  function showStorageError() {
    storageError.hidden = false;
    appointmentError.hidden = false;
    cancelError.hidden = false;
    confirmButton.disabled = true;
  }

  function confirmAppointment() {
    if (!selectedSpecialty || !selectedDate || !selectedTime || !storageReady) return;

    const appointment = {
      id: selectedDate + "T" + selectedTime + "-" + Date.now(),
      specialty: selectedSpecialty,
      date: selectedDate,
      time: selectedTime,
      status: "Confirmada"
    };
    const updatedAppointments = appointments.concat(appointment);
    if (!saveAppointments(updatedAppointments)) return;

    appointments = updatedAppointments;
    renderAppointments();
    document.getElementById("resumen-reserva").hidden = true;
    document.getElementById("reserva-confirmada").hidden = false;
    document.getElementById("detalle-confirmacion").textContent =
      selectedSpecialty + " · " + formatDate(selectedDate) + " · " + selectedTime;
    document.getElementById("step-caption").textContent = "Paso 3 de 3 · Confirmada";
    const successHeading = document.querySelector("#reserva-confirmada h3");
    successHeading.setAttribute("tabindex", "-1");
    successHeading.focus();
  }

  function cancelAppointment() {
    const appointmentToCancel = appointments.find(function (appointment) {
      return appointmentId(appointment) === pendingCancellationId
        && appointment.status !== "Cancelada";
    });
    if (!appointmentToCancel) {
      cancelDialog.close();
      renderAppointments();
      return;
    }

    const updatedAppointments = appointments.filter(function (appointment) {
      return appointmentId(appointment) !== pendingCancellationId;
    });
    if (!saveAppointments(updatedAppointments)) return;

    appointments = updatedAppointments;
    appointmentError.hidden = true;
    document.getElementById("mensaje-horas").textContent =
      "La hora fue cancelada y eliminada de su historial.";
    renderAppointments();
    if (selectedDate) renderTimes();
    cancelDialog.close();
    document.getElementById("titulo-mis-horas").focus();
  }

  function renderAppointments() {
    appointmentList.replaceChildren();
    if (appointments.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "appointments-empty";
      emptyState.textContent = "Todavía no tiene horas reservadas.";
      appointmentList.appendChild(emptyState);
      return;
    }

    appointments.slice().sort(function (first, second) {
      return (first.date + first.time).localeCompare(second.date + second.time);
    }).forEach(function (appointment) {
      const date = dateFromKey(appointment.date);
      const card = document.createElement("article");
      const dateBlock = document.createElement("div");
      const weekday = document.createElement("span");
      const day = document.createElement("strong");
      const month = document.createElement("span");
      const details = document.createElement("div");
      const status = document.createElement("span");
      const specialty = document.createElement("h3");
      const meta = document.createElement("p");
      const note = document.createElement("p");

      card.className = "appointment-card";
      dateBlock.className = "appointment-date";
      weekday.textContent = new Intl.DateTimeFormat("es-CL", { weekday: "short" })
        .format(date).replace(".", "").toUpperCase();
      day.textContent = String(date.getDate());
      month.textContent = new Intl.DateTimeFormat("es-CL", { month: "short" })
        .format(date).replace(".", "").toUpperCase();
      dateBlock.append(weekday, day, month);

      details.className = "appointment-details";
      status.className = "status-badge";
      status.textContent = "Confirmada";
      specialty.textContent = appointment.specialty;
      meta.className = "appointment-meta";
      meta.textContent = appointment.time + " hrs. · CESFAM Juan Soto Fernández";
      note.className = "appointment-professional";
      note.textContent = "Horario de demostración";
      details.append(status, specialty, meta, note);
      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "cancel-appointment";
      cancelButton.dataset.cancelAppointment = appointmentId(appointment);
      cancelButton.textContent = "Cancelar hora";
      cancelButton.setAttribute("aria-label", "Cancelar " + appointment.specialty
        + ", " + formatDate(appointment.date) + " a las " + appointment.time);
      details.appendChild(cancelButton);
      card.append(dateBlock, details);
      appointmentList.appendChild(card);
    });
  }
}
