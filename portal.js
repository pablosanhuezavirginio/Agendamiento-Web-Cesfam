const el = (id) => document.getElementById(id);
const normalizeRut = window.normalizarRutDemo;
const rutSession = sessionStorage.getItem("cesfam-demo-user");
const user = window.CESFAM_DEMO_USERS.find((account) =>
  normalizeRut(account.rut) === normalizeRut(rutSession || "")
);

if (!user) {
  sessionStorage.removeItem("cesfam-demo-user");
  window.location.replace("index.html");
} else {
  startPortal(user);
}

function startPortal(user) {
  const ui = {
    stepPanels: [...document.querySelectorAll("[data-booking-step]")],
    stepIndicators: [...document.querySelectorAll("[data-step-indicator]")],
    specialtyButtons: [...document.querySelectorAll(".service-option")],
    dateList: el("fechas-disponibles"),
    timeList: el("horarios-disponibles"),
    appointmentList: el("lista-horas"),
    cancelDialog: el("dialogo-cancelacion"),
    stepper: el("stepper"),
    stepCaption: el("step-caption"),
    appointmentError: el("error-horas"),
    storageError: el("error-almacenamiento"),
    cancelError: el("error-cancelacion"),
    confirmButton: el("confirmar-reserva"),
    continueTimeButton: el("continuar-horario")
  };
  const state = {
    specialty: "",
    date: "",
    time: "",
    pendingCancellationId: "",
    storageReady: true,
    appointments: []
  };
  const storageKey = "cesfam-demo-appointments-" + normalizeRut(user.rut);
  const dates = buildAvailableDates();

  el("nombre-usuario").textContent = user.name;
  el("avatar-usuario").textContent = user.name.split(/\s+/)
    .map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase();
  el("nombre-bienvenida").textContent = user.name.split(/\s+/)[0];
  el("fecha-actual").textContent = new Intl.DateTimeFormat("es-CL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(new Date()).toUpperCase();
  el("cerrar-sesion").addEventListener("click", () => {
    sessionStorage.removeItem("cesfam-demo-user");
  });

  state.appointments = loadAppointments();

  ui.specialtyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      ui.specialtyButtons.forEach((option) => {
        const selected = option === button;
        option.classList.toggle("selected", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
      state.specialty = button.dataset.specialty;
      el("continuar-especialidad").disabled = false;
    });
  });

  el("continuar-especialidad").addEventListener("click", () => updateStep(2, true));
  el("volver-especialidad").addEventListener("click", () => updateStep(1, true));
  el("continuar-horario").addEventListener("click", () => {
    if (!state.date || !state.time) return;
    el("resumen-paciente").textContent = user.name;
    el("resumen-especialidad").textContent = state.specialty;
    el("resumen-fecha").textContent = formatDate(state.date);
    el("resumen-hora").textContent = state.time;
    ui.storageError.hidden = true;
    updateStep(3, true);
  });
  el("volver-horario").addEventListener("click", () => updateStep(2, true));
  ui.confirmButton.addEventListener("click", confirmAppointment);

  ui.appointmentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cancel-appointment]");
    if (!button) return;
    const appointment = state.appointments.find((item) =>
      appointmentId(item) === button.dataset.cancelAppointment
    );
    if (!appointment) return;
    state.pendingCancellationId = appointmentId(appointment);
    el("detalle-cancelacion").textContent =
      `${appointment.specialty} · ${formatDate(appointment.date)} · ${appointment.time}`;
    ui.cancelError.hidden = true;
    ui.cancelDialog.showModal();
    el("mantener-hora").focus();
  });
  el("mantener-hora").addEventListener("click", () => ui.cancelDialog.close());
  el("confirmar-cancelacion").addEventListener("click", cancelAppointment);
  ui.cancelDialog.addEventListener("close", () => {
    state.pendingCancellationId = "";
  });

  el("agendar-otra-hora").addEventListener("click", () => {
    state.specialty = "";
    state.date = "";
    state.time = "";
    ui.specialtyButtons.forEach((button) => {
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    });
    el("continuar-especialidad").disabled = true;
    el("resumen-reserva").hidden = false;
    el("reserva-confirmada").hidden = true;
    ui.continueTimeButton.disabled = true;
    renderDates();
    renderTimes();
    updateStep(1, true);
  });

  renderAppointments();
  renderDates();
  updateStep(1);

  function updateStep(step, moveFocus = false) {
    ui.stepPanels.forEach((panel) => {
      panel.hidden = Number(panel.dataset.bookingStep) !== step;
    });
    ui.stepIndicators.forEach((indicator) => {
      const indicatorStep = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("active", indicatorStep === step);
      indicator.classList.toggle("completed", indicatorStep < step);
      if (indicatorStep === step) indicator.setAttribute("aria-current", "step");
      else indicator.removeAttribute("aria-current");
    });
    ui.stepper.setAttribute("aria-label", `Paso ${step} de 3`);
    ui.stepCaption.textContent = `Paso ${step} de 3`;
    ui.continueTimeButton.disabled = !state.date || !state.time;
    ui.confirmButton.disabled = !state.storageReady;
    if (moveFocus) {
      const heading = document.querySelector(`[data-booking-step="${step}"] h3`);
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }

  function appointmentId(appointment) {
    return appointment.id || `${appointment.date}T${appointment.time}`;
  }

  function buildAvailableDates() {
    const result = [];
    const date = new Date();
    while (result.length < 3) {
      date.setDate(date.getDate() + 1);
      if (![0, 6].includes(date.getDay())) result.push(dateKey(date));
    }
    return result;
  }

  function dateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function dateFromKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }

  function formatDate(key) {
    const label = new Intl.DateTimeFormat("es-CL", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(dateFromKey(key));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function renderChoice(container, choices, className, selectedValue, onSelect) {
    container.replaceChildren();
    choices.forEach(({ key, label }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = label;
      button.setAttribute("aria-pressed", String(key === selectedValue));
      button.addEventListener("click", () => onSelect(key));
      container.appendChild(button);
    });
  }

  function renderDates() {
    renderChoice(
      ui.dateList,
      dates.map((key) => ({ key, label: formatDate(key) })),
      "date-option",
      state.date,
      (key) => {
        state.date = key;
        state.time = "";
        renderDates();
        renderTimes();
        ui.continueTimeButton.disabled = true;
      }
    );
  }

  function renderTimes() {
    ui.timeList.replaceChildren();
    const message = el("mensaje-horarios");
    if (!state.date) {
      message.textContent = "Seleccione un día para ver sus horarios.";
      return;
    }
    const bookedTimes = new Set(state.appointments
      .filter((appointment) => appointment.date === state.date)
      .map((appointment) => appointment.time));
    const choices = ["09:00", "10:30", "11:30", "15:00"]
      .filter((time) => !bookedTimes.has(time))
      .map((time) => ({ key: time, label: time }));
    if (!choices.length) {
      message.textContent = "No quedan horarios para ese día. Elija otra fecha.";
      return;
    }
    message.textContent = "Horarios disponibles para " + formatDate(state.date) + ".";
    renderChoice(ui.timeList, choices, "time-option", state.time, (time) => {
      state.time = time;
      renderTimes();
      ui.continueTimeButton.disabled = false;
    });
  }

  function showStorageError() {
    state.storageReady = false;
    ui.storageError.hidden = false;
    ui.appointmentError.hidden = false;
    ui.cancelError.hidden = false;
    ui.confirmButton.disabled = true;
  }

  function loadAppointments() {
    let stored;
    try {
      stored = localStorage.getItem(storageKey);
    } catch (error) {
      showStorageError();
      console.error("No se pudo acceder al almacenamiento local.", error);
      return [];
    }
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      const valid = Array.isArray(parsed) && parsed.every((appointment) =>
        appointment
        && typeof appointment.specialty === "string"
        && /^\d{4}-\d{2}-\d{2}$/.test(appointment.date)
        && /^\d{2}:\d{2}$/.test(appointment.time)
      );
      if (!valid) throw new TypeError("Formato de reservas inválido.");
      const active = parsed.filter((appointment) => appointment.status !== "Cancelada");
      if (active.length !== parsed.length && !saveAppointments(active)) return parsed;
      return active;
    } catch (error) {
      showStorageError();
      console.error("No se pudieron leer las horas de demostración.", error);
      return [];
    }
  }

  function saveAppointments(updatedAppointments) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedAppointments));
      return true;
    } catch (error) {
      showStorageError();
      console.error("No se pudo guardar la reserva.", error);
      return false;
    }
  }

  function confirmAppointment() {
    if (!state.specialty || !state.date || !state.time || !state.storageReady) return;
    const appointment = {
      id: `${state.date}T${state.time}-${Date.now()}`,
      specialty: state.specialty,
      date: state.date,
      time: state.time,
      status: "Confirmada"
    };
    const updated = state.appointments.concat(appointment);
    if (!saveAppointments(updated)) return;
    state.appointments = updated;
    renderAppointments();
    el("resumen-reserva").hidden = true;
    el("reserva-confirmada").hidden = false;
    el("detalle-confirmacion").textContent =
      `${state.specialty} · ${formatDate(state.date)} · ${state.time}`;
    ui.stepCaption.textContent = "Paso 3 de 3 · Confirmada";
    const successHeading = document.querySelector("#reserva-confirmada h3");
    successHeading.setAttribute("tabindex", "-1");
    successHeading.focus();
  }

  function cancelAppointment() {
    const updated = state.appointments.filter((appointment) =>
      appointmentId(appointment) !== state.pendingCancellationId
    );
    if (!saveAppointments(updated)) return;
    state.appointments = updated;
    ui.appointmentError.hidden = true;
    el("mensaje-horas").textContent =
      "La hora fue cancelada y eliminada de su historial.";
    renderAppointments();
    if (state.date) renderTimes();
    ui.cancelDialog.close();
    el("titulo-mis-horas").focus();
  }

  function renderAppointments() {
    ui.appointmentList.replaceChildren();
    if (!state.appointments.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "appointments-empty";
      emptyState.textContent = "Todavía no tiene horas reservadas.";
      ui.appointmentList.appendChild(emptyState);
      return;
    }
    state.appointments.slice()
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .forEach((appointment) => {
        const date = dateFromKey(appointment.date);
        const card = document.createElement("article");
        card.className = "appointment-card";

        const dateBlock = document.createElement("div");
        dateBlock.className = "appointment-date";
        const weekday = document.createElement("span");
        weekday.textContent = new Intl.DateTimeFormat("es-CL", { weekday: "short" })
          .format(date).replace(".", "").toUpperCase();
        const day = document.createElement("strong");
        day.textContent = String(date.getDate());
        const month = document.createElement("span");
        month.textContent = new Intl.DateTimeFormat("es-CL", { month: "short" })
          .format(date).replace(".", "").toUpperCase();
        dateBlock.append(weekday, day, month);

        const details = document.createElement("div");
        details.className = "appointment-details";
        const status = document.createElement("span");
        status.className = "status-badge";
        status.textContent = "Confirmada";
        const specialty = document.createElement("h3");
        specialty.textContent = appointment.specialty;
        const meta = document.createElement("p");
        meta.className = "appointment-meta";
        meta.textContent = `${appointment.time} hrs. · CESFAM Juan Soto Fernández`;
        const note = document.createElement("p");
        note.className = "appointment-professional";
        note.textContent = "Horario de demostración";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "cancel-appointment";
        cancelButton.dataset.cancelAppointment = appointmentId(appointment);
        cancelButton.textContent = "Cancelar hora";
        cancelButton.setAttribute("aria-label",
          `Cancelar ${appointment.specialty}, ${formatDate(appointment.date)} a las ${appointment.time}`);
        details.append(status, specialty, meta, note);
        details.appendChild(cancelButton);
        card.append(dateBlock, details);
        ui.appointmentList.appendChild(card);
      });
  }
}
