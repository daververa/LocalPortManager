# Arquitectura Técnica — LocalPort Manager

## 1. Visión General
**LocalPort Manager** es una aplicación de escritorio diseñada para desarrolladores en Windows, orientada a la visualización, monitoreo en tiempo real e inspección profunda de puertos locales de red y servidores de desarrollo, con una experiencia de usuario inspirada en la elegancia visual de macOS y Apple Activity Monitor.

---

## 2. Stack Tecnológico Seleccionado

| Capa | Tecnología | Justificación |
|---|---|---|
| **Runtime Desktop** | **Electron 34+ (Node.js 22 LTS)** | Permite ejecución nativa en Windows con acceso al sistema operativo (PowerShell, CIM, Win32 APIs, NtDll) y soporte de ventana translúcida, System Tray y Global Shortcuts. |
| **Frontend Core** | **React 19 + TypeScript** | Tipado estricto de extremo a extremo, alto rendimiento en renderizado reactivo y gestión declarativa de estados. |
| **Build Tooling** | **Vite 6** | Tiempos de compilación ultrarrápidos, Hot Module Replacement (HMR) instantáneo y soporte nativo ESM. |
| **Diseño y Estilos** | **Tailwind CSS + Lucide Icons + Apple Design System tokens** | Glassmorphism, materiales translúcidos (`backdrop-filter: blur`), microanimaciones de resorte y tipografía SF Pro / Inter. |
| **Comunicación IPC** | **Electron ContextBridge (IPC seguro y tipado)** | Aislamiento estricto de procesos (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`), protegiendo la UI de vulnerabilidades RCE. |
| **Persistencia Local** | **Local JSON Store / electron-store en AppData** | Almacenamiento puramente local y offline de proyectos, favoritos, configuraciones e historial. |

---

## 3. Arquitectura de Procesos de Electron

```mermaid
graph TD
    subgraph "Main Process (Node.js 22)"
        AppLifeCycle[App Lifecycle & Window Management]
        PortScanner[Port Scanner Service]
        ProcessMgr[Process Manager & PEB Reader]
        ProcessCtrl[Process Controller (Suspend/Kill/Spawn)]
        ProjectDetector[Smart Project & Framework Detector]
        StorageSvc[Local Storage Service (JSON)]
        TraySvc[System Tray & Global Shortcuts]
        NotifSvc[Native Windows Notifications]
    end

    subgraph "Preload Layer (Sandbox)"
        ContextBridge[contextBridge.exposeInMainWorld('api')]
        TypeSafeBridge[Typed IPC Channels]
    end

    subgraph "Renderer Process (React 19 + Vite)"
        UIState[Zustand / React Context State Store]
        WidgetView[Mini Widget Floating Window]
        DashboardView[Full Dashboard Window]
        InspectorDrawer[Port Detail Slide-over Inspector]
        ProjectsView[Saved Projects Manager]
        HistoryView[Activity History Log]
        SettingsModal[Configuration & Shortcuts Modal]
    end

    PortScanner -->|Get-NetTCPConnection| WindowsOS[(Windows Kernel / NetTCP)]
    ProcessMgr -->|Win32_Process & ReadProcessMemory| WindowsProcs[(Windows Processes & PEB)]
    ProcessCtrl -->|NtSuspendProcess & taskkill| WindowsProcs
    
    MainProcess <-->|IPC Asíncrono Tipado| PreloadLayer
    PreloadLayer <-->|window.api.*| RendererProcess
```

---

## 4. Estructura de Directorios del Proyecto

```
LocalPortManager/
├── .gitignore
├── ARCHITECTURE.md
├── DESIGN.md
├── SECURITY.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── electron/
│   ├── main.ts                    # Punto de entrada del Main Process
│   ├── preload.ts                 # ContextBridge tipado seguro
│   ├── services/
│   │   ├── port-scanner.ts        # Detección TCP/UDP con Get-NetTCPConnection
│   │   ├── process-manager.ts     # Extracción de procesos, PEB y CWD
│   │   ├── process-controller.ts  # Control real (Pausar/Reanudar/Detener/Spawn)
│   │   ├── project-detector.ts    # Detección inteligente de proyectos/frameworks
│   │   ├── storage.ts             # Persistencia local JSON en AppData
│   │   ├── tray.ts                # Gestión del System Tray de Windows
│   │   └── native-scripts/
│   │       ├── get-cwd.ps1        # Script Win32 PEB CWD reader
│   │       └── suspend-resume.ps1 # Script NtSuspendProcess / NtResumeProcess
│   └── types/
│       └── ipc.ts                 # Interfaces TypeScript compartidas
├── src/
│   ├── main.tsx                   # Entrada de React
│   ├── App.tsx                    # Componente raíz con layout y routing de vistas
│   ├── index.css                  # Directivas de Tailwind y estilos Apple
│   ├── types/
│   │   └── models.ts              # Modelos de datos (PortInfo, Project, etc.)
│   ├── hooks/
│   │   ├── usePorts.ts            # Hook de sincronización en tiempo real
│   │   ├── useProjects.ts         # Hook para proyectos guardados
│   │   └── useTheme.ts            # Gestión de tema claro/oscuro
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Titlebar.tsx       # Barra de título estilo macOS personalizada
│   │   │   ├── Sidebar.tsx        # Navegación lateral estilo macOS
│   │   │   └── Header.tsx         # Estadísticas y contadores de desarrollo
│   │   ├── widget/
│   │   │   └── MiniWidget.tsx     # Vista compacta flotante estilo widget Apple
│   │   ├── dashboard/
│   │   │   ├── PortCard.tsx       # Tarjeta de servicio con microinteracciones
│   │   │   ├── PortGrid.tsx       # Grilla con filtrado y búsqueda instantánea
│   │   │   └── Inspector.tsx      # Panel lateral de detalle técnico
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx    # Tarjeta de proyecto guardado
│   │   │   └── NewProjectModal.tsx # Modal de alta de proyecto
│   │   ├── history/
│   │   │   └── HistoryList.tsx    # Registro de eventos con filtrado
│   │   ├── settings/
│   │   │   └── SettingsModal.tsx  # Configuración y atajos
│   │   └── common/
│   │       ├── Badge.tsx          # Indicadores visuales de estado
│   │       ├── Button.tsx         # Botones con microinteracción Apple
│   │       ├── ConfirmModal.tsx   # Diálogo de confirmación para detención
│   │       └── EmptyState.tsx     # Estado vacío minimalista
└── test/
    ├── scanner.test.ts            # Pruebas del analizador de puertos
    └── framework-detector.test.ts # Pruebas del detector heurístico
```

---

## 5. Módulos y Flujos de Comunicación

### 5.1. Detección en Tiempo Real (PortScanner & ProcessManager)
1. El Main Process ejecuta un ciclo de escaneo adaptable cada **2.5 segundos** (ampliado a **5 segundos** si la ventana está minimizada).
2. Se consulta `Get-NetTCPConnection -State Listen` para obtener `{ LocalAddress, LocalPort, OwningProcess }`.
3. Se agrupan los PIDs únicos y se consultan sus metadatos mediante `Win32_Process` (Name, CommandLine, ExecutablePath, ParentProcessId, CreationDate).
4. Para procesos de usuario no identificados en la línea de comandos, se extrae el CWD exacto consultando el bloque PEB vía `ReadProcessMemory`.
5. Se ejecuta el `ProjectDetector` para inspeccionar el directorio de trabajo:
   - Lectura de `package.json` (nombre del proyecto, scripts `dev`/`start`, dependencias como `vite`, `next`, `astro`, `svelte`).
   - Lectura de `pyproject.toml`, `requirements.txt` o scripts Python (`manage.py`, `app.py`).
   - Detección de servicios comunes como Docker o bases de datos (Postgres en 5432, MySQL en 3306, Redis en 6379).
6. Se calcula el diff con el estado previo. Si hay cambios o nuevos puertos detectados, se emite un evento IPC `ports:updated` al Renderer Process y se dispara una notificación nativa si está activada.

### 5.2. Control Real del Proceso (ProcessController)
- **Abrir en Navegador**: Invoca `shell.openExternal("http://localhost:" + port)`.
- **Abrir Carpeta**: Invoca `shell.openPath(cwd)` de forma asíncrona.
- **Abrir Terminal**: Determina el emulador disponible (Windows Terminal `wt.exe -d "<cwd>"` o PowerShell `-NoExit -Command "Set-Location '<cwd>'"`).
- **Pausar / Reanudar**:
  - Invoca `NtSuspendProcess(handle)` y `NtResumeProcess(handle)` en `ntdll.dll`.
  - El estado del puerto en la UI pasa a `● PAUSADO` (color ámbar).
- **Detener Servidor**:
  - Termina limpiamente el árbol de procesos con `taskkill /PID <PID> /T` para evitar procesos huérfanos.
  - Si el proceso no responde tras un periodo de gracia, ofrece la opción de detención forzada (`/F`).
- **Reiniciar Servidor**:
  - Detiene el proceso actual y relanza la misma línea de comandos en el mismo CWD usando `child_process.spawn`.

---

## 6. Persistencia Local
Los datos se almacenan en un archivo JSON seguro en `%APPDATA%/LocalPortManager/config.json`:
- **Favoritos**: Lista de puertos o nombres de proyectos fijados al principio.
- **Proyectos Guardados**: Nombre, carpeta, comando de inicio, framework y puerto previsto.
- **Historial de Actividad**: Últimos 100 eventos (hora, tipo de evento, puerto, proceso).
- **Configuración de Usuario**: Modo compacto vs expandido, inicio con Windows, atajo global (`Ctrl+Shift+L`), notificaciones activadas, tema (Sistema, Claro, Oscuro).
