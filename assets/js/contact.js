(() => {
  'use strict';
  const dialog = document.querySelector('#email-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const address = dialog.dataset.address;
  const copy = dialog.querySelector('[data-email-copy]');
  const status = dialog.querySelector('[data-email-status]');
  let opener;
  let version = 0;
  document.querySelectorAll('[data-email-intent]').forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      // Modified clicks and no-JS browsers keep the original mailto destination.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      opener = link;
      version++;
      const resume = link.dataset.emailIntent === 'resume';
      const subject = resume ? 'Résumé request' : '';
      const body = resume
        ? "Hi Aidan,\n\nI'd like to request a copy of your résumé.\n\nThank you!"
        : '';
      const query = new URLSearchParams();
      if (subject) query.set('subject', subject);
      if (body) query.set('body', body);
      dialog.querySelector('[data-email-app]').href =
        `mailto:${address}${query.size ? '?' + query.toString().replace(/\+/g, '%20') : ''}`;
      const gmail = new URL('https://mail.google.com/mail/');
      gmail.search = new URLSearchParams({
        view: 'cm',
        fs: '1',
        to: address,
        ...(subject ? { su: subject, body } : {}),
      }).toString();
      dialog.querySelector('[data-email-gmail]').href = gmail.href;
      dialog.querySelector('#email-dialog-title').textContent = resume
        ? 'Request a résumé'
        : 'Email Aidan';
      dialog.querySelector('#email-dialog-description').textContent = resume
        ? 'Send me a request and I can share my résumé directly with you.'
        : 'Choose where to compose your message.';
      dialog.querySelector('[data-email-note]').textContent = resume
        ? 'The résumé is shared by email, rather than posted as a public download.'
        : 'You review and send the message yourself.';
      copy.textContent = 'Copy email address';
      status.textContent = '';
      dialog.showModal();
    });
  });
  copy.addEventListener('click', async () => {
    const requestVersion = version;
    try {
      await navigator.clipboard.writeText(address);
      if (version !== requestVersion || !dialog.open) return;
      copy.textContent = 'Address copied';
      status.textContent =
        'Email address copied. Paste it into your preferred email service.';
    } catch {
      if (version !== requestVersion || !dialog.open) return;
      status.textContent = `Copy is unavailable here. Select and copy the address above: ${address}`;
    }
  });
  dialog.addEventListener('close', () => {
    version++;
    opener?.focus({ preventScroll: true });
  });
  // Native Escape, modal focus containment, and form close need no custom trap.
})();
