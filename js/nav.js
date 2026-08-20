/**
 * js/nav.js
 * Compartilhado por todas as páginas: menu mobile (abrir/fechar) e ano do rodapé.
 */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = document.getElementById('navToggle');
  const navHeader = document.querySelector('header.nav');
  if (navToggle && navHeader) {
    navToggle.addEventListener('click', () => {
      const isOpen = navHeader.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.querySelectorAll('#navMobilePanel a').forEach((a) => {
      a.addEventListener('click', () => {
        navHeader.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
