# Agendamex - CESFAM Juan Soto Fernández

Prototipo web para consultar y agendar horas médicas ficticias del CESFAM Juan Soto Fernández. La aplicación está diseñada para adultos mayores y funciona como demostración local: no realiza citas reales ni se conecta con sistemas sanitarios.

## Equipo

- Pablo Sanhueza: jefe de proyecto
- Pablo Silva: programación
- Alonso Gonzales: integrante del equipo

## Funcionalidades

- Inicio de sesión con cuentas ficticias.
- Agendamiento en tres pasos:
  1. Especialidad.
  2. Día y horario disponible.
  3. Confirmación de la reserva.
- Consulta de horas agendadas.
- Cancelación con confirmación.
- Persistencia local de las reservas mediante `localStorage`.
- Separación de reservas por cuenta ficticia.
- Diseño adaptable para escritorio y dispositivos móviles.
- Indicadores de foco, navegación por teclado y atributos ARIA.

## Cuentas de demostración

| RUT | Contraseña | Paciente |
|---|---|---|
| 5.173.842-0 | 5173842 | Rosa Elena Muñoz |
| 6.289.415-0 | 6289415 | Luis Alberto Rojas |
| 4.856.273-0 | 4856273 | Teresa González |
| 5.942.617-0 | 5942617 | Pedro Fuentes |

Estas cuentas están definidas exclusivamente para demostración.

## Ejecutar el proyecto

No requiere instalación de dependencias ni backend.

Desde la carpeta del proyecto, iniciar un servidor estático:

```powershell
python -m http.server 4173
```

Después abrir:

```text
http://localhost:4173/index.html
```

Las páginas pueden presentar restricciones si se abren directamente con `file://`, por lo que se recomienda usar un servidor HTTP local.

## Estructura del proyecto

```text
index.html          Página de inicio de sesión
portal.html         Portal y flujo de agendamiento
demo-users.js       Cuentas ficticias y normalización de RUT
login.js            Validación del ingreso
portal.js           Reservas, cancelaciones y persistencia local
styles.css          Estilos globales
login.css           Estilos de inicio de sesión
portal.css          Estilos del portal
assets/             Recursos gráficos
docs/               Documentación del proyecto
```

## Persistencia

Las reservas se guardan en el navegador con claves por RUT normalizado:

```text
cesfam-demo-appointments-51738420
```

La sesión activa se guarda en `sessionStorage` mientras el usuario navega. Al cerrar sesión se elimina.

Los datos pueden borrarse desde las herramientas de desarrollo del navegador mediante «Borrar datos de sitio». Esto es útil para reiniciar las reservas de demostración.

## Requisitos

El detalle completo se encuentra en [docs/ERS-Agendamex-CESFAM.docx](docs/ERS-Agendamex-CESFAM.docx).

Requisitos principales:

- **RF-01:** agendamiento en un máximo de tres pasos.
- **RF-02:** ingreso limitado a las cuatro cuentas ficticias.
- **RF-03:** consulta y cancelación persistente de reservas.
- **RNF-01:** diseño responsive y cumplimiento de criterios de accesibilidad.
- **RNF-02:** interfaz usable para adultos mayores, con pruebas SUS superiores a 85/100.

## Alcance y limitaciones

- No existen citas médicas reales.
- Los horarios son datos ficticios fijados por el prototipo.
- No hay base de datos ni autenticación segura de producción.
- `localStorage` permite demostrar persistencia, pero no es compartido entre navegadores o dispositivos.
- No se integra con sistemas reales del CESFAM.

## Tecnologías

- HTML5
- CSS3
- Bootstrap 5.3.3 desde CDN
- JavaScript
