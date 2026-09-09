/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

function fundStage1Study() {
  var alphaHtml = '';
  for (var i = 0; i < FUND_NATURALS.length; i++) {
    var n = FUND_NATURALS[i];
    alphaHtml += '<div class="fund-alpha-note" id="alpha-' + n + '" onclick="fundPingAlpha(\'' + n + '\')">' + n + '</div>';
    if (i < FUND_NATURALS.length - 1) alphaHtml += '<div class="fund-alpha-arrow">\u203A</div>';
  }
  alphaHtml += '<div class="fund-alpha-arrow" style="opacity:0.3;">\u21A9</div>';

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 1 \u00B7 The Notes</div>' +
      '<div class="fund-title">7 notes. They loop forever.</div>' +
      '<div class="fund-body">Music uses just <strong>7 letter names</strong>: A B C D E F G. When you reach G, you don\u2019t stop \u2014 you go back to A, now one octave higher. That cycle is everything. Every scale, every chord, every key is built from these same 7 names.</div>' +
    '</div>' +

    '<div class="fund-string-diagram">' +
      '<div class="fund-string-label">Low E string \u00B7 Natural notes only</div>' +
      '<div class="fund-string-wrap">' + fundBuildStringSVG() + '</div>' +
      '<div class="fund-callout" style="margin-top:10px;"><strong>Notice:</strong> E\u2192F is one fret. B\u2192C is one fret. Every other natural note is two frets apart. Those two gaps show up everywhere \u2014 learn to spot them now.</div>' +
    '</div>' +

    '<div class="fund-section-divider"><span>Tap any note to see what comes next</span></div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">The Musical Alphabet</div>' +
      '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;justify-content:center;margin:8px 0 6px;">' + alphaHtml + '</div>' +
      '<div class="fund-alpha-repeat" id="alphaMsg">The cycle repeats every 7 notes</div>' +
    '</div>' +

    '<button class="fund-cta-btn" onclick="fundStartPractice(1)">Start Practice \u2192</button>'
  );
}

function fundBuildStringSVG(showStepLabels, showAllNotes) {
  var W = 560, H = 96;
  var nutX = 40, endX = W - 20;
  var stringY = 48;
  var fretCount = 12;
  var fretSpacing = (endX - nutX) / fretCount;
  var dotY = 18;

  /* Resolved to the production app's existing CSS variable values rather
     than the prototype's custom palette, per the decision to match
     the app's existing theme. */
  var teal = '#1D9E75';
  var textMuted = isDark() ? '#888' : '#999';
  var stringColor = isDark() ? 'rgba(160,160,160,0.5)' : 'rgba(80,80,80,0.45)';
  var accidentalFill = 'rgba(102,102,102,0.22)';
  var accidentalText = '#666';

  /* This is a single-string diagram, not the multi-string fretboard component
     (js/fretboard-renderer.js) \u2014 it has no string axis to mirror, only the
     fret axis. xF(f) mirrors fret position around [nutX, endX] when the
     player has chosen left-handed, same "nut moves to the other edge, fret
     numbers count down" treatment as the real fretboard (spec 2.5). */
  var mirror = leftHanded;
  function xF(f) {
    var x = nutX + f * fretSpacing;
    return mirror ? (nutX + endX - x) : x;
  }

  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;">';
  svg += '<rect x="' + (xF(0) - 3) + '" y="' + (stringY - 8) + '" width="4" height="16" rx="1" fill="#999" opacity="0.5"/>';

  for (var f = 0; f <= fretCount; f++) {
    var x = xF(f);
    var isHalf = (f === 1 || f === 8);
    svg += '<line x1="' + x + '" y1="' + (stringY - 8) + '" x2="' + x + '" y2="' + (stringY + 8) + '" stroke="' + (isHalf ? teal : 'rgba(102,102,102,0.18)') + '" stroke-width="' + (isHalf ? 1.5 : 1) + '"/>';
  }

  svg += '<line x1="' + xF(0) + '" y1="' + stringY + '" x2="' + xF(fretCount) + '" y2="' + stringY + '" stroke="' + stringColor + '" stroke-width="2"/>';

  for (var f2 = 0; f2 <= fretCount; f2++) {
    var x2 = xF(f2);
    svg += '<text x="' + x2 + '" y="' + (stringY + 20) + '" text-anchor="middle" font-size="9" fill="' + textMuted + '">' + f2 + '</text>';
  }

  svg += '<text x="' + (xF(0) + (mirror ? 18 : -18)) + '" y="' + (stringY + 4) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + textMuted + '">E</text>';

  var notesToShow = showAllNotes ? FUND_FRET_NOTES : FUND_FRET_NATURALS;
  for (var i = 0; i < notesToShow.length; i++) {
    var fn = notesToShow[i];
    var x3 = xF(fn.fret);
    var isNat = showAllNotes ? fn.natural : true;
    var fill = isNat ? teal : accidentalFill;
    var txtFill = isNat ? '#fff' : accidentalText;
    var r = isNat ? 12 : 9;
    svg += '<circle cx="' + x3 + '" cy="' + dotY + '" r="' + r + '" fill="' + fill + '" stroke="' + (isNat ? teal : 'rgba(102,102,102,0.4)') + '" stroke-width="1"/>';
    svg += '<text x="' + x3 + '" y="' + (dotY + 4) + '" text-anchor="middle" font-size="' + (fn.note.length > 1 ? 8 : 11) + '" font-weight="700" fill="' + txtFill + '">' + fn.note + '</text>';
  }

  if (showStepLabels) {
    /* label every natural-to-natural gap as W or H */
    for (var n = 0; n < FUND_FRET_NATURALS.length - 1; n++) {
      var a2 = FUND_FRET_NATURALS[n];
      var b2 = FUND_FRET_NATURALS[n + 1];
      var gap = b2.fret - a2.fret;
      var label = gap === 1 ? 'H' : 'W';
      var mx2 = (xF(a2.fret) + xF(b2.fret)) / 2;
      svg += '<text x="' + mx2 + '" y="' + (stringY + 34) + '" text-anchor="middle" font-size="10" font-weight="800" fill="' + (gap === 1 ? teal : 'rgba(102,102,102,0.5)') + '">' + label + '</text>';
    }
  } else if (!showAllNotes) {
    /* half-step gap markers, E-F and B-C only */
    var pairs = [[0,1],[6,7]];
    for (var p = 0; p < pairs.length; p++) {
      var a = FUND_FRET_NATURALS[pairs[p][0]];
      var b = FUND_FRET_NATURALS[pairs[p][1]];
      var mx = (xF(a.fret) + xF(b.fret)) / 2;
      svg += '<text x="' + mx + '" y="' + (stringY + 34) + '" text-anchor="middle" font-size="9" font-weight="700" fill="' + teal + '">\u00BD</text>';
    }
  }

  svg += '</svg>';
  return svg;
}

function fundPingAlpha(note) {
  var items = document.querySelectorAll('.fund-alpha-note');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
  var noteEl = el('alpha-' + note);
  if (noteEl) noteEl.classList.add('active');

  var idx = FUND_NATURALS.indexOf(note);
  var next = FUND_NATURALS[(idx + 1) % FUND_NATURALS.length];
  var msg = el('alphaMsg');
  if (msg) msg.textContent = 'After ' + note + ' comes ' + next + ' \u2014 ' + (note === 'G' ? 'back to A (one octave up)' : 'up one step');

  setTimeout(function() {
    if (noteEl) noteEl.classList.remove('active');
    if (msg) msg.textContent = 'The cycle repeats every 7 notes';
  }, 1800);
}
