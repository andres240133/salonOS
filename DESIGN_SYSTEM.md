# Sistema de Diseño de SalonOS
**Versión:** 1.0.0  
**Fecha:** 2026-05-20  
**Rol del Autor:** Senior UX/UI Designer (Lujo Moderno & Aplicaciones Móviles)  
**Estado:** Aprobado  

---

## Introducción y Filosofía del Diseño

SalonOS es una plataforma pensada para un salón de belleza de lujo unipersonal. La identidad visual debe reflejar exclusividad, sofisticación, pulcritud y modernidad. 

### Principios de Diseño:
1. **Lujo Moderno:** Uso de fondos muy oscuros (negros y grises intensos) combinados con acentos dorados y tipografía refinada para emular la experiencia física de un salón premium de alta gama.
2. **Ergonomía Mobile-First:** El 90% de las clientas y el 100% de la administradora utilizarán la aplicación desde sus teléfonos móviles. Todo elemento interactivo debe estar al alcance del pulgar y optimizado para pantallas táctiles de entre 360px y 430px.
3. **Fricción Cero para la Clienta:** El flujo de reserva debe ser rápido, limpio y no requerir credenciales ni configuraciones complejas.
4. **Legibilidad Inclusiva (Accesibilidad):** Pensado para un público de rango etario amplio (25 a 70 años). Se prioriza el contraste de color WCAG AA y tamaños de tipografía e inputs aptos para adultos mayores sin perder la estética de lujo.

---

## 1. Tokens de Diseño (Design Tokens)

Los tokens de diseño son la fuente única de verdad para los valores visuales de la aplicación. Se definen a continuación para su fácil integración en CSS y Tailwind CSS.

### 1.1. Paleta de Colores (Color Palette)

#### Configuración de Variables CSS (`index.css`)
```css
:root {
  /* Fondos (Neutros Oscuros) */
  --color-bg-base: #0F0F0F;       /* Fondo de la aplicación */
  --color-bg-card: #1A1A1A;       /* Fondo de tarjetas y contenedores */
  --color-bg-elevated: #2A2A2A;   /* Fondo de modales, dropdowns y elementos flotantes */

  /* Colores de Marca (Dorados) */
  --color-primary: #D4AF37;        /* Dorado principal (lujo, citas pendientes, stock bajo) */
  --color-primary-hover: #B8960C;  /* Dorado oscuro (hover de botones, citas completadas) */
  --color-primary-light: #F5E27A;  /* Dorado claro (highlights, bordes activos, badges) */

  /* Textos */
  --color-text-primary: #F5F5F5;   /* Blanco roto para máxima lectura sin fatiga visual */
  --color-text-secondary: #A0A0A0; /* Gris medio para textos secundarios y placeholders */
  --color-text-muted: #6B7280;     /* Gris oscuro para deshabilitados o fechas secundarias */

  /* Acentos Funcionales y Semánticos */
  --color-success: #16A34A;        /* Verde (citas confirmadas, stock OK) */
  --color-danger: #DC2626;         /* Rojo (citas canceladas, sin stock, peligro) */

  /* Bordes */
  --color-border-gold: rgba(212, 175, 55, 0.2); /* Dorado translúcido sutil */
  --color-border-light: rgba(245, 245, 245, 0.1);/* Gris translúcido para separadores */

  /* Sombras y Resplandores (Glow) */
  --shadow-gold-sm: 0 2px 8px rgba(212, 175, 55, 0.08);
  --shadow-gold-md: 0 4px 20px rgba(212, 175, 55, 0.15);
  --glow-gold: 0 0 12px rgba(212, 175, 55, 0.25);
  --glow-danger: 0 0 12px rgba(220, 38, 38, 0.25);
}
```

#### Nombres Semánticos en Tailwind (`tailwind.config.js`)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0F0F0F',
          card: '#1A1A1A',
          elevated: '#2A2A2A',
        },
        gold: {
          DEFAULT: '#D4AF37',
          hover: '#B8960C',
          light: '#F5E27A',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#A0A0A0',
          muted: '#6B7280',
        },
        success: '#16A34A',
        danger: '#DC2626',
      },
      borderColor: {
        gold: 'rgba(212, 175, 55, 0.2)',
        light: 'rgba(245, 245, 245, 0.1)',
      },
      boxShadow: {
        'gold-sm': '0 2px 8px rgba(212, 175, 55, 0.08)',
        'gold-md': '0 4px 20px rgba(212, 175, 55, 0.15)',
        'glow': '0 0 12px rgba(212, 175, 55, 0.25)',
        'glow-danger': '0 0 12px rgba(220, 38, 38, 0.25)',
      }
    }
  }
}
```

---

### 1.2. Semántica de Colores según Estado

Para una rápida asociación visual en el día a día operativo del salón, se define la siguiente correspondencia semántica:

| Concepto / Entidad | Estado | Color Hex | Clase Tailwind | Uso Recomendado |
|---|---|---|---|---|
| **Cita / Reserva** | Pendiente | `#D4AF37` | `text-gold bg-gold/10 border-gold/30` | Badge y estado por defecto de nueva cita. |
| **Cita / Reserva** | Confirmada | `#16A34A` | `text-success bg-success/10 border-success/30` | Cita confirmada por la clienta o admin. |
| **Cita / Reserva** | Completada | `#B8960C` | `text-gold-hover bg-gold-hover/10 border-gold-hover/30` | Historial y flujo de caja cerrado. |
| **Cita / Reserva** | Cancelada | `#DC2626` | `text-danger bg-danger/10 border-danger/30` | Estado inactivo y slot liberado. |
| **Inventario / Stock** | Stock OK | `#16A34A` | `text-success bg-success/10` | Cantidad de insumo por encima del mínimo. |
| **Inventario / Stock** | Stock Bajo | `#D4AF37` | `text-gold bg-gold/10` | Cantidad de insumo igual o menor al mínimo. |
| **Inventario / Stock** | Sin Stock | `#DC2626` | `text-danger bg-danger/10` | Cantidad de insumo igual a cero. |

---

### 1.3. Escala Tipográfica (Typography Scale)

Para garantizar sofisticación, se propone usar las fuentes **Cormorant Garamond** (serif elegante) para títulos principales de marketing/secciones de lujo, y **Inter** (sans-serif geométrica de alta legibilidad) para textos de interfaz, controles, inputs y la consola de administración.

| Token | CSS Size | Tailwind Class | Peso (Font-Weight) | Line-Height | Uso Principal |
|---|---|---|---|---|---|
| **Display 1** | 36px | `text-4xl` | Bold (700) / Serif | 1.15 | Hero Títulos (Web Pública) |
| **H1** | 30px | `text-3xl` | SemiBold (600) / Serif | 1.20 | Títulos principales de páginas |
| **H2** | 24px | `text-2xl` | SemiBold (600) | 1.25 | Títulos de sección / Títulos de modals |
| **H3** | 20px | `text-xl` | Medium (500) | 1.30 | Tarjetas, subtítulos importantes |
| **Body Large**| 18px | `text-lg` | Regular (400) | 1.50 | Inputs, selectores, botones principales |
| **Body Base** | 16px | `text-base` | Regular (400) | 1.50 | Texto de lectura, etiquetas de formulario |
| **Small** | 14px | `text-sm` | Regular (400) / Medium | 1.40 | Fechas, datos secundarios, tablas |
| **Caption** | 12px | `text-xs` | Medium (500) / Semibold | 1.30 | Badges de estados, micro-etiquetas |

---

### 1.4. Escala de Espaciado (Spacing Scale)

Basada en un sistema de rejilla de 4px, optimizando la consistencia y la alineación móvil.

*   **4px (1/2 unit):** `p-1` o `space-1` — Ajustes mínimos, micro-espaciados de badges.
*   **8px (1 unit):** `p-2` o `space-2` — Espacio entre título y subtítulo, elementos internos de cards.
*   **12px (1.5 units):** `p-3` o `space-3` — Espaciado compacto en celdas de tabla y formularios de configuración.
*   **16px (2 units):** `p-4` o `space-4` — Padding base de tarjetas, espaciado entre campos de formulario.
*   **20px (2.5 units):** `p-5` o `space-5` — Gap de componentes en listas del panel.
*   **24px (3 units):** `p-6` o `space-6` — Padding de modales y layout del contenedor principal móvil.
*   **32px (4 units):** `p-8` o `space-8` — Separación de secciones grandes en web pública.
*   **48px (6 units):** `p-12` o `space-12` — Padding superior del Hero e inicio del flujo clienta.

---

### 1.5. Radios de Borde (Border Radius)

*   **4px (`rounded-sm`):** Para pequeños controles de formularios internos y checkbox.
*   **8px (`rounded`):** Estándar para botones medianos y controles simples.
*   **12px (`rounded-xl`):** Estándar para Tarjetas (Cards), Modales, Inputs y Botones de gran tamaño. Refuerza el aspecto premium contemporáneo.
*   **999px (`rounded-full`):** Exclusivo para Badges e indicadores tipo píldora (Pills).

---

## 2. Componentes Base (UI Components Specification)

Todos los componentes deben ser implementados utilizando Tailwind CSS con las especificaciones y clases aquí detalladas para garantizar consistencia.

### 2.1. Botones (Buttons)

#### A. Botón Primario Dorado
Utilizado para las acciones primarias del flujo (`Siguiente`, `Confirmar`, `Guardar`).
*   **Diseño:** Fondo dorado con texto oscuro para máximo contraste, borde dorado con resplandor sutil. Transición suave de 200ms en el hover.
*   **Clases Tailwind:**
    ```html
    <button class="w-full h-12 px-6 bg-gold text-bg-base font-semibold text-lg rounded-xl transition-all duration-200 hover:bg-gold-hover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gold-light focus:ring-offset-2 focus:ring-offset-bg-base disabled:bg-text-muted disabled:text-bg-card disabled:cursor-not-allowed shadow-gold-sm hover:shadow-gold-md">
      Confirmar Cita
    </button>
    ```

#### B. Botón Outline Dorado
Acciones secundarias (`Volver`, `Cancelar modal`, `Ver más`).
*   **Diseño:** Sin fondo, borde dorado translúcido que se vuelve sólido en hover, texto dorado.
*   **Clases Tailwind:**
    ```html
    <button class="w-full h-12 px-6 bg-transparent border-2 border-gold/40 text-gold font-semibold text-lg rounded-xl transition-all duration-200 hover:bg-gold/10 hover:border-gold active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-bg-base disabled:border-text-muted/20 disabled:text-text-muted disabled:cursor-not-allowed">
      Atrás
    </button>
    ```

#### C. Botón de Peligro Rojo
Acciones destructivas (`Cancelar Cita`, `Eliminar Insumo`, `Vaciar carrito`).
*   **Diseño:** Fondo rojo con texto blanco, resplandor rojo en focus.
*   **Clases Tailwind:**
    ```html
    <button class="w-full h-12 px-6 bg-danger text-text-primary font-semibold text-lg rounded-xl transition-all duration-200 hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-bg-base shadow-lg shadow-danger/20 hover:shadow-danger/40">
      Cancelar Cita
    </button>
    ```

---

### 2.2. Campos de Entrada (Inputs & Selects)

Diseñados bajo la pauta de tamaño mínimo táctil de 48px de altura y fuente mínima de 18px para adultos mayores, previniendo el zoom automático en navegadores iOS (Safari).

#### A. Input de Texto y Teléfono
*   **Clases Tailwind:**
    ```html
    <div class="flex flex-col gap-2">
      <label for="phone" class="text-text-secondary text-sm font-medium">Número de Teléfono (WhatsApp)</label>
      <input type="tel" id="phone" placeholder="Ej: +34 612 345 678" 
             class="w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-lg rounded-xl placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold focus:shadow-glow" />
    </div>
    ```

#### B. Selector (Select)
*   **Clases Tailwind:**
    ```html
    <div class="flex flex-col gap-2">
      <label for="service-cat" class="text-text-secondary text-sm font-medium">Categoría de Servicio</label>
      <div class="relative">
        <select id="service-cat" 
                class="w-full h-12 pl-4 pr-10 bg-bg-card border border-gold/20 text-text-primary text-lg rounded-xl appearance-none transition-all duration-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold focus:shadow-glow">
          <option value="corte">Cortes de Cabello</option>
          <option value="color">Coloración y Tintes</option>
          <option value="tratamientos">Tratamientos Capilares</option>
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gold">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
    ```

---

### 2.3. Contenedores y Elevación (Cards & Layout Elements)

#### A. Tarjeta Base (Card)
*   **Diseño:** Fondo oscuro mate `#1A1A1A`, borde dorado muy sutil y degradado radial imperceptible que simula brillo metálico en los extremos.
*   **Clases Tailwind:**
    ```html
    <div class="p-5 bg-bg-card border border-gold/15 rounded-xl shadow-gold-sm hover:border-gold/25 transition-colors duration-300">
      <h3 class="text-text-primary text-xl font-medium mb-1">Corte + Peinado Premium</h3>
      <p class="text-text-secondary text-sm">60 min • $45.00</p>
    </div>
    ```

#### B. Modal / Diálogo
*   **Diseño:** Fondo gris oscuro elevado, overlay translúcido ultra-oscuro que desenfoca el fondo (glassmorphism), centrado para celulares y con animación de escalado hacia arriba.
*   **Clases Tailwind:**
    ```html
    <!-- Overlay -->
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <!-- Modal Content -->
      <div class="w-full max-w-md bg-bg-elevated border border-gold/30 rounded-t-2xl sm:rounded-2xl p-6 shadow-gold-md animate-in fade-in slide-in-from-bottom duration-300">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-text-primary text-2xl font-semibold">Completar Cita</h2>
          <button class="text-text-secondary hover:text-gold transition-colors p-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <!-- Modal body -->
        <div class="space-y-4 mb-6">
          <p class="text-text-secondary text-base">Registra el pago correspondiente para finalizar.</p>
        </div>
        <!-- Modal actions -->
        <div class="flex flex-col gap-3">
          <button class="w-full h-12 bg-gold text-bg-base font-semibold rounded-xl">Confirmar e Ingresar Pago</button>
          <button class="w-full h-12 bg-transparent text-text-secondary font-medium rounded-xl">Cancelar</button>
        </div>
      </div>
    </div>
    ```

---

### 2.4. Componentes Semánticos e Indicadores

#### A. Badges de Estado de Cita
*   **Pendiente:**
    ```html
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/30">
      Pendiente
    </span>
    ```
*   **Confirmada:**
    ```html
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/30">
      Confirmada
    </span>
    ```
*   **Completada:**
    ```html
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-hover/10 text-gold-hover border border-gold-hover/30">
      Completada
    </span>
    ```
*   **Cancelada:**
    ```html
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger/30">
      Cancelada
    </span>
    ```

#### B. Semáforo de Inventario de Stock
*   **Verde (Stock OK - mayor al mínimo):**
    ```html
    <div class="flex items-center gap-2">
      <span class="w-3.5 h-3.5 rounded-full bg-success ring-4 ring-success/20"></span>
      <span class="text-text-primary text-base font-medium">Stock OK</span>
    </div>
    ```
*   **Amarillo (Stock Bajo - menor o igual al mínimo):**
    ```html
    <div class="flex items-center gap-2">
      <span class="w-3.5 h-3.5 rounded-full bg-gold ring-4 ring-gold/20 animate-pulse"></span>
      <span class="text-gold text-base font-medium">Stock Bajo</span>
    </div>
    ```
*   **Rojo (Sin Stock - igual a cero):**
    ```html
    <div class="flex items-center gap-2">
      <span class="w-3.5 h-3.5 rounded-full bg-danger ring-4 ring-danger/20"></span>
      <span class="text-danger text-base font-semibold">Sin Stock</span>
    </div>
    ```

#### C. Toasts de Notificación (Alertas Flotantes)
*   **Toast Exitoso:**
    ```html
    <div class="fixed bottom-4 right-4 z-50 flex items-center gap-3 p-4 bg-bg-elevated border-l-4 border-gold rounded-xl shadow-gold-md animate-slide-in">
      <div class="text-gold">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
      </div>
      <div>
        <p class="text-text-primary text-sm font-semibold">Cita Guardada</p>
        <p class="text-text-secondary text-xs">Se registró la cita correctamente.</p>
      </div>
    </div>
    ```
*   **Toast de Error:**
    ```html
    <div class="fixed bottom-4 right-4 z-50 flex items-center gap-3 p-4 bg-bg-elevated border-l-4 border-danger rounded-xl shadow-glow-danger animate-slide-in">
      <div class="text-danger">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
      </div>
      <div>
        <p class="text-text-primary text-sm font-semibold">Error al Reservar</p>
        <p class="text-text-secondary text-xs">El horario seleccionado ya ha sido tomado.</p>
      </div>
    </div>
    ```

---

## 3. Layouts de Pantallas Completas (Full Screen Schematics)

Para guiar la codificación exacta, a continuación se definen los mockups estructurales en pseudocódigo visual (HTML/Tailwind altamente estructurado). Todos los contenedores de páginas emplean el layout adaptativo optimizado para móviles.

### 3.1. Flujo de Reserva de Clienta (Sin Login)

#### Paso 1: Selección de Servicio
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col justify-between">
  <!-- Header Fijo Superior -->
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-base/80 backdrop-blur-md sticky top-0 z-40">
    <span class="text-xl font-bold font-serif tracking-wider text-gold">SalonOS</span>
    <span class="text-xs text-text-secondary bg-bg-card border border-gold/20 px-3 py-1 rounded-full">Paso 1 de 3</span>
  </header>

  <!-- Contenido Scrollable -->
  <main class="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
    <div class="space-y-1">
      <h1 class="text-3xl font-serif font-semibold text-gold">Selecciona tus Servicios</h1>
      <p class="text-text-secondary text-sm">Elige uno o más tratamientos. Verás la duración acumulada al instante.</p>
    </div>

    <!-- Filtro de Categorías -->
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button class="bg-gold text-bg-base px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap">Corte y Peinado</button>
      <button class="bg-bg-card border border-gold/20 text-text-primary px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap">Color y Mechas</button>
      <button class="bg-bg-card border border-gold/20 text-text-primary px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap">Tratamientos</button>
    </div>

    <!-- Lista de Servicios -->
    <div class="space-y-3">
      <!-- Item Servicio Seleccionado -->
      <div class="p-4 bg-bg-card border-2 border-gold rounded-xl shadow-glow flex justify-between items-center cursor-pointer">
        <div class="space-y-1">
          <span class="text-lg font-medium text-gold-light">Corte de Dama Estilo Parisino</span>
          <p class="text-text-secondary text-sm">Corte personalizado + lavado + peinado brushing.</p>
          <p class="text-text-muted text-xs">45 min • $35.00</p>
        </div>
        <div class="text-gold">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
        </div>
      </div>

      <!-- Item Servicio No Seleccionado -->
      <div class="p-4 bg-bg-card border border-gold/15 rounded-xl hover:border-gold/30 flex justify-between items-center cursor-pointer transition-all duration-200">
        <div class="space-y-1">
          <span class="text-lg font-medium">Balayage Tradicional + Brillo</span>
          <p class="text-text-secondary text-sm">Degradado natural de color para iluminar tu rostro.</p>
          <p class="text-text-muted text-xs">120 min • $95.00</p>
        </div>
        <div class="w-6 h-6 rounded-full border-2 border-text-muted flex items-center justify-center"></div>
      </div>
    </div>
  </main>

  <!-- Sticky Footer de Facturación y Navegación -->
  <footer class="p-4 border-t border-light bg-bg-card sticky bottom-0 z-40 max-w-md mx-auto w-full">
    <div class="flex justify-between items-center mb-3">
      <div>
        <p class="text-text-secondary text-xs">Total del Servicio (1 items)</p>
        <p class="text-text-primary text-xl font-bold font-serif">$35.00 <span class="text-xs text-text-muted font-sans font-normal">(45 min)</span></p>
      </div>
      <button class="bg-gold text-bg-base font-semibold px-6 py-3 rounded-xl hover:bg-gold-hover transition-colors">
        Siguiente
      </button>
    </div>
  </footer>
</div>
```

#### Paso 2: Calendario de Disponibilidad
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col justify-between">
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-base/80 backdrop-blur-md sticky top-0 z-40">
    <button class="text-gold p-2 -ml-2">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
    </button>
    <span class="text-xl font-bold font-serif tracking-wider text-gold">Selecciona Fecha y Hora</span>
    <span class="text-xs text-text-secondary bg-bg-card border border-gold/20 px-3 py-1 rounded-full">Paso 2 de 3</span>
  </header>

  <main class="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
    <!-- Header Calendario (Mayo 2026) -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-serif text-gold-light">Mayo 2026</h2>
      <div class="flex gap-2">
        <button class="p-2 border border-gold/20 rounded-lg text-text-muted hover:text-gold"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
        <button class="p-2 border border-gold/20 rounded-lg text-text-primary hover:text-gold"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
      </div>
    </div>

    <!-- Calendario Grid (7 cols) -->
    <div class="grid grid-cols-7 gap-2 text-center text-sm font-semibold">
      <span class="text-text-muted">L</span><span class="text-text-muted">M</span><span class="text-text-muted">M</span>
      <span class="text-text-muted">J</span><span class="text-text-muted">V</span><span class="text-text-muted">S</span>
      <span class="text-text-muted">D</span>

      <!-- Fila 1 Vacía / Deshabilitados -->
      <span class="text-text-muted/20 py-2">27</span>
      <span class="text-text-muted/20 py-2">28</span>
      <span class="text-text-muted/20 py-2">29</span>
      <span class="text-text-muted/20 py-2">30</span>
      <span class="text-text-primary py-2 hover:bg-gold/10 rounded-lg cursor-pointer">1</span>
      <span class="text-text-primary py-2 hover:bg-gold/10 rounded-lg cursor-pointer">2</span>
      <span class="text-text-muted/40 py-2">3</span> <!-- Cerrado (Domingo) -->

      <!-- Semana Seleccionada -->
      <span class="text-text-primary py-2 rounded-lg cursor-pointer">4</span>
      <span class="text-text-primary py-2 rounded-lg cursor-pointer">5</span>
      <span class="text-text-primary py-2 rounded-lg cursor-pointer">6</span>
      <!-- Día Seleccionado -->
      <span class="bg-gold text-bg-base py-2 rounded-lg font-bold shadow-glow-sm">7</span>
      <span class="text-text-primary py-2 rounded-lg cursor-pointer">8</span>
      <span class="text-text-primary py-2 rounded-lg cursor-pointer">9</span>
      <span class="text-text-muted/40 py-2">10</span>
    </div>

    <!-- Bloque Slots Horarios -->
    <div class="space-y-3">
      <h3 class="text-lg font-semibold text-text-secondary">Horarios disponibles para el Jueves 7</h3>
      <div class="grid grid-cols-3 gap-2">
        <!-- Slot Seleccionado -->
        <button class="h-12 border-2 border-gold bg-gold/10 text-gold-light rounded-xl font-medium focus:ring-1 focus:ring-gold text-base">
          10:00 AM
        </button>
        <!-- Slot Disponible -->
        <button class="h-12 border border-gold/20 bg-bg-card text-text-primary rounded-xl font-medium hover:border-gold transition-colors text-base">
          11:30 AM
        </button>
        <!-- Slot Reservado / Deshabilitado -->
        <button disabled class="h-12 border border-light/5 bg-bg-card/40 text-text-muted rounded-xl cursor-not-allowed text-base line-through">
          01:00 PM
        </button>
        <button class="h-12 border border-gold/20 bg-bg-card text-text-primary rounded-xl font-medium hover:border-gold transition-colors text-base">
          03:00 PM
        </button>
      </div>
    </div>
  </main>

  <footer class="p-4 border-t border-light bg-bg-card max-w-md mx-auto w-full flex gap-3">
    <button class="w-1/3 h-12 border-2 border-gold/40 text-gold font-semibold rounded-xl">Volver</button>
    <button class="w-2/3 h-12 bg-gold text-bg-base font-semibold rounded-xl hover:bg-gold-hover shadow-gold-sm">Siguiente</button>
  </footer>
</div>
```

#### Paso 3: Formulario Nombre + Teléfono
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col justify-between">
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-base/80 backdrop-blur-md sticky top-0 z-40">
    <button class="text-gold p-2 -ml-2"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
    <span class="text-xl font-bold font-serif tracking-wider text-gold">Tus Datos</span>
    <span class="text-xs text-text-secondary bg-bg-card border border-gold/20 px-3 py-1 rounded-full">Paso 3 de 3</span>
  </header>

  <main class="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
    <div class="space-y-1">
      <h2 class="text-2xl font-serif text-gold-light">Detalles de Contacto</h2>
      <p class="text-text-secondary text-sm">No necesitas cuenta. Solo necesitamos tu nombre y WhatsApp para confirmar y enviarte recordatorios.</p>
    </div>

    <form class="space-y-4">
      <div class="flex flex-col gap-2">
        <label for="name" class="text-text-secondary text-sm font-medium">Nombre Completo</label>
        <input type="text" id="name" placeholder="Ej: Sofía Rodríguez" 
               class="w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-lg rounded-xl focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none" />
      </div>

      <div class="flex flex-col gap-2">
        <label for="phone" class="text-text-secondary text-sm font-medium">WhatsApp (Número Completo)</label>
        <input type="tel" id="phone" placeholder="Ej: +34 612 345 678" 
               class="w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-lg rounded-xl focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none" />
      </div>

      <div class="flex flex-col gap-2">
        <label for="notes" class="text-text-secondary text-sm font-medium">Notas Especiales (Opcional)</label>
        <textarea id="notes" placeholder="Ej: Tengo cabello teñido / Necesito cuidado especial por alergia..." rows="3"
               class="w-full p-4 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none placeholder:text-text-muted"></textarea>
      </div>
    </form>

    <!-- Resumen visual rápido de cita -->
    <div class="p-4 bg-bg-card border border-gold/10 rounded-xl space-y-2">
      <p class="text-xs text-text-muted uppercase tracking-wider font-semibold">Resumen del Turno</p>
      <div class="flex justify-between items-center">
        <span class="text-text-primary text-base font-semibold">Corte de Dama Estilo Parisino</span>
        <span class="text-gold font-semibold">$35.00</span>
      </div>
      <p class="text-sm text-text-secondary flex items-center gap-1">
        <svg class="w-4 h-4 text-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        Jueves 7 de Mayo a las 10:00 AM (45 min)
      </p>
    </div>
  </main>

  <footer class="p-4 border-t border-light bg-bg-card max-w-md mx-auto w-full">
    <button class="w-full h-12 bg-gold text-bg-base font-bold text-lg rounded-xl hover:bg-gold-hover shadow-gold-md transition-colors">
      Agendar Turno y Recibir WhatsApp
    </button>
  </footer>
</div>
```

#### Paso 4: Confirmación Exitosa
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col justify-between">
  <main class="flex-1 p-6 max-w-md mx-auto w-full flex flex-col items-center justify-center space-y-6 text-center">
    <!-- Icono Éxito Animado / Glow -->
    <div class="w-20 h-20 rounded-full bg-success/15 border border-success/40 flex items-center justify-center shadow-lg shadow-success/20">
      <svg class="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
    </div>

    <!-- Título y Mensaje -->
    <div class="space-y-2">
      <h1 class="text-3xl font-serif font-bold text-gold-light">¡Turno Agendado con Éxito!</h1>
      <p class="text-text-secondary text-base">Hola <span class="text-text-primary font-semibold">Sofía</span>, tu cita ha sido reservada correctamente en la agenda del salón.</p>
    </div>

    <!-- Ficha de Cita -->
    <div class="w-full p-5 bg-bg-card border border-gold/20 rounded-xl space-y-3 text-left">
      <div class="flex justify-between border-b border-light pb-2">
        <span class="text-text-secondary text-sm">Servicio:</span>
        <span class="text-text-primary text-base font-semibold">Corte de Dama Estilo Parisino</span>
      </div>
      <div class="flex justify-between border-b border-light pb-2">
        <span class="text-text-secondary text-sm">Fecha y Hora:</span>
        <span class="text-text-primary text-base font-semibold">Jueves 7 Mayo - 10:00 AM</span>
      </div>
      <div class="flex justify-between border-b border-light pb-2">
        <span class="text-text-secondary text-sm">Costo Estimado:</span>
        <span class="text-gold text-base font-bold">$35.00</span>
      </div>
      <div class="flex justify-between">
        <span class="text-text-secondary text-sm">Estado del Turno:</span>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/30">Pendiente de Confirmar</span>
      </div>
    </div>

    <div class="p-4 bg-gold/5 border border-gold/10 rounded-lg text-sm text-text-secondary w-full text-left">
      <p class="leading-relaxed">📌 **Políticas del Salón:** Te enviamos un mensaje a tu número de WhatsApp. Recuerda confirmar tu cita 24h antes por medio del mensaje para asegurar tu horario.</p>
    </div>
  </main>

  <footer class="p-6 max-w-md mx-auto w-full space-y-3">
    <!-- Botón chatear WhatsApp directamente en caso de dudas -->
    <a href="https://wa.me/..." target="_blank" class="w-full h-12 bg-success text-text-primary font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.982L2 22l5.233-1.371a9.936 9.936 0 004.779 1.229h.004c5.505 0 9.988-4.478 9.99-9.983A9.998 9.998 0 0012.012 2zm5.836 14.12c-.255.719-1.488 1.4-2.02 1.464-.482.057-1.112.083-3.23-.799-2.709-1.127-4.455-3.876-4.59-4.055-.136-.18-1.09-1.448-1.09-2.763 0-1.314.686-1.96.932-2.228.246-.267.537-.334.717-.334.179 0 .358.002.514.009.162.007.38-.063.593.447.22.528.75 1.83.815 1.964.064.133.106.289.018.466-.088.177-.132.289-.264.444-.132.155-.278.347-.396.466-.13.13-.264.272-.115.528.15.256.666 1.097 1.428 1.776.98.874 1.808 1.144 2.062 1.272.254.128.402.107.551-.064.148-.171.637-.739.807-1.018.17-.279.34-.233.573-.147.234.086 1.479.697 1.733.825.254.128.424.192.488.301.064.109.064.63-.191 1.349z"/></svg>
      ¿Dudas? Chatea con Nosotros
    </a>
    <a href="/" class="w-full h-12 bg-bg-card border border-light text-text-secondary font-medium rounded-xl flex items-center justify-center hover:bg-bg-elevated transition-colors">
      Volver a la Web Principal
    </a>
  </footer>
</div>
```

---

### 3.2. Consola de Administración (Admin PWA)

#### Login Seguro
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col justify-center items-center p-6">
  <div class="w-full max-w-md space-y-8 bg-bg-card border border-gold/25 p-8 rounded-2xl shadow-gold-md">
    <div class="text-center space-y-2">
      <span class="text-3xl font-serif font-bold text-gold tracking-widest">SalonOS</span>
      <h1 class="text-2xl font-semibold">Panel de Administración</h1>
      <p class="text-text-secondary text-sm">Ingresa tus credenciales para acceder a la agenda e inventario.</p>
    </div>

    <form class="space-y-6">
      <div class="flex flex-col gap-2">
        <label for="email" class="text-text-secondary text-sm font-medium">Correo Electrónico</label>
        <input type="email" id="email" required placeholder="tu@email.com" 
               class="w-full h-12 px-4 bg-bg-base border border-gold/20 text-text-primary text-lg rounded-xl focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none" />
      </div>

      <div class="flex flex-col gap-2">
        <label for="password" class="text-text-secondary text-sm font-medium">Contraseña</label>
        <input type="password" id="password" required placeholder="••••••••" 
               class="w-full h-12 px-4 bg-bg-base border border-gold/20 text-text-primary text-lg rounded-xl focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none" />
      </div>

      <button type="submit" class="w-full h-12 bg-gold text-bg-base font-bold text-lg rounded-xl hover:bg-gold-hover shadow-gold-sm transition-all duration-200">
        Iniciar Sesión
      </button>
    </form>
  </div>
</div>
```

#### Agenda del Día (Vista Principal Móvil)
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col">
  <!-- Header de la Consola -->
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-card sticky top-0 z-40">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-gold animate-pulse"></span>
      <span class="font-serif font-bold text-lg text-gold">SalonOS Admin</span>
    </div>
    <!-- Campana de Alertas de Stock e Incidencias -->
    <div class="relative cursor-pointer p-2 text-text-secondary hover:text-gold">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
      <!-- Indicador Alerta Roja Activa (Stock mínimo) -->
      <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-bg-card"></span>
    </div>
  </header>

  <!-- Cuerpo Agenda -->
  <main class="flex-1 p-4 space-y-4 pb-20">
    <!-- Selector rápido de fecha (Carrusel de días) -->
    <div class="flex justify-between items-center">
      <button class="text-gold p-1"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
      <span class="font-semibold text-text-primary text-base">Hoy, Jueves 7 de Mayo</span>
      <button class="text-gold p-1"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
    </div>

    <!-- Lista de Turnos Cronológica (Línea de tiempo) -->
    <div class="space-y-4">
      <!-- Tarjeta Turno Confirmado (Verde) -->
      <div class="p-4 bg-bg-card border-l-4 border-success rounded-xl flex items-center justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-text-primary text-sm font-semibold">10:00 - 10:45 AM</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/30">Confirmado</span>
          </div>
          <p class="text-base font-semibold text-text-primary">María Gómez</p>
          <p class="text-xs text-text-secondary">Corte de Dama Estilo Parisino • $35.00</p>
        </div>
        <button class="bg-bg-elevated border border-gold/20 text-gold text-sm font-medium px-4 py-2 rounded-lg hover:border-gold">Ver</button>
      </div>

      <!-- Tarjeta Turno Pendiente (Dorado) -->
      <div class="p-4 bg-bg-card border-l-4 border-gold rounded-xl flex items-center justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-text-primary text-sm font-semibold">11:30 AM - 01:30 PM</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold/10 text-gold border border-gold/30">Pendiente</span>
          </div>
          <p class="text-base font-semibold text-text-primary">Sofía Rodríguez</p>
          <p class="text-xs text-text-secondary">Balayage Tradicional • $95.00</p>
        </div>
        <div class="flex gap-2">
          <button class="bg-success text-bg-base text-xs font-semibold p-2 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg></button>
          <button class="bg-danger text-text-primary text-xs font-semibold p-2 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
      </div>

      <!-- Turno Completado (Dorado Oscuro) -->
      <div class="p-4 bg-bg-card/60 border-l-4 border-gold-hover rounded-xl flex items-center justify-between opacity-70">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-text-muted text-sm font-semibold">08:30 - 09:30 AM</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-hover/10 text-gold-hover border border-gold-hover/20">Completada</span>
          </div>
          <p class="text-base font-semibold text-text-muted">Estela Maris</p>
          <p class="text-xs text-text-muted">Lavado + Brushing • $20.00 (Efectivo)</p>
        </div>
        <span class="text-gold-hover text-xs font-semibold">Cerrado</span>
      </div>
    </div>
  </main>

  <!-- Botón Flotante para Agregar Cita Manual -->
  <button class="fixed right-6 bottom-20 w-14 h-14 bg-gold hover:bg-gold-hover text-bg-base rounded-full flex items-center justify-center shadow-lg shadow-gold/30 hover:scale-105 active:scale-95 transition-all duration-200 z-40">
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
  </button>

  <!-- Bottom Nav Fija (Mobile) -->
  <nav class="h-16 border-t border-light bg-bg-card fixed bottom-0 left-0 right-0 z-45 flex justify-around items-center text-text-secondary">
    <a href="#" class="flex flex-col items-center gap-1 text-gold">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      <span class="text-[10px] font-medium">Agenda</span>
    </a>
    <a href="#" class="flex flex-col items-center gap-1 hover:text-gold">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
      <span class="text-[10px] font-medium">Finanzas</span>
    </a>
    <a href="#" class="flex flex-col items-center gap-1 hover:text-gold">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
      <span class="text-[10px] font-medium">Clientes</span>
    </a>
    <a href="#" class="flex flex-col items-center gap-1 hover:text-gold">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
      <span class="text-[10px] font-medium">Inventario</span>
    </a>
  </nav>
</div>
```

#### Agenda Semanal (Tablet / Desktop o rotación móvil)
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col md:flex-row">
  <!-- Sidebar izquierdo (Desktop) -->
  <aside class="hidden lg:flex flex-col w-64 bg-bg-card border-r border-light p-4 space-y-6">
    <span class="text-2xl font-serif font-bold text-gold">SalonOS</span>
    <nav class="space-y-2">
      <a href="#" class="flex items-center gap-3 p-3 rounded-xl bg-gold/10 text-gold-light font-semibold">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        Agenda Semanal
      </a>
      <a href="#" class="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-elevated transition-colors text-text-secondary">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        Módulo Finanzas
      </a>
    </nav>
  </aside>

  <!-- Contenido Central -->
  <main class="flex-1 p-6 space-y-6">
    <!-- Header Agenda -->
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-serif text-gold-light">Semana del 4 al 10 de Mayo</h1>
      <div class="flex gap-2">
        <button class="bg-bg-card border border-gold/20 text-text-primary px-4 py-2 rounded-xl text-sm">Vista Día</button>
        <button class="bg-gold text-bg-base px-4 py-2 rounded-xl text-sm font-semibold">Vista Semana</button>
      </div>
    </div>

    <!-- Grid Semanal (7 columnas en desktop) -->
    <div class="grid grid-cols-7 gap-3 overflow-x-auto">
      <!-- Columna Lunes -->
      <div class="min-w-[120px] bg-bg-card rounded-xl border border-gold/10 p-3 space-y-3">
        <div class="text-center border-b border-light pb-2">
          <p class="text-xs text-text-secondary">Lunes 4</p>
          <span class="text-base font-bold text-gold">2 citas</span>
        </div>
        <!-- Cita 1 -->
        <div class="p-2 bg-success/10 border border-success/30 rounded-lg text-xs cursor-pointer hover:bg-success/20">
          <p class="font-bold text-success">09:00 - Ana P.</p>
          <p class="text-text-secondary">Brushing</p>
        </div>
        <!-- Cita 2 -->
        <div class="p-2 bg-gold/10 border border-gold/30 rounded-lg text-xs cursor-pointer">
          <p class="font-bold text-gold">11:00 - Luz G.</p>
          <p class="text-text-secondary">Color</p>
        </div>
      </div>

      <!-- Columna Martes -->
      <div class="min-w-[120px] bg-bg-card rounded-xl border border-gold/10 p-3 space-y-3">
        <div class="text-center border-b border-light pb-2">
          <p class="text-xs text-text-secondary">Martes 5</p>
          <span class="text-base font-bold text-gold">1 cita</span>
        </div>
        <div class="p-2 bg-success/10 border border-success/30 rounded-lg text-xs">
          <p class="font-bold text-success">15:00 - Celia R.</p>
          <p class="text-text-secondary">Corte</p>
        </div>
      </div>

      <!-- Columnas Miércoles, Jueves, Viernes, Sábado y Domingo siguen mismo patrón visual... -->
    </div>
  </main>
</div>
```

#### Modal de Completar Cita + Registrar Pago
```html
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
  <div class="w-full max-w-md bg-bg-elevated border border-gold/30 rounded-2xl p-6 space-y-6 shadow-gold-md">
    <!-- Header -->
    <div class="flex justify-between items-center pb-2 border-b border-light">
      <h3 class="text-2xl font-serif text-gold-light">Completar Turno y Cobro</h3>
      <button class="text-text-muted hover:text-gold"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
    </div>

    <!-- Formulario de Cobro -->
    <div class="space-y-4">
      <div class="p-4 bg-bg-base/50 border border-gold/10 rounded-xl">
        <p class="text-xs text-text-muted">CLIENTA</p>
        <p class="text-lg font-semibold">María Gómez</p>
        <p class="text-sm text-text-secondary">Corte de Dama Estilo Parisino</p>
      </div>

      <!-- Campo Monto Cobrado (editable) -->
      <div class="flex flex-col gap-2">
        <label for="amount" class="text-text-secondary text-sm font-medium">Monto a Cobrar ($)</label>
        <input type="number" id="amount" value="35.00" 
               class="w-full h-12 px-4 bg-bg-base border border-gold/20 text-text-primary text-xl font-bold rounded-xl focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none" />
      </div>

      <!-- Selector del Método de Pago -->
      <div class="flex flex-col gap-2">
        <label class="text-text-secondary text-sm font-medium">Método de Pago</label>
        <div class="grid grid-cols-3 gap-2">
          <!-- Efectivo -->
          <label class="border-2 border-gold bg-gold/10 text-gold-light rounded-xl h-12 flex items-center justify-center font-semibold cursor-pointer">
            <input type="radio" name="payment_method" value="cash" checked class="sr-only" />
            Efectivo
          </label>
          <!-- Transferencia -->
          <label class="border border-gold/20 hover:border-gold rounded-xl h-12 flex items-center justify-center font-semibold cursor-pointer text-text-primary">
            <input type="radio" name="payment_method" value="transfer" class="sr-only" />
            Transfer
          </label>
          <!-- Tarjeta -->
          <label class="border border-gold/20 hover:border-gold rounded-xl h-12 flex items-center justify-center font-semibold cursor-pointer text-text-primary">
            <input type="radio" name="payment_method" value="card" class="sr-only" />
            Tarjeta
          </label>
        </div>
      </div>
    </div>

    <!-- Botones Acciones -->
    <div class="flex flex-col gap-2">
      <button class="w-full h-12 bg-gold text-bg-base font-bold rounded-xl hover:bg-gold-hover shadow-gold-sm transition-colors">
        Registrar Cobro y Completar Turno
      </button>
      <button class="w-full h-10 bg-transparent text-text-secondary text-sm font-medium hover:text-text-primary transition-colors">
        Volver
      </button>
    </div>
  </div>
</div>
```

#### Dashboard Financiero con KPIs y Gráficas
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col pb-20">
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-card">
    <span class="font-serif font-bold text-lg text-gold">Módulo Financiero y Caja</span>
    <button class="bg-bg-elevated border border-gold/20 text-gold text-xs px-3 py-1.5 rounded-lg hover:border-gold">Exportar CSV</button>
  </header>

  <main class="p-4 space-y-6 max-w-md mx-auto w-full">
    <!-- Filtros de fecha rápidos -->
    <div class="flex gap-2">
      <button class="flex-1 bg-gold text-bg-base py-1.5 rounded-lg text-xs font-semibold">Mes Actual</button>
      <button class="flex-1 bg-bg-card border border-gold/20 text-text-secondary py-1.5 rounded-lg text-xs">Semana</button>
      <button class="flex-1 bg-bg-card border border-gold/20 text-text-secondary py-1.5 rounded-lg text-xs">Año</button>
    </div>

    <!-- Fila de KPI (Grid de tarjetas) -->
    <div class="grid grid-cols-1 gap-3">
      <!-- Tarjeta Ingresos -->
      <div class="p-4 bg-bg-card border border-gold/15 rounded-xl flex items-center justify-between">
        <div>
          <p class="text-xs text-text-secondary uppercase tracking-wider">Ingresos Totales</p>
          <p class="text-3xl font-serif font-bold text-gold-light">$1,240.00</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
        </div>
      </div>

      <!-- Tarjeta Gastos -->
      <div class="p-4 bg-bg-card border border-gold/15 rounded-xl flex items-center justify-between">
        <div>
          <p class="text-xs text-text-secondary uppercase tracking-wider">Gastos Totales</p>
          <p class="text-3xl font-serif font-bold text-danger">$340.00</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
        </div>
      </div>

      <!-- Tarjeta Neto -->
      <div class="p-4 bg-bg-card border-2 border-gold rounded-xl flex items-center justify-between shadow-glow">
        <div>
          <p class="text-xs text-text-secondary uppercase tracking-wider font-semibold">Rentabilidad Neta</p>
          <p class="text-3xl font-serif font-bold text-gold">$900.00</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      </div>
    </div>

    <!-- Gráfica Simplificada (Mini Barras en HTML/Tailwind) -->
    <div class="p-5 bg-bg-card border border-gold/10 rounded-xl space-y-4">
      <h3 class="text-lg font-serif text-gold-light">Ingresos vs Gastos Semanales</h3>
      <!-- Barras de Gráfica -->
      <div class="space-y-3">
        <!-- Lunes -->
        <div class="flex items-center gap-2">
          <span class="w-8 text-xs text-text-secondary">Sem 1</span>
          <div class="flex-1 h-6 bg-bg-base rounded-lg overflow-hidden flex">
            <div class="bg-gold h-full" style="width: 75%"></div>
            <div class="bg-danger h-full" style="width: 25%"></div>
          </div>
          <span class="text-xs font-semibold text-text-primary">$450</span>
        </div>
        <!-- Martes -->
        <div class="flex items-center gap-2">
          <span class="w-8 text-xs text-text-secondary">Sem 2</span>
          <div class="flex-1 h-6 bg-bg-base rounded-lg overflow-hidden flex">
            <div class="bg-gold h-full" style="width: 60%"></div>
            <div class="bg-danger h-full" style="width: 40%"></div>
          </div>
          <span class="text-xs font-semibold text-text-primary">$380</span>
        </div>
      </div>
    </div>
    
    <!-- Botón para Registrar Gasto Manual Directo -->
    <button class="w-full h-12 bg-transparent border border-gold/30 text-gold font-semibold rounded-xl hover:bg-gold/5 flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      Registrar Gasto Administrativo
    </button>
  </main>
</div>
```

#### Directorio de Clientas con Buscador
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col pb-20">
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-card">
    <h1 class="font-serif font-bold text-lg text-gold">Base de Clientas</h1>
    <span class="text-xs bg-gold/10 text-gold border border-gold/20 px-2.5 py-1 rounded-full font-medium">42 Registradas</span>
  </header>

  <main class="p-4 space-y-4 max-w-md mx-auto w-full">
    <!-- Buscador en Tiempo Real -->
    <div class="relative">
      <input type="text" placeholder="Buscar por nombre o teléfono..." 
             class="w-full h-12 pl-11 pr-4 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none" />
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>
    </div>

    <!-- Lista de Clientas -->
    <div class="space-y-3">
      <!-- Ficha Clienta -->
      <div class="p-4 bg-bg-card border border-gold/15 hover:border-gold/30 rounded-xl flex items-center justify-between cursor-pointer transition-colors duration-200">
        <div class="space-y-1">
          <p class="text-lg font-semibold text-text-primary">María Gómez</p>
          <p class="text-sm text-text-secondary">+34 612 345 678</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-success bg-success/5 border border-success/15 px-2 py-0.5 rounded">12 Citas</span>
            <span class="text-xs text-danger bg-danger/5 border border-danger/15 px-2 py-0.5 rounded">0 No-Show</span>
          </div>
        </div>
        <span class="text-gold text-sm"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></span>
      </div>

      <!-- Ficha Clienta con Riesgo de No-show -->
      <div class="p-4 bg-bg-card border border-gold/15 rounded-xl flex items-center justify-between cursor-pointer">
        <div class="space-y-1">
          <p class="text-lg font-semibold text-text-primary">Sofía Rodríguez</p>
          <p class="text-sm text-text-secondary">+34 699 888 777</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-success bg-success/5 border border-success/15 px-2 py-0.5 rounded">3 Citas</span>
            <span class="text-xs text-danger bg-danger/10 border border-danger/30 px-2 py-0.5 rounded-full font-bold">2 No-Shows ⚠️</span>
          </div>
        </div>
        <span class="text-gold text-sm"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></span>
      </div>
    </div>
  </main>
</div>
```

#### Ficha Individual de Clienta con Historial
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col pb-20">
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-card">
    <button class="text-gold p-2 -ml-2"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
    <span class="font-serif font-bold text-lg text-gold">Perfil de Clienta</span>
    <button class="text-gold text-sm font-semibold">Editar</button>
  </header>

  <main class="p-4 space-y-6 max-w-md mx-auto w-full">
    <!-- Información Principal -->
    <div class="p-5 bg-bg-card border border-gold/25 rounded-2xl space-y-3 text-center">
      <div class="w-16 h-16 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold mx-auto text-2xl font-serif">
        MG
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-text-primary">María Gómez</h2>
        <p class="text-sm text-text-secondary">+34 612 345 678</p>
      </div>
      <p class="text-xs text-text-muted">Registrada el: 12 Enero 2026</p>
    </div>

    <!-- Notas Técnicas Exclusivas (Tintes, etc.) -->
    <div class="p-4 bg-bg-card border border-gold/15 rounded-xl space-y-2">
      <h3 class="text-sm font-semibold text-gold-light uppercase tracking-wider">Notas Técnicas del Estilista</h3>
      <textarea readonly class="w-full p-3 bg-bg-base border border-gold/10 text-text-primary text-sm rounded-lg resize-none focus:outline-none">Tono de tintura habitual: Mezcla 7.3 (dorado) + 8.1 (ceniza) a 20 volúmenes. Prefiere champú sin sulfatos por cuero cabelludo sensible.</textarea>
    </div>

    <!-- Historial de Turnos -->
    <div class="space-y-3">
      <h3 class="text-lg font-serif text-text-primary">Historial de Turnos</h3>

      <!-- Registro Completado -->
      <div class="p-3 bg-bg-card border border-light/10 rounded-xl flex justify-between items-center">
        <div>
          <p class="text-sm font-semibold">Corte + Balayage</p>
          <p class="text-xs text-text-secondary">22 Mayo 2026 • Estela M.</p>
        </div>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-hover/10 text-gold-hover border border-gold-hover/20">Completada</span>
      </div>

      <!-- Registro Cancelado -->
      <div class="p-3 bg-bg-card border border-light/5 rounded-xl flex justify-between items-center opacity-70">
        <div>
          <p class="text-sm font-semibold text-text-muted">Peinado de Novia</p>
          <p class="text-xs text-text-muted">10 Abril 2026 • Sin Asignar</p>
        </div>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">Cancelada</span>
      </div>
    </div>
  </main>
</div>
```

#### Tablero de Inventario Semafórico
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col pb-20">
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-card">
    <h1 class="font-serif font-bold text-lg text-gold">Control de Inventario</h1>
    <!-- Botón para Registrar Compra Insumos -->
    <button class="bg-gold text-bg-base font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-gold-hover">Registrar Compra</button>
  </header>

  <main class="p-4 space-y-4 max-w-md mx-auto w-full">
    <!-- Buscador e Indicador de Filtros -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <input type="text" placeholder="Buscar insumo o marca..." 
               class="w-full h-11 pl-10 pr-4 bg-bg-card border border-gold/20 text-text-primary text-sm rounded-xl focus:outline-none focus:border-gold" />
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>
      <select class="bg-bg-card border border-gold/20 text-text-primary px-2 rounded-xl text-xs focus:outline-none">
        <option>Todos</option>
        <option>Verde (OK)</option>
        <option>Amarillo (Bajo)</option>
        <option>Rojo (Sin Stock)</option>
      </select>
    </div>

    <!-- Lista de Insumos Semafórica -->
    <div class="space-y-3">
      <!-- Item Stock OK (Verde) -->
      <div class="p-4 bg-bg-card border border-gold/15 rounded-xl flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-base font-semibold text-text-primary">Tinte Igora Royal 7.3</p>
          <p class="text-xs text-text-secondary">Marca: Schwarzkopf • Prov: SuperSalón</p>
          <p class="text-xs text-text-muted">Stock actual: 12 unidades (Mín: 3)</p>
        </div>
        <div class="flex items-center gap-1 bg-success/15 border border-success/20 px-3 py-1 rounded-full text-xs font-semibold text-success">
          <span class="w-2 h-2 rounded-full bg-success"></span> OK
        </div>
      </div>

      <!-- Item Stock Bajo (Amarillo) -->
      <div class="p-4 bg-bg-card border border-gold/25 rounded-xl flex items-center justify-between shadow-gold-sm">
        <div class="space-y-1">
          <p class="text-base font-semibold text-text-primary">Decolorante Blondme 450g</p>
          <p class="text-xs text-text-secondary">Marca: Schwarzkopf • Prov: Salerm</p>
          <p class="text-xs text-text-muted">Stock actual: 1 pote (Mín: 2)</p>
        </div>
        <div class="flex items-center gap-1 bg-gold/15 border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold text-gold animate-pulse">
          <span class="w-2 h-2 rounded-full bg-gold"></span> Bajo
        </div>
      </div>

      <!-- Item Sin Stock (Rojo) -->
      <div class="p-4 bg-bg-card border border-danger/30 rounded-xl flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-base font-semibold text-text-primary">Champú Post-Color 1000ml</p>
          <p class="text-xs text-text-secondary">Marca: L'Oréal Professional • Prov: SuperSalón</p>
          <p class="text-xs text-text-muted font-semibold text-danger">Stock actual: 0 botellas (Mín: 2)</p>
        </div>
        <div class="flex items-center gap-1 bg-danger/15 border border-danger/20 px-3 py-1 rounded-full text-xs font-semibold text-danger">
          <span class="w-2 h-2 rounded-full bg-danger"></span> Sin Stock
        </div>
      </div>
    </div>
  </main>
</div>
```

#### Registro de Compra a Proveedor
```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col pb-20">
  <header class="h-16 px-4 border-b border-light flex items-center justify-between bg-bg-card">
    <button class="text-gold p-2 -ml-2"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
    <span class="font-serif font-bold text-lg text-gold">Registrar Compra Insumos</span>
    <span class="w-6"></span> <!-- Spacer -->
  </header>

  <main class="p-4 space-y-6 max-w-md mx-auto w-full">
    <!-- Formulario Datos Generales de Compra -->
    <div class="space-y-4">
      <div class="flex flex-col gap-2">
        <label for="supplier" class="text-text-secondary text-sm font-medium">Seleccionar Proveedor</label>
        <select id="supplier" class="w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl focus:outline-none">
          <option value="1">SuperSalón Distribuidora</option>
          <option value="2">Salerm Cosméticos</option>
        </select>
      </div>

      <div class="flex flex-col gap-2">
        <label for="purchase-date" class="text-text-secondary text-sm font-medium">Fecha de la Compra</label>
        <input type="date" id="purchase-date" value="2026-05-20"
               class="w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl focus:outline-none" />
      </div>
    </div>

    <!-- Listado Dinámico de Items a Comprar -->
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="text-base font-semibold text-text-secondary uppercase tracking-wider">Productos Adquiridos</h3>
        <button class="text-gold text-xs font-bold hover:underline">+ Agregar Producto</button>
      </div>

      <!-- Item Compra 1 -->
      <div class="p-4 bg-bg-card border border-gold/10 rounded-xl space-y-3">
        <div class="flex justify-between items-start">
          <div class="flex-1 pr-2">
            <select class="w-full h-10 px-2 bg-bg-base border border-gold/10 text-text-primary text-sm rounded-lg">
              <option>Tinte Igora Royal 7.3</option>
              <option>Decolorante Blondme 450g</option>
            </select>
          </div>
          <button class="text-danger p-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <!-- Cantidad -->
          <div class="flex flex-col gap-1">
            <label class="text-text-muted text-xs">Cantidad</label>
            <input type="number" value="5" class="w-full h-10 px-3 bg-bg-base border border-gold/10 text-text-primary text-sm rounded-lg text-center" />
          </div>
          <!-- Costo Unitario -->
          <div class="flex flex-col gap-1">
            <label class="text-text-muted text-xs">Costo Unitario ($)</label>
            <input type="number" value="4.50" class="w-full h-10 px-3 bg-bg-base border border-gold/10 text-text-primary text-sm rounded-lg text-right" />
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen y Gasto Automático Alert -->
    <div class="p-4 bg-gold/5 border border-gold/20 rounded-xl space-y-2">
      <div class="flex justify-between items-center">
        <span class="text-text-secondary text-sm">Gasto Total Estimado:</span>
        <span class="text-gold text-lg font-bold font-serif">$22.50</span>
      </div>
      <p class="text-[11px] text-text-muted leading-relaxed">⚠️ **Nota:** Al confirmar, se incrementará el stock del catálogo y se generará un registro de egreso inmediato de $22.50 en el Balance de Finanzas categorizado como "Insumos".</p>
    </div>

    <button class="w-full h-12 bg-gold text-bg-base font-bold rounded-xl hover:bg-gold-hover shadow-gold-sm transition-colors">
      Confirmar Compra y Registrar Gasto
    </button>
  </main>
</div>
```

---

### 3.3. Web Pública (Landing Page de Marketing)

#### Layout de Landing Completa
```html
<div class="bg-bg-base text-text-primary min-h-screen selection:bg-gold selection:text-bg-base">
  <!-- Navbar Web Pública -->
  <nav class="h-20 px-6 border-b border-light/10 bg-bg-base/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
    <span class="text-2xl font-serif font-bold text-gold tracking-widest">SalonOS</span>
    <!-- Botón Reservar en Header -->
    <a href="/reservar" class="bg-gold hover:bg-gold-hover text-bg-base font-bold text-sm px-5 py-2.5 rounded-full shadow-gold-sm transition-all">
      Reservar Cita
    </a>
  </nav>

  <!-- SECCIÓN 1: HERO -->
  <section class="relative py-20 px-6 text-center max-w-4xl mx-auto space-y-8">
    <div class="space-y-4">
      <span class="text-xs uppercase tracking-widest text-gold-light font-semibold">Exclusividad & Cuidado Capilar</span>
      <h1 class="text-4xl sm:text-6xl font-serif font-bold leading-tight tracking-tight text-text-primary">
        El Arte del Estilo en tus Manos
      </h1>
      <p class="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
        Un espacio de lujo unipersonal donde cada corte, color y tratamiento es una obra de arte diseñada exclusivamente para ti.
      </p>
    </div>
    <div class="flex justify-center">
      <a href="/reservar" class="h-14 px-10 bg-gold text-bg-base font-bold text-lg rounded-full flex items-center justify-center hover:bg-gold-hover shadow-gold-md transition-transform hover:scale-105 active:scale-95 duration-200">
        Reserva tu Experiencia Ahora
      </a>
    </div>
  </section>

  <!-- SECCIÓN 2: SERVICIOS CON PRECIOS -->
  <section class="py-16 px-6 bg-bg-card border-y border-gold/10">
    <div class="max-w-4xl mx-auto space-y-8">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-serif font-bold text-gold">Nuestros Servicios Exclusivos</h2>
        <p class="text-text-secondary text-sm">Precios transparentes y duración estimada.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Servicio Card -->
        <div class="p-6 bg-bg-base border border-gold/15 rounded-2xl flex justify-between items-center">
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-text-primary">Corte & Styling</h3>
            <p class="text-xs text-text-secondary">Incluye lavado premium, peinado y asesoría.</p>
            <p class="text-xs text-text-muted">45 minutos</p>
          </div>
          <span class="text-xl font-serif font-bold text-gold">$35.00</span>
        </div>
        <!-- Servicio Card -->
        <div class="p-6 bg-bg-base border border-gold/15 rounded-2xl flex justify-between items-center">
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-text-primary">Balayage / Iluminación</h3>
            <p class="text-xs text-text-secondary">Técnica de decoloración a mano alzada francesa.</p>
            <p class="text-xs text-text-muted">120 minutos</p>
          </div>
          <span class="text-xl font-serif font-bold text-gold">$95.00</span>
        </div>
      </div>
    </div>
  </section>

  <!-- SECCIÓN 3: GALERÍA DE TRABAJOS -->
  <section class="py-16 px-6 max-w-4xl mx-auto space-y-8">
    <div class="text-center space-y-2">
      <h2 class="text-3xl font-serif font-bold text-gold">Galería de Trabajos</h2>
      <p class="text-text-secondary text-sm">Descubre las últimas tendencias y transformaciones de nuestras clientas.</p>
    </div>

    <!-- Mosaico Grid Responsivo -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div class="aspect-square bg-bg-card rounded-xl overflow-hidden border border-gold/20 relative group cursor-pointer">
        <!-- Mock de imagen real cargada de Railway/Cloudinary -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="text-xs text-gold font-medium">Balayage Rubio Ceniza</span>
        </div>
        <!-- Placeholder o Imagen real cargada -->
        <div class="w-full h-full bg-cover bg-center bg-[url('/img/balayage_demo.webp')]"></div>
      </div>
      <!-- Repetir mosaico con diferentes trabajos... -->
    </div>
  </section>

  <!-- SECCIÓN 4: CONTACTO Y UBICACIÓN -->
  <section class="py-16 px-6 bg-bg-card border-t border-gold/10">
    <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div class="space-y-4">
        <h2 class="text-3xl font-serif font-bold text-gold">Ubicación & Contacto</h2>
        <p class="text-text-secondary text-sm leading-relaxed">
          Te esperamos en un entorno privado y relajante en el corazón de la ciudad. Solo atendemos con cita previa.
        </p>
        <div class="space-y-2 text-sm text-text-primary">
          <p class="flex items-center gap-2">📍 Gran Vía 45, Piso 2, Madrid</p>
          <p class="flex items-center gap-2">📞 +34 612 345 678</p>
          <p class="flex items-center gap-2">✉️ contacto@salonos.app</p>
        </div>
      </div>
      <!-- Mapa Embed -->
      <div class="w-full h-64 bg-bg-base border border-gold/20 rounded-2xl overflow-hidden shadow-gold-sm">
        <!-- Google Maps iframe embed real -->
        <div class="w-full h-full flex items-center justify-center text-text-muted text-xs">
          [Google Maps Interactivo Integrado]
        </div>
      </div>
    </div>
  </section>

  <!-- Footer general -->
  <footer class="py-8 text-center text-xs text-text-muted border-t border-light/5">
    <p>© 2026 SalonOS. Todos los derechos reservados. Diseñado para salones boutique.</p>
  </footer>
</div>
```

---

## 4. Guía de Accesibilidad (Accessibility Guidelines - WCAG 2.1 AA)

La aplicación debe ser inclusiva para personas de todas las edades. Las siguientes reglas son estrictas y obligatorias en la implementación de código:

### 4.1. Contraste de Colores WCAG 2.1 AA
*   **Texto Principal:** El color del texto principal (`#F5F5F5` / blanco roto) proporciona una relación de contraste superior a **10:1** sobre el fondo de base (`#0F0F0F`) y las tarjetas (`#1A1A1A`), superando el mínimo requerido de **4.5:1** para texto normal.
*   **Texto Secundario:** El color `#A0A0A0` tiene un contraste de **4.8:1** sobre `#1A1A1A`. Es el límite permitido para textos pequeños. **Nunca usar grises más claros o descoloridos para texto informativo o de etiquetas.**
*   **Texto Dorado:** El dorado principal (`#D4AF37`) sobre fondo oscuro base (`#0F0F0F`) tiene un contraste de **5.4:1**, lo que garantiza legibilidad óptima.
*   **Bordes:** Los bordes dorados translúcidos son decorativos (`rgba(212,175,55,0.2)`). Si delimitan campos interactivos (inputs), el borde focus cambia a sólido `#D4AF37` con resplandor, satisfaciendo el contraste de indicador de foco de **3:1**.

### 4.2. Tamaños Táctiles Mínimos (Touch Target Sizes)
*   Cualquier botón interactivo, enlace en barra de navegación o celda clickeable del calendario debe tener una dimensión mínima de **48px x 48px** (según directrices de Android/iOS y WCAG).
*   Si un botón de icono requiere un aspecto pequeño en pantalla, se debe implementar padding invisible para ampliar el área interactiva:
    ```html
    <!-- Botón de icono con área interactiva extendida mediante p-3 -->
    <button class="p-3 -m-3 text-text-secondary hover:text-gold focus:outline-none">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">...</svg>
    </button>
    ```

### 4.3. Tamaños de Fuente y Prevención de Zoom Automático
*   **Tamaño de Texto en Cuerpo (Body):** El tamaño mínimo para textos informativos y párrafos generales en dispositivos móviles es **16px** (`text-base`).
*   **Tamaño de Inputs y Selectores:** Para evitar que navegadores móviles (especialmente Safari en iOS) fuercen un comportamiento de zoom táctil automático al enfocar un campo, los inputs y selects deben tener un tamaño de fuente mínimo de **18px** (`text-lg`) y una altura de **48px** (`h-12`).

### 4.4. Espaciado entre Elementos
*   Evitar agrupar botones o campos interactivos estrechamente. En dispositivos móviles, un espacio incorrecto genera clics accidentales (especialmente en adultos mayores). 
*   Separar campos de formularios por al menos **16px** (`space-y-4` / `gap-4`).
*   Los botones primario y secundario en modales o pies de página deben tener una separación mínima de **12px** (`gap-3`).

### 4.5. Marcado Semántico y ARIA
*   Todos los inputs deben estar asociados a su respectivo `<label>` utilizando el atributo `for` e `id` idéntico.
*   Los botones de iconos que no contienen texto descriptivo deben incluir `aria-label`:
    ```html
    <button aria-label="Agregar cita manual" class="w-12 h-12 bg-gold rounded-full">...</button>
    ```
*   Usar roles semánticos (`<main>`, `<header>`, `<nav>`, `<aside>`, `<footer>`) para una correcta lectura por lectores de pantalla.

---

## 5. Guía de Adaptabilidad (Responsive & Layout Strategy)

SalonOS se diseña bajo la metodología **Mobile First**, garantizando una experiencia de usuario sobresaliente en la resolución base y expandiéndose de forma progresiva en pantallas mayores.

### 5.1. Resoluciones de Diseño y Breakpoints
*   **Mobile Base (375px):** El diseño de la aplicación PWA y el flujo de clienta se conciben al 100% para esta resolución. Los anchos de los contenedores son flexibles (`w-full`), restringidos por un ancho máximo de **430px** (`max-w-md mx-auto`) para que la interfaz se asemeje a una aplicación nativa.
*   **Tablet Breakpoint (768px - `md:`):** El panel de administración reorganiza los grids de una sola columna a dos columnas (ej. Dashboard y Directorio de clientes).
*   **Desktop Breakpoint (1024px - `lg:`):** El panel de la administradora se transforma en un layout de pantalla completa. La barra de navegación inferior móvil (`Bottom Nav`) se oculta (`hidden`) y se despliega un panel lateral de navegación izquierdo (`Sidebar`) fijo de 64px a 256px de ancho, permitiendo la visualización cómoda de la agenda semanal.

### 5.2. Estrategia de Layout para el Panel de Administradora
Para lograr la transición fluida de navegación móvil a barra lateral en escritorio en React, se implementa el siguiente esquema responsive de rejilla:

```html
<div class="min-h-screen bg-bg-base text-text-primary flex flex-col lg:flex-row">
  <!-- Sidebar Fijo (Visible en Desktop >= 1024px) -->
  <aside class="hidden lg:flex flex-col w-64 bg-bg-card border-r border-gold/15 p-6 space-y-6">
    <!-- Logotipo y Enlaces del Panel -->
  </aside>

  <!-- Contenedor Principal (Flex-1) -->
  <div class="flex-1 flex flex-col min-h-screen justify-between">
    <!-- Header (Móvil y Desktop) -->
    <header class="h-16 px-4 border-b border-light/10 bg-bg-card flex items-center justify-between">
      <!-- Elementos del header -->
    </header>

    <!-- Contenido Scrollable de la Vista Activa -->
    <main class="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto">
      <!-- Render Dinámico de Páginas (Dashboard/Agenda/Inventario) -->
    </main>

    <!-- Bottom Nav (Oculta en Desktop >= 1024px, Fijo en móvil) -->
    <nav class="lg:hidden h-16 border-t border-light/10 bg-bg-card fixed bottom-0 left-0 right-0 flex justify-around items-center">
      <!-- Iconos de Navegación -->
    </nav>
  </div>
</div>
```

---

## 6. Animaciones y Micro-interacciones

El lujo se percibe en los detalles. Se implementan transiciones de estado e interacciones sutiles para elevar la percepción de calidad de la PWA.

### 6.1. Efectos de Hover y Foco (Transitions)
*   **Hover en Tarjetas (Cards):** Al pasar el cursor por encima, el borde dorado translúcido aumenta su opacidad suavemente.
    `transition-all duration-300 hover:border-gold/30 hover:scale-[1.01]`
*   **Active Click (Feedback háptico simulado):** Todos los botones deben reducir ligeramente su escala al ser presionados en móvil, emulando la pulsación física de un dispositivo.
    `active:scale-[0.98] transition-transform duration-100`

### 6.2. Entrada de Vistas y Modales
*   **Fade y slide en Modales:** Los modales no deben aparecer abruptamente. Se deslizan desde la parte inferior y ganan opacidad durante 200-300ms.
    `animate-in fade-in slide-in-from-bottom duration-300`
*   **Notificaciones Toasts:** Entran desde la derecha inferior y salen automáticamente tras 4 segundos.
    `animate-slide-in` (definido con `@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`)
