(() => {
  'use strict';
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const theme = document.querySelector('#theme-select');
  const applyTheme = (preference) => {
    root.dataset.preference = preference;
    root.dataset.theme =
      preference === 'system'
        ? system.matches
          ? 'dark'
          : 'light'
        : preference;
    document.querySelector('meta[name="theme-color"]').content =
      root.dataset.theme === 'dark' ? '#09111f' : '#f6f8fc';
  };
  theme.closest('label').hidden = false;
  theme.value = root.dataset.preference || 'system';
  applyTheme(theme.value);
  theme.addEventListener('change', () => {
    applyTheme(theme.value);
    try {
      localStorage.setItem('aidan-appearance', theme.value);
    } catch {
      /* Storage may be unavailable. */
    }
  });
  system.addEventListener('change', () => {
    if (theme.value === 'system') applyTheme('system');
  });

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  const small = matchMedia('(max-width: 800px)');
  const setMenu = (open) => {
    menu.setAttribute('aria-expanded', String(open));
    nav.hidden = small.matches && !open;
  };
  const syncMenu = () => {
    menu.hidden = !small.matches;
    setMenu(false);
  };
  syncMenu();
  small.addEventListener('change', syncMenu);
  menu.addEventListener('click', () =>
    setMenu(menu.getAttribute('aria-expanded') !== 'true'),
  );
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      small.matches &&
      menu.getAttribute('aria-expanded') === 'true'
    ) {
      setMenu(false);
      menu.focus();
    }
  });

  const search = document.querySelector('#journal-search');
  if (search) {
    document.querySelector('.journal-tools').hidden = false;
    const category = document.querySelector('#category-filter');
    const rows = [...document.querySelectorAll('.post-row')];
    const filter = () => {
      let count = 0;
      const terms = search.value
        .trim()
        .toLocaleLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      rows.forEach((row) => {
        const matches =
          terms.every((term) => row.dataset.search.includes(term)) &&
          (!category.value ||
            row.dataset.category.split('|').includes(category.value));
        row.hidden = !matches;
        if (matches) count++;
      });
      document.querySelector('#search-status').textContent =
        `${count} ${count === 1 ? 'entry' : 'entries'}`;
      document.querySelector('#no-results').hidden = count !== 0;
    };
    search.addEventListener('input', filter);
    category.addEventListener('change', filter);
  }

  document.querySelectorAll('.prose pre').forEach((pre) => {
    if (!navigator.clipboard) return;
    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.replaceWith(wrap);
    wrap.append(pre);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy code';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.setAttribute('aria-live', 'polite');
    wrap.append(button);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Select code to copy';
      }
      setTimeout(() => {
        button.textContent = 'Copy code';
      }, 2500);
    });
  });

  // Retire only the old Chirpy worker at this site's exact scope.
  // Do not delete arbitrary origin caches or unrelated application workers.
  if ('serviceWorker' in navigator) {
    const expectedScope = new URL(
      `${document.body.dataset.baseurl || ''}/`,
      location.origin,
    ).href;
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          const worker =
            registration.active ||
            registration.waiting ||
            registration.installing;
          if (
            worker &&
            registration.scope === expectedScope &&
            new URL(worker.scriptURL).pathname ===
              `${document.body.dataset.baseurl || ''}/sw.min.js`
          )
            registration.unregister();
        });
      })
      .catch(() => {
        /* Some browsers disable service workers in private mode. */
      });
  }
})();
