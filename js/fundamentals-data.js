/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* Music Fundamentals module state — separate from Fretboard Notes' instrument-keyed state */
var currentModule = null;   // null | 'notes' | 'fundamentals'
var fundStage     = 1;      // 1-6, current Music Fundamentals stage
var fundCompletedStages = []; // stage ids the user has mastered this session
var FUND_STAGES = [
  { id: 1, label: 'Notes' },
  { id: 2, label: 'Steps' },
  { id: 3, label: 'Accidentals' },
  { id: 4, label: 'Keys' },
  { id: 5, label: 'Circle' },
  { id: 6, label: 'Minor' }
];

/* ── Music Fundamentals: Stage 1 data ── */
var FUND_NATURALS = ['A','B','C','D','E','F','G'];

/* Low E string fret data, used by the Stage 1 diagram */
var FUND_FRET_NATURALS = [
  { fret:0,  note:'E' }, { fret:1,  note:'F' }, { fret:3,  note:'G' },
  { fret:5,  note:'A' }, { fret:7,  note:'B' }, { fret:8,  note:'C' },
  { fret:10, note:'D' }, { fret:12, note:'E' }
];

/* Full chromatic fret data, used by Stage 3's diagram */
var FUND_FRET_NOTES = [
  { fret:0,  note:'E',  natural:true  }, { fret:1,  note:'F',  natural:true  },
  { fret:2,  note:'F#', natural:false }, { fret:3,  note:'G',  natural:true  },
  { fret:4,  note:'G#', natural:false }, { fret:5,  note:'A',  natural:true  },
  { fret:6,  note:'A#', natural:false }, { fret:7,  note:'B',  natural:true  },
  { fret:8,  note:'C',  natural:true  }, { fret:9,  note:'C#', natural:false },
  { fret:10, note:'D',  natural:true  }, { fret:11, note:'D#', natural:false },
  { fret:12, note:'E',  natural:true,  octave:true }
];

/* ── Music Fundamentals: quiz engine state ── */
var FUND_QUIZ = {
  stage: 1,
  typeIdx: 0,
  unlockedTypes: [0],
  attempts: [],
  consecutiveCorrect: 0,
  current: null,
  answered: false,
  questionStart: 0,
  lastPrompt: null,
  pendingUnlock: null,
  forceType: null,
  forceTypeRemaining: 0,
  keysCorrect: {}  /* used as a Set via key presence, for later stages */
};

var FUND_STAGE_CONFIG = {
  1: {
    masteryStreak: 10,
    speedThreshold: 3000,
    typeLabels: ['Sequence recall', 'Fill the gap', 'Count up/down'],
    generate: fundGenerateStage1Question
  },
  2: {
    masteryStreak: 12,
    speedThreshold: 4000,
    typeLabels: ['Identify the interval', 'Find the note'],
    generate: fundGenerateStage2Question
  },
  3: {
    masteryStreak: 15,
    speedThreshold: 3500,
    typeLabels: ['Name the accidental', 'Enharmonic equivalents', 'Chromatic sequence'],
    generate: fundGenerateStage3Question
  },
  4: {
    masteryMode: 'keyCoverage',
    totalKeys: 12,
    speedThresholds: [15000, 6000, 5000, 4000],
    speedThreshold: 6000,
    typeLabels: ['Build the scale', 'Name the key', 'Key signature', 'Notes in the key'],
    generate: fundGenerateStage4Question
  },
  5: {
    masteryMode: 'keyCoverage',
    totalKeys: 12,
    speedThresholds: [8000, 5000, 7000, 6000],
    speedThreshold: 6000,
    typeLabels: ['Navigate the circle', 'Relative minor', 'Key relationship', 'Identify the key'],
    generate: fundGenerateStage5Question
  },
  6: {
    masteryMode: 'keyCoverage',
    totalKeys: 12,
    speedThresholds: [15000, 6000, 5000],
    speedThreshold: 6000,
    typeLabels: ['Build the minor scale', 'Name the minor scale', 'Minor key signature'],
    generate: fundGenerateStage6Question
  }
};

var FUND_MASTERY_COPY = {
  1: {
    title: 'Fast and correct. Locked in.',
    body: 'You\u2019ve got the musical alphabet down cold, accurate and automatic. Next: the two distances behind every scale and chord: whole steps and half steps.'
  },
  2: {
    title: 'Fast and correct. Locked in.',
    body: 'Whole steps and half steps are automatic now. Next: the notes that sit between the natural ones: sharps, flats, and how they\u2019re spelled.'
  },
  3: {
    title: 'Fast and correct. Locked in.',
    body: 'Sharps, flats, and enharmonic spellings are automatic now. Next: keys and key signatures: how those 12 pitches organize into the major scales you\u2019ll actually play.'
  },
  4: {
    title: 'All 12 keys. Locked in.',
    body: 'Every major key, built from the same formula, fast and accurate. Stage 5, the Circle of Fifths, is next.'
  },
  5: {
    title: 'The whole map. Locked in.',
    body: 'Every relationship on the circle, every relative minor, fast and accurate. One more piece: minor scales themselves, what those relative minors actually sound like.'
  },
  6: {
    title: 'Minor scales. Locked in.',
    body: 'Major and minor, built from the same notes, different starting point. That\u2019s the full foundation: every other module builds on what you just learned.'
  }
};

function fundActiveConfig() {
  return FUND_STAGE_CONFIG[FUND_QUIZ.stage];
}

function fundShuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function fundSample(arr, n) {
  return fundShuffle(arr).slice(0, n);
}

function fundTypeAccuracy(typeIdx) {
  var rel = FUND_QUIZ.attempts.filter(function(a) { return a.typeIdx === typeIdx; });
  if (rel.length < 4) return null;
  var correct = rel.filter(function(a) { return a.correct; }).length;
  return correct / rel.length;
}

function fundMaybeUnlockNextType() {
  var cfg = fundActiveConfig();
  var maxTypeIdx = cfg.typeLabels.length - 1;
  var highestUnlocked = Math.max.apply(null, FUND_QUIZ.unlockedTypes);
  var acc = fundTypeAccuracy(highestUnlocked);
  var nextType = highestUnlocked + 1;
  if (acc !== null && acc >= 0.8 && nextType <= maxTypeIdx && FUND_QUIZ.unlockedTypes.indexOf(nextType) === -1) {
    FUND_QUIZ.unlockedTypes.push(nextType);
    FUND_QUIZ.typeIdx = nextType;
    return true;
  }
  return false;
}

function fundPickActiveType(forcedType) {
  if (forcedType !== null && forcedType !== undefined) return forcedType;
  var pool = FUND_QUIZ.unlockedTypes;
  return pool[Math.floor(Math.random() * pool.length)];
}

function fundThresholdForAttempt(cfg, typeIdx) {
  if (cfg.speedThresholds && cfg.speedThresholds[typeIdx] !== undefined) return cfg.speedThresholds[typeIdx];
  return cfg.speedThreshold;
}

function fundRecentCorrectAttempts(n) {
  var correctOnly = FUND_QUIZ.attempts.filter(function(a) { return a.correct; });
  return correctOnly.slice(-n);
}

function fundRecentCorrectTimes(n) {
  return fundRecentCorrectAttempts(n).map(function(a) { return a.timeMs; });
}

function fundAverageRecentTime(n) {
  var times = fundRecentCorrectTimes(n);
  if (times.length === 0) return null;
  var sum = 0;
  for (var i = 0; i < times.length; i++) sum += times[i];
  return sum / times.length;
}

/* Average of (actual time / that question's own threshold) across recent
   correct attempts. A value <= 1 means "on average, at or under the bar
   for whatever type each question was" — lets Stage 4 compare a 15s
   scale-build fairly against a 4s yes/no question in the same window. */
function fundAverageRecentSpeedRatio(cfg, n) {
  var attempts = fundRecentCorrectAttempts(n);
  if (attempts.length === 0) return null;
  var sum = 0;
  for (var i = 0; i < attempts.length; i++) {
    sum += attempts[i].timeMs / fundThresholdForAttempt(cfg, attempts[i].typeIdx);
  }
  return sum / attempts.length;
}

function fundKeysCorrectSize() {
  var count = 0;
  for (var k in FUND_QUIZ.keysCorrect) if (FUND_QUIZ.keysCorrect.hasOwnProperty(k)) count++;
  return count;
}

function fundIsSpeedReady() {
  var cfg = fundActiveConfig();
  if (cfg.masteryMode === 'keyCoverage') {
    if (fundKeysCorrectSize() < cfg.totalKeys) return false;
    var attempts = fundRecentCorrectAttempts(cfg.totalKeys);
    if (attempts.length < cfg.totalKeys) return false;
    var ratio = fundAverageRecentSpeedRatio(cfg, cfg.totalKeys);
    return ratio !== null && ratio <= 1;
  }
  if (FUND_QUIZ.consecutiveCorrect < cfg.masteryStreak) return false;
  var times = fundRecentCorrectTimes(cfg.masteryStreak);
  if (times.length < cfg.masteryStreak) return false;
  var avg = fundAverageRecentTime(cfg.masteryStreak);
  return avg <= cfg.speedThreshold;
}

function fundIsAccurateButSlow() {
  var cfg = fundActiveConfig();
  if (cfg.masteryMode === 'keyCoverage') {
    if (fundKeysCorrectSize() < cfg.totalKeys) return false;
    var attempts = fundRecentCorrectAttempts(cfg.totalKeys);
    if (attempts.length < cfg.totalKeys) return false;
    return !fundIsSpeedReady();
  }
  if (FUND_QUIZ.consecutiveCorrect < cfg.masteryStreak) return false;
  var times = fundRecentCorrectTimes(cfg.masteryStreak);
  if (times.length < cfg.masteryStreak) return false;
  return !fundIsSpeedReady();
}

/* Stage 1 question generators */
function fundGenType0() {
  /* Sequence recall: "What comes after X?" or "What comes before X?" */
  var idx = Math.floor(Math.random() * FUND_NATURALS.length);
  var note = FUND_NATURALS[idx];
  var forward = Math.random() > 0.5;
  var correctIdx = forward ? (idx + 1) % FUND_NATURALS.length : (idx - 1 + FUND_NATURALS.length) % FUND_NATURALS.length;
  var correct = FUND_NATURALS[correctIdx];
  var distractors = FUND_NATURALS.filter(function(n) { return n !== correct && n !== note; });
  var options = fundShuffle([correct].concat(fundSample(distractors, 3)));
  return {
    typeIdx: 0,
    typeLabel: 'Sequence recall',
    prompt: forward ? ('What comes after ' + note + '?') : ('What comes before ' + note + '?'),
    sub: 'Musical alphabet',
    options: options,
    correct: correct
  };
}

function fundGenType1() {
  /* Fill the gap: "A - B - ? - D - E - F - G" */
  var idx = Math.floor(Math.random() * FUND_NATURALS.length);
  var correct = FUND_NATURALS[idx];
  var seq = FUND_NATURALS.map(function(n, i) { return i === idx ? '?' : n; });
  var distractors = FUND_NATURALS.filter(function(n) { return n !== correct; });
  var options = fundShuffle([correct].concat(fundSample(distractors, 3)));
  return {
    typeIdx: 1,
    typeLabel: 'Fill the gap',
    prompt: seq.join('-'),
    sub: 'Which note is missing?',
    options: options,
    correct: correct
  };
}

function fundGenType2() {
  /* Count up/down */
  var startIdx = Math.floor(Math.random() * FUND_NATURALS.length);
  var steps = Math.floor(Math.random() * 4) + 2;
  var dir = Math.random() > 0.5 ? 1 : -1;
  var targetIdx = (((startIdx + dir * steps) % 7) + 7) % 7;
  var correct = FUND_NATURALS[targetIdx];
  var distractors = FUND_NATURALS.filter(function(n) { return n !== correct; });
  var options = fundShuffle([correct].concat(fundSample(distractors, 3)));
  return {
    typeIdx: 2,
    typeLabel: 'Count up/down',
    prompt: 'Starting from ' + FUND_NATURALS[startIdx] + ', go ' + (dir > 0 ? 'up' : 'down') + ' ' + steps + ' note' + (steps > 1 ? 's' : '') + '. What do you land on?',
    sub: 'Wrap around the alphabet as needed',
    options: options,
    correct: correct
  };
}

function fundGenerateStage1Question(forcedType) {
  var t = fundPickActiveType(forcedType);
  if (t === 0) return fundGenType0();
  if (t === 1) return fundGenType1();
  return fundGenType2();
}

/* ── Stage 2: Whole & Half Steps ── */
var FUND_NATURAL_GAP_PAIRS = [
  ['A','B',2], ['B','C',1], ['C','D',2], ['D','E',2], ['E','F',1], ['F','G',2], ['G','A',2]
];

function fundS2GenIdentifyInterval() {
  var pair = FUND_NATURAL_GAP_PAIRS[Math.floor(Math.random() * FUND_NATURAL_GAP_PAIRS.length)];
  var isHalf = pair[2] === 1;
  var options = fundShuffle(['Half step', 'Whole step']);
  return {
    typeIdx: 0,
    typeLabel: 'Identify the interval',
    prompt: pair[0] + ' and ' + pair[1],
    sub: 'Half step or whole step?',
    options: options,
    correct: isHalf ? 'Half step' : 'Whole step'
  };
}

function fundWholeStepNaturalPairs() {
  return FUND_NATURAL_GAP_PAIRS.filter(function(p) { return p[2] === 2; });
}

function fundS2GenFindTheNote() {
  var pairs = fundWholeStepNaturalPairs();
  var forward = Math.random() > 0.5;
  var pick = pairs[Math.floor(Math.random() * pairs.length)];
  var note = forward ? pick[0] : pick[1];
  var correct = forward ? pick[1] : pick[0];
  var distractors = FUND_NATURALS.filter(function(n) { return n !== correct && n !== note; });
  var options = fundShuffle([correct].concat(fundSample(distractors, 3)));
  return {
    typeIdx: 1,
    typeLabel: 'Find the note',
    prompt: 'One whole step ' + (forward ? 'above' : 'below') + ' ' + note,
    sub: 'Pick the resulting note',
    options: options,
    correct: correct
  };
}

function fundGenerateStage2Question(forcedType) {
  var t = fundPickActiveType(forcedType);
  if (t === 0) return fundS2GenIdentifyInterval();
  return fundS2GenFindTheNote();
}

/* ── Stage 3: Sharps, Flats & Enharmonics ── */
var FUND_CHROMATIC_SEQ = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var FUND_SHARP_TO_FLAT = { 'C#':'D\u266D', 'D#':'E\u266D', 'F#':'G\u266D', 'G#':'A\u266D', 'A#':'B\u266D' };
var FUND_FLAT_TO_SHARP = { 'D\u266D':'C#', 'E\u266D':'D#', 'G\u266D':'F#', 'A\u266D':'G#', 'B\u266D':'A#' };
var FUND_ACCIDENTAL_ROOTS = ['C#/D\u266D','D#/E\u266D','F#/G\u266D','G#/A\u266D','A#/B\u266D'];

function fundS3GenNameTheAccidental() {
  var naturalsWithAcc = ['A','C','D','F','G'];
  var note = naturalsWithAcc[Math.floor(Math.random() * naturalsWithAcc.length)];
  var idx = FUND_CHROMATIC_SEQ.indexOf(note);
  var sharpAnswer = FUND_CHROMATIC_SEQ[(idx + 1) % 12];
  var flatAnswer = FUND_SHARP_TO_FLAT[sharpAnswer];
  var useSharp = Math.random() > 0.5;
  var correct = useSharp ? sharpAnswer : flatAnswer;
  var acceptable = [sharpAnswer, flatAnswer];
  var distractorPool = FUND_CHROMATIC_SEQ
    .filter(function(n) { return acceptable.indexOf(n) === -1 && n !== note; })
    .map(function(n) { return FUND_SHARP_TO_FLAT[n] || n; });
  var options = fundShuffle([correct].concat(fundSample(distractorPool, 3)));
  return {
    typeIdx: 0,
    typeLabel: 'Name the accidental',
    prompt: 'What is one half step above ' + note + '?',
    sub: 'Sharp or flat spelling both work',
    options: options,
    correct: correct,
    acceptableAnswers: acceptable
  };
}

function fundS3GenEnharmonic() {
  var pair = FUND_ACCIDENTAL_ROOTS[Math.floor(Math.random() * FUND_ACCIDENTAL_ROOTS.length)];
  var parts = pair.split('/');
  var askSharp = Math.random() > 0.5;
  var given = askSharp ? parts[0] : parts[1];
  var correct = askSharp ? parts[1] : parts[0];
  var otherPairs = FUND_ACCIDENTAL_ROOTS.filter(function(p) { return p !== pair; });
  var distractors = fundSample(otherPairs, 3).map(function(p) {
    var sp = p.split('/');
    return Math.random() > 0.5 ? sp[0] : sp[1];
  });
  var options = fundShuffle([correct].concat(distractors));
  return {
    typeIdx: 1,
    typeLabel: 'Enharmonic equivalents',
    prompt: 'What is another name for ' + given + '?',
    sub: 'Same pitch, different spelling',
    options: options,
    correct: correct
  };
}

function fundS3GenChromaticSeq() {
  var idx = Math.floor(Math.random() * 12);
  var note = FUND_CHROMATIC_SEQ[idx];
  var forward = Math.random() > 0.5;
  var targetIdx = forward ? (idx + 1) % 12 : (idx - 1 + 12) % 12;
  var correctSharp = FUND_CHROMATIC_SEQ[targetIdx];
  var hasFlat = !!FUND_SHARP_TO_FLAT[correctSharp];
  var correct = (hasFlat && Math.random() > 0.5) ? FUND_SHARP_TO_FLAT[correctSharp] : correctSharp;
  var acceptable = hasFlat ? [correctSharp, FUND_SHARP_TO_FLAT[correctSharp]] : [correctSharp];
  var distractorPool = FUND_CHROMATIC_SEQ
    .filter(function(n) { return acceptable.indexOf(n) === -1; })
    .map(function(n) { return FUND_SHARP_TO_FLAT[n] || n; });
  var options = fundShuffle([correct].concat(fundSample(distractorPool, 3)));
  return {
    typeIdx: 2,
    typeLabel: 'Chromatic sequence',
    prompt: forward ? ('What note comes after ' + note + ' in the chromatic scale?') : ('What note comes before ' + note + ' in the chromatic scale?'),
    sub: '12 pitches, repeating',
    options: options,
    correct: correct,
    acceptableAnswers: acceptable
  };
}

function fundGenerateStage3Question(forcedType) {
  var t = fundPickActiveType(forcedType);
  if (t === 0) return fundS3GenNameTheAccidental();
  if (t === 1) return fundS3GenEnharmonic();
  return fundS3GenChromaticSeq();
}

/* ════════════════════════════════════════════
   MAJOR KEY DATA — built from the W-W-H-W-W-W-H formula.
   This is the most correctness-sensitive part of the port — verified
   against the prototype's already-tested output before relying on it
   for Stages 4-6.
════════════════════════════════════════════ */
var FUND_MAJOR_SCALE_FORMULA = [2, 2, 1, 2, 2, 2, 1]; /* W W H W W W H */
var FUND_MINOR_SCALE_FORMULA = [2, 1, 2, 2, 1, 2, 2]; /* W H W W H W W, natural minor */

function fundChromaticIndex(note) {
  var idx = FUND_CHROMATIC_SEQ.indexOf(note);
  if (idx !== -1) return idx;
  if (FUND_FLAT_TO_SHARP[note]) return FUND_CHROMATIC_SEQ.indexOf(FUND_FLAT_TO_SHARP[note]);
  return -1;
}

function fundNextLetter(letter) {
  var idx = FUND_NATURALS.indexOf(letter);
  return FUND_NATURALS[(idx + 1) % FUND_NATURALS.length];
}

function fundBuildMajorScale(root) {
  var rootLetter = root[0];
  var notes = [root];
  var currentLetter = rootLetter;
  var chromaticPos = fundChromaticIndex(root.replace('b', '\u266D'));

  for (var i = 0; i < 6; i++) {
    var step = FUND_MAJOR_SCALE_FORMULA[i];
    chromaticPos = (chromaticPos + step) % 12;
    currentLetter = fundNextLetter(currentLetter);
    var naturalIdx = fundChromaticIndex(currentLetter);
    var diff = (chromaticPos - naturalIdx + 12) % 12;
    if (diff > 6) diff -= 12;
    var spelled;
    if (diff === 0) spelled = currentLetter;
    else if (diff > 0) spelled = currentLetter + new Array(diff + 1).join('#');
    else spelled = currentLetter + new Array(-diff + 1).join('b');
    notes.push(spelled);
  }
  return notes;
}

/* Chromatic order (C up to B), not circle-of-fifths — the circle order doesn't
   mean anything yet to a student who hasn't reached Stage 5. Where a pitch
   class has two spellings (F#/Gb), the sharp spelling comes first, matching
   the "sharps before flats" convention used elsewhere in this stage. Every
   other consumer of FUND_MAJOR_KEYS (which this builds) does keyed lookup or
   random sampling, so this order only affects the on-screen key-picker rows. */
var FUND_KEY_SIGNATURES_RAW = [
  { key: 'C',  sharps: 0, flats: 0 },
  { key: 'Db', sharps: 0, flats: 5 },
  { key: 'D',  sharps: 2, flats: 0 },
  { key: 'Eb', sharps: 0, flats: 3 },
  { key: 'E',  sharps: 4, flats: 0 },
  { key: 'F',  sharps: 0, flats: 1 },
  { key: 'F#', sharps: 6, flats: 0 },
  { key: 'Gb', sharps: 0, flats: 6 },
  { key: 'G',  sharps: 1, flats: 0 },
  { key: 'Ab', sharps: 0, flats: 4 },
  { key: 'A',  sharps: 3, flats: 0 },
  { key: 'Bb', sharps: 0, flats: 2 },
  { key: 'B',  sharps: 5, flats: 0 }
];

var FUND_SHARP_ORDER = ['F#','C#','G#','D#','A#','E#','B#'];
var FUND_FLAT_ORDER  = ['Bb','Eb','Ab','Db','Gb','Cb','Fb'];

var FUND_MAJOR_KEYS = FUND_KEY_SIGNATURES_RAW.map(function(k) {
  var scale = fundBuildMajorScale(k.key);
  var accidentals = k.sharps > 0 ? FUND_SHARP_ORDER.slice(0, k.sharps) : FUND_FLAT_ORDER.slice(0, k.flats);
  var relativeMinorRoot = scale[5];
  var relativeMinorScale = scale.slice(5).concat(scale.slice(0, 5));
  return {
    name: k.key.replace('b', '\u266D') + ' major',
    root: k.key,
    scale: scale,
    sharps: k.sharps,
    flats: k.flats,
    accidentals: accidentals,
    displayKey: k.key.replace('b', '\u266D').replace('#', '\u266F'),
    relativeMinorRoot: relativeMinorRoot,
    displayRelativeMinor: relativeMinorRoot.replace('b', '\u266D').replace('#', '\u266F'),
    relativeMinorScale: relativeMinorScale
  };
});

function fundKeyByRoot(root) {
  for (var i = 0; i < FUND_MAJOR_KEYS.length; i++) {
    if (FUND_MAJOR_KEYS[i].root === root) return FUND_MAJOR_KEYS[i];
  }
  return null;
}

function fundKeyByMinorRoot(minorRoot) {
  for (var i = 0; i < FUND_MAJOR_KEYS.length; i++) {
    if (FUND_MAJOR_KEYS[i].relativeMinorRoot === minorRoot) return FUND_MAJOR_KEYS[i];
  }
  return null;
}

/* ── Stage 4: Keys & Key Signatures — Practice question generators ── */
function fundPickUnmasteredKey() {
  var remaining = FUND_MAJOR_KEYS.filter(function(k) { return !FUND_QUIZ.keysCorrect[k.root]; });
  var pool = remaining.length > 0 ? remaining : FUND_MAJOR_KEYS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function fundS4GenBuildTheScale() {
  var key = fundPickUnmasteredKey();
  var decoySet = {};
  for (var i = 0; i < key.scale.length; i++) {
    var note = key.scale[i];
    var letter = note[0];
    if (note !== letter) decoySet[letter] = true;
  }
  var missingLetters = FUND_NATURALS.filter(function(l) {
    return !key.scale.some(function(n) { return n[0] === l; });
  });
  var pickedMissing = fundSample(missingLetters, Math.min(2, missingLetters.length));
  for (var m = 0; m < pickedMissing.length; m++) decoySet[pickedMissing[m]] = true;

  var decoys = [];
  for (var d in decoySet) if (decoySet.hasOwnProperty(d)) decoys.push(d);

  /* The root (degree 1) is given away in the prompt itself, so it's pre-filled
     and non-interactive. The pool covers degrees 2-7 plus one more tile for
     the octave (degree 8, same spelling as the root) — the player has to
     recognize the scale wraps back to the root, not have it handed to them. */
  var openNotes = key.scale.slice(1).concat([key.scale[0]]);
  var pool = fundShuffle(openNotes.concat(decoys));

  return {
    typeIdx: 0,
    typeLabel: 'Build the scale',
    constructionType: 'scale',
    prompt: 'Build the ' + key.displayKey + ' major scale',
    sub: 'Root is given. Tap the rest in order, applying W-W-H-W-W-W-H',
    pool: pool,
    correctSequence: key.scale.concat([key.scale[0]]),
    keyRoot: key.root
  };
}

function fundS4GenNameTheKey() {
  var key = fundPickUnmasteredKey();
  var distractors = fundSample(FUND_MAJOR_KEYS.filter(function(k) { return k.root !== key.root; }), 3)
    .map(function(k) { return k.displayKey + ' major'; });
  var options = fundShuffle([key.displayKey + ' major'].concat(distractors));

  var rotateBy = Math.floor(Math.random() * key.scale.length);
  var rotated = key.scale.slice(rotateBy).concat(key.scale.slice(0, rotateBy));

  return {
    typeIdx: 1,
    typeLabel: 'Name the key',
    prompt: rotated.join('-'),
    sub: 'What major key is this? (notes shown out of order)',
    options: options,
    correct: key.displayKey + ' major',
    keyRoot: key.root
  };
}

function fundS4GenKeySignature() {
  var key = fundPickUnmasteredKey();
  var count = key.sharps || key.flats || 0;
  var type = key.sharps > 0 ? 'sharps' : key.flats > 0 ? 'flats' : 'sharps or flats';
  var correct = String(count);
  var distractorCounts = [0,1,2,3,4,5,6,7].filter(function(n) { return n !== count; });
  var options = fundShuffle([correct].concat(fundSample(distractorCounts, 3).map(String)));
  return {
    typeIdx: 2,
    typeLabel: 'Key signature',
    prompt: 'How many ' + type + ' does ' + key.displayKey + ' major have?',
    sub: 'Pick the count',
    options: options,
    correct: correct,
    keyRoot: key.root
  };
}

function fundS4GenNotesInKey() {
  var key = fundPickUnmasteredKey();
  var askInKey = Math.random() > 0.5;
  var testNote;
  if (askInKey) {
    testNote = key.scale[Math.floor(Math.random() * key.scale.length)];
  } else {
    var flatVals = [];
    for (var fk in FUND_SHARP_TO_FLAT) if (FUND_SHARP_TO_FLAT.hasOwnProperty(fk)) flatVals.push(FUND_SHARP_TO_FLAT[fk]);
    var notInScale = FUND_CHROMATIC_SEQ.concat(flatVals).filter(function(n) { return key.scale.indexOf(n) === -1; });
    testNote = notInScale[Math.floor(Math.random() * notInScale.length)];
  }
  return {
    typeIdx: 3,
    typeLabel: 'Notes in the key',
    prompt: 'Is ' + testNote + ' in the key of ' + key.displayKey + ' major?',
    sub: 'Yes or no',
    options: fundShuffle(['Yes', 'No']),
    correct: askInKey ? 'Yes' : 'No',
    keyRoot: key.root
  };
}

function fundGenerateStage4Question(forcedType) {
  var t = fundPickActiveType(forcedType);
  if (t === 0) return fundS4GenBuildTheScale();
  if (t === 1) return fundS4GenNameTheKey();
  if (t === 2) return fundS4GenKeySignature();
  return fundS4GenNotesInKey();
}

/* ── Stage 5: The Circle of Fifths — Practice question generators ── */
function fundS5CircleDistance(rootA, rootB) {
  var n = FUND_CIRCLE_KEYS.length;
  var idxA = FUND_CIRCLE_KEYS.indexOf(rootA);
  var idxB = FUND_CIRCLE_KEYS.indexOf(rootB);
  var diff = Math.abs(idxA - idxB);
  return Math.min(diff, n - diff);
}

function fundS5GenNavigateCircle() {
  var key = fundPickUnmasteredKey();
  var n = FUND_CIRCLE_KEYS.length;
  var idx = FUND_CIRCLE_KEYS.indexOf(key.root);
  var goCW = Math.random() > 0.5;
  var targetRoot = FUND_CIRCLE_KEYS[goCW ? (idx + 1) % n : (idx - 1 + n) % n];
  var targetKey = fundKeyByRoot(targetRoot);

  var otherRoots = FUND_CIRCLE_KEYS.filter(function(r) { return r !== targetRoot && r !== key.root; });
  var distractors = fundSample(otherRoots, 3).map(function(r) { return fundKeyByRoot(r).displayKey; });
  var options = fundShuffle([targetKey.displayKey].concat(distractors));

  return {
    typeIdx: 0,
    typeLabel: 'Navigate the circle',
    prompt: 'What key is one fifth ' + (goCW ? 'above' : 'below') + ' ' + key.displayKey + '?',
    sub: goCW ? 'Clockwise on the circle' : 'Counter-clockwise on the circle',
    options: options,
    correct: targetKey.displayKey,
    keyRoot: key.root
  };
}

function fundS5GenRelativeMinor() {
  var key = fundPickUnmasteredKey();
  var askForMinor = Math.random() > 0.5;

  if (askForMinor) {
    var correct = key.displayRelativeMinor + ' minor';
    var distractors = fundSample(FUND_MAJOR_KEYS.filter(function(k) { return k.root !== key.root; }), 3)
      .map(function(k) { return k.displayRelativeMinor + ' minor'; });
    return {
      typeIdx: 1, typeLabel: 'Relative minor',
      prompt: 'What is the relative minor of ' + key.displayKey + ' major?',
      sub: 'Scale degree 6',
      options: fundShuffle([correct].concat(distractors)),
      correct: correct, keyRoot: key.root
    };
  } else {
    var correct2 = key.displayKey + ' major';
    var distractors2 = fundSample(FUND_MAJOR_KEYS.filter(function(k) { return k.root !== key.root; }), 3)
      .map(function(k) { return k.displayKey + ' major'; });
    return {
      typeIdx: 1, typeLabel: 'Relative minor',
      prompt: key.displayRelativeMinor + ' minor is the relative minor of which major key?',
      sub: 'Same key signature, different home note',
      options: fundShuffle([correct2].concat(distractors2)),
      correct: correct2, keyRoot: key.root
    };
  }
}

function fundS5GenKeyRelationship() {
  var key = fundPickUnmasteredKey();
  var others = FUND_MAJOR_KEYS.filter(function(k) { return k.root !== key.root; });
  var other = others[Math.floor(Math.random() * others.length)];
  var distance = fundS5CircleDistance(key.root, other.root);

  var correct = String(distance);
  var distractorCounts = [0,1,2,3,4,5,6].filter(function(n) { return n !== distance; });
  var options = fundShuffle([correct].concat(fundSample(distractorCounts, 3).map(String)));

  return {
    typeIdx: 2,
    typeLabel: 'Key relationship',
    prompt: 'How many sharps or flats separate ' + key.displayKey + ' major and ' + other.displayKey + ' major?',
    sub: 'Count the steps between them on the circle',
    options: options,
    correct: correct,
    keyRoot: key.root
  };
}

function fundS5GenIdentifyKey() {
  var key = fundPickUnmasteredKey();
  var count = key.sharps || key.flats || 0;
  var type = key.sharps > 0 ? 'sharps' : key.flats > 0 ? 'flats' : null;
  var correct = key.displayKey + ' major';
  var distractors = fundSample(FUND_MAJOR_KEYS.filter(function(k) { return k.root !== key.root; }), 3)
    .map(function(k) { return k.displayKey + ' major'; });
  var options = fundShuffle([correct].concat(distractors));
  var prompt = type ? ('Which major key has ' + count + ' ' + type + '?') : 'Which major key has no sharps or flats?';

  return {
    typeIdx: 3,
    typeLabel: 'Identify the key',
    prompt: prompt,
    sub: 'Work backward from the signature',
    options: options,
    correct: correct,
    keyRoot: key.root
  };
}

function fundGenerateStage5Question(forcedType) {
  var t = fundPickActiveType(forcedType);
  if (t === 0) return fundS5GenNavigateCircle();
  if (t === 1) return fundS5GenRelativeMinor();
  if (t === 2) return fundS5GenKeyRelationship();
  return fundS5GenIdentifyKey();
}

/* ── Stage 6: Natural Minor Scales — Practice question generators ── */
function fundS6GenBuildMinorScale() {
  var majorKey = fundPickUnmasteredKey();
  var minorScale = majorKey.relativeMinorScale;

  var decoySet = {};
  for (var i = 0; i < minorScale.length; i++) {
    var note = minorScale[i];
    var letter = note[0];
    if (note !== letter) decoySet[letter] = true;
  }
  var missingLetters = FUND_NATURALS.filter(function(l) {
    return !minorScale.some(function(n) { return n[0] === l; });
  });
  var pickedMissing = fundSample(missingLetters, Math.min(2, missingLetters.length));
  for (var m = 0; m < pickedMissing.length; m++) decoySet[pickedMissing[m]] = true;

  var decoys = [];
  for (var d in decoySet) if (decoySet.hasOwnProperty(d)) decoys.push(d);

  /* same treatment as the major-scale builder: the root is given away in the
     prompt, so the player fills in degrees 2-7 plus the octave repeat of the
     root themselves, instead of getting the octave handed to them for free. */
  var openNotes = minorScale.slice(1).concat([minorScale[0]]);
  var pool = fundShuffle(openNotes.concat(decoys));

  return {
    typeIdx: 0,
    typeLabel: 'Build the minor scale',
    constructionType: 'minorScale',
    prompt: 'Build the ' + majorKey.displayRelativeMinor + ' minor scale',
    sub: 'Root is given. Tap the rest in order, applying W-H-W-W-H-W-W',
    pool: pool,
    correctSequence: minorScale.concat([minorScale[0]]),
    keyRoot: majorKey.root
  };
}

function fundS6GenNameMinorScale() {
  var majorKey = fundPickUnmasteredKey();
  var correct = majorKey.displayRelativeMinor + ' minor';
  var distractors = fundSample(FUND_MAJOR_KEYS.filter(function(k) { return k.root !== majorKey.root; }), 3)
    .map(function(k) { return k.displayRelativeMinor + ' minor'; });
  var options = fundShuffle([correct].concat(distractors));

  var rotateBy = Math.floor(Math.random() * majorKey.relativeMinorScale.length);
  var rotated = majorKey.relativeMinorScale.slice(rotateBy).concat(majorKey.relativeMinorScale.slice(0, rotateBy));

  return {
    typeIdx: 1,
    typeLabel: 'Name the minor scale',
    prompt: rotated.join('-'),
    sub: 'What natural minor scale is this? (notes shown out of order)',
    options: options,
    correct: correct,
    keyRoot: majorKey.root
  };
}

function fundS6GenMinorKeySignature() {
  var majorKey = fundPickUnmasteredKey();
  var count = majorKey.sharps || majorKey.flats || 0;
  var type = majorKey.sharps > 0 ? 'sharps' : majorKey.flats > 0 ? 'flats' : 'sharps or flats';
  var correct = String(count);
  var distractorCounts = [0,1,2,3,4,5,6,7].filter(function(n) { return n !== count; });
  var options = fundShuffle([correct].concat(fundSample(distractorCounts, 3).map(String)));
  return {
    typeIdx: 2,
    typeLabel: 'Minor key signature',
    prompt: 'How many ' + type + ' does ' + majorKey.displayRelativeMinor + ' minor have?',
    sub: 'Same signature as its relative major',
    options: options,
    correct: correct,
    keyRoot: majorKey.root
  };
}

function fundGenerateStage6Question(forcedType) {
  var t = fundPickActiveType(forcedType);
  if (t === 0) return fundS6GenBuildMinorScale();
  if (t === 1) return fundS6GenNameMinorScale();
  return fundS6GenMinorKeySignature();
}

/* ── Shared: circle-of-fifths data and SVG builder (used by stages 4 & 5) ── */
var FUND_CIRCLE_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

function fundBuildScaleBuilderHTML(key) {
  var items = '';
  /* FUND_MAJOR_SCALE_FORMULA has 7 steps (W W H W W W H) — one between each of
     the 7 scale degrees AND one more leading back up to the octave root. Loop
     over every step, then cap it with that octave note, so the full formula
     is visible instead of stopping one connector short. */
  for (var i = 0; i < key.scale.length; i++) {
    items += '<div class="fund-scale-note' + (i === 0 ? ' root' : '') + '">' + key.scale[i] + '</div>';
    var isHalf = FUND_MAJOR_SCALE_FORMULA[i] === 1;
    items += '<div class="fq-formula-connector ' + (isHalf ? 'half' : 'whole') + '">' + (isHalf ? 'H' : 'W') + '</div>';
  }
  items += '<div class="fund-scale-note root" style="opacity:0.55;">' + key.scale[0] + '</div>';
  return items;
}

function fundBuildCircleSVG(opts) {
  opts = opts || {};
  var showMinors = !!opts.showMinors;
  var selectedRoot = opts.selectedRoot || null;
  var interactive = !!opts.interactive;
  var onTapHandler = opts.onTapHandler || null;

  var W = 320, H = 320, cx = 160, cy = 160;
  var r = showMinors ? 110 : 120;
  var innerR = 62;
  var teal = '#1D9E75';
  var copper = '#C87941'; /* used sparingly, only for the seam highlight */
  var green = '#3DA35D';
  var muted = 'var(--text2)';

  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;max-width:440px;margin:0 auto;">';
  svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="rgba(102,102,102,0.2)" stroke-width="1"/>';
  if (showMinors) svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + innerR + '" fill="none" stroke="rgba(102,102,102,0.15)" stroke-width="1"/>';

  var n = FUND_CIRCLE_KEYS.length;
  for (var i = 0; i < n; i++) {
    var root = FUND_CIRCLE_KEYS[i];
    var angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    var x = cx + r * Math.cos(angle);
    var y = cy + r * Math.sin(angle);
    var key = fundKeyByRoot(root);
    var isSeam = (root === 'F#' || root === 'Db');
    var isSelected = (selectedRoot === root);

    var fill = isSelected ? teal : isSeam ? copper : (key.sharps > 0 ? 'rgba(200,121,65,0.15)' : key.flats > 0 ? 'rgba(61,163,93,0.12)' : 'var(--surface)');
    var stroke = isSelected ? teal : key.sharps > 0 ? copper : key.flats > 0 ? green : 'rgba(102,102,102,0.4)';
    var textColor = (isSelected || isSeam) ? '#fff' : 'var(--text)';
    var tapAttr = (interactive && onTapHandler) ? (' style="cursor:pointer;" onclick="' + onTapHandler + '(\'' + root + '\')"') : '';

    svg += '<g' + tapAttr + '>';
    var count = key.sharps || key.flats || 0;
    var countStr = key.sharps > 0 ? (key.sharps + '♯') : key.flats > 0 ? (key.flats + '♭') : '';
    var countColor = (isSelected || isSeam) ? '#fff' : key.sharps > 0 ? copper : key.flats > 0 ? green : textColor;
    svg += '<circle cx="' + x + '" cy="' + y + '" r="22" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5"/>';
    svg += '<text x="' + x + '" y="' + (count > 0 ? y + 1 : y + 5) + '" text-anchor="middle" font-size="14" font-weight="800" fill="' + textColor + '" style="pointer-events:none;">' + key.displayKey + '</text>';
    if (count > 0) svg += '<text x="' + x + '" y="' + (y + 13) + '" text-anchor="middle" font-size="9" font-weight="700" fill="' + countColor + '" style="pointer-events:none;">' + countStr + '</text>';
    svg += '</g>';

    if (showMinors) {
      var ix = cx + innerR * Math.cos(angle);
      var iy = cy + innerR * Math.sin(angle);
      var minorFill = isSelected ? 'rgba(29,158,117,0.2)' : 'var(--bg)';
      var minorStroke = isSelected ? teal : 'rgba(102,102,102,0.3)';
      svg += '<g' + tapAttr + '>';
      svg += '<circle cx="' + ix + '" cy="' + iy + '" r="16" fill="' + minorFill + '" stroke="' + minorStroke + '" stroke-width="1.2"/>';
      svg += '<text x="' + ix + '" y="' + (iy + 4) + '" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text2)" style="pointer-events:none;">' + key.displayRelativeMinor + 'm</text>';
      svg += '</g>';
    }
  }

  var fsIdx = FUND_CIRCLE_KEYS.indexOf('F#');
  var fsAngle = (fsIdx / n) * 2 * Math.PI - Math.PI / 2;
  var gbX = cx + (r + 36) * Math.cos(fsAngle);
  var gbY = cy + (r + 36) * Math.sin(fsAngle);
  var gbKey = fundKeyByRoot('Gb');
  svg += '<text x="' + gbX + '" y="' + gbY + '" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text2)">= G\u266D major (' + gbKey.flats + '\u266D)</text>';

  if (!showMinors) {
    svg += '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="13" font-weight="600" fill="' + muted + '">12 keys,</text>';
    svg += '<text x="' + cx + '" y="' + (cy + 20) + '" text-anchor="middle" font-size="13" font-weight="600" fill="' + muted + '">one loop</text>';
  } else {
    svg += '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="12" font-weight="600" fill="' + muted + '">outer: major</text>';
    svg += '<text x="' + cx + '" y="' + (cy + 18) + '" text-anchor="middle" font-size="12" font-weight="600" fill="' + muted + '">inner: minor</text>';
  }

  svg += '</svg>';
  return svg;
}

