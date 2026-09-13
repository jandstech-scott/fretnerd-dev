/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

function fundStartPractice(stageId) {
  FUND_QUIZ.stage = stageId;
  FUND_QUIZ.typeIdx = 0;
  FUND_QUIZ.unlockedTypes = [0];
  FUND_QUIZ.attempts = [];
  FUND_QUIZ.consecutiveCorrect = 0;
  FUND_QUIZ.answered = false;
  FUND_QUIZ.lastPrompt = null;
  FUND_QUIZ.pendingUnlock = null;
  FUND_QUIZ.forceType = null;
  FUND_QUIZ.forceTypeRemaining = 0;
  FUND_QUIZ.keysCorrect = {};
  fundRenderPracticeQuestion();
}

function fundRenderPracticeQuestion() {
  var cfg = fundActiveConfig();
  var forcedType = (FUND_QUIZ.forceTypeRemaining > 0 && FUND_QUIZ.forceType !== null) ? FUND_QUIZ.forceType : null;
  if (forcedType !== null) FUND_QUIZ.forceTypeRemaining--;

  var q = cfg.generate(forcedType);
  var guard = 0;
  while (q.prompt === FUND_QUIZ.lastPrompt && guard < 8) {
    q = cfg.generate(forcedType !== null ? forcedType : q.typeIdx);
    guard++;
  }
  FUND_QUIZ.current = q;
  FUND_QUIZ.lastPrompt = q.prompt;
  FUND_QUIZ.answered = false;
  FUND_QUIZ.questionStart = performance.now();

  var c = el('fundamentals-content');
  var isKeyMode = (cfg.masteryMode === 'keyCoverage');
  var progressLabel = isKeyMode ? 'Keys covered' : 'Toward mastery';
  var progressNum = isKeyMode ? fundKeysCorrectSize() : Math.min(FUND_QUIZ.consecutiveCorrect, cfg.masteryStreak);
  var progressTarget = isKeyMode ? cfg.totalKeys : cfg.masteryStreak;
  var streakBadge = FUND_QUIZ.consecutiveCorrect > 0
    ? '<div class="fq-streak">' + FUND_QUIZ.consecutiveCorrect + (isKeyMode ? ' correct in a row' : ' in a row') + '</div>' : '';

  var headerHtml =
    '<div class="fq-prompt-row">' +
      '<div>' +
        '<div class="fq-question">' + q.prompt + '</div>' +
        '<div class="fq-sub">' + q.sub + '</div>' +
      '</div>' +
      '<div class="fq-badge-col">' +
        '<div class="fq-type-badge">' + q.typeLabel + '</div>' +
        streakBadge +
      '</div>' +
    '</div>' +
    '<div class="fq-progress-row">' +
      '<div class="fq-progress-label">' + progressLabel + '</div>' +
      '<div class="fq-progress-track"><div class="fq-progress-fill" style="width:' + Math.min(100, (progressNum / progressTarget) * 100) + '%"></div></div>' +
    '</div>';

  if (q.constructionType) {
    fundRenderConstructionQuestion(c, headerHtml, q);
    return;
  }

  var optionsHtml = q.options.map(function(opt) {
    var longCls = opt.length > 8 ? ' long-text' : '';
    return '<button class="fq-answer-btn' + longCls + '" onclick="fundAnswerQuestion(\'' + opt + '\')">' + opt + '</button>';
  }).join('');

  c.innerHTML =
    '<div class="fq-shell">' + headerHtml +
      '<div class="fq-answers" id="fqAnswers">' + optionsHtml + '</div>' +
      '<div class="fq-feedback" id="fqFeedback"></div>' +
    '</div>';
}

/* ── Scale construction UI (tap-to-place), used by "Build the scale" ── */
FUND_QUIZ.constructionSelections = [];
FUND_QUIZ.usedPoolIndices = [];

function fundRenderConstructionQuestion(c, headerHtml, q) {
  /* the root (slot 0) is given away in the prompt itself, so it starts
     pre-filled and non-interactive; the player only places the rest */
  FUND_QUIZ.constructionSelections = [q.correctSequence[0]];
  FUND_QUIZ.usedPoolIndices = [];

  c.innerHTML =
    '<div class="fq-shell">' + headerHtml +
      '<div class="fq-construct-slots" id="fqConstructSlots">' + fundRenderConstructSlots(q) + '</div>' +
      '<div class="fq-construct-hint">Tap a filled slot to clear it, or use Undo for the last one placed.</div>' +
      '<div class="fq-construct-pool" id="fqConstructPool">' + fundRenderConstructPool(q) + '</div>' +
      '<div class="fq-construct-actions">' +
        '<button class="fq-undo-btn" id="fqConstructUndo" onclick="fundUndoConstructionNote()" disabled>\u21A9 Undo</button>' +
        '<button class="fund-cta-btn" id="fqConstructSubmit" onclick="fundSubmitConstruction()" disabled style="flex:1;">Check scale</button>' +
      '</div>' +
      '<div class="fq-feedback" id="fqFeedback"></div>' +
    '</div>';
}

function fundRenderConstructSlots(q) {
  var slots = '';
  var formula = (q.constructionType === 'minorScale') ? FUND_MINOR_SCALE_FORMULA : FUND_MAJOR_SCALE_FORMULA;
  /* correctSequence now runs root..octave (8 notes), so 7 connectors between
     them covers the full W/H formula. Slot 0 (the given root) has no tap
     handler — it's not part of the puzzle, just shown for reference. */
  for (var i = 0; i < q.correctSequence.length; i++) {
    var filled = FUND_QUIZ.constructionSelections[i];
    var tapAttr = (i !== 0 && filled !== undefined) ? (' onclick="fundClearConstructionSlot(' + i + ')"') : '';
    slots += '<div class="fq-construct-slot ' + (filled ? 'filled' : '') + (i === 0 ? ' root-slot' : '') + '"' + tapAttr + '>' + (filled || '') + '</div>';
    if (i < q.correctSequence.length - 1) {
      var isHalf = formula[i] === 1;
      slots += '<div class="fq-formula-connector ' + (isHalf ? 'half' : 'whole') + '">' + (isHalf ? 'H' : 'W') + '</div>';
    }
  }
  return slots;
}

function fundRenderConstructPool(q) {
  var html = '';
  for (var idx = 0; idx < q.pool.length; idx++) {
    var note = q.pool[idx];
    var isUsed = FUND_QUIZ.usedPoolIndices.indexOf(idx) !== -1;
    html += '<button class="fq-construct-pool-note" onclick="fundPickConstructionNote(\'' + note + '\',' + idx + ')" ' + (isUsed ? 'disabled' : '') + '>' + note + '</button>';
  }
  return html;
}

function fundFilledSlotCount() {
  var count = 0;
  for (var i = 0; i < FUND_QUIZ.constructionSelections.length; i++) {
    if (FUND_QUIZ.constructionSelections[i] !== undefined) count++;
  }
  return count;
}

function fundNextOpenSlotIndex(q) {
  for (var i = 0; i < q.correctSequence.length; i++) {
    if (FUND_QUIZ.constructionSelections[i] === undefined) return i;
  }
  return -1;
}

function fundRefreshConstructionUI(q) {
  el('fqConstructSlots').innerHTML = fundRenderConstructSlots(q);
  el('fqConstructPool').innerHTML = fundRenderConstructPool(q);
  /* count of 1 just means the given root is filled — nothing real to undo yet */
  el('fqConstructUndo').disabled = (fundFilledSlotCount() <= 1);
  el('fqConstructSubmit').disabled = (fundFilledSlotCount() !== q.correctSequence.length);
}

function fundPickConstructionNote(note, poolIdx) {
  var q = FUND_QUIZ.current;
  if (FUND_QUIZ.answered) return;
  if (FUND_QUIZ.usedPoolIndices.indexOf(poolIdx) !== -1) return;
  var slotIdx = fundNextOpenSlotIndex(q);
  if (slotIdx === -1) return;
  FUND_QUIZ.constructionSelections[slotIdx] = note;
  FUND_QUIZ.usedPoolIndices[slotIdx] = poolIdx;
  fundRefreshConstructionUI(q);
}

function fundClearConstructionSlot(slotIdx) {
  var q = FUND_QUIZ.current;
  if (FUND_QUIZ.answered) return;
  if (slotIdx === 0) return; /* the given root isn't part of the puzzle */
  if (FUND_QUIZ.constructionSelections[slotIdx] === undefined) return;
  FUND_QUIZ.constructionSelections[slotIdx] = undefined;
  FUND_QUIZ.usedPoolIndices[slotIdx] = undefined;
  fundRefreshConstructionUI(q);
}

function fundUndoConstructionNote() {
  var q = FUND_QUIZ.current;
  if (FUND_QUIZ.answered) return;
  var lastFilled = -1;
  for (var i = 1; i < q.correctSequence.length; i++) { /* skip slot 0, the given root */
    if (FUND_QUIZ.constructionSelections[i] !== undefined) lastFilled = i;
  }
  if (lastFilled === -1) return;
  FUND_QUIZ.constructionSelections[lastFilled] = undefined;
  FUND_QUIZ.usedPoolIndices[lastFilled] = undefined;
  fundRefreshConstructionUI(q);
}

function fundSubmitConstruction() {
  if (FUND_QUIZ.answered) return;
  FUND_QUIZ.answered = true;
  var q = FUND_QUIZ.current;
  var cfg = fundActiveConfig();
  var timeMs = performance.now() - FUND_QUIZ.questionStart;

  var correct = true;
  for (var i = 0; i < q.correctSequence.length; i++) {
    if (FUND_QUIZ.constructionSelections[i] !== q.correctSequence[i]) { correct = false; break; }
  }
  FUND_QUIZ.attempts.push({ typeIdx: q.typeIdx, correct: correct, timeMs: timeMs });
  FUND_QUIZ.consecutiveCorrect = correct ? FUND_QUIZ.consecutiveCorrect + 1 : Math.max(0, FUND_QUIZ.consecutiveCorrect - 1);
  if (correct && q.keyRoot) FUND_QUIZ.keysCorrect[q.keyRoot] = true;

  var slotsHtml = '';
  var revealFormula = (q.constructionType === 'minorScale') ? FUND_MINOR_SCALE_FORMULA : FUND_MAJOR_SCALE_FORMULA;
  for (var j = 0; j < q.correctSequence.length; j++) {
    var correctNote = q.correctSequence[j];
    var picked = FUND_QUIZ.constructionSelections[j];
    var isRight = (picked === correctNote);
    slotsHtml += '<div class="fq-construct-slot filled ' + (isRight ? 'right' : 'wrong') + (j === 0 ? ' root-slot' : '') + '">' + picked + (!isRight ? ('<span class="fq-construct-correction">' + correctNote + '</span>') : '') + '</div>';
    if (j < q.correctSequence.length - 1) {
      var isHalf2 = revealFormula[j] === 1;
      slotsHtml += '<div class="fq-formula-connector ' + (isHalf2 ? 'half' : 'whole') + '">' + (isHalf2 ? 'H' : 'W') + '</div>';
    }
  }
  el('fqConstructSlots').innerHTML = slotsHtml;

  var poolBtns = document.querySelectorAll('.fq-construct-pool-note');
  for (var p = 0; p < poolBtns.length; p++) poolBtns[p].disabled = true;
  el('fqConstructUndo').disabled = true;
  el('fqConstructSubmit').disabled = true;

  var fb = el('fqFeedback');
  var unlocked = fundMaybeUnlockNextType();
  var wasSlow = correct && timeMs > fundThresholdForAttempt(cfg, q.typeIdx);
  var html = '';

  if (correct) {
    var secs = (timeMs / 1000).toFixed(1);
    html = wasSlow
      ? '<span class="fq-fb-slow">\u2713 Correct (' + secs + 's), getting there, not automatic yet</span>'
      : '<span class="fq-fb-correct">\u2713 Correct (' + secs + 's)' + (FUND_QUIZ.consecutiveCorrect >= 3 ? (', ' + FUND_QUIZ.consecutiveCorrect + ' in a row') : '') + '</span>';
  } else {
    html = '<span class="fq-fb-wrong">\u2717 Not quite: corrections shown above.</span>';
  }

  if (unlocked) {
    html += '<div class="fq-fb-unlock">New question type unlocked: ' + cfg.typeLabels[FUND_QUIZ.typeIdx] + '</div>';
    FUND_QUIZ.pendingUnlock = FUND_QUIZ.typeIdx;
  }

  if (correct) {
    fb.innerHTML = html;
    setTimeout(fundProceedAfterAnswer, 1800);
  } else {
    html += '<button class="fq-continue-btn" onclick="fundProceedAfterAnswer()">Continue \u2192</button>';
    fb.innerHTML = html;
  }
}

function fundAnswerQuestion(choice) {
  if (FUND_QUIZ.answered) return;
  FUND_QUIZ.answered = true;
  var q = FUND_QUIZ.current;
  var cfg = fundActiveConfig();
  var acceptable = q.acceptableAnswers || [q.correct];
  var correct = (acceptable.indexOf(choice) !== -1);
  var timeMs = performance.now() - FUND_QUIZ.questionStart;

  FUND_QUIZ.attempts.push({ typeIdx: q.typeIdx, correct: correct, timeMs: timeMs });
  FUND_QUIZ.consecutiveCorrect = correct ? FUND_QUIZ.consecutiveCorrect + 1 : Math.max(0, FUND_QUIZ.consecutiveCorrect - 1);
  if (correct && q.keyRoot) FUND_QUIZ.keysCorrect[q.keyRoot] = true;

  var btns = document.querySelectorAll('.fq-answer-btn');
  for (var i = 0; i < btns.length; i++) {
    var btn = btns[i];
    btn.disabled = true;
    if (btn.textContent === choice) {
      btn.className = 'fq-answer-btn ' + (correct ? 'correct' : 'wrong');
    } else if (acceptable.indexOf(btn.textContent) !== -1 && !correct) {
      btn.className = 'fq-answer-btn correct';
    }
  }

  var fb = el('fqFeedback');
  var unlocked = fundMaybeUnlockNextType();
  var wasSlow = correct && timeMs > fundThresholdForAttempt(cfg, q.typeIdx);
  var html = '';

  if (correct) {
    var secs = (timeMs / 1000).toFixed(1);
    html = wasSlow
      ? '<span class="fq-fb-slow">\u2713 Correct (' + secs + 's), getting there, not automatic yet</span>'
      : '<span class="fq-fb-correct">\u2713 Correct (' + secs + 's)' + (FUND_QUIZ.consecutiveCorrect >= 3 ? (', ' + FUND_QUIZ.consecutiveCorrect + ' in a row') : '') + '</span>';
  } else {
    var answerLabel = acceptable.length > 1 ? acceptable.join(' or ') : q.correct;
    var penaltyMsg = FUND_QUIZ.consecutiveCorrect === 0 ? 'No streak to lose yet.' : ('Back to ' + FUND_QUIZ.consecutiveCorrect + '.');
    html = '<span class="fq-fb-wrong">\u2717 Not quite: it\u2019s <strong>' + answerLabel + '</strong>. ' + penaltyMsg + '</span>';
  }

  if (unlocked) {
    html += '<div class="fq-fb-unlock">New question type unlocked: ' + cfg.typeLabels[FUND_QUIZ.typeIdx] + '</div>';
    FUND_QUIZ.pendingUnlock = FUND_QUIZ.typeIdx;
  }

  if (correct) {
    fb.innerHTML = html;
    setTimeout(fundProceedAfterAnswer, 1600);
  } else {
    html += '<button class="fq-continue-btn" onclick="fundProceedAfterAnswer()">Continue \u2192</button>';
    fb.innerHTML = html;
  }
}

function fundProceedAfterAnswer() {
  if (FUND_QUIZ.pendingUnlock !== null) {
    fundRenderUnlockIntroScreen(FUND_QUIZ.pendingUnlock);
  } else if (fundIsSpeedReady()) {
    fundRenderMasteryScreen();
  } else if (fundIsAccurateButSlow()) {
    fundRenderSpeedNudgeScreen();
  } else {
    fundRenderPracticeQuestion();
  }
}

function fundRenderUnlockIntroScreen(typeIdx) {
  var cfg = fundActiveConfig();
  var c = el('fundamentals-content');

  var preview = cfg.generate();
  var guard = 0;
  while (preview.typeIdx !== typeIdx && guard < 20) {
    preview = cfg.generate();
    guard++;
  }

  var optionsHtml = preview.options.map(function(opt) {
    var isCorrect = opt === preview.correct;
    return '<div class="fq-answer-btn' + (isCorrect ? ' correct' : '') + '" style="cursor:default;">' + opt + '</div>';
  }).join('');

  c.innerHTML =
    '<div class="fund-lesson-card" style="text-align:center;padding:24px 20px;">' +
      '<div style="font-size:30px;margin-bottom:8px;">\u{1F513}</div>' +
      '<div class="fund-eyebrow" style="justify-content:center;">New question type</div>' +
      '<div class="fund-title" style="font-size:20px;">' + cfg.typeLabels[typeIdx] + '</div>' +
      '<div class="fund-body" style="margin-top:6px;">You\u2019re doing well enough to add a new format into the mix. Here\u2019s what it looks like: take your time, no clock running yet.</div>' +
    '</div>' +
    '<div class="fq-shell" style="opacity:0.85;">' +
      '<div class="fq-prompt-row">' +
        '<div><div class="fq-question">' + preview.prompt + '</div><div class="fq-sub">' + preview.sub + '</div></div>' +
        '<div class="fq-badge-col"><div class="fq-type-badge">' + preview.typeLabel + '</div></div>' +
      '</div>' +
      '<div class="fq-answers">' + optionsHtml + '</div>' +
      '<div class="fq-feedback" style="color:var(--text2);">This is just a preview: nothing to tap here.</div>' +
    '</div>' +
    '<button class="fund-cta-btn" onclick="fundConfirmUnlock()">Got it, continue \u2192</button>';
}

function fundConfirmUnlock() {
  FUND_QUIZ.forceType = FUND_QUIZ.pendingUnlock;
  FUND_QUIZ.forceTypeRemaining = 2;
  FUND_QUIZ.pendingUnlock = null;
  fundRenderPracticeQuestion();
}

function fundRenderSpeedNudgeScreen() {
  var c = el('fundamentals-content');
  var cfg = fundActiveConfig();
  var streak = cfg.masteryStreak || cfg.totalKeys || 10;
  var avg = fundAverageRecentTime(streak);
  var avgSecs = (avg / 1000).toFixed(1);

  c.innerHTML =
    '<div class="fund-lesson-card" style="text-align:center;padding:24px 20px;">' +
      '<div style="font-size:30px;margin-bottom:8px;">\u23F1</div>' +
      '<div class="fund-eyebrow" style="justify-content:center;">You know this, but it\u2019s not automatic yet</div>' +
      '<div class="fund-body" style="margin-top:6px;">You\u2019re getting them right, but averaging ' + avgSecs + 's. A few more rounds and this should start feeling automatic.</div>' +
    '</div>' +
    '<button class="fund-cta-btn" onclick="fundContinueDrilling()">Keep drilling \u2192</button>';
}

function fundContinueDrilling() {
  FUND_QUIZ.consecutiveCorrect = 0;
  FUND_QUIZ.attempts = [];
  fundRenderPracticeQuestion();
}

function fundRenderMasteryScreen() {
  var c = el('fundamentals-content');
  var copy = FUND_MASTERY_COPY[FUND_QUIZ.stage] || FUND_MASTERY_COPY[1];
  if (fundCompletedStages.indexOf(FUND_QUIZ.stage) === -1) fundCompletedStages.push(FUND_QUIZ.stage);
  renderStageBar();

  var isFinalStage = (FUND_QUIZ.stage === FUND_STAGES.length);
  var nextControl = isFinalStage
    ? '<button class="fund-cta-btn" onclick="fundRenderModuleCompletion()">See your foundation \u2192</button>'
    : '<button class="fund-cta-btn" onclick="fundAdvanceToStage(' + (FUND_QUIZ.stage + 1) + ')">Continue to Stage ' + (FUND_QUIZ.stage + 1) + ' \u2192</button>';

  c.innerHTML =
    '<div class="fund-lesson-card" style="text-align:center;padding:28px 20px;">' +
      '<div style="font-size:36px;margin-bottom:10px;">\u{1F3C5}</div>' +
      '<div class="fund-eyebrow" style="justify-content:center;">Stage ' + FUND_QUIZ.stage + ' Mastered</div>' +
      '<div class="fund-title">' + copy.title + '</div>' +
      '<div class="fund-body" style="margin-top:6px;">' + copy.body + '</div>' +
    '</div>' + nextControl;
}

function fundRenderModuleCompletion() {
  var c = el('fundamentals-content');
  c.innerHTML =
    '<div class="fund-lesson-card" style="text-align:center;padding:32px 20px;">' +
      '<div style="font-size:40px;margin-bottom:12px;">\u{1F3B8}</div>' +
      '<div class="fund-eyebrow" style="justify-content:center;">Module Complete</div>' +
      '<div class="fund-title">You\u2019ve got the foundation.<br>Time to put it on the fretboard.</div>' +
      '<div class="fund-body" style="margin-top:8px;">All six stages complete. Everything else in the app builds on what you just learned.</div>' +
    '</div>' +
    '<button class="fund-cta-btn" onclick="showHome()">Back to Home</button>';
}

function fundAdvanceToStage(id) {
  fundStage = id;
  if (id === 4) fundStage4SubPage = 1;
  renderStageBar();
  renderFundStage();
}

