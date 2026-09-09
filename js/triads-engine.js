/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   MODULE 4: TRIAD POSITIONS — Practice Engine
═══════════════════════════════════════════════════ */

var TRIAD_QUIZ = {
  correct:  0,
  total:    0,
  streak:   0,
  currentQ: null,
  answered: false
};

var TRIAD_MASTERY_STREAK = 9;

/* triadsShowMode is defined in triads-shell.js */

function triadsStartPractice() {
  triadsShowMode('practice');
}

function triadsUpdateStats() {
  var stats = el('triads-stats');
  if (!stats) return;

  stats.style.display        = 'flex';
  stats.style.alignItems     = 'center';
  stats.style.justifyContent = 'space-between';

  if (triadsMode === 'practice') {
    var f    = TRIAD_PRACTICE_FILTERS;
    var sets = triadsStringSets();
    var numSets = f.sets === null ? sets.length : f.sets.length;

    var leftParts = [];
    if (numSets < sets.length) {
      leftParts.push(numSets === 1
        ? sets[f.sets[0]].label
        : numSets + ' sets');
    }
    if (f.qualities.length === 1) leftParts.push(f.qualities[0].charAt(0).toUpperCase() + f.qualities[0].slice(1) + ' only');
    if (f.inversions.length < 3)  leftParts.push(f.inversions.length + ' inv.');
    var filterLabel = leftParts.length ? leftParts.join(' · ') : 'All triads';

    var scoreRight = TRIAD_QUIZ.streak > 1
      ? TRIAD_QUIZ.correct + '/' + TRIAD_QUIZ.total + ' &nbsp;<span style="color:var(--teal);font-weight:700;">' + TRIAD_QUIZ.streak + ' in a row</span>'
      : TRIAD_QUIZ.correct + '/' + TRIAD_QUIZ.total + ' correct';

    stats.innerHTML =
      '<span style="font-size:12px;color:var(--text2);">' + filterLabel + '</span>' +
      '<span style="font-size:12px;color:var(--text3);">' + scoreRight + '</span>';
  } else {
    var SS = triadsStringSets()[triadsStageSetMap()[triadsStage]];
    stats.innerHTML =
      '<span style="font-size:12px;color:var(--text2);">Stage ' + triadsStage + ' · ' + SS.names + '</span>' +
      '<span style="font-size:12px;color:var(--text3);">' + triadsStageList().length + ' stages</span>';
  }
}

function triadsRenderPracticeQ() {
  var c = el('fundamentals-content');
  TRIAD_BUILD.placed    = [];
  TRIAD_BUILD.validated = false;
  var q = triadsGenQuestion();
  TRIAD_QUIZ.currentQ  = q;
  TRIAD_QUIZ.answered  = false;

  c.innerHTML =
    triadsModeTabs() +
    '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<div style="padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">' +
        '<div style="font-size:16px;font-weight:700;color:var(--text);line-height:1.25;">' + q.prompt + '</div>' +
        '<div style="font-size:11px;color:var(--text2);margin-top:2px;">' + q.sub + '</div>' +
      '</div>' +
      '<div class="fund-lesson-card" style="padding:8px;">' +
        '<div id="triads-fb-outer" style="cursor:pointer;"><div id="triads-board" class="fb-board"></div></div>' +
      '</div>' +
      '<div id="triadsFB" style="text-align:center;font-size:13px;color:var(--text3);padding:4px 0;">Tap each string to place the notes</div>' +
    '</div>';

  triadsDrawBuildCanvas(q.shape, [], null);
  triadsUpdateStats();

  var outer = el('triads-fb-outer');
  outer.addEventListener('click', triadsHandleBuildTap);
  outer.addEventListener('touchend', triadsHandleBuildTapTouch, { passive: false });
}

function triadsGenQuestion() {
  var f    = TRIAD_PRACTICE_FILTERS;
  var sets = triadsStringSets();
  var setPool = (f.sets === null || f.sets.length === 0)
    ? sets.map(function(_, i) { return i; })
    : f.sets.filter(function(i) { return i < sets.length; });

  var setIdx    = setPool[Math.floor(Math.random() * setPool.length)];
  var root      = Math.floor(Math.random() * 12);
  var quality   = f.qualities[Math.floor(Math.random() * f.qualities.length)];
  var inversion = f.inversions[Math.floor(Math.random() * f.inversions.length)];
  var shape     = triadsGetShape(root, quality, inversion, setIdx);
  var SS        = sets[setIdx];

  return {
    prompt: TRIAD_ROOT_NAMES[root] + ' ' + quality + ' — ' + TRIAD_INV_FULL[inversion],
    sub:    SS.names + ' strings',
    shape:  shape
  };
}

/* Map a click/touch event to (stringIdx, fret) and place a dot.
   Uses fbClientToBoardXY (js/fretboard-renderer.js) for the pixel→board-
   local conversion — the same plumbing fbHitTest uses — but snaps to the
   nearest of the shape's own 3 strings rather than the nearest of all,
   since only those 3 are tappable here. This also means taps resolve
   correctly under left-handed mirroring for free: xForFret/yForString
   already produced the (possibly mirrored) dot positions the player sees,
   and fretForX/yForString invert that same transform here. */
function triadsHandleBuildTap(e) {
  if (TRIAD_BUILD.validated) return;
  var pt = fbClientToBoardXY('triads-fb-outer', e.clientX, e.clientY);
  if (!pt) return;
  var geom = pt.geom;

  var activeStrings = TRIAD_QUIZ.currentQ.shape.strings;
  var stringIdx = activeStrings.reduce(function(best, s) {
    return Math.abs(pt.y - yForString(s, geom)) < Math.abs(pt.y - yForString(best, geom)) ? s : best;
  }, activeStrings[0]);

  var fret = fretForX(pt.x, geom);
  if (fret < geom.fretLo || fret > geom.fretHi) return;

  triadsBuildPlace(stringIdx, fret);
}

function triadsHandleBuildTapTouch(e) {
  e.preventDefault();
  triadsHandleBuildTap(e.changedTouches[0]);
}

/* Place (or replace) a dot on a string, then redraw; auto-validate on third dot */
function triadsBuildPlace(stringIdx, fret) {
  TRIAD_BUILD.placed = TRIAD_BUILD.placed.filter(function(d) {
    return d.stringIdx !== stringIdx;
  });
  TRIAD_BUILD.placed.push({ stringIdx: stringIdx, fret: fret });

  var remaining = 3 - TRIAD_BUILD.placed.length;
  var fb = el('triadsFB');
  if (fb) fb.textContent = remaining > 0
    ? remaining + ' note' + (remaining === 1 ? '' : 's') + ' to go'
    : 'Checking…';

  triadsDrawBuildCanvas(TRIAD_QUIZ.currentQ.shape, TRIAD_BUILD.placed, null);

  if (TRIAD_BUILD.placed.length === 3) setTimeout(triadsBuildValidate, 120);
}

/* Compare placed dots to correct shape, score, and reveal */
function triadsBuildValidate() {
  TRIAD_BUILD.validated = true;
  var shape = TRIAD_QUIZ.currentQ.shape;

  /* Build lookup: stringIdx → {fret, role} */
  var correct = {};
  for (var i = 0; i < 3; i++) {
    correct[shape.strings[i]] = { fret: shape.frets[i], role: shape.roles[i] };
  }

  var allRight = true;
  var results  = [];
  var covered  = {};

  TRIAD_BUILD.placed.forEach(function(dot) {
    var c  = correct[dot.stringIdx];
    var ok = c && c.fret === dot.fret;
    results.push({ correct: ok, role: ok ? c.role : -1 });
    if (ok) covered[dot.stringIdx] = true;
    else    allRight = false;
  });

  /* Strings the user got wrong or skipped — show their correct positions */
  var missing = shape.strings
    .filter(function(si) { return !covered[si]; })
    .map(function(si) {
      var j = shape.strings.indexOf(si);
      return { stringIdx: si, fret: shape.frets[j], role: shape.roles[j] };
    });

  TRIAD_QUIZ.total++;
  if (allRight) { TRIAD_QUIZ.correct++; TRIAD_QUIZ.streak++; }
  else          { TRIAD_QUIZ.streak = 0; }

  triadsDrawBuildCanvas(shape, TRIAD_BUILD.placed, { results: results, missing: missing });
  triadsUpdateStats();

  var fb = el('triadsFB');
  if (allRight) {
    var note = TRIAD_QUIZ.streak >= TRIAD_MASTERY_STREAK
      ? ' ' + TRIAD_QUIZ.streak + ' in a row!' : '';
    fb.innerHTML = '<span class="fq-fb-correct">✓ ' + TRIAD_INV_FULL[shape.inversion] +
                   ' — ' + TRIAD_INV_BASS[shape.inversion] + '.' + note + '</span>';
  } else {
    fb.innerHTML = '<span class="fq-fb-wrong">Not quite — correct shape shown.</span>';
  }
  fb.innerHTML += '<button class="fq-continue-btn" onclick="triadsNextQ()">Next →</button>';
}

function triadsNextQ() {
  triadsRenderPracticeQ();
}
