(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const animate = (element, frames, options) => {
    if (motion.matches || !element.animate) return;
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished
      .catch(() => {})
      .finally(() => animations.delete(animation));
  };
  motion.addEventListener('change', () => {
    if (motion.matches) animations.forEach((animation) => animation.cancel());
  });

  document.querySelectorAll('[data-chronicle]').forEach((chronicle) => {
    const viewport = chronicle.querySelector('.chronicle-window');
    const entries = [...chronicle.querySelectorAll('.chronicle-entry')];
    if (!entries.length) return;
    const range = chronicle.querySelector('input[type="range"]');
    const previous = chronicle.querySelector('[data-step="-1"]');
    const next = chronicle.querySelector('[data-step="1"]');
    const years = [...chronicle.querySelectorAll('[data-year-jump]')];
    const status = chronicle.querySelector('[data-timeline-announcement]');
    let current = 0;
    let frame = 0;
    let announceTimer;
    let pointer = null;
    let suppressClick = false;

    // Measure relative to the scroller, not the page. The trailing gutter lets
    // the last entry align to the same reading position as the first.
    const offset = (index) => entries[index].offsetLeft - entries[0].offsetLeft;
    const sync = () => {
      frame = 0;
      const nearest = entries.reduce(
        (best, _, index) =>
          Math.abs(offset(index) - viewport.scrollLeft) <
          Math.abs(offset(best) - viewport.scrollLeft)
            ? index
            : best,
        0,
      );
      current = nearest;
      entries.forEach((entry, index) =>
        entry.toggleAttribute('data-current', index === current),
      );
      range.value = String(current);
      range.setAttribute(
        'aria-valuetext',
        entries[current].dataset.milestoneLabel,
      );
      chronicle.querySelector('[data-position]').textContent =
        `${String(current + 1).padStart(2, '0')} / ${String(entries.length).padStart(2, '0')}`;
      previous.disabled = current === 0;
      next.disabled = current === entries.length - 1;
      years.forEach((button) => {
        if (button.dataset.yearJump === entries[current].dataset.year)
          button.setAttribute('aria-current', 'date');
        else button.removeAttribute('aria-current');
      });
      clearTimeout(announceTimer);
      announceTimer = setTimeout(() => {
        status.textContent = entries[current].dataset.milestoneLabel;
      }, 180);
    };
    const go = (index, instant = false) => {
      const target = Math.max(0, Math.min(entries.length - 1, index));
      viewport.scrollTo({
        left: offset(target),
        behavior: instant || motion.matches ? 'instant' : 'smooth',
      });
    };
    chronicle
      .querySelectorAll(
        '.chronicle-controls, .chronicle-years, .chronicle-scrubber',
      )
      .forEach((element) => {
        element.hidden = false;
      });
    chronicle.dataset.enhanced = 'true';
    previous.addEventListener('click', () => go(current - 1));
    next.addEventListener('click', () => go(current + 1));
    years.forEach((button) =>
      button.addEventListener('click', () =>
        go(
          entries.findIndex(
            (entry) => entry.dataset.year === button.dataset.yearJump,
          ),
        ),
      ),
    );
    range.addEventListener('input', () => go(Number(range.value), true));
    viewport.addEventListener(
      'scroll',
      () => {
        if (!frame) frame = requestAnimationFrame(sync);
      },
      { passive: true },
    );
    viewport.addEventListener('keydown', (event) => {
      if (event.target !== viewport) return;
      const keys = {
        ArrowLeft: current - 1,
        ArrowRight: current + 1,
        Home: 0,
        End: entries.length - 1,
      };
      if (event.key in keys) {
        event.preventDefault();
        go(keys[event.key]);
      }
    });

    // Touch/pen keep native panning. Mouse dragging takes over only after a
    // horizontal threshold, so ordinary clicks and vertical page scrolling work.
    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      suppressClick = false;
      pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: viewport.scrollLeft,
        moved: false,
      };
    });
    viewport.addEventListener('pointermove', (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      if (!pointer.moved) {
        if (Math.abs(event.clientY - pointer.y) > 12 && Math.abs(dx) < 8) {
          pointer = null;
          return;
        }
        if (Math.abs(dx) < 8) return;
        pointer.moved = true;
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add('is-dragging');
      }
      event.preventDefault();
      viewport.scrollLeft = pointer.left - dx;
    });
    const endDrag = (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const moved = pointer.moved;
      pointer = null;
      suppressClick = moved;
      viewport.classList.remove('is-dragging');
      if (viewport.hasPointerCapture(event.pointerId))
        viewport.releasePointerCapture(event.pointerId);
      if (moved) {
        sync();
        go(current);
      }
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
    viewport.addEventListener('pointerleave', (event) => {
      if (pointer && !pointer.moved) endDrag(event);
    });
    viewport.addEventListener('dragstart', (event) => event.preventDefault());
    viewport.addEventListener(
      'click',
      (event) => {
        if (suppressClick) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick = false;
        }
      },
      true,
    );
    if ('ResizeObserver' in window)
      new ResizeObserver(() => go(current, true)).observe(viewport);
    sync();
  });

  // A direct visit introduces the factual homepage in two restrained strokes.
  // Content is never hidden, so failed scripts still leave the page complete.
  const intro = document.querySelector('.profile-intro');
  if (
    intro &&
    (!document.referrer ||
      new URL(document.referrer).origin !== location.origin)
  ) {
    [...intro.children].forEach((element, index) =>
      animate(
        element,
        [
          { transform: `translateX(${index ? 30 : -30}px)` },
          { transform: 'translateX(0)' },
        ],
        {
          duration: 720,
          delay: 80 + index * 90,
          easing: 'cubic-bezier(.22,.68,.15,1)',
          fill: 'backwards',
        },
      ),
    );
  }

  // Elements below the fold enter from alternating sides once. The clipped
  // image edge gives long journal pages a measured rhythm as the user scrolls.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (motion.matches) return;
          const element = entry.target;
          element.classList.add('is-revealed');
          const media = element.querySelector(
            '.post-preview-media, .post-thumbnail',
          );
          const copy = element.querySelector(
            '.post-preview-copy, .post-row-copy',
          );
          const index = Number(element.dataset.revealIndex || 0);
          const direction = index % 2 ? 1 : -1;
          if (media) {
            animate(
              media,
              [
                {
                  clipPath:
                    direction < 0
                      ? 'inset(0 100% 0 0 round 5px)'
                      : 'inset(0 0 0 100% round 5px)',
                  transform: `translateX(${direction * 20}px)`,
                },
                {
                  clipPath: 'inset(0 0 0 0 round 5px)',
                  transform: 'translateX(0)',
                },
              ],
              { duration: 820, easing: 'cubic-bezier(.22,.68,.15,1)' },
            );
          }
          animate(
            copy || element,
            [
              {
                transform: media
                  ? `translateX(${direction * -24}px)`
                  : 'translateX(-24px)',
              },
              { transform: 'translateX(0)' },
            ],
            {
              duration: 760,
              delay: media ? 90 : 0,
              easing: 'cubic-bezier(.22,.68,.15,1)',
              fill: 'backwards',
            },
          );
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach((element, index) => {
      element.dataset.revealIndex = String(index);
      if (element.getBoundingClientRect().top >= innerHeight - 24)
        observer.observe(element);
    });
  }

  // Browsers without native document transitions receive the same fluid cue.
  // Navigation itself remains immediate: no click interception or fake router.
  if (!('CSSViewTransitionRule' in window)) {
    addEventListener('pageshow', (event) => {
      if (event.persisted || !document.referrer) return;
      if (new URL(document.referrer).origin !== location.origin) return;
      animate(
        document.querySelector('#main'),
        [
          {
            clipPath: 'ellipse(75% 0% at 50% -5%)',
            transform: 'translateY(22px)',
          },
          {
            clipPath: 'ellipse(150% 160% at 50% 0%)',
            transform: 'translateY(0)',
          },
        ],
        { duration: 760, easing: 'cubic-bezier(.22,.68,.15,1)' },
      );
    });
  }

  // A quiet reading-position trace lives on article pages only.
  const article = document.querySelector('.article-body');
  if (article) {
    const trace = document.createElement('div');
    trace.className = 'reading-trace';
    trace.setAttribute('aria-hidden', 'true');
    document.querySelector('.site-header').append(trace);
    let pending = false;
    const update = () => {
      pending = false;
      const bounds = article.getBoundingClientRect();
      const visibleHeight = innerHeight - 120;
      const progress = Math.max(
        0,
        Math.min(
          1,
          (120 - bounds.top) / Math.max(1, bounds.height - visibleHeight),
        ),
      );
      trace.style.transform = `scaleX(${progress})`;
    };
    addEventListener(
      'scroll',
      () => {
        if (!pending) {
          pending = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    addEventListener('resize', update);
    update();
  }
})();
