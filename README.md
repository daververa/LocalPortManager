# ◉ LocalPort Manager

> **Mini Centro de Control y Gestor de Puertos Locales para Windows**  
> Diseñado con la elegancia visual de macOS, rendimiento nativo y control real sobre procesos del sistema operativo.

---

## Características Principales

- ⚡ **Detección Automática en Tiempo Real**: Escaneo instantáneo de puertos TCP activos (`Get-NetTCPConnection`), extrayendo PID, ejecutable, comando exacto y fecha de inicio.
- 📁 **Directorio de Trabajo Real (CWD)**: Lectura nativa del Process Environment Block (PEB) en Windows mediante `ReadProcessMemory` para conocer la carpeta exacta donde se originó el servidor.
- 🧠 **Identificación Inteligente de Proyectos**: Detección automática del nombre del proyecto y framework analizando `package.json`, scripts npm (`dev`, `start`), archivos Python (`pyproject.toml`, `manage.py`, `requirements.txt`) o servicios (Vite, Next.js, FastAPI, Flask, Django, Docker, Postgres, etc.).
-  **Estética Apple (macOS Moderna)**: Interfaz de cristal translúcido con `backdrop-blur`, tipografía SF Pro / Inter, microanimaciones de resorte y estados visuales intuitivos (`● ACTIVO`, `● PAUSADO`, `○ DETENIDO`, `◌ INICIANDO`).
- 🪟 **Modo Dual (Widget Flotante & Dashboard Completo)**:
  - **Modo Widget**: Ventana compacta flotante siempre a mano con controles rápidos `[Abrir]`, `[Pausar]`, `[Detener]`.
  - **Modo Completo**: Centro de mando con barra lateral, métricas generales, proyectos guardados, historial cronológico y buscador instantáneo.
- ⏸️ **Pausa y Reanudación Real**: Congela y reactiva servidores al instante usando las APIs nativas `NtSuspendProcess` y `NtResumeProcess` de Windows.
- 🛑 **Terminación Limpia del Árbol de Procesos**: Detención en cascada (`taskkill /T`) para evitar servidores zombies o procesos secundarios huérfanos.
- 🛡️ **Seguridad y Clasificación de Procesos**: Categorización en *Seguro*, *Precaución* y *Sistema Protegido* (bloqueo absoluto de procesos críticos de Windows).
- 🚀 **Gestor de Proyectos**: Guarda tus proyectos favoritos y lánzalos con 1 clic con detección automática del puerto.
- 🔔 **System Tray y Atajos Globales**: Minimiza a la bandeja del sistema y ábrelo en cualquier momento mediante `Ctrl + Shift + L`.

---

## Estructura del Proyecto

```
LocalPortManager/
├── ARCHITECTURE.md          # Especificación de arquitectura y flujo de datos
├── DESIGN.md                # Sistema de diseño y tokens visuales Apple
├── SECURITY.md              # Políticas de seguridad y clasificación de procesos
├── electron/
│   ├── main.ts              # Proceso principal de Electron y ciclo de vida
│   ├── preload.ts           # Puente IPC seguro con contextBridge
│   └── services/            # Servicios de escaneo, control de procesos y persistencia
├── src/
│   ├── components/          # Componentes de React (Widget, Dashboard, Inspector)
│   ├── hooks/               # Hooks de sincronización en tiempo real
│   ├── types/               # Modelos y contratos TypeScript
│   ├── App.tsx              # Shell de la aplicación con soporte de temas
│   └── index.css            # Estilos de Tailwind y clases de glassmorphism
└── package.json
```

---

## Requisitos y Ejecución

- **Windows 10 / 11** (x64)
- **Node.js** v18+ (probado con v22.23.1)
- **pnpm** o **npm**

### Instalación de dependencias:
```bash
pnpm install
```

### Ejecución en Modo Desarrollo:
```bash
pnpm dev
```

### Compilación para Producción:
```bash
pnpm build
```

---

## Atajos de Teclado

- `Ctrl + Shift + L`: Alternar visibilidad de la ventana / Invocar widget.
- `Ctrl + R`: Forzar escaneo inmediato de puertos.
- `Esc`: Cerrar inspector lateral o modales.
- `Ctrl + F` / `/`: Enfocar el buscador de puertos.

---

## Privacidad
LocalPort Manager es **100% local y privado**. No recopila telemetría ni realiza peticiones de red externas. Toda la configuración e historial se almacenan en `%APPDATA%/LocalPortManager/`.
