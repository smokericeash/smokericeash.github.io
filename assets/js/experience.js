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
    const map = chronicle.querySelector('.ascent-map');
    const route = map?.querySelector('.ascent-route-base');
    const travelled = map?.querySelector('.ascent-route-travel');
    const climber = map?.querySelector('.ascent-climber');
    const routeLength = route?.getTotalLength() || 0;
    let current = 0;
    let frame = 0;
    let announceTimer;
    let pointer = null;
    let suppressClick = false;
    let scrollAnimation = 0;
    let destination = 0;
    let lastRouteProgress = 0;

    // The fixed-size route maps continuous native scroll progress to altitude.
    // Keep the artwork decorative; the actual dated entries remain the record.
    const syncRoute = () => {
      if (!routeLength) return;
      const maxScroll = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
      const progress = Math.max(0, Math.min(1, viewport.scrollLeft / maxScroll));
      const distance = routeLength * progress;
      const point = route.getPointAtLength(distance);
      const ahead = route.getPointAtLength(Math.min(routeLength, distance + 4));
      const behind = route.getPointAtLength(Math.max(0, distance - 4));
      const slope = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
      const tilt = Math.max(-11, Math.min(11, (slope * 180) / Math.PI * 0.3));
      const facing = progress < lastRouteProgress - 0.001 ? -1 : 1;
      travelled.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
      climber.style.left = `${point.x / 10}%`;
      climber.style.top = `${point.y / 1.92}%`;
      climber.style.transform = `translate(-50%, -100%) rotate(${tilt}deg) scaleX(${facing})`;
      map.dataset.progress = progress.toFixed(3);
      lastRouteProgress = progress;
    };

    // Measure relative to the scroller, not the page. The trailing gutter lets
    // the last entry align to the same reading position as the first.
    const offset = (index) => entries[index].offsetLeft - entries[0].offsetLeft;
    const sync = () => {
      frame = 0;
      syncRoute();
      const nearest = entries.reduce(
        (best, _, index) =>
          Math.abs(offset(index) - viewport.scrollLeft) <
          Math.abs(offset(best) - viewport.scrollLeft)
            ? index
            : best,
        0,
      );
      current = nearest;
      if (!scrollAnimation) destination = current;
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
    const stopScroll = () => {
      if (scrollAnimation) cancelAnimationFrame(scrollAnimation);
      scrollAnimation = 0;
    };
    const go = (index, instant = false) => {
      destination = Math.max(0, Math.min(entries.length - 1, index));
      const target = offset(destination);
      stopScroll();
      if (instant || motion.matches) {
        viewport.scrollLeft = target;
        sync();
        return;
      }
      const start = viewport.scrollLeft;
      const distance = target - start;
      if (Math.abs(distance) < 1) return;
      const duration = Math.min(640, Math.max(420, Math.abs(distance) * 0.6));
      let startTime;
      const step = (time) => {
        if (startTime === undefined) startTime = time;
        const progress = Math.min(1, (time - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        viewport.scrollLeft = start + distance * eased;
        if (progress < 1) scrollAnimation = requestAnimationFrame(step);
        else {
          scrollAnimation = 0;
          sync();
        }
      };
      scrollAnimation = requestAnimationFrame(step);
    };
    motion.addEventListener('change', () => {
      if (motion.matches && scrollAnimation) go(destination, true);
    });
    chronicle
      .querySelectorAll(
        '.chronicle-controls, .chronicle-years, .chronicle-scrubber',
      )
      .forEach((element) => {
        element.hidden = false;
      });
    chronicle.dataset.enhanced = 'true';
    previous.addEventListener('click', () => go(destination - 1));
    next.addEventListener('click', () => go(destination + 1));
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
    viewport.addEventListener('wheel', stopScroll, { passive: true });
    viewport.addEventListener('touchstart', stopScroll, { passive: true });
    viewport.addEventListener(
      'scroll',
      () => {
        if (!frame) frame = requestAnimationFrame(sync);
      },
      { passive: true },
    );
    addEventListener('resize', () => {
      if (!frame) frame = requestAnimationFrame(sync);
    });
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
      stopScroll();
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
          { transform: `translateX(${index ? 14 : -14}px)` },
          { transform: 'translateX(0)' },
        ],
        {
          duration: 580,
          delay: 80 + index * 90,
          easing: 'cubic-bezier(.22,.68,.15,1)',
          fill: 'backwards',
        },
      ),
    );
  }

  // Browsers without native document transitions receive the same calm cue.
  // Navigation itself remains immediate: no click interception or fake router.
  if (!('CSSViewTransitionRule' in window)) {
    addEventListener('pageshow', (event) => {
      if (event.persisted || !document.referrer) return;
      if (new URL(document.referrer).origin !== location.origin) return;
      animate(
        document.querySelector('#main'),
        [
          {
            opacity: 0,
            transform: 'translateY(10px)',
          },
          {
            offset: 0.2,
            opacity: 0,
            transform: 'translateY(10px)',
          },
          {
            opacity: 1,
            transform: 'translateY(0)',
          },
        ],
        {
          duration: 520,
          easing: 'cubic-bezier(.22,.68,.15,1)',
          fill: 'backwards',
        },
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
