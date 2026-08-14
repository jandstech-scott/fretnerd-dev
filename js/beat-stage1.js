/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   BEAT & TIMING — Stage 1: Find the Pulse
═══════════════════════════════════════════════════ */

function beatStage1Study() {
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 1 · Find the Pulse</div>' +
      '<div class="fund-title">Feel the beat before you play it</div>' +
      '<div class="fund-body">Watch the foot tap a steady quarter-note pulse. <b>Copper</b> means "the beat" — <b>silver</b> means the space between beats, the "and." Don’t tap yet — just watch and count along in your head: 1, 2, 3, 4.</div>' +
    '</div>' +
    beatBuildFootWidget({ showTicks: false, showMeasure: false }) +
    '<div style="display:flex;justify-content:center;margin:8px 0;">' +
      '<button class="fund-key-btn' + (beatSettings.audioClick ? ' active' : '') + '" onclick="beatToggleStudyClick()" id="beatStudyClickBtn">' +
        (beatSettings.audioClick ? '\u{1F50A} Audio click: On' : '\u{1F508} Audio click: Off') +
      '</button>' +
    '</div>' +
    '<button class="fund-cta-btn" onclick="beatShowMode(\'practice\')">Start Practice →</button>'
  );
}

function beatToggleStudyClick() {
  beatSettings.audioClick = !beatSettings.audioClick;
  beatSaveSettings();
  var btn = document.getElementById('beatStudyClickBtn');
  if (btn) {
    btn.textContent = beatSettings.audioClick ? '\u{1F50A} Audio click: On' : '\u{1F508} Audio click: Off';
    btn.classList.toggle('active', beatSettings.audioClick);
  }
}

function beatStage1Practice() {
  return (
    '<div class="fq-shell">' +
      '<div class="fq-prompt-row">' +
        '<div>' +
          '<div class="fq-question">Tap the beat</div>' +
          '<div class="fq-sub">Spacebar, click, or tap the zone below — right on the copper beat.</div>' +
        '</div>' +
        '<div class="fq-badge-col">' +
          '<div class="fq-type-badge" id="beatTapCountReadout">0 / ' + beatSession.rollingWindowSize + '</div>' +
          '<div class="fq-streak" id="beatAccuracyReadout">0% on time</div>' +
        '</div>' +
      '</div>' +
      beatBuildFootWidget({ showTicks: false, showMeasure: false }) +
      '<div class="beat-tap-zone beat-tap-zone--disabled" id="beatTapZone1">TAP</div>' +
      '<div class="beat-last-tap" id="beatLastTapFeedback">&nbsp;</div>' +
      '<div class="beat-stage-complete" id="beatStageCompleteBanner">Stage complete! Tap a stage dot above to continue.</div>' +
    '</div>'
  );
}

/* every tap must show something — silent/blank feedback reads as "nothing
   happened" and makes it impossible to tell a stray tap from a bug */
var BEAT_TAP_FEEDBACK_LABELS = {
  onTime: 'On time!', early: 'A touch early', late: 'A touch late',
  missed: 'Missed', wrongDir: 'Wrong direction',
  tooFar: 'Between beats — wait for the next one', extra: 'Already counted that beat'
};

function beatShowLastTapFeedback(result) {
  var el1 = document.getElementById('beatLastTapFeedback');
  if (!el1) return;
  if (result === null || result === undefined) {
    el1.textContent = 'Hang on — count-in still running';
    el1.className = 'beat-last-tap beat-last-tap--wait';
    return;
  }
  el1.textContent = BEAT_TAP_FEEDBACK_LABELS[result] || '';
  el1.className = 'beat-last-tap beat-last-tap--' + result;
}

function beatStage1Bind(mode) {
  BeatClock.start(beatSettings.bpm, beatSettings.timeSig, 'quarter');
  beatBindVisuals();
  beatBindAudioClick();
  if (mode === 'practice') {
    beatResetSession();
    beatBindMissChecking(beatCheckMisses);
    beatBindTapInput('beatTapZone1', function() {
      var r = beatRecordTap();
      beatShowLastTapFeedback(r);
    });
    /* hold off scoring until the player has felt a few beats of this tempo */
    beatShowCountIn(function() {
      beatToggleTapZonesDisabled(false);
      beatStartTapTracking('beat');
    });
  }
}
