/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ── Stage 3: Sharps, Flats & Enharmonics — Study content ── */
var FUND_CHROMATIC_DISPLAY = [
  { name: 'A',  type: 'natural' }, { name: 'A#/B\u266D', type: 'acc' },
  { name: 'B',  type: 'natural' }, { name: 'C',  type: 'natural' },
  { name: 'C#/D\u266D', type: 'acc' }, { name: 'D',  type: 'natural' },
  { name: 'D#/E\u266D', type: 'acc' }, { name: 'E',  type: 'natural' },
  { name: 'F',  type: 'natural' }, { name: 'F#/G\u266D', type: 'acc' },
  { name: 'G',  type: 'natural' }, { name: 'G#/A\u266D', type: 'acc' }
];
var FUND_ENHARMONIC_PAIRS = [
  { sharp: 'C#', flat: 'D\u266D', from: 'C', to: 'D' },
  { sharp: 'D#', flat: 'E\u266D', from: 'D', to: 'E' },
  { sharp: 'F#', flat: 'G\u266D', from: 'F', to: 'G' },
  { sharp: 'G#', flat: 'A\u266D', from: 'G', to: 'A' },
  { sharp: 'A#', flat: 'B\u266D', from: 'A', to: 'B' }
];
var fundActiveEnharmIdx = 0;

function fundStage3Study() {
  var chromHtml = '';
  for (var i = 0; i < FUND_CHROMATIC_DISPLAY.length; i++) {
    var c = FUND_CHROMATIC_DISPLAY[i];
    var key = c.name.replace('/', '_');
    chromHtml += '<div class="fund-chrom-note ' + c.type + '" id="chrom-' + key + '" onclick="fundPingChromatic(\'' + c.name + '\',\'' + c.type + '\')">' + c.name + '</div>';
  }

  var pair = FUND_ENHARMONIC_PAIRS[fundActiveEnharmIdx];
  var pickerHtml = '';
  for (var j = 0; j < FUND_ENHARMONIC_PAIRS.length; j++) {
    var p = FUND_ENHARMONIC_PAIRS[j];
    pickerHtml += '<button class="fund-key-btn ' + (j === fundActiveEnharmIdx ? 'active' : '') + '" onclick="fundSetEnharm(' + j + ')">' + p.sharp + ' / ' + p.flat + '</button>';
  }

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 3 \u00B7 Sharps, Flats &amp; Enharmonics</div>' +
      '<div class="fund-title">The notes between the notes.</div>' +
      '<div class="fund-body">You already know a half step is the smallest gap between two pitches \u2014 one fret. Between most natural notes sits another pitch, exactly one half step away. Call it a <strong>sharp (\u266F)</strong> going up, a <strong>flat (\u266D)</strong> going down. Same fret, same sound, different name depending on direction.</div>' +
    '</div>' +

    '<div class="fund-string-diagram">' +
      '<div class="fund-string-label">Low E string \u00B7 All 12 pitches</div>' +
      '<div class="fund-string-wrap">' + fundBuildStringSVG(false, true) + '</div>' +
    '</div>' +

    '<div class="fund-section-divider"><span>All 12 chromatic pitches</span></div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Tap to explore</div>' +
      '<div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center;">' + chromHtml + '</div>' +
      '<div id="chromMsg" style="margin-top:10px;min-height:28px;font-size:12px;color:var(--text2);text-align:center;line-height:1.5;"></div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Enharmonic Equivalents</div>' +
      '<div class="fund-body" style="margin-bottom:10px;">Same pitch, two names. Which spelling you use depends on the key you\u2019re in \u2014 not the sound itself.</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">' +
        '<div style="text-align:center;"><div class="fund-enharm-pill" id="sharpPill">' + pair.sharp + '</div><div style="font-size:13px;color:var(--text2);margin-top:4px;font-weight:600;">sharp spelling</div></div>' +
        '<div style="font-size:20px;font-weight:700;color:var(--text3);">=</div>' +
        '<div style="text-align:center;"><div class="fund-enharm-pill" id="flatPill">' + pair.flat + '</div><div style="font-size:13px;color:var(--text2);margin-top:4px;font-weight:600;">flat spelling</div></div>' +
      '</div>' +
      '<div id="enharmCtx" style="font-size:12px;color:var(--text2);text-align:center;line-height:1.6;margin-top:10px;">' +
        'Moving <strong>up</strong> from ' + pair.from + ', the next pitch is <strong>' + pair.sharp + '</strong>. Moving <strong>down</strong> from ' + pair.to + ', that same pitch is <strong>' + pair.flat + '</strong>.' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px;">' + pickerHtml + '</div>' +
    '</div>' +

    '<div class="fund-callout"><strong>E\u2013F and B\u2013C have no sharp/flat between them.</strong> You\u2019ve already seen why \u2014 they\u2019re the two half-step pairs in the natural alphabet.</div>' +

    '<button class="fund-cta-btn" onclick="fundStartPractice(3)">Start Practice \u2192</button>'
  );
}

var FUND_CHROM_TIPS = {
  'natural': function(n) { return n + ' is a natural note \u2014 one of the 7 letter names.'; },
  'acc': function(n) {
    var parts = n.split('/');
    return parts[0] + ' and ' + parts[1] + ' are the same pitch \u2014 two names for one fret.';
  }
};

function fundPingChromatic(name, type) {
  var items = document.querySelectorAll('.fund-chrom-note');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('hl-nat', 'hl-acc');
  var key = name.replace('/', '_');
  var noteEl = el('chrom-' + key);
  if (noteEl) noteEl.classList.add(type === 'natural' ? 'hl-nat' : 'hl-acc');

  var msg = el('chromMsg');
  if (msg) msg.textContent = FUND_CHROM_TIPS[type](name);

  setTimeout(function() {
    if (noteEl) noteEl.classList.remove('hl-nat', 'hl-acc');
    if (msg) msg.textContent = '';
  }, 4000);
}

function fundSetEnharm(idx) {
  fundActiveEnharmIdx = idx;
  var pair = FUND_ENHARMONIC_PAIRS[idx];
  setText('sharpPill', pair.sharp);
  setText('flatPill', pair.flat);
  el('enharmCtx').innerHTML = 'Moving <strong>up</strong> from ' + pair.from + ', the next pitch is <strong>' + pair.sharp + '</strong>. Moving <strong>down</strong> from ' + pair.to + ', that same pitch is <strong>' + pair.flat + '</strong>.';
  var btns = document.querySelectorAll('.fund-key-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', i === idx);
}

