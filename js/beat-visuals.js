/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   MODULE 6: BEAT & TIMING — Visuals
   Foot-tap SVG, subdivision tick row, strum-arrow row.
   Markup is built once per render; per-frame updates only touch
   transform/classList, driven entirely by BeatClock.subscribe().
═══════════════════════════════════════════════════ */

var _beatVisualsFn       = null; /* current BeatClock subscriber, so we can unsubscribe cleanly */
var _beatVisualsLastBeat = -1;
var _beatVisualsLastSub  = -1;

/* Stylized athletic-sneaker silhouette — brand SVG, not photorealistic.
   Side profile, toe pointing right: a rounded heel counter (back, left),
   a compact tongue/lace peak, then a long, gradually-tapering low toe
   (roughly half the shoe's length) — that long low toe is the key cue
   that reads as "running shoe" rather than a rounded blob. */
function beatFootSVG() {
  return '<svg viewBox="0 0 100 60" class="beat-foot" id="beatFootSvg">' +
    '<path class="beat-foot__sole" d="M6,40 Q4,50 16,50 L88,50 Q97,50 95,40 ' +
      'Q90,46 80,46 L16,46 Q7,46 6,40 Z"/>' +
    '<path id="beatFootShoe" class="beat-foot__shoe" ' +
      'd="M8,40 C8,32 9,26 13,22 C18,17 22,16 27,18 S36,22 40,20 S46,12 50,11 ' +
      'S60,14 64,17 S80,24 86,28 S95,33 97,36 C98,39 96,41 91,42 ' +
      'C60,45 30,45 14,43 C10,42 8,41 8,40 Z"/>' +
    '<path class="beat-foot__laces" fill="none" d="M36,16 L41,22 M41,13 L46,19 M46,10 L51,16"/>' +
  '</svg>';
}

/* opts: { showTicks:bool, showMeasure:bool } — builds the shared foot-tap widget markup */
function beatBuildFootWidget(opts) {
  opts = opts || {};
  var ticks = '';
  if (opts.showTicks) {
    ticks = '<div class="beat-tick-row" id="beatTickRow"></div>';
  }
  return (
    '<div class="beat-foot-wrap">' +
      '<div class="beat-readout-row">' +
        '<div class="beat-bpm-readout beat-readout" id="beatBpmReadout">' + beatSettings.bpm + ' BPM</div>' +
        (opts.showMeasure ? '<div class="beat-measure-counter beat-readout" id="beatMeasureCounter"></div>' : '') +
      '</div>' +
      '<div class="beat-count-in" id="beatCountIn"></div>' +
      beatFootSVG() +
      ticks +
    '</div>'
  );
}

function beatBuildTickRow(container) {
  var row = document.getElementById('beatTickRow');
  if (!row) return;
  var count = BEAT_SUBDIVISIONS[BeatClock.subdivision].perBeat;
  var html = '';
  for (var i = 0; i < count; i++) {
    html += '<div class="beat-tick" id="beatTick' + i + '"></div>';
  }
  row.innerHTML = html;
}

/* generic labeled-slot row (rest = null) — used for Stage 4 strum arrows
   and Stage 3's tap/rest notation rows; glyph varies by label */
function beatBuildDotRow(slots, idPrefix) {
  var html = '<div class="beat-strum-row">';
  for (var i = 0; i < slots.length; i++) {
    var label  = slots[i];
    var filled = label !== null;
    var glyph  = label === 'D' ? '↓' : label === 'U' ? '↑' : filled ? '●' : '·';
    var cls    = label === 'D' ? 'down' : label === 'U' ? 'up' : filled ? 'down' : 'rest';
    html += '<div class="beat-arrow beat-arrow--' + cls + '"' + (idPrefix ? ' id="' + idPrefix + i + '"' : '') + '>' + glyph + '</div>';
  }
  html += '</div>';
  return html;
}

/* plain-text (no ids) version for use inside answer-choice buttons */
function beatDotRowText(slots) {
  return slots.map(function(s) {
    return s === 'D' ? '↓' : s === 'U' ? '↑' : s !== null ? '●' : '·';
  }).join(' ');
}

/* returns a BeatClock subscriber that highlights the currently-playing
   slot of `slots` during an automatic playback demo (Stage 3 Type 3) */
function beatPlaybackHighlightFactory(slots) {
  var lastIdx = -1;
  return function(phase) {
    var perBeat  = BEAT_SUBDIVISIONS.eighth.perBeat;
    var idx = Math.floor(phase.beatFloat * perBeat) % slots.length;
    if (idx === lastIdx) return;
    if (lastIdx !== -1) {
      var prev = document.getElementById('beatArrow' + lastIdx);
      if (prev) prev.classList.remove('beat-arrow--ontime');
    }
    var cur = document.getElementById('beatArrow' + idx);
    if (cur && slots[idx] !== null) cur.classList.add('beat-arrow--ontime');
    lastIdx = idx;
  };
}

function beatRenderFoot(phase) {
  var shoe = document.getElementById('beatFootShoe');
  if (!shoe) return; /* stage/mode switched away mid-frame */

  /* rock the foot: max "down" rotation right at the beat, max "up" at the off-beat */
  var angle = -8 * Math.cos(phase.phaseFraction * Math.PI * 2);
  shoe.parentElement.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';

  var svg = document.getElementById('beatFootSvg');
  if (svg) {
    if (phase.isBeatDown) {
      svg.classList.add('beat-foot--down');
      svg.classList.remove('beat-foot--up');
    } else {
      svg.classList.add('beat-foot--up');
      svg.classList.remove('beat-foot--down');
    }
  }

  /* brief glow exactly as a new beat lands */
  if (phase.beatIndex !== _beatVisualsLastBeat) {
    _beatVisualsLastBeat = phase.beatIndex;
    if (svg) {
      svg.classList.add('beat-foot--pulse');
      setTimeout(function() { svg.classList.remove('beat-foot--pulse'); }, 140);
    }
  }

  var bpmEl = document.getElementById('beatBpmReadout');
  if (bpmEl) bpmEl.textContent = Math.round(BeatClock.bpm) + ' BPM';

  var measureEl = document.getElementById('beatMeasureCounter');
  if (measureEl) {
    measureEl.textContent = 'Beat ' + (phase.beatInMeasure + 1) + ' / ' + BEAT_TIME_SIGS[BeatClock.timeSig].beatsPerMeasure;
  }

  var subCfg = BEAT_SUBDIVISIONS[BeatClock.subdivision];
  if (subCfg.perBeat > 1) {
    var subIdx = phase.subdivisionIndex % subCfg.perBeat;
    if (subIdx !== _beatVisualsLastSub) {
      _beatVisualsLastSub = subIdx;
      for (var i = 0; i < subCfg.perBeat; i++) {
        var tick = document.getElementById('beatTick' + i);
        if (!tick) continue;
        tick.classList.toggle('beat-tick--active', i === subIdx);
      }
    }
  }
}

function beatBindVisuals() {
  beatUnbindVisuals();
  _beatVisualsLastBeat = -1;
  _beatVisualsLastSub  = -1;
  beatBuildTickRow();
  _beatVisualsFn = beatRenderFoot;
  BeatClock.subscribe(_beatVisualsFn);
}

function beatUnbindVisuals() {
  if (_beatVisualsFn) {
    BeatClock.unsubscribe(_beatVisualsFn);
    _beatVisualsFn = null;
  }
}
