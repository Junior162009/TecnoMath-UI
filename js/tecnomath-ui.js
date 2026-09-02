(() => {
  'use strict';

  const THEME_KEY = 'tecnomath:theme';
  const root = document.documentElement;

  function getSystemTheme() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function saveTheme(value) {
    try { localStorage.setItem(THEME_KEY, value); } catch (_) { /* storage may be blocked */ }
  }

  function readSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function applyTheme(theme, persist = true) {
    const value = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = value;
    root.style.colorScheme = value;

    // body puede no existir todavía cuando el script se carga.
    if (document.body) document.body.classList.toggle('tm-dark', value === 'dark');

    if (persist) saveTheme(value);

    document.querySelectorAll('[data-tm-theme-toggle]').forEach((button) => {
      const isDark = value === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      button.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      button.textContent = isDark ? '☀️ Claro' : '🌙 Oscuro';
    });
  }

  function initTheme() {
    const saved = readSavedTheme();
    applyTheme(saved || getSystemTheme(), false);

    document.querySelectorAll('[data-tm-theme-toggle]').forEach((button) => {
      if (button.dataset.tmThemeReady === 'true') return;
      button.dataset.tmThemeReady = 'true';
      button.addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next, true);
      });
    });

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener?.('change', (event) => {
      // Si el usuario eligió manualmente un tema, respetarlo.
      if (!readSavedTheme()) applyTheme(event.matches ? 'dark' : 'light', false);
    });
  }

  function syncBodyTheme() {
    if (root.dataset.theme === 'dark') document.body.classList.add('tm-dark');
    else document.body.classList.remove('tm-dark');
  }

  function toast(message, type = 'info', duration = 3200) {
    let container = document.querySelector('.tm-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'tm-toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    const item = document.createElement('div');
    item.className = `tm-toast tm-alert-${type}`;
    item.setAttribute('role', 'status');
    item.textContent = message;
    container.appendChild(item);
    window.setTimeout(() => item.remove(), duration);
  }

  function initModals() {
    document.querySelectorAll('[data-tm-modal-open]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const modal = document.getElementById(trigger.dataset.tmModalOpen);
        if (modal) modal.classList.add('is-open');
      });
    });
    document.querySelectorAll('[data-tm-modal-close]').forEach((trigger) => {
      trigger.addEventListener('click', () => trigger.closest('.tm-modal')?.classList.remove('is-open'));
    });
    document.querySelectorAll('.tm-modal').forEach((modal) => {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) modal.classList.remove('is-open');
      });
    });
  }

  function initDropdowns() {
    document.querySelectorAll('[data-tm-dropdown-toggle]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const dropdown = trigger.closest('.tm-dropdown');
        document.querySelectorAll('.tm-dropdown.is-open').forEach((item) => {
          if (item !== dropdown) item.classList.remove('is-open');
        });
        dropdown?.classList.toggle('is-open');
      });
    });
    document.addEventListener('click', () => document.querySelectorAll('.tm-dropdown.is-open').forEach((item) => item.classList.remove('is-open')));
  }

  function initTabs() {
    document.querySelectorAll('[data-tm-tabs]').forEach((tabs) => {
      const buttons = tabs.querySelectorAll('[data-tm-tab]');
      const panels = tabs.querySelectorAll('[data-tm-panel]');
      buttons.forEach((button) => button.addEventListener('click', () => {
        const target = button.dataset.tmTab;
        buttons.forEach((item) => item.classList.toggle('is-active', item === button));
        panels.forEach((panel) => { panel.hidden = panel.dataset.tmPanel !== target; });
      }));
    });
  }

  function initProgress() {
    document.querySelectorAll('[data-tm-progress]').forEach((bar) => {
      const value = Math.max(0, Math.min(100, Number(bar.dataset.tmProgress) || 0));
      bar.style.width = `${value}%`;
      bar.setAttribute('aria-valuenow', String(value));
    });
  }

  function initSidebar() {
    document.querySelectorAll('[data-tm-sidebar-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.tmSidebarToggle);
        target?.classList.toggle('is-open');
        button.setAttribute('aria-expanded', String(target?.classList.contains('is-open')));
      });
    });
  }

  window.TecnoMathUI = { applyTheme, toast, initModals, initDropdowns, initTabs, initProgress, initSidebar };
  document.addEventListener('DOMContentLoaded', () => {
    syncBodyTheme();
    initTheme(); initModals(); initDropdowns(); initTabs(); initProgress(); initSidebar();
  });
})();
