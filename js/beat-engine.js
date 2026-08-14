/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   MODULE 6: BEAT & TIMING — Tap-timing scoring engine
   Timing-delta scoring (ms early/late), NOT the correctness-based
   SRS engine used by Fretboard Notes — see module spec section 7.
   Every tap is scored against a "grid" derived straight from
   BeatClock, so there is no independent notion of "expected time."
═══════════════════════════════════════════════════ */

var beatTapState = {
  granularity:     'beat',  /* 'beat' | 'subdivision' */
  lastScoredIndex: -1,
  active:          false
};

function beatGridPerBeat() {
  return beatTapState.granularity === 'subdivision'
    ? BEAT_SUBDIVISIONS[BeatClock.subdivision].perBeat
    : 1;
}

function beatGridIndexAt(now) {
  var beatFloat = BeatClock._beatIndexAt(now);
  return beatFloat * beatGridPerBeat();
}

function beatGridTimeForIndex(gridIndex) {
  var beatFloat = gridIndex / beatGridPerBeat();
  return BeatClock.anchorTime + (beatFloat - BeatClock.anchorBeatIndex) * BeatClock.getBeatIntervalMs();
}

/* ── Tap capture (Stage 1/2 pulse+subdivision taps, Stage 3 Type 2) ── */

function beatStartTapTracking(granularity) {
  beatTapState.granularity     = granularity;
  beatTapState.lastScoredIndex = Math.floor(beatGridIndexAt(performance.now()));
  beatTapState.active          = true;
}

function beatStopTapTracking() {
  beatTapState.active = false;
}

function beatRecordTap(now) {
  if (!beatTapState.active) return null;
  now = now || performance.now();
  var gridFloat     = beatGridIndexAt(now);
  var nearestIdx    = Math.round(gridFloat);
  var expectedTime  = beatGridTimeForIndex(nearestIdx);
  var deltaMs       = now - expectedTime;
  var tol           = beatTolerance();
  var result;
  if (nearestIdx <= beatTapState.lastScoredIndex) {
    result = 'extra'; /* duplicate tap on an already-resolved beat */
  } else if (Math.abs(deltaMs) <= tol.onTime) {
    result = 'onTime';
    beatTapState.lastScoredIndex = nearestIdx;
  } else if (Math.abs(deltaMs) <= tol.wide) {
    result = deltaMs < 0 ? 'early' : 'late';
    beatTapState.lastScoredIndex = nearestIdx;
  } else {
    /* tap landed between beats, nowhere near one — don't consume this
       beat (a better-timed tap can still land it, or it'll be marked
       'missed' later); this must still surface visible feedback rather
       than silently doing nothing */
    result = 'tooFar';
  }
  beatPushTapResult({ expectedTime: expectedTime, actualTime: now, deltaMs: deltaMs, result: result });
  return result;
}

/* called every BeatClock frame while tap tracking is active; marks any
   grid point whose tolerance window has fully closed with no tap as 'missed' */
function beatCheckMisses(phase) {
  if (!beatTapState.active) return;
  var tol      = beatTolerance();
  var now      = phase.now;
  var idx      = Math.floor(beatGridIndexAt(now));
  for (var i = beatTapState.lastScoredIndex + 1; i <= idx; i++) {
    var expectedTime = beatGridTimeForIndex(i);
    if (now - expectedTime > tol.wide) {
      beatPushTapResult({ expectedTime: expectedTime, actualTime: null, deltaMs: null, result: 'missed' });
      beatTapState.lastScoredIndex = i;
    } else {
      break;
    }
  }
}

/* ── Generic slotted-pattern tap engine ──
   Shared by Stage 3's "Tap it" notation question and Stage 4's strum
   patterns — both are an eighth-note grid of labeled slots (note/rest,
   or down/up) where a tap must match both the timing window AND the
   expected label. */

var _beatActivePattern = null; /* array of slot labels, or null for a rest */

function beatSetActivePattern(slots) { _beatActivePattern = slots; }

function beatRecordPatternTap(tappedLabel, now) {
  if (!beatTapState.active || !_beatActivePattern) return null;
  now = now || performance.now();
  var gridFloat  = beatGridIndexAt(now);
  var nearestIdx = Math.round(gridFloat);
  var slotIdx    = ((nearestIdx % _beatActivePattern.length) + _beatActivePattern.length) % _beatActivePattern.length;
  var expected     = _beatActivePattern[slotIdx];
  var expectedTime = beatGridTimeForIndex(nearestIdx);
  var deltaMs      = now - expectedTime;
  var tol          = beatTolerance();
  var result;

  if (nearestIdx <= beatTapState.lastScoredIndex || expected === null) {
    result = 'extra';
  } else if (Math.abs(deltaMs) > tol.wide) {
    /* between slots, nowhere near one — leave it unresolved rather than
       silently swallowing the tap or falsely consuming a nearby slot */
    result = 'tooFar';
  } else {
    var labelOk  = tappedLabel === expected;
    var timingOk = Math.abs(deltaMs) <= tol.onTime;
    if (labelOk && timingOk) result = 'onTime';
    else if (!labelOk)       result = 'wrongDir';
    else                     result = deltaMs < 0 ? 'early' : 'late';
    beatTapState.lastScoredIndex = nearestIdx;
  }

  beatPushTapResult({
    expectedTime: expectedTime, actualTime: now, deltaMs: deltaMs, result: result,
    slotIdx: slotIdx, expectedLabel: expected
  });
  beatRenderStrumSlotResult(slotIdx, result);
  return result;
}

/* marks any non-rest slot whose window has closed with no tap as 'missed' */
function beatCheckPatternMisses(phase) {
  if (!beatTapState.active || !_beatActivePattern) return;
  var tol = beatTolerance();
  var now = phase.now;
  var idx = Math.floor(beatGridIndexAt(now));
  for (var i = beatTapState.lastScoredIndex + 1; i <= idx; i++) {
    var slotIdx = ((i % _beatActivePattern.length) + _beatActivePattern.length) % _beatActivePattern.length;
    if (_beatActivePattern[slotIdx] === null) { beatTapState.lastScoredIndex = i; continue; }
    var expectedTime = beatGridTimeForIndex(i);
    if (now - expectedTime > tol.wide) {
      beatPushTapResult({ expectedTime: expectedTime, actualTime: null, deltaMs: null, result: 'missed', slotIdx: slotIdx, expectedLabel: _beatActivePattern[slotIdx] });
      beatRenderStrumSlotResult(slotIdx, 'missed');
      beatTapState.lastScoredIndex = i;
    } else {
      break;
    }
  }
}

/* discrete (non-timing) question result — Stage 3 Type 1/3 multiple choice,
   adapted into the same rolling-taps shape so beatCheckMastery() needs no
   stage-specific branching for them */
function beatPushDiscreteResult(correct) {
  beatPushTapResult({ expectedTime: null, actualTime: null, deltaMs: null, result: correct ? 'onTime' : 'missed' });
}

function beatRenderStrumSlotResult(slotIdx, result) {
  var arrow = document.getElementById('beatArrow' + slotIdx);
  if (!arrow) return;
  arrow.classList.remove('beat-arrow--ontime', 'beat-arrow--correct', 'beat-arrow--wrong');
  if (result === 'onTime') arrow.classList.add('beat-arrow--correct');
  else if (beatIsScoredResult(result)) arrow.classList.add('beat-arrow--wrong');
}

/* 'extra' (duplicate tap) and 'tooFar' (tap landed between beats, unresolved)
   are not real attempts at a beat/slot — excluded from accuracy and counts */
function beatIsScoredResult(result) {
  return result !== 'extra' && result !== 'tooFar';
}

var _beatMissesFn = null;

function beatBindMissChecking(fn) {
  beatUnbindMissChecking();
  _beatMissesFn = fn;
  BeatClock.subscribe(_beatMissesFn);
}

function beatUnbindMissChecking() {
  if (_beatMissesFn) {
    BeatClock.unsubscribe(_beatMissesFn);
    _beatMissesFn = null;
  }
}

/* ── Rolling window + mastery ── */

function beatPushTapResult(entry) {
  beatSession.taps.push(entry);
  if (beatSession.taps.length > beatSession.rollingWindowSize) beatSession.taps.shift();
  beatUpdateScoreUI();
  beatCheckMastery();
}

function beatRollingAccuracy() {
  var scored = beatSession.taps.filter(function(t) { return beatIsScoredResult(t.result); });
  if (scored.length === 0) return 0;
  var good = scored.filter(function(t) { return t.result === 'onTime'; }).length;
  return good / scored.length;
}

function beatUpdateScoreUI() {
  var el1 = document.getElementById('beatAccuracyReadout');
  if (el1) el1.textContent = Math.round(beatRollingAccuracy() * 100) + '% on time';
  var el2 = document.getElementById('beatTapCountReadout');
  if (el2) {
    var scored = beatSession.taps.filter(function(t) { return beatIsScoredResult(t.result); });
    el2.textContent = scored.length + ' / ' + beatSession.rollingWindowSize;
  }
}

function beatWindowFull() {
  return beatSession.taps.filter(function(t) { return beatIsScoredResult(t.result); }).length >= beatSession.rollingWindowSize;
}

function beatCheckMastery() {
  if (!beatWindowFull()) return;
  var acc = beatRollingAccuracy();
  if (acc < 0.8) return;

  if (beatStage === 1 || beatStage === 2) {
    if (beatSession.bpmIndex < BEAT_TEMPO_PROGRESSION.length - 1) {
      beatSession.bpmIndex++;
      var newBpm = BEAT_TEMPO_PROGRESSION[beatSession.bpmIndex];
      beatSettings.bpm = newBpm;
      beatSaveSettings();
      BeatClock.setBpm(beatSettings.bpm);
      beatSession.taps = [];
      /* pause scoring — explain the tempo jump, then give a count-in at
         the new tempo before judging taps again; jumping with no warning
         felt unfair */
      var savedGranularity = beatTapState.granularity;
      beatStopTapTracking();
      beatToggleTapZonesDisabled(true);
      beatShowTempoPopup(newBpm, function() {
        beatShowCountIn(function() {
          beatToggleTapZonesDisabled(false);
          beatStartTapTracking(savedGranularity);
        });
      });
    } else {
      beatMarkStageComplete(beatStage);
    }
  } else if (beatStage === 3 || beatStage === 4) {
    beatMarkStageComplete(beatStage);
  }
}

/* ── Count-in: shows 4 beats of "1 2 3 4" before tap tracking (re)starts,
   so the player can feel a new/changed tempo before being scored on it ── */

function beatToggleTapZonesDisabled(disabled) {
  var zones = document.querySelectorAll('.beat-tap-zone');
  for (var i = 0; i < zones.length; i++) zones[i].classList.toggle('beat-tap-zone--disabled', disabled);
}

function beatShowCountIn(onComplete) {
  var countEl = document.getElementById('beatCountIn');
  if (!countEl) { onComplete(); return; }
  /* count "1..beatsPerMeasure" four full times through, so the player gets
     a real feel for the tempo rather than a single too-short measure */
  var beatsPerRep = BEAT_TIME_SIGS[BeatClock.timeSig].beatsPerMeasure;
  var totalReps   = 4;
  var totalBeats  = beatsPerRep * totalReps;
  var startBeatIndex = null;
  var shownBeatIndex  = null;

  countEl.classList.add('show');
  function tick(phase) {
    if (startBeatIndex === null) startBeatIndex = phase.beatIndex;
    var elapsed = phase.beatIndex - startBeatIndex + 1;
    if (elapsed > totalBeats) {
      BeatClock.unsubscribe(tick);
      countEl.classList.remove('show');
      onComplete();
      return;
    }
    if (phase.beatIndex !== shownBeatIndex) {
      shownBeatIndex = phase.beatIndex;
      countEl.textContent = ((elapsed - 1) % beatsPerRep) + 1;
    }
  }
  BeatClock.subscribe(tick);
}

function beatMarkStageComplete(stageId) {
  if (beatCompletedStages.indexOf(stageId) === -1) beatCompletedStages.push(stageId);
  beatRenderStageBar();
  var el1 = document.getElementById('beatStageCompleteBanner');
  if (el1) el1.classList.add('show');
}

/* ── Optional audio click (Web Audio, no dependency) ── */

var _beatAudioCtx       = null;
var _beatAudioLastBeat  = -1;
var _beatAudioClickFn   = null;

function beatEnsureAudioCtx() {
  if (!_beatAudioCtx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _beatAudioCtx = new AC();
  }
  return _beatAudioCtx;
}

function beatPlayClick(accent) {
  var ctx = beatEnsureAudioCtx();
  if (!ctx) return;
  var osc  = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.frequency.value = accent ? 1400 : 1000;
  gain.gain.setValueAtTime(0.22, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.06);
}

function beatAudioClickTick(phase) {
  if (!beatSettings.audioClick) return;
  if (phase.beatIndex === _beatAudioLastBeat) return;
  _beatAudioLastBeat = phase.beatIndex;
  beatPlayClick(phase.beatInMeasure === 0);
}

function beatBindAudioClick() {
  beatUnbindAudioClick();
  _beatAudioLastBeat = -1;
  _beatAudioClickFn = beatAudioClickTick;
  BeatClock.subscribe(_beatAudioClickFn);
}

function beatUnbindAudioClick() {
  if (_beatAudioClickFn) {
    BeatClock.unsubscribe(_beatAudioClickFn);
    _beatAudioClickFn = null;
  }
}
