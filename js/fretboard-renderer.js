/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════════════════
   FRETBOARD RENDERER — shared HTML/SVG component for Study & Practice
   Replaces the old canvas-based drawFretboard/drawStudyFretboard.
═══════════════════════════════════════════════════════════════ */

var FB_BOARD_ID       = { 'fb-outer': 'fb-board', 'study-fb-outer': 'study-board', 'triads-fb-outer': 'triads-board' };
var FB_MARKER_FRETS   = [3, 5, 7, 9, 12, 15, 17, 19];
var FB_GRAIN_TILE      = 128;   // px, matches the baked texture asset below
var FB_GEOM           = {};     // per-container geometry cache, for hit-testing

/* pre-baked tileable matte-grain texture (spec 2.3): a procedurally-generated
   PNG reproducing the confirmed feColorMatrix output (constant rgb ~#6B6B70,
   alpha-only fractal noise), baked once offline — not a live feTurbulence
   filter recomputed on every innerHTML redraw. */
var FB_GRAIN_TEXTURE_URI = 'data:image/png;base64,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';

/* ── geometry: consolidates the sizing math both old renderers duplicated ── */
function fbComputeGeometry(outer, opts) {
  opts = opts || {};
  var numStrings = opts.numStrings || NUM_STRINGS;
  var leftHanded = !!opts.leftHanded;

  var fretLo = 0, fretHi = MAX_FRET;
  if (opts.fretWindow) {
    fretLo = opts.fretWindow.lo; fretHi = opts.fretWindow.hi;
  } else if ((opts.phoneZoneTargetFret != null) && isPhonePortrait()) {
    var bounds = phoneZoneBounds(opts.phoneZoneTargetFret);
    fretLo = bounds.lo; fretHi = bounds.hi;
  }
  var FRETS = fretHi - fretLo;

  var aW = outer.clientWidth - 8;
  if (aW <= 10) aW = window.innerWidth - 8;

  var cW, cH;
  if (FRETS < MAX_FRET) {
    /* fill width, taller aspect since fewer frets shown — scale factor tuned for readability */
    var zoneAspect = NECK_ASPECT * (FRETS / MAX_FRET) * 1.6;
    cW = Math.max(200, Math.floor(aW));
    cH = Math.max(80,  Math.floor(cW / zoneAspect));
  } else {
    cW = Math.max(200, Math.floor(aW));
    cH = Math.max(40,  Math.floor(cW / NECK_ASPECT));
  }

  var PL = Math.round(cW * 0.042), PR = Math.round(cW * 0.012);
  var PT = Math.round(cH * 0.12),  PB = Math.round(cH * 0.22);
  var fw = (cW - PL - PR) / FRETS;
  var sh = (cH - PT - PB) / (numStrings - 1);
  /* when showing a zone (fretLo > 0), add a small left margin so the
     first fret line doesn't sit flush against the board edge */
  var zoneMargin = (fretLo > 0) ? Math.round(fw * 0.4) : 0;

  var boardLeft   = PL;
  var boardRight  = PL + zoneMargin + FRETS * fw;
  var boardTop    = PT;
  var boardBottom = PT + (numStrings - 1) * sh;

  return {
    cW: cW, cH: cH, PL: PL, PT: PT, PR: PR, PB: PB, fw: fw, sh: sh,
    FRETS: FRETS, fretLo: fretLo, fretHi: fretHi, zoneMargin: zoneMargin,
    boardLeft: boardLeft, boardRight: boardRight, boardTop: boardTop, boardBottom: boardBottom,
    numStrings: numStrings, leftHanded: leftHanded,
    fretLabels: opts.fretLabels || 'none',
    activeStrings: opts.activeStrings || null
  };
}

/* ── the four mandated coordinate helpers (spec 4.2) — left-hand mirroring
     lives here and nowhere else in the rendering/hit-testing path ── */
function xForFret(fret, opts) {
  var fi = fret - opts.fretLo;
  var x = (fret === 0 && opts.fretLo === 0)
    ? opts.PL
    : opts.PL + opts.zoneMargin + (fi - 0.5) * opts.fw;
  return opts.leftHanded ? (opts.boardLeft + opts.boardRight - x) : x;
}

function yForString(string, opts) {
  var s = opts.leftHanded ? (opts.numStrings - 1 - string) : string;
  return opts.boardTop + s * opts.sh;
}

function fretForX(x, opts) {
  var xx = opts.leftHanded ? (opts.boardLeft + opts.boardRight - x) : x;
  /* fret 0 sits exactly at the nut, not at a cell center — xForFret special-
     cases it, so the inverse must too. Without this, Math.round(0.5) rounds
     UP to 1 in JS, breaking exact round-trip at the open string. */
  if (opts.fretLo === 0 && xx < opts.PL + opts.fw * 0.25) return 0;
  var fi = (xx - opts.PL - opts.zoneMargin) / opts.fw + 0.5;
  return Math.round(fi) + opts.fretLo;
}

function stringForY(y, opts) {
  var s = Math.round((y - opts.boardTop) / opts.sh);
  return opts.leftHanded ? (opts.numStrings - 1 - s) : s;
}

/* fret WIRE (boundary) x-position — distinct from xForFret's note-position
   *center* formula. Mirrors independently via the same boardLeft/boardRight,
   not a second orientation branch. */
function fbFretWireX(fret, geom) {
  var x = geom.PL + geom.zoneMargin + (fret - geom.fretLo) * geom.fw;
  return geom.leftHanded ? (geom.boardLeft + geom.boardRight - x) : x;
}

/* ── hit-testing (spec 4.3) ── */

/* Shared pixel→board-local-coordinate conversion. Exposed (not just used
   internally by fbHitTest) so callers that need custom snapping logic
   beyond "nearest of all strings" — e.g. Triad Positions snapping taps to
   only the 3 strings in the current shape — can reuse the same rect/scale
   math instead of duplicating it. */
function fbClientToBoardXY(containerId, clientX, clientY) {
  var geom = FB_GEOM[containerId];
  var boardId = FB_BOARD_ID[containerId];
  var boardEl = boardId && el(boardId);
  var svgEl = boardEl && boardEl.querySelector('svg');
  if (!geom || !svgEl) return null;
  var rect = svgEl.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  var scaleX = geom.cW / rect.width, scaleY = geom.cH / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
    geom: geom
  };
}

/* Not wired to any Fretboard Notes UI yet, but correct and verifiable (see
   tests/fretboard-renderer.test.html). Triad Positions' "build the shape"
   tap-to-place uses fbClientToBoardXY directly instead, since it needs to
   snap to only the shape's 3 active strings rather than the nearest of all. */
function fbHitTest(containerId, clientX, clientY) {
  var pt = fbClientToBoardXY(containerId, clientX, clientY);
  if (!pt) return null;
  var geom = pt.geom;
  var fret   = fretForX(pt.x, geom);
  var string = stringForY(pt.y, geom);
  if (fret < geom.fretLo || fret > geom.fretHi || string < 0 || string >= geom.numStrings) return null;
  return { string: string, fret: fret };
}

/* ── markup layer: one inline <svg> string, matching this codebase's
     existing innerHTML-building idiom ── */
function buildBoardSVG(geom, highlights) {
  var svg = [];
  svg.push('<svg viewBox="0 0 ' + geom.cW + ' ' + geom.cH + '" width="' + geom.cW + '" height="' + geom.cH + '" xmlns="http://www.w3.org/2000/svg">');
  svg.push('<defs><pattern id="fbGrain" width="' + FB_GRAIN_TILE + '" height="' + FB_GRAIN_TILE + '" patternUnits="userSpaceOnUse">' +
           '<image href="' + FB_GRAIN_TEXTURE_URI + '" width="' + FB_GRAIN_TILE + '" height="' + FB_GRAIN_TILE + '"/></pattern></defs>');

  var bw = geom.boardRight - geom.boardLeft, bh = geom.boardBottom - geom.boardTop;
  svg.push('<rect x="' + geom.boardLeft + '" y="' + geom.boardTop + '" width="' + bw + '" height="' + bh + '" fill="var(--fb-board,#111110)"/>');
  svg.push('<rect x="' + geom.boardLeft + '" y="' + geom.boardTop + '" width="' + bw + '" height="' + bh + '" fill="url(#fbGrain)" opacity="0.6"/>');

  /* fret wires — skip the literal fret-0 boundary when a nut block will be drawn there */
  for (var f = 0; f <= geom.FRETS; f++) {
    var realFret = f + geom.fretLo;
    if (realFret === 0 && geom.fretLo === 0) continue;
    var wx = fbFretWireX(realFret, geom);
    svg.push('<line x1="' + wx + '" y1="' + geom.boardTop + '" x2="' + wx + '" y2="' + geom.boardBottom + '" stroke="var(--fb-fret,#6B5C39)" stroke-width="1"/>');
  }

  /* strings — width graduates by physical string index (thinnest = index 0 / high e).
     activeStrings (Triad Positions) dims strings outside the current shape's set;
     null (Fretboard Notes) means every string renders at full opacity, unchanged. */
  for (var s = 0; s < geom.numStrings; s++) {
    var sy = yForString(s, geom);
    var sw = 1 + (s / (geom.numStrings - 1));
    var sOpacity = (!geom.activeStrings || geom.activeStrings.indexOf(s) >= 0) ? 1 : 0.25;
    svg.push('<line x1="' + geom.boardLeft + '" y1="' + sy + '" x2="' + geom.boardRight + '" y2="' + sy + '" stroke="var(--fb-string,#7A8E9A)" stroke-width="' + sw + '" stroke-linecap="round" opacity="' + sOpacity + '"/>');
  }

  /* position markers */
  var mr = Math.max(3, Math.min(geom.sh * 0.22, geom.fw * 0.18));
  FB_MARKER_FRETS.forEach(function(fd) {
    if (fd < geom.fretLo || fd > geom.fretHi) return;
    var mx = xForFret(fd, geom);
    if (fd === 12) {
      svg.push('<circle cx="' + mx + '" cy="' + (geom.boardTop + (geom.numStrings - 1) * geom.sh * 0.3) + '" r="' + mr + '" fill="var(--fb-marker,#E6D9B8)"/>');
      svg.push('<circle cx="' + mx + '" cy="' + (geom.boardTop + (geom.numStrings - 1) * geom.sh * 0.7) + '" r="' + mr + '" fill="var(--fb-marker,#E6D9B8)"/>');
    } else {
      svg.push('<circle cx="' + mx + '" cy="' + (geom.boardTop + (geom.numStrings - 1) * geom.sh * 0.5) + '" r="' + mr + '" fill="var(--fb-marker,#E6D9B8)"/>');
    }
  });

  /* nut block + one groove per string (spec 2.2) — only when the fret-0
     boundary is on screen; sits on whichever physical edge is the fret-0
     boundary under the current orientation */
  if (geom.fretLo === 0) {
    var nutW  = Math.max(4, geom.cW * 0.03);
    var nutCx = geom.leftHanded ? geom.boardRight : geom.boardLeft;
    svg.push('<rect x="' + (nutCx - nutW / 2) + '" y="' + geom.boardTop + '" width="' + nutW + '" height="' + bh + '" rx="2" fill="var(--fb-nut-fill,#EEE3C8)" stroke="var(--fb-nut-stroke,#B8A47A)" stroke-width="0.75"/>');
    for (var gs = 0; gs < geom.numStrings; gs++) {
      var gy = yForString(gs, geom);
      svg.push('<line x1="' + (nutCx - nutW / 2) + '" y1="' + gy + '" x2="' + (nutCx + nutW / 2) + '" y2="' + gy + '" stroke="var(--fb-nut-stroke,#B8A47A)" stroke-width="1"/>');
    }
  }

  /* string number labels — sit on whichever side the nut is on */
  var labelX      = geom.leftHanded ? geom.boardRight + 5 : geom.boardLeft - 5;
  var labelAnchor = geom.leftHanded ? 'start' : 'end';
  for (var ls = 0; ls < geom.numStrings; ls++) {
    var lsy = yForString(ls, geom);
    svg.push('<text x="' + labelX + '" y="' + lsy + '" text-anchor="' + labelAnchor + '" dominant-baseline="central" fill="var(--fb-label,#888)" font-size="' + Math.max(9, Math.min(12, geom.sh * 0.55)) + '" font-family="-apple-system,sans-serif">' + (ls + 1) + '</text>');
  }

  /* fret number labels — zone-relative in the phone-portrait zoom, odd-frets
     across the full neck in Study mode (matches prior per-caller behavior) */
  if (geom.fretLabels === 'zone' && geom.FRETS < MAX_FRET) {
    var labelY = geom.boardBottom + geom.PB * 0.45;
    for (var fn = geom.fretLo; fn <= geom.fretHi; fn++) {
      var fnx = xForFret(fn, geom);
      svg.push('<text x="' + fnx + '" y="' + labelY + '" text-anchor="middle" fill="var(--fb-label,#ccc)" font-size="' + Math.max(9, Math.min(12, geom.fw * 0.4)) + '" font-family="-apple-system,sans-serif">' + fn + '</text>');
    }
  } else if (geom.fretLabels === 'odd') {
    var labelY2 = geom.boardBottom + geom.PB * 0.55;
    for (var fn2 = 1; fn2 <= geom.fretHi; fn2++) {
      if (fn2 % 2 !== 1) continue;
      var fnx2 = xForFret(fn2, geom);
      svg.push('<text x="' + fnx2 + '" y="' + labelY2 + '" text-anchor="middle" fill="var(--fb-label,#999)" font-size="' + Math.max(8, Math.min(11, geom.fw * 0.38)) + '" font-family="-apple-system,sans-serif">' + fn2 + '</text>');
    }
  }

  /* note dots — multi-highlight (spec 4.1). Wrong-state gets a corner X badge
     (spec 2.4), drawn last so it layers cleanly over the letter.
     h.outline (Triad Positions' "missing position" indicator) draws a
     stroke-only ring with color-matched text instead of a filled dot —
     callers that don't set it (Fretboard Notes) get the original filled look. */
  (highlights || []).forEach(function(h) {
    var dx = xForFret(h.fret, geom);
    var dy = yForString(h.string, geom);
    var r  = Math.max(7, Math.min(geom.sh * 0.44, geom.fw * 0.36));
    var colorVar = 'var(--fb-dot-' + h.state + ',var(--teal))';
    svg.push('<g class="fb-dot" data-string="' + h.string + '" data-fret="' + h.fret + '" data-state="' + h.state + '"' + (h.role ? ' data-role="' + h.role + '"' : '') + '>');
    if (h.outline) {
      svg.push('<circle cx="' + dx + '" cy="' + dy + '" r="' + r + '" fill="none" stroke="' + colorVar + '" stroke-width="2"/>');
    } else {
      svg.push('<circle cx="' + dx + '" cy="' + dy + '" r="' + r + '" fill="' + colorVar + '"/>');
    }
    if (h.label) {
      var textFill = h.outline ? colorVar : 'var(--fb-dot-text,#fff)';
      svg.push('<text x="' + dx + '" y="' + dy + '" text-anchor="middle" dominant-baseline="central" fill="' + textFill + '" font-size="' + Math.max(9, r * 0.9) + '" font-weight="600" font-family="-apple-system,sans-serif">' + h.label + '</text>');
    }
    if (h.state === 'wrong') {
      var br = r * 0.5, bx = dx + r * 0.8, by = dy - r * 0.8, xr = br * 0.5;
      svg.push('<circle cx="' + bx + '" cy="' + by + '" r="' + br + '" fill="var(--fb-dot-wrong-badge,#791F1F)"/>');
      svg.push('<line x1="' + (bx - xr) + '" y1="' + (by - xr) + '" x2="' + (bx + xr) + '" y2="' + (by + xr) + '" stroke="var(--fb-dot-wrong,#E24B4A)" stroke-width="1" stroke-linecap="round"/>');
      svg.push('<line x1="' + (bx - xr) + '" y1="' + (by + xr) + '" x2="' + (bx + xr) + '" y2="' + (by - xr) + '" stroke="var(--fb-dot-wrong,#E24B4A)" stroke-width="1" stroke-linecap="round"/>');
    }
    svg.push('</g>');
  });

  svg.push('</svg>');
  return svg.join('');
}

/* ── adapter layer ── */
function renderFretboard(containerId, highlights, opts) {
  opts = opts || {};
  var outer   = el(containerId);
  var boardId = FB_BOARD_ID[containerId];
  var boardEl = boardId && el(boardId);
  if (!outer || !boardEl) return;
  opts.numStrings = opts.numStrings || NUM_STRINGS;
  if (opts.leftHanded === undefined) opts.leftHanded = leftHanded;
  var geom = fbComputeGeometry(outer, opts);
  FB_GEOM[containerId] = geom;
  boardEl.innerHTML = buildBoardSVG(geom, highlights);
}

function renderPracticeFretboard(kn, revealNote, isWrong) {
  var state = revealNote ? (isWrong ? 'wrong' : 'correct') : 'unanswered';
  renderFretboard('fb-outer',
    [{ string: kn.s, fret: kn.f, state: state, label: revealNote || '?', role: null }],
    { phoneZoneTargetFret: kn.f, fretLabels: 'zone' });
}

function buildStudyHighlights(activeStrings, fMin, fMax) {
  var highlights = [];
  for (var si = 0; si < NUM_STRINGS; si++) {
    if (activeStrings.indexOf(si) < 0) continue;
    for (var fi = 0; fi <= MAX_FRET; fi++) {
      if (fi < fMin || fi > fMax) continue;
      var idx = chromIdx(si, fi);
      if (!idxAllowed(idx)) continue;
      var isAcc = ACCIDENTAL_IDX.indexOf(idx) >= 0;
      highlights.push({ string: si, fret: fi, state: isAcc ? 'accidental' : 'natural', label: spellNote(idx), role: null });
    }
  }
  return highlights;
}

/* extracted verbatim from the old drawStudyFretboard's tail (unchanged colors/markup) */
function buildStudyLegend() {
  var accSpan = (accHasSharps(accidentalMode) || accHasFlats(accidentalMode))
    ? '<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#6C5CE7;margin-right:5px;vertical-align:middle;"></span>Accidental</span>'
    : '';
  var HINT_SVG = '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin:0 1px"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><circle cx="7" cy="5" r="2" fill="var(--surface)"/><circle cx="13" cy="10" r="2" fill="var(--surface)"/><circle cx="7" cy="15" r="2" fill="var(--surface)"/></svg>';
  var summarySpan = '<span style="margin-left:auto;text-align:right;line-height:1.5;">'
    + buildSettingsSummary()
    + '<br><span style="font-size:14px;">Tap ' + HINT_SVG + ' to change</span>'
    + '</span>';
  el('study-legend').innerHTML =
    '<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1D9E75;margin-right:5px;vertical-align:middle;"></span>Natural</span> '
    + accSpan + summarySpan;
}

function renderStudyFretboard(activeStrings, fMin, fMax) {
  renderFretboard('study-fb-outer', buildStudyHighlights(activeStrings, fMin, fMax), { fretLabels: 'odd' });
  buildStudyLegend();
}
