(() => {
  'use strict';
  const root = document.querySelector('[data-expedition]');
  if (!root) return;

  const cards = [...root.querySelectorAll('[data-expedition-checkpoint]')];
  const prologue = root.querySelector('.expedition-prologue');
  const continuation = root.querySelector('.expedition-continuation');
  const svg = root.querySelector('.expedition-art');
  const visual = root.querySelector('.expedition-visual');
  const backdrop = root.querySelector('.expedition-picture');
  const wall = root.querySelector('.expedition-wall-picture');
  const route = root.querySelector('[data-expedition-route]');
  const completed = root.querySelector('[data-expedition-route-done]');
  const contact = root.querySelector('[data-expedition-contact]');
  const climber = root.querySelector('[data-expedition-climber]');
  const primaryFrame = climber.querySelector('[data-climber-frame-primary]');
  const nextFrame = climber.querySelector('[data-climber-frame-next]');
  const firstFrameUrl = primaryFrame.getAttribute('href');
  const frameUrls = Array.from({ length: 10 }, (_, index) =>
    firstFrameUrl.replace(/01\.webp/, `${String(index + 1).padStart(2, '0')}.webp`));
  // Every complete-body image is registered to the same goggle position at
  // export time. The two whole-body images blend between neighboring poses;
  // there are no separately animated limbs or per-pose transforms.
  // Warm the remaining poses after the first page paint. Fetching all poses at
  // startup competed with the mountain's first paint on mobile. Any deliberate
  // wheel/touch interaction starts preloading sooner.
  const frameCache = [];
  const preloadFrames = () => {
    if (frameCache.length) return;
    frameUrls.slice(1).forEach(src => {
      const image = new Image();
      image.src = src;
      frameCache.push(image);
    });
  };
  const schedulePreload = () => setTimeout(preloadFrames, 1200);
  if (document.readyState === 'complete') schedulePreload();
  else addEventListener('load', schedulePreload, { once: true });
  addEventListener('wheel', preloadFrames, { once: true, passive: true });
  addEventListener('touchstart', preloadFrames, { once: true, passive: true });
  addEventListener('keydown', preloadFrames, { once: true });
  const ease = value => value * value * (3 - 2 * value);
  const clamp01 = value => Math.max(0, Math.min(1, value));
  const position = root.querySelector('[data-expedition-position]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pacificSky = () => {
    const hour = Number(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23',
    }).format(new Date()));
    visual.dataset.pacificSky = hour >= 6 && hour < 19 ? 'day' : 'night';
  };
  pacificSky();
  setInterval(pacificSky, 10 * 60 * 1000);
  const count = cards.length;
  const worldHeight = (count + 2) * 500;
  const stages = count + 1;
  // Route geometry grows from the real number of posts, with no hand-maintained milestones.
  const routePoints = Array.from({ length: count + 2 }, (_, index) => ({
    x: 340 + Math.sin(index * 1.65) * 5,
    y: worldHeight - 300 - index * 500,
  }));
  const d = routePoints.map((point, index) => {
    if (!index) return `M${point.x} ${point.y}`;
    const previous = routePoints[index - 1];
    return `C${previous.x} ${previous.y - 192} ${point.x} ${point.y + 190} ${point.x} ${point.y}`;
  }).join(' ');
  route.setAttribute('d', d);
  completed.setAttribute('d', d);
  const totalLength = route.getTotalLength();
  completed.style.strokeDasharray = String(totalLength);
  completed.style.strokeDashoffset = String(totalLength);
  root.dataset.enhanced = '';

  let anchors = [];
  let target = 0;
  let current = 0;
  let frame = 0;
  let renderTime = 0;
  let lastStage = -1;
  const center = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top + scrollY + rect.height / 2;
  };
  const measure = () => {
    anchors = [center(prologue), ...cards.map(center), center(continuation)];
    requestSync();
  };
  const getTarget = () => {
    const focus = scrollY + innerHeight * (innerWidth <= 680 ? .72 : .52);
    if (focus <= anchors[0]) return 0;
    if (focus >= anchors[stages]) return stages;
    for (let i = 0; i < stages; i += 1) {
      if (focus <= anchors[i + 1])
        return i + (focus - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]);
    }
    return stages;
  };
  const render = time => {
    frame = 0;
    if (!anchors.length) return;
    target = getTarget();
    const elapsed = renderTime ? Math.max(0, time - renderTime) : 16;
    renderTime = time;
    current = motion.matches ? target : current + (target - current) * (1 - Math.exp(-elapsed / 80));
    if (Math.abs(target - current) < .002) current = target;
    const fraction = current / stages;
    backdrop.style.transform = `translate3d(0, ${(-10.71 * (1 - fraction)).toFixed(2)}%, 0)`;
    wall.style.transform = `translate3d(0, ${(-18.03 * (1 - fraction)).toFixed(2)}%, 0)`;
    const point = route.getPointAtLength(totalLength * fraction);
    // The camera and climber share one progress value. A delayed camera made
    // the climber appear to fall back after the wheel stopped. The intended
    // screen height steadily rises throughout the route, without a loop reset.
    const stride = current - Math.floor(current);
    // Two upward pushes per entry follow the illustrated foothold phases.
    // Between pushes the torso holds its height while a tool finds a hold.
    const pushRight = ease(clamp01((stride - .28) / .23));
    const pushLeft = ease(clamp01((stride - .78) / .22));
    const climbProgress = (Math.floor(current) + (pushRight + pushLeft) / 2) / stages;
    const screenY = 500 - 190 * climbProgress;
    const camera = Math.max(0, Math.min(worldHeight - 800, point.y - screenY));
    svg.setAttribute('viewBox', `0 ${camera.toFixed(2)} 600 800`);
    contact.setAttribute('cx', (point.x + 56).toFixed(2));
    contact.setAttribute('cy', (point.y + 69).toFixed(2));
    completed.style.strokeDashoffset = String(totalLength * (1 - fraction));
    // A full right/left stepping cycle spans two entries. The previous cycle
    // raced through every pose during a single moderate wheel gesture.
    const pose = motion.matches ? 0 : current * frameUrls.length / 2;
    const frameIndex = Math.floor(pose) % frameUrls.length;
    const nextIndex = (frameIndex + 1) % frameUrls.length;
    const blend = motion.matches ? 0 : ease(pose - Math.floor(pose));
    if (primaryFrame.getAttribute('href') !== frameUrls[frameIndex])
      primaryFrame.setAttribute('href', frameUrls[frameIndex]);
    if (nextFrame.getAttribute('href') !== frameUrls[nextIndex])
      nextFrame.setAttribute('href', frameUrls[nextIndex]);
    primaryFrame.setAttribute('opacity', (1 - blend).toFixed(3));
    nextFrame.setAttribute('opacity', blend.toFixed(3));
    climber.setAttribute('transform', `translate(${(point.x + 45).toFixed(2)} ${(point.y + 65).toFixed(2)}) scale(1.65)`);
    position.textContent = String(Math.min(stages + 1, Math.floor(current) + 1)).padStart(2, '0');
    const nearest = Math.round(current);
    if (nearest !== lastStage) {
      cards.forEach((card, index) => card.toggleAttribute('data-near', index + 1 === nearest));
      lastStage = nearest;
    }
    if (Math.abs(target - current) > .002 && !motion.matches) frame = requestAnimationFrame(render);
    else renderTime = 0;
  };
  const requestSync = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  // Native wheel deltas arrive as instant jumps on desktop. Ease the actual page
  // position, then gently finish at a nearby checkpoint after input pauses.
  // Settling is allowed only in the gesture's direction, never back down the
  // route after the climber has already advanced.
  // Touch, keyboard, scrollbar dragging and reduced-motion users keep native scroll.
  const desktop = matchMedia('(min-width: 681px) and (min-height: 700px)');
  let scrollFrame = 0;
  let scrollPosition = scrollY;
  let scrollTarget = scrollY;
  let scrollTime = 0;
  let settleTimer = 0;
  let wheelStart = scrollY;
  const clampScroll = value => Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, value));
  const animateScroll = time => {
    const elapsed = scrollTime ? Math.min(48, time - scrollTime) : 16;
    scrollTime = time;
    scrollPosition += (scrollTarget - scrollPosition) * (1 - Math.exp(-elapsed / 105));
    if (Math.abs(scrollTarget - scrollPosition) < .6) scrollPosition = scrollTarget;
    scrollTo(0, scrollPosition);
    if (scrollPosition !== scrollTarget) scrollFrame = requestAnimationFrame(animateScroll);
    else { scrollFrame = 0; scrollTime = 0; }
  };
  const startScroll = () => {
    if (!scrollFrame) {
      scrollPosition = scrollY;
      scrollTime = 0;
      scrollFrame = requestAnimationFrame(animateScroll);
    }
  };
  addEventListener('wheel', event => {
    if (!desktop.matches || motion.matches || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        event.target.closest('input, select, textarea, [contenteditable="true"], dialog')) return;
    event.preventDefault();
    if (!settleTimer) wheelStart = scrollY;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    scrollTarget = clampScroll(scrollTarget + delta * 1.2);
    startScroll();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      settleTimer = 0;
      if (Math.abs(scrollTarget - wheelStart) < 180) return;
      const readingCenter = (innerHeight + 84) / 2;
      const direction = Math.sign(scrollTarget - wheelStart);
      const candidates = anchors.filter(anchor => direction * (anchor - readingCenter - scrollTarget) >= -1);
      const nearest = candidates.reduce((best, anchor) =>
        Math.abs(anchor - (scrollTarget + readingCenter)) < Math.abs(best - (scrollTarget + readingCenter)) ? anchor : best,
      candidates[0]);
      if (nearest != null && Math.abs(nearest - (scrollTarget + readingCenter)) < 300) {
        scrollTarget = clampScroll(nearest - readingCenter);
        startScroll();
      }
    }, 160);
  }, { passive: false });
  const cancelWheelAnimation = () => {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    scrollTarget = scrollPosition = scrollY;
    clearTimeout(settleTimer);
    settleTimer = 0;
  };
  addEventListener('pointerdown', cancelWheelAnimation, { passive: true });
  addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      cancelWheelAnimation();
    }
  });
  addEventListener('scroll', () => {
    if (!scrollFrame) scrollTarget = scrollPosition = scrollY;
    if (scrollY > 0) preloadFrames();
    requestSync();
  }, { passive: true });
  addEventListener('resize', measure);
  motion.addEventListener('change', () => {
    if (motion.matches) {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
      clearTimeout(settleTimer);
      settleTimer = 0;
      scrollTarget = scrollPosition = scrollY;
    }
    requestSync();
  });
  addEventListener('pageshow', measure);
  measure();
})();
