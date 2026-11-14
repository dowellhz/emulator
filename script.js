const header = document.querySelector('[data-header]');
const menuToggle = header?.querySelector('[data-nav-toggle]');
const menu = document.getElementById(menuToggle?.getAttribute('aria-controls') || 'site-nav');
const desktop = window.matchMedia('(min-width: 901px)');

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

// Keep content readable immediately, including long guide sections and anchors.
document.querySelectorAll('.reveal').forEach((node) => node.classList.add('visible'));

// The measured header also accommodates translated navigation and larger type.
const updateHeaderHeight = () => {
  if (header) document.documentElement.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
};
updateHeaderHeight();
if (header && 'ResizeObserver' in window) new ResizeObserver(updateHeaderHeight).observe(header);
else window.addEventListener('resize', updateHeaderHeight, { passive: true });

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 16);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (header && menuToggle && menu) {
  const setMenuOpen = (open, restoreFocus = false) => {
    header.classList.toggle('nav-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    if (restoreFocus) menuToggle.focus();
  };

  menuToggle.addEventListener('click', () => {
    setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('nav-open')) {
      setMenuOpen(false, true);
    }
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setMenuOpen(false);
  });
  desktop.addEventListener('change', () => {
    // A focused desktop link must not disappear when the mobile menu collapses.
    const restoreFocus = !desktop.matches && menu.contains(document.activeElement);
    setMenuOpen(false, restoreFocus);
    updateHeaderHeight();
  });
  setMenuOpen(false);
}

document.querySelectorAll('[data-showcase]').forEach((showcase) => {
  const tabs = [...showcase.querySelectorAll('[role="tab"][data-showcase-tab]')];
  const entries = tabs.map((tab) => ({
    tab,
    panel: document.getElementById(tab.getAttribute('aria-controls')),
  }));
  // Incomplete markup falls back to the fully visible, non-scripted gallery.
  if (!entries.length || entries.some(({ panel }) => !panel || !showcase.contains(panel) || !panel.hasAttribute('data-showcase-panel'))) return;

  const activate = (index, focus = false) => {
    entries.forEach(({ tab, panel }, current) => {
      const selected = current === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    });
    if (focus) tabs[index].focus();
  };

  entries.forEach(({ tab }, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next, true);
    });
  });
  const selected = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  activate(selected < 0 ? 0 : selected);
  showcase.classList.add('showcase-ready');
});

document.querySelectorAll('[data-copy]').forEach((button) => {
  const target = document.getElementById(button.dataset.copy);
  if (!target) return;
  const label = button.querySelector('[data-copy-label]') || button;
  const originalLabel = label.textContent;
  button.setAttribute('aria-live', 'polite');
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      label.textContent = button.dataset.copiedLabel || originalLabel;
      button.dataset.copyState = 'success';
    } catch {
      label.textContent = button.dataset.copyErrorLabel || originalLabel;
      button.dataset.copyState = 'error';
    }
    window.setTimeout(() => {
      label.textContent = originalLabel;
      delete button.dataset.copyState;
      button.disabled = false;
    }, 2000);
  });
});

document.documentElement.classList.add('js-ready');
