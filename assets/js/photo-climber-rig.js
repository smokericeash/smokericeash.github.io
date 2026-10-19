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
        if ((type === 'leg' || side === 'left') && photoTorso) body.insertBefore(group, photoTorso);
        else body.append(group);
        segments[side][segment] = group;
      }
    }
    const update = state => {
      for (const side of ['left', 'right']) {
        const p = parts[side];
        const hip = rel(state.hips[side], state.origin);
        const knee = rel(state.knees[side], state.origin);
        const foot = rel(state.feet[side], state.origin);
        align(segments[side].thigh, rel(p.hip, p.thighCrop), rel(p.knee, p.thighCrop), hip, knee, .155);
        align(segments[side].shin, rel(p.knee, p.shinCrop), rel(p.foot, p.shinCrop), knee, foot, .14);
        const upperLength = Math.hypot(knee.x - hip.x, knee.y - hip.y);
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
      }
    };
    return { update, segments };
  };
  window.PhotoLegRig = { create };
})();
