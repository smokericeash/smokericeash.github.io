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
  const limbs = {
    frontArm: climber.querySelector('[data-climber-front-arm]'),
    forearm: climber.querySelector('[data-climber-forearm]'),
    backArm: climber.querySelector('[data-climber-back-arm]'),
    frontLeg: climber.querySelector('[data-climber-front-leg]'),
    backThigh: climber.querySelector('[data-climber-back-thigh]'),
    backShin: climber.querySelector('[data-climber-back-shin]'),
  };
  const zone = root.querySelector('[data-expedition-zone]');
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
  const stageNames = ['BASE CAMP', 'THE APPROACH', 'ICE & ROCK', 'THE HIGH RIDGE', 'BEYOND THE ROUTE'];
  // Route geometry grows from the real number of posts, with no hand-maintained milestones.
  const routePoints = Array.from({ length: count + 2 }, (_, index) => ({
    x: 328 + Math.sin(index * 1.65) * 51 + Math.cos(index * .7) * 19,
    y: worldHeight - 300 - index * 500,
  }));
  const d = routePoints.map((point, index) => {
    if (!index) return `M${point.x} ${point.y}`;
    const previous = routePoints[index - 1];
    return `C${previous.x - 32} ${previous.y - 192} ${point.x + 27} ${point.y + 190} ${point.x} ${point.y}`;
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
  let cameraCurrent = 0;
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
    cameraCurrent = motion.matches ? current : cameraCurrent + (current - cameraCurrent) * (1 - Math.exp(-elapsed / 265));
    cameraCurrent = Math.max(current - .34, Math.min(current + .34, cameraCurrent));
    if (Math.abs(current - cameraCurrent) < .002) cameraCurrent = current;
    const fraction = current / stages;
    backdrop.style.transform = `translate3d(0, ${(-10.71 * (1 - fraction)).toFixed(2)}%, 0)`;
    wall.style.transform = `translate3d(0, ${(-18.03 * (1 - fraction)).toFixed(2)}%, 0)`;
    const point = route.getPointAtLength(totalLength * fraction);
    const ahead = route.getPointAtLength(Math.min(totalLength, totalLength * fraction + 12));
    const behind = route.getPointAtLength(Math.max(0, totalLength * fraction - 12));
    const tangent = Math.atan2(behind.x - ahead.x, behind.y - ahead.y);
    const cameraPoint = route.getPointAtLength(totalLength * cameraCurrent / stages);
    const camera = Math.max(0, Math.min(worldHeight - 800, cameraPoint.y - 410));
    svg.setAttribute('viewBox', `0 ${camera.toFixed(2)} 600 800`);
    contact.setAttribute('cx', (point.x + 23).toFixed(2));
    contact.setAttribute('cy', (point.y + 69).toFixed(2));
    completed.style.strokeDashoffset = String(totalLength * (1 - fraction));
    // Each raster limb is cut from the same illustration. Continuous joint
    // transforms keep the painted texture intact without swapping whole poses.
    const phase = motion.matches ? 0 : current * Math.PI * 4;
    const reach = Math.sin(phase);
    const pull = Math.cos(phase);
    const stance = motion.matches ? 0 : (1 - pull) / 2;
    limbs.frontArm.setAttribute('transform', `rotate(${(-3 - 5 * reach).toFixed(2)} 183 103)`);
    limbs.forearm.setAttribute('transform', `rotate(${(-3 * pull - 7 * reach).toFixed(2)} 236 81)`);
    limbs.backArm.setAttribute('transform', `rotate(${(3 + 5 * reach).toFixed(2)} 102 122)`);
    limbs.frontLeg.setAttribute('transform', `rotate(${(-3 - 9 * Math.max(0, reach)).toFixed(2)} 174 181)`);
    limbs.backThigh.setAttribute('transform', `rotate(${(-30 + 6 * Math.min(0, reach)).toFixed(2)} 137 188)`);
    limbs.backShin.setAttribute('transform', `rotate(${(-9 - 11 * Math.max(0, reach)).toFixed(2)} 103 271)`);
    const lift = motion.matches ? 0 : -4.5 * stance;
    climber.setAttribute('transform', `translate(${(point.x + 11).toFixed(2)} ${(point.y + 65 + lift).toFixed(2)}) rotate(${(tangent * 180 / Math.PI * .025).toFixed(2)}) scale(1.65)`);
    const region = Math.min(4, Math.floor(fraction * 5));
    zone.textContent = stageNames[region];
    position.textContent = String(Math.min(stages + 1, Math.floor(current) + 1)).padStart(2, '0');
    const nearest = Math.round(current);
    if (nearest !== lastStage) {
      cards.forEach((card, index) => card.toggleAttribute('data-near', index + 1 === nearest));
      lastStage = nearest;
    }
    if ((Math.abs(target - current) > .002 || Math.abs(current - cameraCurrent) > .002) && !motion.matches) frame = requestAnimationFrame(render);
    else renderTime = 0;
  };
  const requestSync = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  // Native wheel deltas arrive as instant jumps on desktop. Ease the actual page
  // position, then gently finish at a nearby checkpoint after input pauses.
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
      const nearest = anchors.reduce((best, anchor) =>
        Math.abs(anchor - (scrollTarget + readingCenter)) < Math.abs(best - (scrollTarget + readingCenter)) ? anchor : best,
      anchors[0]);
      if (Math.abs(nearest - (scrollTarget + readingCenter)) < 270) {
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
