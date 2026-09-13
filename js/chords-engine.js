/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ══════════════════════════════════════════════════════
   CHORD CONSTRUCTION — Practice engine
══════════════════════════════════════════════════════ */
function chordsStartPractice(stageId) {
  CHORD_QUIZ.stage              = stageId;
  CHORD_QUIZ.typeIdx            = 0;
  CHORD_QUIZ.unlockedTypes      = [0];
  CHORD_QUIZ.attempts           = [];
  CHORD_QUIZ.consecutiveCorrect = 0;
  CHORD_QUIZ.answered           = false;
  CHORD_QUIZ.lastPrompt         = null;
  CHORD_QUIZ.pendingUnlock      = null;
  CHORD_QUIZ.forceType          = null;
  CHORD_QUIZ.forceTypeRemaining = 0;
  CHORD_QUIZ.chordTypesCorrect  = {};
  chordsRenderPracticeQuestion();
}

function chordsRenderPracticeQuestion() {
  var cfg = chordActiveConfig();
  var forcedType = (CHORD_QUIZ.forceTypeRemaining > 0 && CHORD_QUIZ.forceType !== null) ? CHORD_QUIZ.forceType : null;
  if (forcedType !== null) CHORD_QUIZ.forceTypeRemaining--;

  var q = cfg.generate(forcedType);
  var guard = 0;
  while (q.prompt === CHORD_QUIZ.lastPrompt && guard++ < 8)
    q = cfg.generate(forcedType !== null ? forcedType : q.typeIdx);

  CHORD_QUIZ.current     = q;
  CHORD_QUIZ.lastPrompt  = q.prompt;
  CHORD_QUIZ.answered    = false;
  CHORD_QUIZ.questionStart = performance.now();

  var cfg2      = chordActiveConfig();
  var isKC      = cfg2.masteryMode === 'keyCoverage';
  var needed    = isKC ? Math.ceil(cfg2.totalCells * cfg2.coverageThreshold) : cfg2.masteryStreak;
  var progressN = isKC ? chordCoverageCount(cfg2) : Math.min(CHORD_QUIZ.consecutiveCorrect, needed);
  var streakBadge = CHORD_QUIZ.consecutiveCorrect > 0
    ? '<div class="fq-streak">' + CHORD_QUIZ.consecutiveCorrect + ' correct in a row</div>' : '';

  var headerHtml =
    '<div class="fq-prompt-row">' +
      '<div><div class="fq-question">' + q.prompt + '</div><div class="fq-sub">' + q.sub + '</div></div>' +
      '<div class="fq-badge-col"><div class="fq-type-badge">' + q.typeLabel + '</div>' + streakBadge + '</div>' +
    '</div>' +
    '<div class="fq-progress-row">' +
      '<div class="fq-progress-label">' + (isKC ? 'Coverage' : 'Toward mastery') + '</div>' +
      '<div class="fq-progress-track"><div class="fq-progress-fill" style="width:' + Math.min(100, (progressN / needed) * 100) + '%"></div></div>' +
      '<div class="fq-progress-count">' + progressN + '/' + needed + '</div>' +
    '</div>';

  var optionsHtml = q.options.map(function(opt) {
    var escaped = opt.replace(/'/g, '&#39;');
    return '<button class="fq-answer-btn" onclick="chordsAnswerQuestion(&#39;' + escaped + '&#39;)">' + opt + '</button>';
  }).join('');

  var c = el('fundamentals-content');
  c.innerHTML =
    '<div class="fq-shell">' + headerHtml +
      '<div class="fq-answers" id="fqAnswers">' + optionsHtml + '</div>' +
      '<div class="fq-feedback" id="fqFeedback"></div>' +
    '</div>';
}

function chordsAnswerQuestion(choice) {
  if (CHORD_QUIZ.answered) return;
  CHORD_QUIZ.answered = true;
  var q   = CHORD_QUIZ.current;
  var cfg = chordActiveConfig();
  var correct = (choice === q.correct);
  var timeMs  = performance.now() - CHORD_QUIZ.questionStart;

  CHORD_QUIZ.attempts.push({ typeIdx:q.typeIdx, correct:correct, timeMs:timeMs });
  CHORD_QUIZ.consecutiveCorrect = correct ? CHORD_QUIZ.consecutiveCorrect + 1 : Math.max(0, CHORD_QUIZ.consecutiveCorrect - 1);
  if (correct && q.chordKey) CHORD_QUIZ.chordTypesCorrect[q.chordKey] = true;

  var btns = document.querySelectorAll('.fq-answer-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].disabled = true;
    var txt = btns[i].textContent;
    if (txt === choice) btns[i].className = 'fq-answer-btn ' + (correct ? 'correct' : 'wrong');
    else if (txt === q.correct && !correct) btns[i].className = 'fq-answer-btn correct';
  }

  var fb       = el('fqFeedback');
  var unlocked = chordMaybeUnlockNextType();
  var wasSlow  = correct && timeMs > cfg.speedThreshold;
  var secs     = (timeMs / 1000).toFixed(1);
  var html     = '';

  if (correct) {
    html = wasSlow
      ? '<span class="fq-fb-slow">✓ Correct (' + secs + 's), getting there, not automatic yet</span>'
      : '<span class="fq-fb-correct">✓ Correct (' + secs + 's)' + (CHORD_QUIZ.consecutiveCorrect >= 3 ? ', ' + CHORD_QUIZ.consecutiveCorrect + ' in a row' : '') + '</span>';
  } else {
    var penalty = CHORD_QUIZ.consecutiveCorrect === 0 ? 'No streak to lose yet.' : 'Back to ' + CHORD_QUIZ.consecutiveCorrect + '.';
    html = '<span class="fq-fb-wrong">✗ Not quite: it\'s <strong>' + q.correct + '</strong>. ' + penalty + '</span>';
  }

  if (unlocked) {
    html += '<div class="fq-fb-unlock">New question type unlocked: ' + cfg.typeLabels[CHORD_QUIZ.typeIdx] + '</div>';
    CHORD_QUIZ.pendingUnlock = CHORD_QUIZ.typeIdx;
  }

  if (correct) {
    fb.innerHTML = html;
    setTimeout(chordsProceedAfterAnswer, 1600);
  } else {
    html += '<button class="fq-continue-btn" onclick="chordsProceedAfterAnswer()">Continue →</button>';
    fb.innerHTML = html;
  }
}

function chordsProceedAfterAnswer() {
  if (CHORD_QUIZ.pendingUnlock !== null) {
    chordsRenderUnlockIntro(CHORD_QUIZ.pendingUnlock);
  } else if (chordIsSpeedReady()) {
    chordsRenderMasteryScreen();
  } else if (chordIsAccurateButSlow()) {
    chordsRenderSpeedNudge();
  } else {
    chordsRenderPracticeQuestion();
  }
}

function chordsRenderUnlockIntro(typeIdx) {
  var cfg     = chordActiveConfig();
  var preview = cfg.generate();
  var guard   = 0;
  while (preview.typeIdx !== typeIdx && guard++ < 20) preview = cfg.generate();

  var optHtml = preview.options.map(function(o) {
    return '<div class="fq-answer-btn" style="cursor:default;">' + o + '</div>';
  }).join('');

  var c = el('fundamentals-content');
  c.innerHTML =
    '<div class="fund-lesson-card" style="text-align:center;padding:24px 20px;">' +
      '<div style="font-size:30px;margin-bottom:8px;">🔓</div>' +
      '<div class="fund-eyebrow" style="justify-content:center;">New question type</div>' +
      '<div class="fund-title" style="font-size:20px;">' + cfg.typeLabels[typeIdx] + '</div>' +
      '<div class="fund-body" style="margin-top:6px;">You\'re doing well enough to mix in a new format. Here\'s a preview: no clock running yet.</div>' +
    '</div>' +
    '<div class="fq-shell" style="opacity:0.85;">' +
      '<div class="fq-prompt-row"><div><div class="fq-question">' + preview.prompt + '</div><div class="fq-sub">' + preview.sub + '</div></div>' +
      '<div class="fq-badge-col"><div class="fq-type-badge">' + preview.typeLabel + '</div></div></div>' +
      '<div class="fq-answers">' + optHtml + '</div>' +
      '<div class="fq-feedback" style="color:var(--text2);">Preview only: nothing to tap.</div>' +
    '</div>' +
    '<button class="fund-cta-btn" onclick="chordsConfirmUnlock()">Got it, continue →</button>';
}

function chordsConfirmUnlock() {
  CHORD_QUIZ.forceType          = CHORD_QUIZ.pendingUnlock;
  CHORD_QUIZ.forceTypeRemaining = 2;
  CHORD_QUIZ.pendingUnlock      = null;
  chordsRenderPracticeQuestion();
}

function chordsRenderSpeedNudge() {
  var cfg = chordActiveConfig();
  var isKC = cfg.masteryMode === 'keyCoverage';
  var needed = isKC ? Math.ceil(cfg.totalCells * cfg.coverageThreshold) : cfg.masteryStreak;
  var recent = chordRecentCorrectAttempts(needed);
  var avg = recent.length ? (recent.reduce(function(s,a){return s+a.timeMs;},0)/recent.length/1000).toFixed(1) : '?';
  var c = el('fundamentals-content');
  c.innerHTML =
    '<div class="fund-lesson-card" style="text-align:center;padding:24px 20px;">' +
      '<div style="font-size:30px;margin-bottom:8px;">⏱</div>' +
      '<div class="fund-eyebrow" style="justify-content:center;">You know this, but it\'s not automatic yet</div>' +
      '<div class="fund-title" style="font-size:18px;">Averaging ' + avg + 's.</div>' +
      '<div class="fund-body" style="margin-top:6px;">Every answer is right, but you\'re still thinking it through. A few more rounds and it should start feeling instant.</div>' +
    '</div>' +
    '<button class="fund-cta-btn" onclick="chordsKeepDrilling()">Keep drilling →</button>';
}

function chordsKeepDrilling() {
  CHORD_QUIZ.consecutiveCorrect = 0;
  CHORD_QUIZ.chordTypesCorrect  = {};
  chordsRenderPracticeQuestion();
}

function chordsRenderMasteryScreen() {
  var copy = CHORD_MASTERY_COPY[CHORD_QUIZ.stage] || CHORD_MASTERY_COPY[1];
  if (chordCompletedStages.indexOf(CHORD_QUIZ.stage) === -1) chordCompletedStages.push(CHORD_QUIZ.stage);
  chordsRenderStageBar();

  var isFinal = (CHORD_QUIZ.stage === CHORD_STAGES.length);
  var nextBtn = isFinal
    ? '<button class="fund-cta-btn" onclick="chordsRenderCompletion()">See your results →</button>'
    : '<button class="fund-cta-btn" onclick="chordsAdvanceToStage(' + (CHORD_QUIZ.stage + 1) + ')">Continue to Stage ' + (CHORD_QUIZ.stage + 1) + ' →</button>';

  var c = el('fundamentals-content');
  c.innerHTML =
    '<div class="fund-lesson-card" style="text-align:center;padding:28px 20px;">' +
      '<div style="font-size:36px;margin-bottom:10px;">🏅</div>' +
      '<div class="fund-eyebrow" style="justify-content:center;">Stage ' + CHORD_QUIZ.stage + ' Mastered</div>' +
      '<div class="fund-title">' + copy.title + '</div>' +
      '<div class="fund-body" style="margin-top:6px;">' + copy.body + '</div>' +
    '</div>' + nextBtn;
}

function chordsRenderCompletion() {
  var c = el('fundamentals-content');
  c.innerHTML =
    '<div class="fund-lesson-card" style="text-align:center;padding:32px 20px;">' +
      '<div style="font-size:40px;margin-bottom:12px;">🎸</div>' +
      '<div class="fund-eyebrow" style="justify-content:center;">Module Complete</div>' +
      '<div class="fund-title">Chord construction is yours.<br>Time to put it on the neck.</div>' +
      '<div class="fund-body" style="margin-top:8px;">Five chord types, any root, no hesitation. Module 04, Triad Positions, is up next.</div>' +
    '</div>' +
    '<button class="fund-cta-btn" onclick="showHome()">Back to Home</button>';
}

function chordsAdvanceToStage(id) {
  chordStage = id;
  chordsRenderStageBar();
  chordsRenderStudyStage();
}
