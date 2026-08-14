/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   BEAT & TIMING — Stage 3: Read Rhythm
   3 question types per the spec: Count it (multiple choice),
   Tap it (real-time tap-along), Identify (pick matching notation
   after a silent playback demo). All three feed the same rolling
   accuracy window via beatPushTapResult()/beatPushDiscreteResult().
═══════════════════════════════════════════════════ */

/* one-measure (8 eighth-note slot) rhythm patterns, 'T' = tap, null = rest */
var BEAT_RHYTHM_PATTERNS = [
  { id: 'all-quarters', label: 'All quarter notes',           beats: 4, slots: ['T',null,'T',null,'T',null,'T',null] },
  { id: 'all-eighths',  label: 'All eighth notes',            beats: 4, slots: ['T','T','T','T','T','T','T','T'] },
  { id: 'quarter-rests',label: 'Quarters with rests',         beats: 4, slots: ['T',null,null,null,'T',null,'T',null] },
  { id: 'syncopated',   label: 'Syncopated (the "and" of 2)', beats: 4, slots: ['T',null,null,'T','T',null,'T',null] }
];

var BEAT_Q3 = { type: 1, target: null, answered: false, _options: null, _choices: null };
var _beat3PlaybackFn = null;

function beatStage3Study() {
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 3 · Read Rhythm</div>' +
      '<div class="fund-title">Notation is just the pulse, written down</div>' +
      '<div class="fund-body">Each filled dot is a note, each gap is a rest. Count out loud as you look: <b>"1 + 2 + 3 + 4 +"</b> for straight eighth notes, <b>"1 _ 2 _ 3 _ 4 _"</b> for quarter notes.</div>' +
    '</div>' +
    BEAT_RHYTHM_PATTERNS.slice(0, 2).map(function(p) {
      return '<div class="fund-string-diagram">' +
        '<div class="fund-string-label">' + p.label + '</div>' +
        beatBuildDotRow(p.slots) +
      '</div>';
    }).join('') +
    '<button class="fund-cta-btn" onclick="beatShowMode(\'practice\')">Start Practice →</button>'
  );
}

function beatStage3Practice() {
  return '<div class="fq-shell" id="beatQ3Shell"></div>';
}

function beatStage3Bind(mode) {
  if (mode === 'practice') beatStage3NextQuestion();
}

function beatStage3TypeLabel() {
  if (BEAT_Q3.type === 1) return 'Count it';
  if (BEAT_Q3.type === 2) return 'Tap it';
  return 'Identify';
}

function beatStage3NextQuestion() {
  var types = [1, 2, 3];
  BEAT_Q3.type     = types[Math.floor(Math.random() * types.length)];
  BEAT_Q3.target   = BEAT_RHYTHM_PATTERNS[Math.floor(Math.random() * BEAT_RHYTHM_PATTERNS.length)];
  BEAT_Q3.answered = false;
  var shell = document.getElementById('beatQ3Shell');
  if (shell) shell.innerHTML = beatStage3RenderQuestion();
  beatStage3BindQuestion();
}

function beatStage3RenderQuestion() {
  var header =
    '<div class="fq-prompt-row">' +
      '<div><div class="fq-question">' + beatStage3TypeLabel() + '</div>' +
      '<div class="fq-sub">Rolling accuracy over this session</div></div>' +
      '<div class="fq-badge-col">' +
        '<div class="fq-type-badge">' + Math.round(beatRollingAccuracy() * 100) + '%</div>' +
      '</div>' +
    '</div>';

  if (BEAT_Q3.type === 1) {
    var count = BEAT_Q3.target.beats;
    var opts = fundShuffle([count - 1, count, count + 1, count + 2]);
    BEAT_Q3._options = opts;
    return header +
      beatBuildDotRow(BEAT_Q3.target.slots) +
      '<div class="fq-question" style="font-size:15px;margin-top:8px;">How many beats does this measure contain?</div>' +
      '<div class="fq-answers">' +
        opts.map(function(o, i) {
          return '<button class="fq-answer-btn" id="beatQ3Opt' + i + '" onclick="beatStage3AnswerCount(' + o + ',' + i + ')">' + o + '</button>';
        }).join('') +
      '</div>' +
      '<div class="fq-feedback" id="beatQ3Feedback">&nbsp;</div>';
  }

  if (BEAT_Q3.type === 2) {
    return header +
      beatBuildDotRow(BEAT_Q3.target.slots) +
      '<div class="fund-body" style="text-align:center;">Tap along with the pulse — one tap for every filled dot.</div>' +
      beatBuildFootWidget({ showTicks: false, showMeasure: false }) +
      '<div class="beat-tap-zone" id="beatTapZone3">TAP</div>' +
      '<div class="beat-last-tap" id="beatLastTapFeedback">&nbsp;</div>';
  }

  /* type 3 — identify */
  var correctPattern = BEAT_Q3.target;
  var distractors = fundSample(BEAT_RHYTHM_PATTERNS.filter(function(p) { return p.id !== correctPattern.id; }), 2);
  var choices = fundShuffle([correctPattern].concat(distractors));
  BEAT_Q3._choices = choices;
  return header +
    '<div class="fund-body" style="text-align:center;">Watch the pattern play, then pick the notation that matches.</div>' +
    beatBuildDotRow(correctPattern.slots, 'beatArrow') +
    '<div class="fq-answers" style="grid-template-columns:1fr;">' +
      choices.map(function(c, i) {
        return '<button class="fq-answer-btn" id="beatQ3Choice' + i + '" onclick="beatStage3AnswerIdentify(\'' + c.id + '\',' + i + ')" disabled>' + beatDotRowText(c.slots) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="fq-feedback" id="beatQ3Feedback">Listen…</div>';
}

function beatStage3BindQuestion() {
  if (BEAT_Q3.type === 2) {
    BeatClock.start(beatSettings.bpm, '4/4', 'eighth');
    beatBindVisuals();
    beatBindAudioClick();
    beatSetActivePattern(BEAT_Q3.target.slots);
    beatStartTapTracking('subdivision');
    beatBindMissChecking(beatCheckPatternMisses);
    beatBindTapInput('beatTapZone3', function() {
      var r = beatRecordPatternTap('T');
      beatShowLastTapFeedback(r);
    });
    var measureMs = BeatClock.getBeatIntervalMs() * 4;
    setTimeout(function() {
      beatTeardownStage();
      beatStage3NextQuestion();
    }, measureMs + 300);

  } else if (BEAT_Q3.type === 3) {
    BeatClock.start(beatSettings.bpm, '4/4', 'eighth');
    _beat3PlaybackFn = beatPlaybackHighlightFactory(BEAT_Q3.target.slots);
    BeatClock.subscribe(_beat3PlaybackFn);
    var measureMs3 = BeatClock.getBeatIntervalMs() * 4;
    setTimeout(function() {
      if (_beat3PlaybackFn) { BeatClock.unsubscribe(_beat3PlaybackFn); _beat3PlaybackFn = null; }
      BeatClock.stop();
      for (var i = 0; i < BEAT_Q3._choices.length; i++) {
        var btn = document.getElementById('beatQ3Choice' + i);
        if (btn) btn.disabled = false;
      }
      var fb = document.getElementById('beatQ3Feedback');
      if (fb) fb.textContent = 'Which notation matches the pattern you just saw?';
    }, measureMs3);
  }
  /* type 1 needs no clock — static notation + multiple choice */
}

function beatStage3AnswerCount(chosen, idx) {
  if (BEAT_Q3.answered) return;
  BEAT_Q3.answered = true;
  var correct = chosen === BEAT_Q3.target.beats;
  var btn = document.getElementById('beatQ3Opt' + idx);
  if (btn) btn.classList.add(correct ? 'correct' : 'wrong');
  var fb = document.getElementById('beatQ3Feedback');
  if (fb) fb.textContent = correct ? 'Correct!' : ('Not quite — it’s ' + BEAT_Q3.target.beats + ' beats.');
  beatPushDiscreteResult(correct);
  setTimeout(function() { beatStage3NextQuestion(); }, 900);
}

function beatStage3AnswerIdentify(chosenId, idx) {
  if (BEAT_Q3.answered) return;
  BEAT_Q3.answered = true;
  var correct = chosenId === BEAT_Q3.target.id;
  var btn = document.getElementById('beatQ3Choice' + idx);
  if (btn) btn.classList.add(correct ? 'correct' : 'wrong');
  var fb = document.getElementById('beatQ3Feedback');
  if (fb) fb.textContent = correct ? 'Correct!' : 'Not quite — listen closer next time.';
  beatPushDiscreteResult(correct);
  setTimeout(function() { beatStage3NextQuestion(); }, 900);
}
