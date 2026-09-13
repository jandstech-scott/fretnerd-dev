/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ── Stage 4: Keys & Key Signatures — 3-page Study sub-navigation ── */
var fundStage4SubPage = 1;
var FUND_STAGE4_PAGE_COUNT = 3;
var fundStage4SelectedKey = 'C';

function fundStage4Study() {
  if (fundStage4SubPage === 1) return fundStage4Page1();
  if (fundStage4SubPage === 2) return fundStage4Page2();
  return fundStage4Page3();
}

function fundStage4NavHTML(showNext, nextLabel) {
  var backDisabled = (fundStage4SubPage === 1) ? 'disabled' : '';
  var isLastPage = (fundStage4SubPage === FUND_STAGE4_PAGE_COUNT);
  var advanceAction = isLastPage ? 'fundStartPractice(4)' : ('fundStage4GoSubPage(' + (fundStage4SubPage + 1) + ')');
  var label = nextLabel || 'Next \u2192';
  if (showNext) {
    return '<div class="fund-subnav">' +
      '<button class="fund-subnav-btn" onclick="fundStage4GoSubPage(' + (fundStage4SubPage - 1) + ')" ' + backDisabled + '>\u2190 Back</button>' +
      '<button class="fund-cta-btn" style="flex:1;" onclick="' + advanceAction + '">' + label + '</button>' +
    '</div>';
  }
  return '<div class="fund-subnav">' +
    '<button class="fund-subnav-btn" onclick="fundStage4GoSubPage(' + (fundStage4SubPage - 1) + ')" ' + backDisabled + '>\u2190 Back</button>' +
    '<button class="fund-cta-btn" style="flex:1;" id="fundStage4NextBtn" onclick="' + advanceAction + '" disabled>' + label + '</button>' +
  '</div>';
}

function fundStage4GoSubPage(n) {
  if (n < 1 || n > FUND_STAGE4_PAGE_COUNT) return;
  fundStage4SubPage = n;
  el('fundamentals-content').innerHTML = fundStage4Study();
}

function fundStage4UnlockNext() {
  var btn = el('fundStage4NextBtn');
  if (btn) btn.disabled = false;
}

/* Page 1: the formula */
function fundStage4Page1() {
  var key = fundKeyByRoot(fundStage4SelectedKey);
  var keyBtns = '';
  for (var i = 0; i < FUND_MAJOR_KEYS.length; i++) {
    var k = FUND_MAJOR_KEYS[i];
    keyBtns += '<button class="fund-key-btn ' + (k.root === fundStage4SelectedKey ? 'active' : '') + '" onclick="fundSelectStage4Key(\'' + k.root + '\')">' + k.displayKey + '</button>';
  }
  var sigLabel = key.sharps > 0 ? ('sharp' + (key.sharps > 1 ? 's' : '')) : key.flats > 0 ? ('flat' + (key.flats > 1 ? 's' : '')) : 'sharps or flats';

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 4 \u00B7 Page 1 of 3</div>' +
      '<div class="fund-title">One formula. Twelve keys.</div>' +
      '<div class="fund-body">A <strong>scale</strong> is a sequence of 7 notes, built from a pattern of whole and half steps. A <strong>key</strong> is that scale used as your home base: the notes and chords that feel like they belong together. Keys come in different flavors: major, minor, and others, each with its own step pattern. We\u2019ll start with major, the most common starting point. Every major key\u2019s scale is built the exact same way: start on any note and apply the pattern of whole and half steps you already know.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">The Major Scale Formula</div>' +
      '<div class="fund-formula-row">' +
        '<div class="fund-formula-step whole">W</div><div class="fund-formula-step whole">W</div>' +
        '<div class="fund-formula-step half">H</div><div class="fund-formula-step whole">W</div>' +
        '<div class="fund-formula-step whole">W</div><div class="fund-formula-step whole">W</div>' +
        '<div class="fund-formula-step half">H</div>' +
      '</div>' +
      '<div class="fund-body" style="text-align:center;font-size:14px;">Apply this pattern from any starting note and you get that note\u2019s major scale.</div>' +
    '</div>' +

    '<div class="fund-section-divider"><span>Try it: pick a root</span></div>' +

    '<div class="fund-lesson-card">' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:10px;">' + keyBtns + '</div>' +
      '<div class="fund-scale-builder" id="fundScaleBuilder">' + fundBuildScaleBuilderHTML(key) + '</div>' +
      '<div class="fund-signature-summary" id="fundSigSummary">' +
        '<div class="fund-sig-count">' + (key.sharps || key.flats || 0) + '</div>' +
        '<div class="fund-sig-label">' + sigLabel + '</div>' +
        (key.accidentals.length > 0 ? ('<div class="fund-sig-accidentals">' + key.accidentals.join('  ') + '</div>') : '') +
      '</div>' +
    '</div>' +

    fundStage4NavHTML(true)
  );
}

function fundSelectStage4Key(root) {
  fundStage4SelectedKey = root;
  var key = fundKeyByRoot(root);
  var btns = document.querySelectorAll('.fund-key-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].textContent === key.displayKey);
  el('fundScaleBuilder').innerHTML = fundBuildScaleBuilderHTML(key);
  var sigLabel = key.sharps > 0 ? ('sharp' + (key.sharps > 1 ? 's' : '')) : key.flats > 0 ? ('flat' + (key.flats > 1 ? 's' : '')) : 'sharps or flats';
  el('fundSigSummary').innerHTML =
    '<div class="fund-sig-count">' + (key.sharps || key.flats || 0) + '</div>' +
    '<div class="fund-sig-label">' + sigLabel + '</div>' +
    (key.accidentals.length > 0 ? ('<div class="fund-sig-accidentals">' + key.accidentals.join('  ') + '</div>') : '');
}

/* Page 2: read the signature off a built scale */
var FUND_STAGE4_READ_SIG_KEY = 'D';
var fundStage4ReadSigSelections = [];
var fundStage4ReadSigChecked = false;

function fundStage4Page2() {
  var key = fundKeyByRoot(FUND_STAGE4_READ_SIG_KEY);
  fundStage4ReadSigSelections = [];
  fundStage4ReadSigChecked = false;

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 4 \u00B7 Page 2 of 3</div>' +
      '<div class="fund-title">Read the signature off the scale.</div>' +
      '<div class="fund-body">You don\u2019t need to memorize which sharps belong to which key. They\u2019re sitting right there in the scale you build. Here\u2019s ' + key.displayKey + ' major. Tap the notes that <strong>aren\u2019t natural</strong>.</div>' +
    '</div>' +
    '<div class="fund-lesson-card">' +
      '<div id="fundReadSigScale" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">' + fundRenderReadSigScale(key) + '</div>' +
      '<div id="fundReadSigFeedback" style="margin-top:10px;text-align:center;font-size:13px;min-height:18px;"></div>' +
    '</div>' +
    fundStage4NavHTML(false, 'Next \u2192')
  );
}

function fundRenderReadSigScale(key) {
  var html = '';
  for (var i = 0; i < key.scale.length; i++) {
    var note = key.scale[i];
    var isSelected = fundStage4ReadSigSelections.indexOf(i) !== -1;
    var isAccidental = note.length > 1;
    var cls = isSelected ? 'selected' : '';
    if (fundStage4ReadSigChecked) cls += isAccidental ? ' correct-tap' : (isSelected ? ' wrong-tap' : '');
    html += '<button class="fund-readsig-note ' + cls + '" onclick="fundToggleReadSig(' + i + ')" ' + (fundStage4ReadSigChecked ? 'disabled' : '') + '>' + note + '</button>';
  }
  return html;
}

function fundToggleReadSig(i) {
  if (fundStage4ReadSigChecked) return;
  var idx = fundStage4ReadSigSelections.indexOf(i);
  if (idx === -1) fundStage4ReadSigSelections.push(i);
  else fundStage4ReadSigSelections.splice(idx, 1);
  var key = fundKeyByRoot(FUND_STAGE4_READ_SIG_KEY);
  el('fundReadSigScale').innerHTML = fundRenderReadSigScale(key);

  var accidentalCount = key.scale.filter(function(n) { return n.length > 1; }).length;
  if (fundStage4ReadSigSelections.length === accidentalCount) fundCheckReadSig();
}

function fundCheckReadSig() {
  fundStage4ReadSigChecked = true;
  var key = fundKeyByRoot(FUND_STAGE4_READ_SIG_KEY);
  el('fundReadSigScale').innerHTML = fundRenderReadSigScale(key);

  var correctIndices = [];
  for (var i = 0; i < key.scale.length; i++) if (key.scale[i].length > 1) correctIndices.push(i);
  var gotItRight = (correctIndices.length === fundStage4ReadSigSelections.length) &&
    correctIndices.every(function(i) { return fundStage4ReadSigSelections.indexOf(i) !== -1; });

  var fb = el('fundReadSigFeedback');
  fb.innerHTML = gotItRight
    ? '<span class="fq-fb-correct">\u2713 Exactly right: ' + key.accidentals.join(' and ') + ' is ' + key.displayKey + ' major\u2019s whole key signature.</span>'
    : '<span class="fq-fb-slow">Close: the accidentals are ' + key.accidentals.join(' and ') + '. Everything else stays natural.</span>';

  fundStage4UnlockNext();
}

/* Page 3: key signatures, list and circle tabs, plus a reading drill */
var FUND_SHARP_TABLE_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#'];
var FUND_FLAT_TABLE_KEYS  = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
var fundStage4SigTab = 'list';
var fundStage4DrillQuestion = null;
var fundStage4DrillAnswered = false;
var fundStage4DrillCorrectCount = 0;
var FUND_STAGE4_DRILL_TARGET = 6;

function fundStage4Page3() {
  fundStage4SigTab = 'list';
  fundStage4DrillQuestion = null;
  fundStage4DrillAnswered = false;
  fundStage4DrillCorrectCount = 0;

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 4 \u00B7 Page 3 of 3</div>' +
      '<div class="fund-title">Key signatures, two ways.</div>' +
      '<div class="fund-body">Same information, two views. The list reads top to bottom: each key keeps everything above it and adds one more. The circle shows why it never really stops: it\u2019s a loop, not a line.</div>' +
    '</div>' +
    '<div class="fund-sig-tab-row">' +
      '<button class="fund-sig-tab-btn ' + (fundStage4SigTab === 'list' ? 'active' : '') + '" onclick="fundSwitchSigTab(\'list\')">List</button>' +
      '<button class="fund-sig-tab-btn ' + (fundStage4SigTab === 'circle' ? 'active' : '') + '" onclick="fundSwitchSigTab(\'circle\')">Circle</button>' +
    '</div>' +
    '<div id="fundSigTabContent">' + (fundStage4SigTab === 'list' ? fundRenderListTab() : fundRenderCircleTab()) + '</div>' +
    fundStage4NavHTML(false, 'Start Practice \u2192')
  );
}

function fundSwitchSigTab(tab) {
  fundStage4SigTab = tab;
  var btns = document.querySelectorAll('.fund-sig-tab-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].textContent.toLowerCase() === tab);
  el('fundSigTabContent').innerHTML = (tab === 'list') ? fundRenderListTab() : fundRenderCircleTab();
}

function fundRenderListTab() {
  return (
    '<div style="display:flex;gap:10px;align-items:flex-start;">' +
      '<div class="fund-lesson-card" style="flex:1;min-width:0;">' +
        '<div class="fund-sig-table-label sharps">Sharp keys</div>' +
        '<div id="fundSigTableSharps">' + fundRenderSigTable(FUND_SHARP_TABLE_KEYS, 'sharp') + '</div>' +
      '</div>' +
      '<div class="fund-lesson-card" style="flex:1;min-width:0;">' +
        '<div class="fund-sig-table-label flats">Flat keys</div>' +
        '<div id="fundSigTableFlats">' + fundRenderSigTable(FUND_FLAT_TABLE_KEYS, 'flat') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="fund-callout"><strong>Notice it stops at 6.</strong> F# major (6 sharps) and G\u266d major (6 flats) are enharmonic twins: the same pitches, two spellings. Flip to the Circle tab to see why they meet at the bottom.</div>' +
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Quick check: read the table directly</div>' +
      '<div class="fund-body" style="font-size:13px;margin-bottom:8px;">Get all 6 right to unlock Start Practice below.</div>' +
      '<div id="fundStage4DrillArea">' + fundRenderDrillQuestion() + '</div>' +
    '</div>'
  );
}

function fundRenderCircleTab() {
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-body">Same 12 keys, arranged as a loop instead of a list. Going clockwise from C adds one sharp at a time. Going counter-clockwise adds one flat at a time. They meet at the bottom: F# and its enharmonic twin, Gb, sitting at the exact same spot.</div>' +
    '</div>' +
    '<div class="fund-lesson-card">' +
      '<div style="display:flex;justify-content:center;padding:8px 0;">' + fundBuildCircleSVG() + '</div>' +
    '</div>' +
    '<div class="fund-callout"><strong>The seam at the bottom is why the list stops.</strong> F# major and Gb major are the same pitches, spelled two different ways. The circle has no edge; a list has to pick one.</div>'
  );
}

function fundRenderSigTable(rootList, accType) {
  var newCls = (accType === 'sharp') ? 'new-acc-sharp' : 'new-acc-flat';
  var keptCls = (accType === 'sharp') ? 'kept-acc-sharp' : 'kept-acc-flat';
  var html = '';
  for (var i = 0; i < rootList.length; i++) {
    var key = fundKeyByRoot(rootList[i]);
    var priorAcc = (i > 0) ? fundKeyByRoot(rootList[i - 1]).accidentals : [];
    var accCells = '';
    if (key.accidentals.length > 0) {
      var parts = [];
      for (var a = 0; a < key.accidentals.length; a++) {
        var acc = key.accidentals[a];
        var isNew = priorAcc.indexOf(acc) === -1;
        parts.push('<span class="fund-sig-table-acc ' + (isNew ? newCls : keptCls) + '">' + acc + '</span>');
      }
      accCells = parts.join(' ');
    } else {
      accCells = '<span class="fund-sig-table-acc none">-</span>';
    }
    html += '<div class="fund-sig-table-row">' +
      '<div class="fund-sig-table-pos">' + i + '</div>' +
      '<div class="fund-sig-table-key">' + key.displayKey + '</div>' +
      '<div class="fund-sig-table-count">' + key.accidentals.length + '</div>' +
      '<div class="fund-sig-table-accs">' + accCells + '</div>' +
    '</div>';
  }
  return html;
}

function fundGenerateDrillQuestion() {
  var useSharps = Math.random() > 0.5;
  var pool = useSharps ? FUND_SHARP_TABLE_KEYS.slice(1) : FUND_FLAT_TABLE_KEYS.slice(1);
  var root = pool[Math.floor(Math.random() * pool.length)];
  var key = fundKeyByRoot(root);
  var askCount = Math.random() > 0.5;

  if (askCount) {
    var correct = String(key.accidentals.length);
    var distractorCounts = [0,1,2,3,4,5,6].filter(function(n) { return n !== key.accidentals.length; });
    var options = fundShuffle([correct].concat(fundSample(distractorCounts, 3).map(String)));
    return { prompt: 'How many ' + (useSharps ? 'sharps' : 'flats') + ' does ' + key.displayKey + ' major have?', options: options, correct: correct };
  } else {
    var correct2 = key.accidentals.join(' ');
    var otherPool = (useSharps ? FUND_SHARP_TABLE_KEYS : FUND_FLAT_TABLE_KEYS).filter(function(r) { return r !== root && r !== 'C'; });
    var distractors = fundSample(otherPool, Math.min(3, otherPool.length)).map(function(r) { return fundKeyByRoot(r).accidentals.join(' '); });
    var options2 = fundShuffle([correct2].concat(distractors));
    return { prompt: 'Which ' + (useSharps ? 'sharps' : 'flats') + ' does ' + key.displayKey + ' major have?', options: options2, correct: correct2 };
  }
}

function fundRenderDrillQuestion() {
  fundStage4DrillQuestion = fundGenerateDrillQuestion();
  fundStage4DrillAnswered = false;
  var q = fundStage4DrillQuestion;
  var optHtml = q.options.map(function(opt) {
    return '<button class="fund-predict-option" onclick="fundAnswerDrill(\'' + opt + '\')">' + opt + '</button>';
  }).join('');
  return '<div class="fund-drill-progress">Reading the table: ' + fundStage4DrillCorrectCount + '/' + FUND_STAGE4_DRILL_TARGET + '</div>' +
    '<div class="fund-predict-question">' + q.prompt + '</div>' +
    '<div class="fund-predict-options">' + optHtml + '</div>' +
    '<div class="fund-predict-feedback" id="fundStage4DrillFeedback"></div>';
}

function fundAnswerDrill(choice) {
  if (fundStage4DrillAnswered) return;
  fundStage4DrillAnswered = true;
  var q = fundStage4DrillQuestion;
  var correct = (choice === q.correct);

  var btns = document.querySelectorAll('#fundStage4DrillArea .fund-predict-option');
  for (var i = 0; i < btns.length; i++) {
    btns[i].disabled = true;
    if (btns[i].textContent === choice) btns[i].classList.add(correct ? 'correct-tap' : 'wrong-tap');
    else if (btns[i].textContent === q.correct && !correct) btns[i].classList.add('correct-tap');
  }

  var fb = el('fundStage4DrillFeedback');
  if (correct) {
    fundStage4DrillCorrectCount++;
    fb.innerHTML = '<span class="fq-fb-correct">\u2713 Right off the table.</span>';
  } else {
    fb.innerHTML = '<span class="fq-fb-wrong">Not quite: find its row above and check again.</span>';
  }
  fb.innerHTML += '<button class="fq-continue-btn" onclick="fundNextDrillQuestion()">Continue \u2192</button>';
}

function fundNextDrillQuestion() {
  if (fundStage4DrillCorrectCount >= FUND_STAGE4_DRILL_TARGET) {
    fundStage4UnlockNext();
    el('fundStage4DrillArea').innerHTML = '<div class="fund-predict-feedback"><span class="fq-fb-correct">\u2713 You\u2019re reading the table fluently. Ready for Practice.</span></div>';
    return;
  }
  el('fundStage4DrillArea').innerHTML = fundRenderDrillQuestion();
}
