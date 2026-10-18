/* Deterministic 2.5D climber study. World contacts and body use one SVG camera. */
(() => {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}) => {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const mix = (a, b, amount) => a + (b - a) * amount;
  const point = (x, y) => ({ x, y });
  const surfaceX = y => 369 + 8 * Math.sin(y / 93) + 3 * Math.sin(y / 27);
  const limb = (root, side, type) => {
    const group = make('g', { 'data-rig-limb': `${side}-${type}` });
    const path = make('path', { fill: 'none', stroke: type === 'leg' ? 'url(#rig-pants)' : 'url(#rig-jacket)',
      'stroke-width': type === 'leg' ? 20 : 15, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const shading = make('path', { fill: 'none', stroke: type === 'leg' ? '#0c1118' : '#24313a',
      'stroke-width': type === 'leg' ? 4 : 3, opacity: '.47', 'stroke-linecap': 'round' });
    const seam = make('path', { fill: 'none', stroke: side === 'left' ? '#8495a0' : '#1b2229',
      'stroke-width': side === 'left' ? 1.5 : 2.5, opacity: '.83', 'stroke-linecap': 'round' });
    const detail = make('path', { fill: 'none', stroke: side === 'left' ? '#9caeb4' : '#657987',
      'stroke-width': side === 'left' ? '1.2' : '1.7', opacity: '.75', 'stroke-linecap': 'round' });
    // A fabric fold crosses the anatomical joint; a separate round cap made the
    // old study look like a mechanical hinge at this small display size.
    const joint = make('path', { fill: 'none', stroke: type === 'leg' ? '#52606b' : '#b5c3c7',
      'stroke-width': type === 'leg' ? '1.7' : '1.1', opacity: '.55', 'stroke-linecap': 'round' });
    group.append(path, shading, seam, detail, joint);
    const end = type === 'leg' ? make('g', { 'data-rig-boot': side }) : make('g', { 'data-rig-glove': side });
    end.innerHTML = type === 'leg'
      ? '<path d="M-12 -5 Q-8 -13 2 -10 L13 -5 Q20 -1 18 5 L-13 6 Q-18 2 -12 -5Z" fill="#20272c" stroke="#0a1116" stroke-width="2"/><path d="M-12 0 Q-5 -6 4 -2 L15 0" fill="none" stroke="#e2e9e8" stroke-width="4"/><path d="M-13 7 L-13 12 M-5 7 L-5 12 M5 7 L5 11 M14 6 L14 10" stroke="#de642a" stroke-width="2"/><path d="M9 -5 L14 -3" stroke="#e66a2e" stroke-width="2"/>'
      : '<path d="M-6 -5 Q1 -9 7 -4 L7 6 Q0 9 -6 4Z" fill="#1a2229" stroke="#93abb3" stroke-width=".8"/><path d="M-4 2 L5 3" stroke="#e36b32" stroke-width="1.4"/>';
    group.append(end);
    root.append(group);
    return { group, path, shading, seam, detail, joint, end, side };
  };
  // Fixed link lengths and one permanent signed bend for each anatomical side.
  const solveIK = (start, end, first, second, bend) => {
    const dx = end.x - start.x, dy = end.y - start.y;
    const distance = Math.hypot(dx, dy) || .0001;
    const reachable = clamp(distance, Math.abs(first - second) + .5, first + second - .5);
    const ux = dx / distance, uy = dy / distance;
    const along = (first * first - second * second + reachable * reachable) / (2 * reachable);
    const perpendicular = Math.sqrt(Math.max(0, first * first - along * along));
    return point(start.x + ux * along - uy * perpendicular * bend,
      start.y + uy * along + ux * perpendicular * bend);
  };
  const relative = (p, origin) => point(p.x - origin.x, p.y - origin.y);
  const drawLimb = (part, start, middle, end, origin, type) => {
    const a = relative(start, origin), b = relative(middle, origin), c = relative(end, origin);
    // Pass *through* the solved knee/elbow. One quadratic control at b never
    // actually reached b and let the illustrated limb drift off its joint.
    const midAB = point(mix(a.x, b.x, .82), mix(a.y, b.y, .82));
    const midBC = point(mix(b.x, c.x, .18), mix(b.y, c.y, .18));
    const d = `M${a.x.toFixed(2)} ${a.y.toFixed(2)} L${midAB.x.toFixed(2)} ${midAB.y.toFixed(2)} Q${b.x.toFixed(2)} ${b.y.toFixed(2)} ${midBC.x.toFixed(2)} ${midBC.y.toFixed(2)} L${c.x.toFixed(2)} ${c.y.toFixed(2)}`;
    part.path.setAttribute('d', d);
    part.shading.setAttribute('d', `M${(a.x + 5).toFixed(2)} ${a.y.toFixed(2)} L${(midAB.x + 5).toFixed(2)} ${midAB.y.toFixed(2)} Q${(b.x + 4).toFixed(2)} ${b.y.toFixed(2)} ${(midBC.x + 3).toFixed(2)} ${midBC.y.toFixed(2)} L${(c.x + 3).toFixed(2)} ${c.y.toFixed(2)}`);
    part.seam.setAttribute('d', `M${(b.x - 3).toFixed(2)} ${(b.y + 5).toFixed(2)} Q${b.x.toFixed(2)} ${(b.y + 11).toFixed(2)} ${(b.x + 6).toFixed(2)} ${(b.y + 7).toFixed(2)}`);
    if (type === 'leg') part.detail.setAttribute('d', part.side === 'left'
      ? `M${(a.x - 9).toFixed(2)} ${(a.y + 7).toFixed(2)} Q${(b.x - 8).toFixed(2)} ${(b.y - 8).toFixed(2)} ${(b.x - 8).toFixed(2)} ${(b.y + 2).toFixed(2)}`
      : `M${(b.x + 7).toFixed(2)} ${(b.y + 11).toFixed(2)} l1 7`);
    part.joint.setAttribute('d', `M${(b.x - 7).toFixed(2)} ${(b.y - 3).toFixed(2)} q7 5 14 1`);
    part.end.setAttribute('transform', `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)})${type === 'leg' ? ' rotate(-8)' : ''}`);
  };
  const makeRig = (svg, world, stageCount, options = {}) => {
    const maxSteps = stageCount * 2;
    // Keep the summit at one world height while future milestones extend the wall below it.
    const baseFootY = 692 + (maxSteps - 1) * 22;
    const wallHeight = Math.max(1550, baseFootY + 400);
    const defs = svg.querySelector('defs') || svg.insertBefore(make('defs'), svg.firstChild);
    const paint = make('g');
    paint.innerHTML = '<linearGradient id="rig-jacket" x2=".8" y2="1"><stop stop-color="#f2f5f4"/><stop offset=".53" stop-color="#d8e3e6"/><stop offset="1" stop-color="#8399a3"/></linearGradient><linearGradient id="rig-pants" x2="1" y2=".35"><stop stop-color="#111820"/><stop offset=".57" stop-color="#2b343d"/><stop offset="1" stop-color="#0c121a"/></linearGradient><linearGradient id="rig-pack" x2="1" y2="1"><stop stop-color="#3d4952"/><stop offset=".5" stop-color="#161d25"/><stop offset="1" stop-color="#0a1018"/></linearGradient><linearGradient id="rig-ice" x2="1" y2=".5"><stop stop-color="#233f4c"/><stop offset=".42" stop-color="#84acc0"/><stop offset="1" stop-color="#c3dce6"/></linearGradient><linearGradient id="rig-snow" x2="0" y2="1"><stop stop-color="#f6fbfb"/><stop offset=".25" stop-color="#bcd0d8"/><stop offset="1" stop-color="#405c6b"/></linearGradient><filter id="rig-shadow"><feGaussianBlur stdDeviation="3"/></filter>';
    while (paint.firstChild) defs.append(paint.firstChild);
    const wall = make('g', { 'data-rig-wall': '' });
    const image = make('image', { href: options.wallSrc || '/assets/media/ascent-icewall-800.webp',
      x: '0', y: '0', width: '600', height: String(wallHeight), preserveAspectRatio: 'none' });
    wall.append(image);
    // The generated cutout uses the same right-hand glacier but has a genuine
    // snow lip at the top; it remains hidden until the final ledge transition.
    const summitImage = make('image', { href: options.summitSrc || '',
      x: '0', y: '620', width: '600', height: '800', opacity: '0', preserveAspectRatio: 'none' });
    wall.append(summitImage);
    const contour = Array.from({ length: Math.ceil(wallHeight / 20) + 1 }, (_, i) => point(surfaceX(i * 20), i * 20));
    const wallPath = `M${contour.map(p => `${p.x.toFixed(1)} ${p.y}`).join(' L')} L600 ${wallHeight + 20} L600 0Z`;
    wall.append(make('path', { d: wallPath, fill: 'url(#rig-ice)', opacity: '.2' }));
    const marks = make('g', { 'data-rig-marks': '' });
    wall.append(marks);
    world.insertBefore(wall, world.firstChild);
    const ridgeY = 700;
    const body = make('g', { 'data-rig-body': '' });
    const rear = make('g');
    const leftLeg = limb(rear, 'left', 'leg');
    const leftArm = limb(rear, 'left', 'arm');
    body.append(rear);
    const figure = make('g');
    figure.innerHTML = '<path d="M-19 -18 Q-2 -26 17 -13 L18 8 Q8 18 -16 10Z" fill="#1b232b" stroke="#0e151c" stroke-width="2"/><path d="M-23 -67 Q-5 -80 18 -65 Q31 -49 26 -21 Q18 -5 -15 -7 Q-29 -22 -23 -67Z" fill="url(#rig-jacket)" stroke="#708691" stroke-width="2"/><path d="M14 -66 Q29 -60 26 -33 L16 -20 L11 -54Z" fill="#222c34"/><path d="M-16 -14 Q4 -8 20 -12" fill="none" stroke="#182029" stroke-width="7"/><path d="M-13 -11 Q-6 -4 0 0 M10 -9 Q16 -2 16 5" fill="none" stroke="#a4aeb0" stroke-width="2"/><ellipse cx="3" cy="-8" rx="3" ry="5" fill="none" stroke="#aab9bd" stroke-width="2"/><path d="M-27 -60 Q-43 -52 -39 -25 L-30 -11 Q-24 -5 -13 -12 L-14 -55Z" fill="url(#rig-pack)" stroke="#84949d" stroke-width="2"/><path d="M-37 -45 Q-27 -42 -16 -48 M-37 -31 Q-24 -28 -14 -34" fill="none" stroke="#687983" stroke-width="2"/><path d="M-24 -60 L-20 -13" fill="none" stroke="#b9c5c8" stroke-width="2"/><path d="M-20 -25 L-38 -26" fill="none" stroke="#d1d9d8" stroke-width="1"/><path d="M-18 -5 Q-24 1 -19 7 Q-13 11 -10 3" fill="none" stroke="#ba9a6d" stroke-width="2"/><path d="M20 -9 Q25 -4 22 3" fill="none" stroke="#c3c9c6" stroke-width="2"/><path d="M22 -5 L26 0 L22 5 L19 0Z" fill="none" stroke="#d8a06b" stroke-width="1.6"/>';
    body.append(figure);
    if (options.photoTorso) {
      const cut = make('clipPath', { id: 'rig-torso-cut', clipPathUnits: 'userSpaceOnUse' });
      cut.append(make('path', { d: 'M154 67 Q187 50 223 75 L230 111 L238 142 L240 217 Q245 236 239 243 L210 246 L166 245 Q132 258 107 239 L99 207 Q93 174 115 145 Q132 116 154 111Z' }));
      defs.append(cut);
      const photo = make('g', { transform: 'translate(-91 -140) scale(.55)', 'data-rig-photo-torso': '' });
      photo.append(make('image', { href: '/assets/media/ascent-climber-swirl-frame-01.webp',
        width: '400', height: '533', 'clip-path': 'url(#rig-torso-cut)' }));
      body.append(photo);
      figure.setAttribute('display', 'none');
    }
    const gear = make('g', { 'data-rig-gear': '' });
    gear.innerHTML = '<path d="M-22 -7 Q0 1 19 -10" fill="none" stroke="#101820" stroke-width="5"/><path d="M-19 -6 Q-15 5 -12 9 M10 -7 Q15 1 14 9" fill="none" stroke="#8e9ba1" stroke-width="2"/><ellipse cx="3" cy="-6" rx="2.8" ry="4" fill="none" stroke="#d1d9d7" stroke-width="1.5"/><path d="M-24 0 Q-32 6 -29 14 Q-25 20 -20 13 M-20 1 Q-28 8 -25 15 Q-22 18 -20 11" fill="none" stroke="#bba381" stroke-width="2"/><path d="M20 -7 q7 3 3 10 q-4 4 -6 -1Z" fill="none" stroke="#c4c9c5" stroke-width="1.5"/><path d="M-3 1 l4 4 l4 -3" fill="none" stroke="#df7334" stroke-width="1.5"/>';
    body.append(gear);
    const front = make('g');
    const rightLeg = limb(front, 'right', 'leg');
    const rightArm = limb(front, 'right', 'arm');
    body.append(front);
    const head = make('g', { 'data-rig-head': '' });
    head.innerHTML = '<path d="M-5 -80 Q-8 -100 7 -105 Q24 -105 29 -90 L27 -76 Q12 -67 -5 -80Z" fill="#222a32" stroke="#81929b" stroke-width="2"/><path d="M-3 -89 Q5 -101 19 -99" fill="none" stroke="#6a7880" stroke-width="2"/><path d="M19 -90 Q32 -90 32 -81 Q26 -73 18 -78Z" fill="#096783" stroke="#b3e2e6" stroke-width="1.5"/><path d="M20 -86 L29 -82" stroke="#1eb1c3" stroke-width="1"/><path d="M-8 -79 Q1 -72 17 -73" fill="none" stroke="#eef0ee" stroke-width="5"/>';
    body.append(head);
    if (options.photoTorso) head.setAttribute('display', 'none');
    const toolLeft = make('g', { 'data-rig-tool': 'left' });
    const toolRight = make('g', { 'data-rig-tool': 'right' });
    const impact = make('g', { 'data-rig-impact': '' });
    const flag = make('g', { 'data-rig-flag': '' });
    world.append(body, toolLeft, toolRight, impact, flag);
    const debug = make('g', { 'data-rig-debug': '', display: options.debug ? 'inline' : 'none' });
    world.append(debug);
    const contacts = (index, side, type) => {
      const y = type === 'foot' ? baseFootY - index * 22 : baseFootY - 139 - index * 22;
      const x = surfaceX(y) + (type === 'foot' ? side === 'left' ? -20 : -10 : side === 'left' ? -9 : 4);
      return point(x, y);
    };
    const animateContact = (old, newer, a, b, u, outward) => {
      const t = smooth((u - a) / (b - a));
      return point(mix(old.x, newer.x, t) - Math.sin(Math.PI * t) * outward,
        mix(old.y, newer.y, t) - Math.sin(Math.PI * t) * outward * .28);
    };
    const drawTool = (node, hand, tip, anchored) => {
      const grip = point(hand.x, hand.y);
      node.innerHTML = `<path d="M${grip.x.toFixed(1)} ${grip.y.toFixed(1)} L${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="#19232b" stroke-width="5" stroke-linecap="round"/><path d="M${grip.x.toFixed(1)} ${grip.y.toFixed(1)} L${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="#df672c" stroke-width="2"/><path d="M${(tip.x - 8).toFixed(1)} ${(tip.y + 2).toFixed(1)} L${(tip.x + 4).toFixed(1)} ${(tip.y - 2).toFixed(1)} L${(tip.x + 9).toFixed(1)} ${(tip.y + 4).toFixed(1)}" fill="none" stroke="#222d34" stroke-width="3" stroke-linejoin="round"/>${anchored ? `<circle cx="${tip.x.toFixed(1)}" cy="${tip.y.toFixed(1)}" r="3" fill="#1d3442" opacity=".8"/>` : ''}`;
    };
    const setDebug = state => {
      if (!options.debug) return;
      const dots = [
        ['L HIP', state.hips.left, '#eef'], ['R HIP', state.hips.right, '#e88'],
        ['L KNEE', state.knees.left, '#eef'], ['R KNEE', state.knees.right, '#e88'],
        ['L FOOT', state.feet.left, '#eef'], ['R FOOT', state.feet.right, '#e88'],
        ['L TOOL', state.tips.left, '#eef'], ['R TOOL', state.tips.right, '#e88'],
      ];
      debug.innerHTML = dots.map(([name, p, color]) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}"/><text x="${p.x + 5}" y="${p.y - 5}" fill="${color}" font-size="8">${name}</text>`).join('');
    };
    let lastState;
    const update = progress => {
      const phase = clamp(progress * 2, 0, maxSteps);
      const step = Math.min(maxSteps - 1, Math.floor(phase));
      const u = phase - step;
      const moving = step % 2 === 0 ? 'right' : 'left';
      const planted = moving === 'left' ? 'right' : 'left';
      const push = smooth((u - .57) / .3);
      const finalProgress = clamp(progress - (stageCount - 1));
      const standing = smooth((finalProgress - .72) / .22);
      const finalRise = smooth((finalProgress - .94) / .06);
      const bodyY = mix(baseFootY - 45 - step * 22 - 22 * push, 624 - 50 * finalRise, standing);
      const origin = point(mix(surfaceX(bodyY) - 62 + Math.sin(u * Math.PI) * 1.5,
        surfaceX(ridgeY) - 12, standing), bodyY);
      const hips = { left: point(origin.x - 13, origin.y + 3), right: point(origin.x + 11, origin.y + 3) };
      const shoulders = { left: point(origin.x - 16, origin.y - 59), right: point(origin.x + 16, origin.y - 60) };
      const feet = {}, tips = {}, hands = {}, knees = {}, elbows = {}, toolGrips = {};
      const stow = smooth((finalProgress - .74) / .12);
      const release = smooth((finalProgress - .93) / .07);
      const flagGrab = smooth((finalProgress - .79) / .10);
      const flagBase = point(mix(origin.x - 30, surfaceX(ridgeY) + 5, flagGrab),
        mix(origin.y - 35, ridgeY, flagGrab));
      const flagLength = mix(28, 80, flagGrab);
      const flagHand = point(flagBase.x - 4, flagBase.y - flagLength + 5);
      for (const side of ['left', 'right']) {
        const offset = side === moving ? step : step - 1;
        const oldOffset = side === moving ? step - 2 : step - 1;
        const oldFoot = contacts(oldOffset, side, 'foot');
        const newFoot = contacts(offset, side, 'foot');
        feet[side] = side === moving ? animateContact(oldFoot, newFoot, .34, .54, u, 13) : newFoot;
        feet[side] = point(mix(feet[side].x, surfaceX(ridgeY) + (side === 'left' ? -19 : 2), standing),
          mix(feet[side].y, ridgeY - 8, standing));
        const oldTool = contacts(oldOffset, side, 'tool');
        const newTool = contacts(offset, side, 'tool');
        tips[side] = side === moving ? animateContact(oldTool, newTool, .09, .27, u, 14) : newTool;
        const packTip = point(origin.x - (side === 'left' ? 39 : 25), origin.y - 45);
        tips[side] = point(mix(tips[side].x, packTip.x, stow), mix(tips[side].y, packTip.y, stow));
        toolGrips[side] = point(tips[side].x - 14, tips[side].y + 17);
        hands[side] = point(toolGrips[side].x, toolGrips[side].y);
        const resting = point(origin.x + (side === 'left' ? -17 : 18), origin.y - 2);
        if (side === 'right') {
          hands[side] = point(mix(hands[side].x, flagHand.x, flagGrab * (1 - release)),
            mix(hands[side].y, flagHand.y, flagGrab * (1 - release)));
          hands[side] = point(mix(hands[side].x, resting.x, release), mix(hands[side].y, resting.y, release));
        } else {
          hands[side] = point(mix(hands[side].x, resting.x, standing), mix(hands[side].y, resting.y, standing));
        }
        knees[side] = solveIK(hips[side], feet[side], 59, 58, -1);
        elbows[side] = solveIK(shoulders[side], hands[side], 43, 43, side === 'left' ? 1 : -1);
        drawLimb(side === 'left' ? leftLeg : rightLeg, hips[side], knees[side], feet[side], origin, 'leg');
        drawLimb(side === 'left' ? leftArm : rightArm, shoulders[side], elbows[side], hands[side], origin, 'arm');
      }
      body.setAttribute('transform', `translate(${origin.x.toFixed(2)} ${origin.y.toFixed(2)})`);
      gear.setAttribute('transform', `rotate(${(Math.sin(u * Math.PI) * 2).toFixed(1)} -20 -5)`);
      head.setAttribute('transform', `rotate(${(u > .32 && u < .55 ? 3 : -2).toFixed(1)} 7 -83)`);
      drawTool(toolLeft, toolGrips.left, tips.left, moving !== 'left' || u >= .27);
      drawTool(toolRight, toolGrips.right, tips.right, moving !== 'right' || u >= .27);
      const visible = [];
      for (let i = Math.max(0, step - 8); i <= step; i += 1) {
        if (i === step && u < .27) continue;
        const side = i % 2 === 0 ? 'right' : 'left';
        const tool = contacts(i, side, 'tool');
        const foot = contacts(i, side, 'foot');
        visible.push(`<path d="M${tool.x - 3} ${tool.y + 2} l6 -4 m-4 7 l5 2" stroke="#c7e8f0" stroke-width="1" opacity=".5" fill="none"/>`);
        if (i < step || u >= .54) visible.push(`<path d="M${foot.x - 5} ${foot.y + 6} q5 -3 9 -1" fill="none" stroke="#bdd5db" stroke-width="2" opacity=".55"/>`);
      }
      marks.innerHTML = visible.join('');
      impact.innerHTML = finalProgress < .74 && ((u >= .265 && u <= .31) || (u >= .535 && u <= .575))
        ? (() => { const p = u < .4 ? tips[moving] : feet[moving];
          const t = u < .4 ? (u - .265) / .045 : (u - .535) / .04;
          return Array.from({ length: 3 }, (_, i) => `<circle cx="${(p.x - 1 - i * 4).toFixed(1)}" cy="${(p.y + t * (6 + i * 3)).toFixed(1)}" r="${(1.7 - t).toFixed(1)}" fill="#d9eced" opacity="${(.7 * (1 - t)).toFixed(2)}"/>`).join(''); })()
        : '';
      summitImage.setAttribute('opacity', smooth((finalProgress - .60) / .30).toFixed(3));
      image.setAttribute('opacity', (1 - smooth((finalProgress - .60) / .30)).toFixed(3));
      const flagWidth = 29 * smooth((finalProgress - .89) / .08);
      flag.innerHTML = `<path d="M${flagBase.x.toFixed(1)} ${flagBase.y.toFixed(1)} L${(flagBase.x - 4).toFixed(1)} ${(flagBase.y - flagLength).toFixed(1)}" fill="none" stroke="#c7d3d4" stroke-width="2.5"/><path d="M${(flagBase.x - 4).toFixed(1)} ${(flagBase.y - flagLength).toFixed(1)} q${(flagWidth * .6).toFixed(1)} -3 ${flagWidth.toFixed(1)} 1 l-${(flagWidth * .15).toFixed(1)} 13 q-${(flagWidth * .4).toFixed(1)} -3 -${(flagWidth * .85).toFixed(1)} 1Z" fill="#182d3b" stroke="#b8d2d8" stroke-width=".8"/><text x="${(flagBase.x + 1).toFixed(1)}" y="${(flagBase.y - flagLength + 10).toFixed(1)}" fill="#edf7f6" font-size="7" font-weight="700" opacity="${smooth((finalProgress - .9) / .06).toFixed(2)}">ac</text><path d="M${(flagBase.x + 2).toFixed(1)} ${(flagBase.y + 2).toFixed(1)} q6 -3 13 1" fill="none" stroke="#e6f1f1" stroke-width="${(1.5 * smooth((finalProgress - .87) / .09)).toFixed(2)}" opacity="${smooth((finalProgress - .87) / .09).toFixed(2)}"/>`;
      lastState = { phase, step, u, moving, planted, origin, hips, shoulders, knees, elbows, feet, tips, hands,
        finalProgress, standing, flagBase };
      setDebug(lastState);
      return lastState;
    };
    return { update, getState: () => lastState, surfaceX, wall, body, marks, debug };
  };
  window.IceClimberRig = { create: makeRig, solveIK, surfaceX };
})();
