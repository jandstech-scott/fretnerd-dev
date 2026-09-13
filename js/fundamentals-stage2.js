/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ── Stage 2: Whole & Half Steps — Study content ── */
function fundStage2Study() {
  var rowHtml = '';
  for (var i = 0; i < FUND_NATURALS.length; i++) {
    var n = FUND_NATURALS[i];
    rowHtml += '<div class="fund-step-note" id="measure-' + n + '" onclick="fundMeasureStep(\'' + n + '\')">' + n + '</div>';
  }

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 2 \u00B7 Whole &amp; Half Steps</div>' +
      '<div class="fund-title">The two distances everything is built from.</div>' +
      '<div class="fund-body">You already spotted this in Stage 1: E\u2192F and B\u2192C are one fret apart. Every other natural note pair is two frets apart. Those two distances have names: <strong>half step</strong> (one fret) and <strong>whole step</strong> (two frets). Every scale, every chord, every interval you\u2019ll ever play is just a sequence of these two.</div>' +
    '</div>' +

    '<div class="fund-string-diagram">' +
      '<div class="fund-string-label">Low E string \u00B7 Whole &amp; half steps marked</div>' +
      '<div class="fund-string-wrap">' + fundBuildStringSVG(true) + '</div>' +
      '<div class="fund-callout" style="margin-top:10px;"><strong>Half step (H):</strong> one fret. Only E-F and B-C are this close.<br><strong>Whole step (W):</strong> two frets. Every other natural pair.</div>' +
    '</div>' +

    '<div class="fund-section-divider"><span>Tap any note to measure the gap</span></div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Try it</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:8px 0;">' + rowHtml + '</div>' +
      '<div id="stepMeasureMsg" style="margin-top:10px;min-height:20px;font-size:12px;color:var(--text2);text-align:center;">Tap any note to see the gap to the next one</div>' +
    '</div>' +

    '<div class="fund-callout"><strong>Why only 7 letters for 12 pitches?</strong> Because the gaps aren\u2019t even. Five of the seven natural pairs are a whole step apart, leaving room for a sharp/flat in between. The other two (E-F, B-C) are already a half step. No room for anything between them.</div>' +

    '<button class="fund-cta-btn" onclick="fundStartPractice(2)">Start Practice \u2192</button>'
  );
}

function fundMeasureStep(note) {
  var items = document.querySelectorAll('.fund-step-note');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');

  var idx = FUND_NATURALS.indexOf(note);
  var next = FUND_NATURALS[(idx + 1) % FUND_NATURALS.length];
  var isHalf = (note === 'E' && next === 'F') || (note === 'B' && next === 'C');

  var a = el('measure-' + note); if (a) a.classList.add('active');
  var b = el('measure-' + next); if (b) b.classList.add('active');

  var msg = el('stepMeasureMsg');
  if (msg) {
    msg.innerHTML = isHalf
      ? '<strong style="color:var(--teal-txt);">' + note + ' \u2192 ' + next + ' is a half step</strong>. Just one fret, no room for anything between them.'
      : '<strong>' + note + ' \u2192 ' + next + ' is a whole step</strong>. Two frets, with a sharp/flat sitting in between.';
  }

  setTimeout(function() {
    var items2 = document.querySelectorAll('.fund-step-note');
    for (var j = 0; j < items2.length; j++) items2[j].classList.remove('active');
    if (msg) msg.textContent = 'Tap any note to see the gap to the next one';
  }, 4000);
}
