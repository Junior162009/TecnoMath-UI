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

  window.TecnoMathUI = { applyTheme, toast, initModals };
  document.addEventListener('DOMContentLoaded', () => { initTheme(); initModals(); });
})();
