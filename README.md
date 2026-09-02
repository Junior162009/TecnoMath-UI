# TecnoMath UI

Sistema visual reutilizable para TecnoMath y sus juegos web.

## Estructura

- `css/tecnomath-ui.css` — variables, tipografía, botones, tarjetas, formularios y utilidades.
- `css/components.css` — paneles, estadísticas, tablas, modales, alertas, avatares y toasts.
- `css/responsive.css` — utilidades responsive para móvil y tablet.
- `css/themes.css` — soporte de tema claro/oscuro.
- `js/tecnomath-ui.js` — tema, toasts, modales, navegación, tabs y progreso.

## Uso

Incluye las hojas CSS y el JS en cualquier página.

Ejemplo de botón:

```html
<a class="tm-btn tm-btn-primary" href="#">🎮 Jugar</a>
```

Ejemplo de tarjeta:

```html
<section class="tm-card">
  <h2 class="tm-title">Mi progreso</h2>
  <p class="tm-muted">Continúa tu aventura matemática.</p>
</section>
```

Botón de tema:

```html
<button class="tm-theme-toggle" data-tm-theme-toggle aria-pressed="false">🌙 Oscuro</button>
```

## Principios

1. No reemplazar estilos existentes de los juegos de forma destructiva.
2. Adoptar los componentes de forma progresiva.
3. Mantener accesibilidad, responsive y soporte para movimiento reducido.
4. Centralizar decisiones visuales para que TecnoMath tenga una identidad consistente.

> CI: prueba de despliegue de GitHub Pages.
