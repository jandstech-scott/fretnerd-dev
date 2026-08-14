/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   BEAT & TIMING — Stage 4: Strum in Time
   Down/up strum patterns scored on both timing AND direction,
   via the generic slotted-pattern engine shared with Stage 3.
═══════════════════════════════════════════════════ */

function beatStage4Study() {
  var pattern = beatCurrentStrumPattern();
  var patternBtns = BEAT_STRUM_PATTERNS.map(function(p) {
    var active = p.id === beatSettings.strumPattern ? ' active' : '';
    return '<button class="fund-sig-tab-btn' + active + '" style="flex:1;" onclick="beatSetStudyPattern(\'' + p.id + '\')">' + p.label + '</button>';
  }).join('');
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 4 · Strum in Time</div>' +
      '<div class="fund-title">Put the pulse in your strumming hand</div>' +
      '<div class="fund-body">↓ = downstroke, ↑ = upstroke. Watch which arrows light up on the beat vs. the "and" — the foot-tap pulse never stops underneath, on guitar or bass.</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin:4px 0;">' + patternBtns + '</div>' +
    beatBuildFootWidget({ showTicks: false, showMeasure: false }) +
    beatBuildDotRow(pattern.slots, 'beatArrow') +
    '<button class="fund-cta-btn" onclick="beatShowMode(\'practice\')">Start Practice →</button>'
  );
}

function beatSetStudyPattern(id) {
  beatSettings.strumPattern = id;
  beatSaveSettings();
  beatRenderContent();
}

function beatStage4Practice() {
  var pattern = beatCurrentStrumPattern();
  var verb = (typeof instrument !== 'undefined' && instrument === 'bass') ? 'plucking' : 'strumming';
  return (
    '<div class="fq-shell">' +
      '<div class="fq-prompt-row">' +
        '<div>' +
          '<div class="fq-question">' + pattern.label + '</div>' +
          '<div class="fq-sub">Tap the DOWN/UP zones (or ↓/↑ arrow keys) while ' + verb + ' along, right on the beat.</div>' +
        '</div>' +
        '<div class="fq-badge-col">' +
          '<div class="fq-type-badge" id="beatTapCountReadout">0 / ' + beatSession.rollingWindowSize + '</div>' +
          '<div class="fq-streak" id="beatAccuracyReadout">0% on time</div>' +
        '</div>' +
      '</div>' +
      beatBuildFootWidget({ showTicks: false, showMeasure: false }) +
      beatBuildDotRow(pattern.slots, 'beatArrow') +
      '<div style="display:flex;gap:10px;">' +
        '<div class="beat-tap-zone beat-tap-zone--down beat-tap-zone--disabled" id="beatDownZone">DOWN ↓</div>' +
        '<div class="beat-tap-zone beat-tap-zone--up beat-tap-zone--disabled" id="beatUpZone">UP ↑</div>' +
      '</div>' +
      '<div class="beat-last-tap" id="beatLastTapFeedback">&nbsp;</div>' +
      '<div class="beat-stage-complete" id="beatStageCompleteBanner">Stage complete! You’ve finished Beat &amp; Timing.</div>' +
    '</div>'
  );
}

function beatStage4Bind(mode) {
  var pattern = beatCurrentStrumPattern();
  BeatClock.start(beatSettings.bpm, '4/4', 'eighth');
  beatBindVisuals();
  beatBindAudioClick();
  if (mode === 'study') {
    BeatClock.subscribe(beatPlaybackHighlightFactory(pattern.slots));
  } else {
    beatResetSession();
    beatSetActivePattern(pattern.slots);
    beatBindMissChecking(beatCheckPatternMisses);
    beatBindDirectionalInput('beatDownZone', 'beatUpZone',
      function() { beatShowLastTapFeedback(beatRecordPatternTap('D')); },
      function() { beatShowLastTapFeedback(beatRecordPatternTap('U')); }
    );
    beatShowCountIn(function() {
      beatToggleTapZonesDisabled(false);
      beatStartTapTracking('subdivision');
    });
  }
}
