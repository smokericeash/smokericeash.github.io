/* Live photographic limb skin for the contact-anchored climber. */
(() => {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  const svgNode = (name, attrs = {}) => {
    const element = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  };
  const parts = {
    left: {
      hip: { x: 320, y: 620 }, knee: { x: 350, y: 935 }, foot: { x: 395, y: 1320 },
      thighCrop: { x: 190, y: 540, width: 360, height: 420 },
      shinCrop: { x: 215, y: 915, width: 350, height: 530 },
    },
    right: {
      hip: { x: 790, y: 620 }, knee: { x: 815, y: 935 }, foot: { x: 850, y: 1320 },
      thighCrop: { x: 655, y: 540, width: 365, height: 420 },
      shinCrop: { x: 675, y: 915, width: 345, height: 530 },
    },
  };
  const sleeves = {
    left: {
      shoulder: { x: 145, y: 150 }, elbow: { x: 260, y: 315 }, hand: { x: 475, y: 452 },
      wholeCrop: { x: 70, y: 65, width: 510, height: 490 },
      upperCrop: { x: 75, y: 70, width: 310, height: 330 },
      lowerCrop: { x: 245, y: 265, width: 325, height: 285 },
    },
    right: {
      shoulder: { x: 675, y: 420 }, elbow: { x: 795, y: 278 }, hand: { x: 925, y: 103 },
      wholeCrop: { x: 590, y: 40, width: 430, height: 485 },
      upperCrop: { x: 595, y: 245, width: 300, height: 280 },
      lowerCrop: { x: 770, y: 45, width: 250, height: 280 },
    },
  };
  const rel = (p, origin) => ({ x: p.x - origin.x, y: p.y - origin.y });
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  const align = (node, sourceStart, sourceEnd, targetStart, targetEnd, widthScale) => {
    const sourceAngle = Math.atan2(sourceEnd.y - sourceStart.y, sourceEnd.x - sourceStart.x) * 180 / Math.PI;
    const targetAngle = Math.atan2(targetEnd.y - targetStart.y, targetEnd.x - targetStart.x) * 180 / Math.PI;
    const sourceLength = Math.hypot(sourceEnd.x - sourceStart.x, sourceEnd.y - sourceStart.y);
    const targetLength = Math.hypot(targetEnd.x - targetStart.x, targetEnd.y - targetStart.y);
    const stretch = targetLength / sourceLength;
    node.setAttribute('transform', `translate(${targetStart.x.toFixed(2)} ${targetStart.y.toFixed(2)}) rotate(${targetAngle.toFixed(2)}) scale(${stretch.toFixed(4)} ${widthScale}) rotate(${-sourceAngle.toFixed(2)}) translate(${-sourceStart.x} ${-sourceStart.y})`);
  };
  const create = (body, assetRoot) => {
    const segments = { left: {}, right: {} };
    const defs = body.ownerSVGElement.querySelector('defs');
    const photoTorso = body.querySelector('[data-rig-photo-torso]');
    const standingSrc = `${assetRoot}/ascent-standing-pose.webp`;
    const cutout = (id, d) => {
      const clip = svgNode('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
      clip.append(svgNode('path', { d }));
      defs.append(clip);
      return `url(#${id})`;
    };
    body.querySelectorAll('[data-rig-limb]').forEach(node => { node.style.display = 'none'; });
    // The seat overlaps the jacket hem and both thigh roots. Keep it behind the
    // legs so its lower edge never draws a rigid shorts-shaped cut across them.
    const pelvis = svgNode('g', { 'data-photo-waist': '', transform: 'translate(-85.6 -117) scale(.16)' });
    pelvis.append(svgNode('image', { href: standingSrc, width: 1086, height: 1448,
      'clip-path': cutout('rig-photo-waist', 'M325 600 L745 600 L750 730 Q700 800 610 800 L530 825 L420 800 Q340 790 310 730Z') }));
    body.insertBefore(pelvis, photoTorso);
    for (const type of ['leg', 'arm']) for (const side of ['left', 'right']) {
      const source = type === 'leg' ? parts[side] : sleeves[side];
      if (type === 'leg') {
        // Keep fabric behind the waist/thigh overlap as the hip flexes. This
        // underlay fills the exposed socket without moving either body part.
        const hipFabric = { x: 135, y: 155 };
        const hipClip = svgNode('clipPath', { id: `rig-photo-${side}-hip`, clipPathUnits: 'userSpaceOnUse' });
        hipClip.append(svgNode('ellipse', { cx: hipFabric.x, cy: hipFabric.y, rx: 70, ry: 75 }));
        defs.append(hipClip);
        const hip = svgNode('g', { 'data-photo-hip': side });
        hip.append(svgNode('image', { href: `${assetRoot}/ascent-rig-${side}-leg-thigh.webp`,
          width: source.thighCrop.width, height: source.thighCrop.height,
          'clip-path': `url(#rig-photo-${side}-hip)` }));
        body.insertBefore(hip, pelvis);
        segments[side].hip = hip;
        segments[side].hipFabric = hipFabric;
        // The two cropped fabric ends uncover a wedge at deep bends. A small
        // photographic gusset behind them keeps the knee continuously clothed.
        const fabric = { x: side === 'left' ? 425 : 630, y: 970 };
        const kneeClip = svgNode('clipPath', { id: `rig-photo-${side}-knee`, clipPathUnits: 'userSpaceOnUse' });
        kneeClip.append(svgNode('ellipse', { cx: fabric.x, cy: fabric.y, rx: 90, ry: 105 }));
        defs.append(kneeClip);
        const knee = svgNode('g', { 'data-photo-knee': side });
        knee.append(svgNode('image', { href: standingSrc, width: 1086, height: 1448,
          'clip-path': `url(#rig-photo-${side}-knee)` }));
        body.insertBefore(knee, photoTorso);
        segments[side].knee = knee;
        segments[side].kneeFabric = fabric;
      }
      for (const segment of type === 'leg' ? ['thigh', 'shin'] : ['whole']) {
        const group = svgNode('g', { 'data-photo-limb': `${side}-${type}-${segment}` });
        const crop = source[`${segment}Crop`];
        group.append(svgNode('image', { href: `${assetRoot}/ascent-rig-${side}-${type}-${segment}.webp`,
          width: crop.width, height: crop.height }));
        if (type === 'arm' && side === 'left' && photoTorso) {
          // The far sleeve's unused shoulder cap belongs behind the hood/pack.
          // Round the local occlusion behind the collar instead of leaving a square
          // sleeve cap beside the neck. The forearm and its pose stay unchanged.
          const shoulderMask = svgNode('g', { 'clip-path': cutout('rig-far-shoulder-occlusion',
            'M-200 -55 H-20 Q-3 -55 -3 -72 V-88 Q-3 -95 -12 -95 V-200 H200 V200 H-200Z') });
          shoulderMask.append(group); body.insertBefore(shoulderMask, photoTorso);
        } else if (type === 'leg' && photoTorso) body.insertBefore(group, photoTorso);
        else body.append(group);
        segments[side][segment] = group;
      }
    }
    // Bend the original continuous sleeve around a softly rounded elbow. The
    // shoulder and gripping hand stay fixed; only the fabric between them bends.
    // A straight shoulder-to-hand scale made the entire arm shrink on a pull.
    const sleeve = sleeves.right;
    const sourceStart = rel(sleeve.shoulder, sleeve.wholeCrop);
    const sourceEnd = rel(sleeve.hand, sleeve.wholeCrop);
    const sourceLength = Math.hypot(sourceEnd.x - sourceStart.x, sourceEnd.y - sourceStart.y);
    const ux = (sourceEnd.x - sourceStart.x) / sourceLength;
    const uy = (sourceEnd.y - sourceStart.y) / sourceLength;
    const sourcePoint = (t, v) => ({ x: sourceStart.x + ux * sourceLength * t - uy * v,
      y: sourceStart.y + uy * sourceLength * t + ux * v });
    const bentSleeve = svgNode('g', { 'data-photo-right-arm-bend': '', display: 'none' });
    const patches = [];
    // Opaque pixel bounds of the approved sleeve; narrow cross sections keep
    // the inner elbow mesh from turning inside out at the deepest bend.
    for (let band = 0; band < 24; band++) {
      const a = -.2 + band * 1.4 / 24, b = -.2 + (band + 1) * 1.4 / 24;
      for (const [low, high] of [[-65, 0], [0, 160]]) for (const corners of [
        [[a, low], [b, low], [b, high]], [[a, low], [b, high], [a, high]],
      ]) {
        const points = corners.map(([t, v]) => sourcePoint(t, v));
        const id = `rig-right-sleeve-${patches.length}`;
        const center = { x: points.reduce((sum, p) => sum + p.x, 0) / 3,
          y: points.reduce((sum, p) => sum + p.y, 0) / 3 };
        const expanded = points.map(p => {
          const d = Math.hypot(p.x - center.x, p.y - center.y);
          return `${p.x + (p.x - center.x) * .8 / d},${p.y + (p.y - center.y) * .8 / d}`;
        }).join(' ');
        const clip = svgNode('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
        clip.append(svgNode('polygon', { points: expanded })); defs.append(clip);
        const patch = svgNode('g');
        patch.append(svgNode('image', { href: `${assetRoot}/ascent-rig-right-arm-whole.webp`,
          width: sleeve.wholeCrop.width, height: sleeve.wholeCrop.height, 'clip-path': `url(#${id})` }));
        bentSleeve.append(patch);
        patches.push({ patch, corners, points });
      }
    }
    body.append(bentSleeve);
    const bendRightSleeve = (shoulder, hand, finalProgress) => {
      const dx = hand.x - shoulder.x, dy = hand.y - shoulder.y;
      const distance = Math.hypot(dx, dy);
      const amount = smooth((54 - distance) / 14) * (1 - smooth((finalProgress - .68) / .06));
      // A shallower elbow keeps the pull full-sized without bunching the sleeve.
      const length = distance + amount * Math.max(0, 52 - distance);
      const bends = length - distance > .001;
      bentSleeve.setAttribute('display', bends ? 'inline' : 'none');
      segments.right.whole.setAttribute('display', bends ? 'none' : 'inline');
      if (!bends) return;
      const x = dx / distance, y = dy / distance;
      const profile = height => {
        const elbow = { x: shoulder.x + dx * .46 - y * height, y: shoulder.y + dy * .46 + x * height };
        const upper = Math.hypot(elbow.x - shoulder.x, elbow.y - shoulder.y);
        const lower = Math.hypot(hand.x - elbow.x, hand.y - elbow.y);
        const u = { x: (elbow.x - shoulder.x) / upper, y: (elbow.y - shoulder.y) / upper };
        const v = { x: (hand.x - elbow.x) / lower, y: (hand.y - elbow.y) / lower };
        const trim = Math.min(14, upper * .48, lower * .48);
        const a = { x: elbow.x - u.x * trim, y: elbow.y - u.y * trim };
        const b = { x: elbow.x + v.x * trim, y: elbow.y + v.y * trim };
        const curve = t => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * elbow.x + t * t * b.x,
          y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * elbow.y + t * t * b.y });
        const samples = [0]; let previous = a;
        for (let i = 1; i <= 20; i++) {
          const point = curve(i / 20);
          samples.push(samples[i - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
          previous = point;
        }
        return { elbow, upper, lower, u, v, trim, a, b, curve, samples,
          first: upper - trim, total: upper + lower - 2 * trim + samples[20] };
      };
      let low = 0, high = length;
      for (let i = 0; i < 22; i++) {
        const height = (low + high) / 2;
        if (profile(height).total < length) low = height; else high = height;
      }
      const bend = profile((low + high) / 2);
      const map = (t, v) => {
        const at = t * bend.total;
        let point, tangent;
        if (at <= bend.first) {
          point = { x: shoulder.x + bend.u.x * at, y: shoulder.y + bend.u.y * at }; tangent = bend.u;
        } else if (at >= bend.first + bend.samples[20]) {
          const d = at - bend.first - bend.samples[20];
          point = { x: bend.b.x + bend.v.x * d, y: bend.b.y + bend.v.y * d }; tangent = bend.v;
        } else {
          const d = at - bend.first;
          let i = 1; while (bend.samples[i] < d) i++;
          const u = (i - 1 + (d - bend.samples[i - 1]) / (bend.samples[i] - bend.samples[i - 1])) / 20;
          point = bend.curve(u);
          const tx = (1 - u) * (bend.elbow.x - bend.a.x) + u * (bend.b.x - bend.elbow.x);
          const ty = (1 - u) * (bend.elbow.y - bend.a.y) + u * (bend.b.y - bend.elbow.y);
          const norm = Math.hypot(tx, ty); tangent = { x: tx / norm, y: ty / norm };
        }
        return { x: point.x - tangent.y * v * .12, y: point.y + tangent.x * v * .12 };
      };
      for (const { patch, corners, points: [p, q, r] } of patches) {
        const [a, b, c] = corners.map(([t, v]) => map(t, v));
        const det = (q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y);
        const m11 = ((b.x - a.x) * (r.y - p.y) - (c.x - a.x) * (q.y - p.y)) / det;
        const m12 = ((b.y - a.y) * (r.y - p.y) - (c.y - a.y) * (q.y - p.y)) / det;
        const m21 = ((q.x - p.x) * (c.x - a.x) - (r.x - p.x) * (b.x - a.x)) / det;
        const m22 = ((q.x - p.x) * (c.y - a.y) - (r.x - p.x) * (b.y - a.y)) / det;
        patch.setAttribute('transform', `matrix(${m11} ${m12} ${m21} ${m22} ${a.x - m11 * p.x - m21 * p.y} ${a.y - m12 * p.x - m22 * p.y})`);
      }
      bentSleeve.setAttribute('data-fabric-length', length.toFixed(3));
      bentSleeve.setAttribute('data-grip-distance', distance.toFixed(3));
    };
    const update = state => {
      for (const side of ['left', 'right']) {
        const p = parts[side];
        const hip = rel(state.hips[side], state.origin);
        const knee = rel(state.knees[side], state.origin);
        const foot = rel(state.feet[side], state.origin);
        // The right photo has a narrower trouser silhouette; match its fabric width.
        const thighWidth = side === 'right' ? .1674 : .155;
        align(segments[side].thigh, rel(p.hip, p.thighCrop), rel(p.knee, p.thighCrop), hip, knee, thighWidth);
        align(segments[side].shin, rel(p.knee, p.shinCrop), rel(p.foot, p.shinCrop), knee, foot, .14);
        const upperLength = Math.hypot(knee.x - hip.x, knee.y - hip.y);
        const hipAngle = Math.atan2(knee.y - hip.y, knee.x - hip.x) * 180 / Math.PI - 90;
        const hipFabric = segments[side].hipFabric;
        segments[side].hip.setAttribute('transform', `translate(${hip.x.toFixed(2)} ${hip.y.toFixed(2)}) rotate(${hipAngle.toFixed(2)}) scale(.26) translate(${-hipFabric.x} ${-hipFabric.y})`);
        const lowerLength = Math.hypot(foot.x - knee.x, foot.y - knee.y);
        const tangentX = (knee.x - hip.x) / upperLength + (foot.x - knee.x) / lowerLength;
        const tangentY = (knee.y - hip.y) / upperLength + (foot.y - knee.y) / lowerLength;
        const foldAngle = Math.atan2(tangentY, tangentX) * 180 / Math.PI - 90;
        const fabric = segments[side].kneeFabric;
        segments[side].knee.setAttribute('transform', `translate(${knee.x.toFixed(2)} ${knee.y.toFixed(2)}) rotate(${foldAngle.toFixed(2)}) scale(.16) translate(${-fabric.x} ${-fabric.y})`);
        const a = sleeves[side];
        const shoulder = rel(state.shoulders[side], state.origin);
        const hand = rel(state.hands[side], state.origin);
        align(segments[side].whole, rel(a.shoulder, a.wholeCrop), rel(a.hand, a.wholeCrop), shoulder, hand, .12);
        if (side === 'right') bendRightSleeve(shoulder, hand, state.finalProgress);
      }
    };
    return { update, segments };
  };
  window.PhotoLegRig = { create };
})();
