# Sistema de Diseño — LocalPort Manager (Apple Inspired)

## 1. Filosofía de Diseño
El diseño de **LocalPort Manager** está inspirado en la precisión, minimalismo y sofisticación visual de macOS moderno (Sonoma / Tahoe / Sequoia), integrando elementos de:
- **Apple Control Center**: Módulos flotantes compactos, tarjetas translúcidas con blur, jerarquía visual limpia y directa.
- **Activity Monitor & Xcode**: Métricas y telemetría técnica presentada de forma visualmente atractiva sin abrumar.
- **Widgets de macOS**: Un modo flotante compacto y discreto que se adapta al flujo de trabajo del desarrollador.

> **Principio Clave**: *"Menos de 3 segundos para comprender qué está corriendo en tu máquina."* La información crítica (Puerto, Proyecto, Estado) salta a la vista; los detalles técnicos profundos se descubren con un clic.

---

## 2. Paleta de Colores y Superficies

### 2.1. Modo Oscuro (Predeterminado para Developers)
| Elemento | Valor Color / CSS | Propósito |
|---|---|---|
| **Fondo Base** | `#0E0E10` / `rgba(14, 14, 16, 0.94)` | Fondo profundo pero no negro puro, permitiendo relieve visual. |
| **Material Translúcido** | `rgba(28, 28, 32, 0.72)` con `backdrop-blur-xl` | Superficie de tarjetas y barras de herramientas. |
| **Superficie Elevada** | `rgba(40, 40, 46, 0.85)` | Estados de hover y modales emergentes. |
| **Bordes de Luz** | `rgba(255, 255, 255, 0.08)` | Bordes ultra-finos (1px) que simulan el corte de cristal de macOS. |
| **Texto Primario** | `#F5F5F7` (Apple Off-White) | Títulos, puertos destacados y nombres de proyectos. |
| **Texto Secundario** | `#98989D` (Muted Gray) | Rutas, PID, tiempos de inicio y etiquetas. |

### 2.2. Modo Claro
| Elemento | Valor Color / CSS | Propósito |
|---|---|---|
| **Fondo Base** | `#F2F2F7` / `rgba(242, 242, 247, 0.94)` | Blanco aperlado característico de los ajustes de macOS. |
| **Material Translúcido** | `rgba(255, 255, 255, 0.82)` con `backdrop-blur-xl` | Tarjetas de puertos con sutil sombra difusa. |
| **Bordes de Luz** | `rgba(0, 0, 0, 0.07)` | Delimitación sutil sin cargar la vista. |
| **Texto Primario** | `#1D1D1F` | Máximo contraste y legibilidad tipográfica. |
| **Texto Secundario** | `#86868B` | Información complementaria. |

### 2.3. Acentos y Estados de Proceso
- **● ACTIVO**: Verde Esmeralda (`#34C759` / `#30D158`) — Pulso respiratorio sutil (CSS animation `pulse-glow`).
- **● PAUSADO**: Ámbar Cálido (`#FF9500` / `#FF9F0A`) — Indicador fijo con borde suavizado.
- **○ DETENIDO**: Gris Neutro (`#8E8E93`) — Anillo hueco con opacidad reducida.
- **◌ INICIANDO**: Azul Sistema (`#007AFF` / `#0A84FF`) — Spinner fino continuo.
- **⚠ ERROR / PROTEGIDO**: Rojo Coral (`#FF3B30` / `#FF453A`) — Alerta discreta con tooltip explicativo.

---

## 3. Tipografía
- **Familia Tipográfica**:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", "Segoe UI", Roboto, sans-serif;
  ```
- **Monospace (Puertos, PIDs, Comandos)**:
  ```css
  font-family: "SF Mono", "Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace;
  ```
- **Escala**:
  - `Display / Port Hero`: 24px - 28px, Bold / SemiBold (Monospace numérico tabular).
  - `Section Header`: 15px - 17px, SemiBold.
  - `Card Title`: 13px - 14px, Medium.
  - `Body / Metadata`: 11px - 12px, Regular / Medium.
  - `Badge / Pill`: 10px, SemiBold, Uppercase con letter-spacing +0.05em.

---

## 4. Modos de Visualización

### 4.1. Modo Widget (Mini Centro de Control Flotante)
- **Dimensiones**: 380px ancho × 540px alto.
- **Comportamiento**: Ventana flotante compacta, opción de fijar "Always on Top" (icono chincheta Apple), lista de tarjetas compactas de servidores activos con acceso rápido a `[Abrir]`, `[Pausar]`, `[Detener]`.
- **Botón inferior**: "Ver todos los servicios →" para expandir a la vista completa de forma fluida.

### 4.2. Modo Completo (Dashboard de Gestión)
- **Dimensiones**: 980px ancho × 680px alto (redimensionable).
- **Barra Lateral (Sidebar)**:
  - ◉ General (Resumen de recursos y métricas de red)
  - ⚡ Puertos Locales (Todos los listeners con filtros rápidos)
  - 📁 Proyectos (Servidores registrados con inicio en 1 clic)
  - 🔍 Procesos (Vista de árbol de procesos y PIDs)
  - ★ Favoritos (Servidores fijados)
  - 🕒 Historial (Registro cronológico de eventos)
  - ⚙ Configuración (Atajos de teclado, arranque con Windows, notificaciones)
- **Área Principal**:
  - Encabezado con contadores ("4 servidores activos · 12 listeners detectados").
  - Buscador instantáneo con atajo `Cmd/Ctrl + K` o `Ctrl + F`.
  - Filtros en píldoras: `Todos`, `Activos`, `Pausados`, `Node.js`, `Vite`, `Python`, `Docker`, `Bases de Datos`.
  - Grilla responsiva de tarjetas de puertos.

### 4.3. Inspector Lateral (Slide-over Drawer)
- Al pulsar en cualquier tarjeta, se desliza suavemente desde la derecha un panel de inspección profunda con la telemetría completa:
  - Puerto, URL formateada con botón de copia rápida con animación de confirmación.
  - Proyecto detectado, ruta exacta en disco (`C:\...`).
  - Nombre del proceso ejecutable, PID y PID padre.
  - Línea de comando completa con opción de copia.
  - Framework detectado con insignia distintiva.
  - Fecha y hora exacta de inicio con cálculo de duración (uptime).
  - Grupo de botones de acción real:
    - `[ Abrir en Navegador ]`
    - `[ Abrir Carpeta ]`
    - `[ Abrir Terminal ]`
    - `[ Pausar / Reanudar ]`
    - `[ Reiniciar ]`
    - `[ Detener ]`

---

## 5. Microinteracciones y Física de Animaciones
- **Curvas de Transición Apple**:
  ```css
  cubic-bezier(0.16, 1, 0.3, 1) /* Apple Ease-Out Spring */
  ```
- **Feedback Háptico Visual**:
  - Al pulsar botones, se aplica una escala suave `scale(0.97)` instantánea y recuperación con rebote físico.
  - Al copiar URLs o comandos, el icono de portapapeles se transforma en un check verde esmeralda con fade out a los 2 segundos.
  - Los cambios de estado (Activo <-> Pausado) realizan un cross-fade sutil sin saltos de interfaz.
