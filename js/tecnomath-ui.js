(() => {
  'use strict';

  const THEME_KEY = 'tecnomath:theme';

  function applyTheme(theme) {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    document.body.classList.toggle('tm-dark', value === 'dark');
    localStorage.setItem(THEME_KEY, value);
    document.querySelectorAll('[data-tm-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(value === 'dark'));
      button.textContent = value === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || preferred);
    document.querySelectorAll('[data-tm-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    });
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
    initTheme(); initModals(); initDropdowns(); initTabs(); initProgress(); initSidebar();
  });
})();
