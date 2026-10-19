const header = document.querySelector('[data-header]');
const reveals = document.querySelectorAll('.reveal');

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

// Navigation wraps differently by language and viewport. Reserve its actual
// height rather than a large fixed gap above every page and anchor.
const updateHeaderHeight = () => {
  if (header) document.documentElement.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
};
updateHeaderHeight();
if (header && 'ResizeObserver' in window) new ResizeObserver(updateHeaderHeight).observe(header);
else window.addEventListener('resize', updateHeaderHeight, { passive: true });

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 16);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((node) => {
    node.classList.add('reveal-pending');
    observer.observe(node);
  });
} else {
  reveals.forEach((node) => node.classList.add('visible'));
}
