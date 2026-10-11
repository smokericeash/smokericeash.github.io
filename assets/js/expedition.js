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
  const terrain = root.querySelector('[data-expedition-terrain]');
  const distant = root.querySelector('[data-expedition-distance]');
  const route = root.querySelector('[data-expedition-route]');
  const completed = root.querySelector('[data-expedition-route-done]');
  const contact = root.querySelector('[data-expedition-contact]');
  const climber = root.querySelector('[data-expedition-climber]');
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
  const svgNS = 'http://www.w3.org/2000/svg';
  const count = cards.length;
  const worldHeight = (count + 2) * 500;
  const stages = count + 1;
  const stageNames = ['BASE CAMP', 'THE APPROACH', 'ICE & ROCK', 'THE HIGH RIDGE', 'BEYOND THE ROUTE'];
  const routePoints = Array.from({ length: count + 2 }, (_, index) => ({
    x: 328 + Math.sin(index * 1.65) * 51 + Math.cos(index * .7) * 19,
    y: worldHeight - 300 - index * 500,
  }));

  // The number of modules and anchors comes only from the rendered post list.
  // Changing a post never requires editing scene coordinates.
  const add = (parent, tag, attrs) => {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    parent.append(element);
    return element;
  };
  root.querySelector('.expedition-sky').setAttribute('height', worldHeight);
  const spine = Array.from({ length: Math.ceil(worldHeight / 125) + 1 }, (_, step) => {
    const y = Math.max(0, worldHeight - step * 125);
    const x = 250 + Math.sin(step * 1.7) * 48 + Math.sin(step * .41) * 26;
    return [x.toFixed(1), y];
  });
  add(distant, 'path', {
    class: 'expedition-distance-shadow',
    d: `M0 ${worldHeight} L${spine.map(([x, y]) => `${Math.max(65, x - 116).toFixed(1)} ${y}`).join(' L')} L0 0Z`,
  });
  add(distant, 'path', {
    class: 'expedition-distance',
    d: `M0 ${worldHeight} L${spine.map(([x, y], step) => `${Math.max(18, x - 178 + Math.sin(step * 2.4) * 31).toFixed(1)} ${y}`).join(' L')} L0 0Z`,
  });
  add(distant, 'path', {
    class: 'expedition-distance',
    d: 'M0 1170 L127 920 184 1000 348 195 439 632 512 702 600 613 V1170Z',
  });
  add(distant, 'path', {
    class: 'expedition-snow',
    d: 'M348 195 L385 363 350 331 318 400 321 333Z',
  });
  add(terrain, 'path', {
    class: 'expedition-rock',
    d: `M${spine[0].join(' ')} L${spine.slice(1).map(([x, y]) => `${x} ${y}`).join(' L')} L600 0 L600 ${worldHeight}Z`,
  });
  for (let i = 0; i < count + 2; i += 1) {
    const y = worldHeight - (i + 1) * 500;
    const group = add(terrain, 'g', { transform: `translate(0 ${y})` });
    add(group, 'path', {
      class: 'expedition-snow',
      d: `M${245 + (i % 3) * 18} 27 L${294 + (i % 3) * 18} 82 258 132 322 208 300 214 239 144 276 89 Z`,
    });
    add(group, 'path', {
      class: 'expedition-snow',
      d: `M${278 + i % 4 * 11} 327 L${323 + i % 4 * 11} 391 296 470 308 480 274 410 253 392 Z`,
    });
    add(group, 'path', {
      class: 'expedition-ice',
      d: `M398 14 Q366 90 382 143 L347 237 376 331 352 436 M482 39 L448 151 469 234 427 344`,
    });
    add(group, 'path', {
      class: 'expedition-ledge',
      d: `M285 ${179 + i % 3 * 21} Q331 ${168 + i % 3 * 21} 399 ${187 + i % 3 * 21} M276 389 Q332 374 402 399`,
    });
    for (let dot = 0; dot < 17; dot += 1) {
      const x = (dot * 97 + i * 43) % 600;
      const cy = (dot * 71 + i * 29) % 500;
      add(group, 'circle', { class: 'expedition-snowfall', cx: x, cy, r: dot % 5 === 0 ? 1.5 : .7 });
    }
    if (i === 0) {
      // Two understated tents give the real start of the route a sense of scale.
      add(group, 'path', { d: 'M48 430 L81 388 117 430 Z M128 449 L153 413 181 449 Z', fill: '#dcecf0', opacity: '.85' });
      add(group, 'path', { d: 'M81 388 L81 430 M153 413 L153 449', stroke: '#456b78', 'stroke-width': '2' });
    }
  }

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
  let frame = 0;
  let lastStage = -1;
  const rig = {
    armFront: climber.querySelector('.mountaineer-arm-front'),
    armBack: climber.querySelector('.mountaineer-arm-back'),
    legFront: climber.querySelector('.mountaineer-leg-front'),
    legBack: climber.querySelector('.mountaineer-leg-back'),
  };
  const joint = (sx, sy, hx, hy, upper, lower, side) => {
    const dx = hx - sx;
    const dy = hy - sy;
    const length = Math.max(1, Math.hypot(dx, dy));
    const reach = Math.min(length, upper + lower - .1);
    const along = (upper * upper - lower * lower + reach * reach) / (2 * reach);
    const outward = Math.sqrt(Math.max(0, upper * upper - along * along));
    return [
      sx + dx / length * along - dy / length * outward * side,
      sy + dy / length * along + dx / length * outward * side,
    ];
  };
  const drawArm = (part, sx, sy, hx, hy, side) => {
    const [ex, ey] = joint(sx, sy, hx, hy, 20, 20, side);
    part.querySelector('.mountaineer-sleeve').setAttribute(
      'd', `M${sx} ${sy} L${ex.toFixed(2)} ${ey.toFixed(2)} L${hx.toFixed(2)} ${hy.toFixed(2)}`,
    );
    const glove = part.querySelector('.mountaineer-glove');
    glove.setAttribute('cx', hx.toFixed(2));
    glove.setAttribute('cy', hy.toFixed(2));
  };
  const drawLeg = (part, sx, sy, fx, fy, side) => {
    const [kx, ky] = joint(sx, sy, fx, fy, 17, 17, side);
    part.querySelector('.mountaineer-pants').setAttribute(
      'd', `M${sx} ${sy} L${kx.toFixed(2)} ${ky.toFixed(2)} L${fx.toFixed(2)} ${fy.toFixed(2)}`,
    );
    part.querySelector('.mountaineer-boot').setAttribute(
      'd', `M${(fx - 5).toFixed(2)} ${(fy - 3).toFixed(2)} L${(fx + 4).toFixed(2)} ${(fy - 3).toFixed(2)} L${(fx + 8).toFixed(2)} ${(fy + 3).toFixed(2)} L${(fx - 6).toFixed(2)} ${(fy + 4).toFixed(2)}Z`,
    );
    part.querySelector('.mountaineer-crampon').setAttribute(
      'd', `M${(fx - 3).toFixed(2)} ${(fy + 3).toFixed(2)} l-1 4 M${(fx + 5).toFixed(2)} ${(fy + 2).toFixed(2)} l1 4`,
    );
  };
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
  const render = () => {
    frame = 0;
    if (!anchors.length) return;
    target = getTarget();
    current = motion.matches ? target : current + (target - current) * .19;
    if (Math.abs(target - current) < .002) current = target;
    const fraction = current / stages;
    backdrop.style.transform = `translate3d(0, ${(-28.57 * (1 - fraction)).toFixed(2)}%, 0)`;
    const point = route.getPointAtLength(totalLength * fraction);
    const ahead = route.getPointAtLength(Math.min(totalLength, totalLength * fraction + 12));
    const behind = route.getPointAtLength(Math.max(0, totalLength * fraction - 12));
    const tangent = Math.atan2(behind.x - ahead.x, behind.y - ahead.y);
    const camera = Math.max(0, Math.min(worldHeight - 800, point.y - 410));
    svg.setAttribute('viewBox', `0 ${camera.toFixed(2)} 600 800`);
    contact.setAttribute('cx', (point.x + 6).toFixed(2));
    contact.setAttribute('cy', (point.y + 3).toFixed(2));
    completed.style.strokeDashoffset = String(totalLength * (1 - fraction));
    const distanceFromStop = Math.abs(current - Math.round(current));
    const effort = motion.matches ? 0 : Math.min(1, distanceFromStop * 4);
    const phase = current * Math.PI * 2 * 1.15;
    const frontReach = (1 - Math.cos(phase)) / 2;
    const backReach = 1 - frontReach;
    const sway = Math.sin(phase) * effort;
    climber.setAttribute('transform', `translate(${(point.x + sway * 1.4).toFixed(2)} ${(point.y - Math.abs(sway) * 1.4).toFixed(2)}) rotate(${(12 + tangent * 180 / Math.PI * .12 + sway * 1.4).toFixed(2)}) scale(1.8)`);
    drawArm(rig.armFront, 10, -48, 20 + sway * 2, -74 + (.5 - frontReach) * 20 * effort, 1);
    drawArm(rig.armBack, -10, -48, -20 - sway * 2, -46 - backReach * 20 * effort, -1);
    drawLeg(rig.legFront, 5, -24, 16 + sway * 3, -6 + (backReach - .5) * 10 * effort, 1);
    drawLeg(rig.legBack, -5, -24, -12 - sway * 3, 2 - frontReach * 9 * effort, -1);
    const region = Math.min(4, Math.floor(fraction * 5));
    zone.textContent = stageNames[region];
    position.textContent = String(Math.min(stages + 1, Math.floor(current) + 1)).padStart(2, '0');
    const nearest = Math.round(current);
    if (nearest !== lastStage) {
      cards.forEach((card, index) => card.toggleAttribute('data-near', index + 1 === nearest));
      lastStage = nearest;
    }
    if (Math.abs(target - current) > .002 && !motion.matches) frame = requestAnimationFrame(render);
  };
  const requestSync = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  addEventListener('scroll', requestSync, { passive: true });
  addEventListener('resize', measure);
  motion.addEventListener('change', requestSync);
  addEventListener('pageshow', measure);
  measure();
})();
