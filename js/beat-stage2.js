/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   BEAT & TIMING — Stage 2: Subdivide
═══════════════════════════════════════════════════ */

function beatStage2Study() {
  var sigBtns = ['4/4','3/4','6/8'].map(function(sig) {
    var active = beatSettings.timeSig === sig ? ' active' : '';
    return '<button class="fund-sig-tab-btn' + active + '" style="flex:1;" onclick="beatSetStudyTimeSig(\'' + sig + '\')">' + sig + '</button>';
  }).join('');
  var subBtns = ['quarter','eighth','sixteenth'].map(function(sub) {
    var active = beatSettings.subdivision === sub ? ' active' : '';
    return '<button class="fund-sig-tab-btn' + active + '" style="flex:1;" onclick="beatSetStudySubdivision(\'' + sub + '\')">' + BEAT_SUBDIVISIONS[sub].label + '</button>';
  }).join('');
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 2 · Subdivide</div>' +
      '<div class="fund-title">Split the beat into smaller pieces</div>' +
      '<div class="fund-body">The small teal ticks are subdivisions of the main beat — two eighth notes, or four sixteenths, fit inside every foot-tap. The beat counter shows how beats group under each time signature.</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin:4px 0;">' + sigBtns + '</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:4px;">' + subBtns + '</div>' +
    beatBuildFootWidget({ showTicks: true, showMeasure: true }) +
    '<button class="fund-cta-btn" onclick="beatShowMode(\'practice\')">Start Practice →</button>'
  );
}

function beatSetStudyTimeSig(sig) {
  beatSettings.timeSig = sig;
  beatSaveSettings();
  beatRenderContent();
}

function beatSetStudySubdivision(sub) {
  beatSettings.subdivision = sub;
  beatSaveSettings();
  beatRenderContent();
}

function beatStage2Practice() {
  var subLabel = BEAT_SUBDIVISIONS[beatSettings.subdivision].label.toLowerCase();
  return (
    '<div class="fq-shell">' +
      '<div class="fq-prompt-row">' +
        '<div>' +
          '<div class="fq-question">Tap every ' + subLabel + ' note</div>' +
          '<div class="fq-sub">Not just the main beat — every subdivision tick.</div>' +
        '</div>' +
        '<div class="fq-badge-col">' +
          '<div class="fq-type-badge" id="beatTapCountReadout">0 / ' + beatSession.rollingWindowSize + '</div>' +
          '<div class="fq-streak" id="beatAccuracyReadout">0% on time</div>' +
        '</div>' +
      '</div>' +
      beatBuildFootWidget({ showTicks: true, showMeasure: true }) +
      '<div class="beat-tap-zone beat-tap-zone--disabled" id="beatTapZone2">TAP</div>' +
      '<div class="beat-last-tap" id="beatLastTapFeedback">&nbsp;</div>' +
      '<div class="beat-stage-complete" id="beatStageCompleteBanner">Stage complete! Tap a stage dot above to continue.</div>' +
    '</div>'
  );
}

function beatStage2Bind(mode) {
  BeatClock.start(beatSettings.bpm, beatSettings.timeSig, beatSettings.subdivision);
  beatBindVisuals();
  beatBindAudioClick();
  if (mode === 'practice') {
    beatResetSession();
    var granularity = beatSettings.subdivision === 'quarter' ? 'beat' : 'subdivision';
    beatBindMissChecking(beatCheckMisses);
    beatBindTapInput('beatTapZone2', function() {
      var r = beatRecordTap();
      beatShowLastTapFeedback(r);
    });
    beatShowCountIn(function() {
      beatToggleTapZonesDisabled(false);
      beatStartTapTracking(granularity);
    });
  }
}
