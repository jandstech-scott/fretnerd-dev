/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ── Stage 6: Natural Minor Scales — Study content ── */
var fundStage6SelectedRoot = 'A'; /* A minor — relative minor of C, simplest starting point */

function fundStage6Study() {
  var majorKey = fundKeyByMinorRoot(fundStage6SelectedRoot);
  var keyBtns = '';
  for (var i = 0; i < FUND_MAJOR_KEYS.length; i++) {
    var k = FUND_MAJOR_KEYS[i];
    keyBtns += '<button class="fund-key-btn ' + (k.relativeMinorRoot === fundStage6SelectedRoot ? 'active' : '') + '" onclick="fundSelectStage6Key(\'' + k.relativeMinorRoot + '\')">' + k.displayRelativeMinor + 'm</button>';
  }

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 6 \u00B7 Natural Minor Scales</div>' +
      '<div class="fund-title">Same notes. Different home.</div>' +
      '<div class="fund-body">Every relative minor you learned in Stage 5 has its own scale, and you already know it. It\u2019s the same 7 notes as its major key, just starting from a different note. ' + majorKey.displayKey + ' major and ' + majorKey.displayRelativeMinor + ' minor share every note. Only which one feels like \u201Chome\u201D changes.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Two Formulas, Same Notes</div>' +
      '<div class="fund-body" style="margin-bottom:14px;">Major and natural minor use different formulas. Starting from their own root, they land on the same 7 pitches, just in a different order.</div>' +
      '<div class="fund-formula-compare-label">Major</div>' +
      '<div class="fund-formula-row" style="margin:6px 0 16px;">' +
        '<div class="fund-formula-step whole">W</div><div class="fund-formula-step whole">W</div>' +
        '<div class="fund-formula-step half">H</div><div class="fund-formula-step whole">W</div>' +
        '<div class="fund-formula-step whole">W</div><div class="fund-formula-step whole">W</div>' +
        '<div class="fund-formula-step half">H</div>' +
      '</div>' +
      '<div class="fund-formula-compare-label">Natural minor</div>' +
      '<div class="fund-formula-row" style="margin:6px 0 14px;">' +
        '<div class="fund-formula-step whole">W</div><div class="fund-formula-step half">H</div>' +
        '<div class="fund-formula-step whole">W</div><div class="fund-formula-step whole">W</div>' +
        '<div class="fund-formula-step half">H</div><div class="fund-formula-step whole">W</div>' +
        '<div class="fund-formula-step whole">W</div>' +
      '</div>' +
      '<div class="fund-body" style="font-size:13px;margin-top:4px;">Notice the half steps land in different places: that\u2019s what gives minor its different character, even using the same notes as its relative major.</div>' +
    '</div>' +

    '<div class="fund-section-divider"><span>Try it: pick a minor key</span></div>' +

    '<div class="fund-lesson-card">' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:10px;">' + keyBtns + '</div>' +
      '<div class="fund-scale-builder" id="fundMinorScaleBuilder">' + fundBuildMinorScaleBuilderHTML(majorKey) + '</div>' +
      '<div class="fund-minor-major-link" id="fundMinorMajorLink">' + fundRenderMinorMajorLink(majorKey) + '</div>' +
    '</div>' +

    '<div class="fund-callout"><strong>Same key signature, both directions.</strong> Whatever sharps or flats belong to a major key belong to its relative minor too. You already know every minor key\u2019s signature from Stage 4, you just didn\u2019t know it yet.</div>' +

    '<button class="fund-cta-btn" onclick="fundStartPractice(6)">Start Practice \u2192</button>'
  );
}

function fundBuildMinorScaleBuilderHTML(majorKey) {
  var items = '';
  for (var i = 0; i < majorKey.relativeMinorScale.length; i++) {
    items += '<div class="fund-scale-note' + (i === 0 ? ' root' : '') + '">' + majorKey.relativeMinorScale[i] + '</div>';
    if (i < majorKey.relativeMinorScale.length - 1) {
      var isHalf = FUND_MINOR_SCALE_FORMULA[i] === 1;
      items += '<div class="fq-formula-connector ' + (isHalf ? 'half' : 'whole') + '">' + (isHalf ? 'H' : 'W') + '</div>';
    }
  }
  return items;
}

function fundRenderMinorMajorLink(majorKey) {
  return '<div style="font-size:12px;color:var(--text2);text-align:center;line-height:1.6;">' +
    '<strong style="color:var(--text);">' + majorKey.displayRelativeMinor + ' minor</strong> is the relative minor of ' +
    '<strong style="color:var(--text);">' + majorKey.displayKey + ' major</strong>: ' +
    majorKey.scale.join(' ') + ', starting from ' + majorKey.displayRelativeMinor + ' instead of ' + majorKey.displayKey + '.' +
  '</div>';
}

function fundSelectStage6Key(minorRoot) {
  fundStage6SelectedRoot = minorRoot;
  var majorKey = fundKeyByMinorRoot(minorRoot);
  var btns = document.querySelectorAll('.fund-key-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].textContent === majorKey.displayRelativeMinor + 'm');
  el('fundMinorScaleBuilder').innerHTML = fundBuildMinorScaleBuilderHTML(majorKey);
  el('fundMinorMajorLink').innerHTML = fundRenderMinorMajorLink(majorKey);
}
