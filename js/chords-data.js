/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ══════════════════════════════════════════════════════
   CHORD CONSTRUCTION — Data, state, question generators
══════════════════════════════════════════════════════ */
var chordStage = 1;
var chordCompletedStages = [];
var CHORD_STAGES = [
  { id:1, label:'Intervals' }, { id:2, label:'Major' }, { id:3, label:'Minor' },
  { id:4, label:'Dom7' },      { id:5, label:'7th' },   { id:6, label:'All' }
];

/* ── Roots & spelling ── */
var CHORD_ALL_ROOTS    = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
var CHORD_FLAT_SPELL   = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
var CHORD_NATURAL_ROOTS = ['C','D','E','F','G','A','B'];

function chordRootToIdx(root) {
  var i = FUND_CHROMATIC_SEQ.indexOf(root);
  return i !== -1 ? i : CHORD_FLAT_SPELL.indexOf(root);
}

function chordNotes(root, formula) {
  var useFlat = root.indexOf('b') !== -1;
  var spell = useFlat ? CHORD_FLAT_SPELL : FUND_CHROMATIC_SEQ;
  var ri = chordRootToIdx(root);
  return formula.map(function(o) { return spell[(ri + o) % 12]; });
}

function chordDN(n) { return n.replace('b', '♭').replace('#', '♯'); }
function chordDisplayNotes(notes) { return notes.map(chordDN).join(' - '); }

function chordSymbol(root, typeId) {
  var sfx = { major:'', minor:'m', dom7:'7', maj7:'maj7', min7:'m7' };
  return chordDN(root) + (sfx[typeId] || '');
}

/* ── Intervals ── */
var CHORD_INTERVALS = [
  { name:'Minor 3rd',  abbr:'m3', semitones:3  },
  { name:'Major 3rd',  abbr:'M3', semitones:4  },
  { name:'Perfect 5th',abbr:'P5', semitones:7  },
  { name:'Minor 7th',  abbr:'m7', semitones:10 },
  { name:'Major 7th',  abbr:'M7', semitones:11 }
];

/* ── Chord type registry ── */
var CHORD_TYPES = [
  { id:'major', name:'Major',      symbol:'',     formula:[0,4,7],    degreeLabels:['R','M3','P5'],      stageIntroduced:2 },
  { id:'minor', name:'Minor',      symbol:'m',    formula:[0,3,7],    degreeLabels:['R','m3','P5'],      stageIntroduced:3 },
  { id:'dom7',  name:'Dominant 7', symbol:'7',    formula:[0,4,7,10], degreeLabels:['R','M3','P5','m7'], stageIntroduced:4 },
  { id:'maj7',  name:'Major 7',    symbol:'maj7', formula:[0,4,7,11], degreeLabels:['R','M3','P5','M7'], stageIntroduced:5 },
  { id:'min7',  name:'Minor 7',    symbol:'m7',   formula:[0,3,7,10], degreeLabels:['R','m3','P5','m7'], stageIntroduced:5 }
];

function chordTypeById(id) {
  for (var i = 0; i < CHORD_TYPES.length; i++) if (CHORD_TYPES[i].id === id) return CHORD_TYPES[i];
  return null;
}
function chordTypesUpToStage(s) {
  return CHORD_TYPES.filter(function(t) { return t.stageIntroduced <= s; });
}

/* ── Quiz state ── */
var CHORD_QUIZ = {
  stage:1, typeIdx:0, unlockedTypes:[0], attempts:[],
  consecutiveCorrect:0, current:null, answered:false,
  questionStart:0, lastPrompt:null, pendingUnlock:null,
  forceType:null, forceTypeRemaining:0,
  chordTypesCorrect:{}
};

/* ── Stage config ── */
var CHORD_STAGE_CONFIG = {
  1: { masteryMode:'streak',      masteryStreak:12, speedThreshold:4000,
       typeLabels:['Name the interval','Find the note','Semitone count'],
       generate:chordGenerateStage1Question },
  2: { masteryMode:'keyCoverage', chordTypes:['major'],        totalCells:12,  coverageThreshold:1.0, speedThreshold:5000,
       typeLabels:['Notes in chord','Name the chord','Formula recall'],
       generate:chordGenerateStage2Question },
  3: { masteryMode:'keyCoverage', chordTypes:['minor'],        totalCells:12,  coverageThreshold:1.0, speedThreshold:5000,
       typeLabels:['Notes in chord','Name the chord','Formula recall'],
       generate:chordGenerateStage3Question },
  4: { masteryMode:'keyCoverage', chordTypes:['dom7'],         totalCells:12,  coverageThreshold:1.0, speedThreshold:6000,
       typeLabels:['Notes in chord','Name the chord','Formula recall'],
       generate:chordGenerateStage4Question },
  5: { masteryMode:'keyCoverage', chordTypes:['maj7','min7'],  totalCells:24,  coverageThreshold:1.0, speedThreshold:6000,
       typeLabels:['Notes in chord','Name the chord','Formula recall'],
       generate:chordGenerateStage5Question },
  6: { masteryMode:'keyCoverage', chordTypes:['major','minor','dom7','maj7','min7'], totalCells:60, coverageThreshold:0.8, speedThreshold:5000,
       typeLabels:['Notes in chord','Name the chord','Formula recall'],
       generate:chordGenerateStage6Question }
};

var CHORD_MASTERY_COPY = {
  1: { title:'Intervals locked in.',
       body:'Minor 3rd, Major 3rd, Perfect 5th: the distances that build every chord. Next: how they stack to make a major chord.' },
  2: { title:'Major chords. All 12 roots.',
       body:'R-M3-P5, every key, automatic. Next: flatten that middle note by one half step for the same shape, completely different sound.' },
  3: { title:'Major and minor. Solid.',
       body:'One half step of difference, completely different feel. Next: add a flatted 7th on top and you get the chord that drives blues, jazz, and most of popular music.' },
  4: { title:'Dominant 7ths. All 12.',
       body:'R-M3-P5-m7. That tension in the top note is what makes it want to resolve. Next: swap the flatted 7th for a natural one for a very different mood.' },
  5: { title:'All three 7th types. Done.',
       body:'Dom7 pulls. Maj7 floats. Min7 broods. One more stage: all 5 types mixed until the recognition is truly automatic.' },
  6: { title:'Five chord types. Automatic.',
       body:'Major, minor, dom7, maj7, min7: notes and formulas, any root, no hesitation. That’s chord construction. Module 04 puts them on the neck.' }
};

function chordActiveConfig() { return CHORD_STAGE_CONFIG[CHORD_QUIZ.stage]; }

/* ── Utilities ── */
function chordShuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function chordSample(arr, n) { return chordShuffle(arr).slice(0, n); }

function chordCoverageCount(cfg) {
  var count = 0;
  for (var i = 0; i < CHORD_ALL_ROOTS.length; i++)
    for (var j = 0; j < cfg.chordTypes.length; j++)
      if (CHORD_QUIZ.chordTypesCorrect[CHORD_ALL_ROOTS[i] + ':' + cfg.chordTypes[j]]) count++;
  return count;
}

function chordRecentCorrectAttempts(n) {
  return CHORD_QUIZ.attempts.filter(function(a) { return a.correct; }).slice(-n);
}

function chordAverageRecentTime(n) {
  var rec = chordRecentCorrectAttempts(n);
  if (!rec.length) return null;
  var sum = 0; for (var i = 0; i < rec.length; i++) sum += rec[i].timeMs;
  return sum / rec.length;
}

function chordIsSpeedReady() {
  var cfg = chordActiveConfig();
  if (cfg.masteryMode === 'streak') {
    if (CHORD_QUIZ.consecutiveCorrect < cfg.masteryStreak) return false;
    var avg = chordAverageRecentTime(cfg.masteryStreak);
    return avg !== null && avg <= cfg.speedThreshold;
  }
  var needed = Math.ceil(cfg.totalCells * cfg.coverageThreshold);
  if (chordCoverageCount(cfg) < needed) return false;
  var recent = chordRecentCorrectAttempts(needed);
  if (recent.length < needed) return false;
  var total = 0; for (var k = 0; k < recent.length; k++) total += recent[k].timeMs;
  return (total / recent.length) <= cfg.speedThreshold;
}

function chordIsAccurateButSlow() {
  var cfg = chordActiveConfig();
  if (cfg.masteryMode === 'streak') {
    if (CHORD_QUIZ.consecutiveCorrect < cfg.masteryStreak) return false;
    return !chordIsSpeedReady();
  }
  var needed = Math.ceil(cfg.totalCells * cfg.coverageThreshold);
  return chordCoverageCount(cfg) >= needed && !chordIsSpeedReady();
}

function chordTypeAccuracy(typeIdx) {
  var rel = CHORD_QUIZ.attempts.filter(function(a) { return a.typeIdx === typeIdx; });
  if (rel.length < 4) return null;
  return rel.filter(function(a) { return a.correct; }).length / rel.length;
}

function chordMaybeUnlockNextType() {
  var cfg = chordActiveConfig();
  var max = cfg.typeLabels.length - 1;
  var hi  = Math.max.apply(null, CHORD_QUIZ.unlockedTypes);
  var acc = chordTypeAccuracy(hi);
  var next = hi + 1;
  if (acc !== null && acc >= 0.8 && next <= max && CHORD_QUIZ.unlockedTypes.indexOf(next) === -1) {
    CHORD_QUIZ.unlockedTypes.push(next);
    CHORD_QUIZ.typeIdx = next;
    return true;
  }
  return false;
}

function chordPickActiveType(forced) {
  if (forced !== null && forced !== undefined) return forced;
  var p = CHORD_QUIZ.unlockedTypes;
  return p[Math.floor(Math.random() * p.length)];
}

function chordPickTypeForStage(cfg) {
  var unmastered = cfg.chordTypes.filter(function(id) {
    for (var i = 0; i < CHORD_ALL_ROOTS.length; i++)
      if (!CHORD_QUIZ.chordTypesCorrect[CHORD_ALL_ROOTS[i] + ':' + id]) return true;
    return false;
  });
  var pool = unmastered.length > 0 ? unmastered : cfg.chordTypes;
  return pool[Math.floor(Math.random() * pool.length)];
}

function chordWeightedPool(roots) {
  /* Natural roots appear 3×, accidentals 1× — roughly 75% natural questions */
  var weighted = [];
  for (var i = 0; i < roots.length; i++) {
    weighted.push(roots[i]);
    if (CHORD_NATURAL_ROOTS.indexOf(roots[i]) !== -1) {
      weighted.push(roots[i]);
      weighted.push(roots[i]);
    }
  }
  return weighted;
}

function chordPickUnmasteredRoot(typeId) {
  var unmastered = CHORD_ALL_ROOTS.filter(function(r) {
    return !CHORD_QUIZ.chordTypesCorrect[r + ':' + typeId];
  });
  var pool = chordWeightedPool(unmastered.length > 0 ? unmastered : CHORD_ALL_ROOTS);
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ══════════════════════════════════════════════════
   STAGE 1 — INTERVALS
══════════════════════════════════════════════════ */
function chordS1PickPair() {
  var iv = CHORD_INTERVALS[Math.floor(Math.random() * CHORD_INTERVALS.length)];
  var pool = chordWeightedPool(CHORD_ALL_ROOTS);
  var root = pool[Math.floor(Math.random() * pool.length)];
  var ri = chordRootToIdx(root);
  var useFlat = root.indexOf('b') !== -1;
  var spell = useFlat ? CHORD_FLAT_SPELL : FUND_CHROMATIC_SEQ;
  var target = spell[(ri + iv.semitones) % 12];
  return { iv:iv, root:root, target:target };
}

function chordGenerateStage1Question(forcedType) {
  var t = chordPickActiveType(forcedType);
  if (t === 0) {
    /* Name the interval: given two notes, pick name */
    var p = chordS1PickPair();
    var distractors = chordSample(CHORD_INTERVALS.filter(function(x) { return x.name !== p.iv.name; }), 3)
      .map(function(x) { return x.name; });
    return {
      typeIdx:0, typeLabel:'Name the interval',
      prompt: chordDN(p.root) + ' to ' + chordDN(p.target),
      sub: 'What interval is this?',
      options: chordShuffle([p.iv.name].concat(distractors)),
      correct: p.iv.name
    };
  }
  if (t === 1) {
    /* Find the note: given root + interval name, pick target */
    var p2 = chordS1PickPair();
    var ri2 = chordRootToIdx(p2.root);
    var useFlat2 = p2.root.indexOf('b') !== -1;
    var spell2 = useFlat2 ? CHORD_FLAT_SPELL : FUND_CHROMATIC_SEQ;
    var tried = {}; tried[p2.target] = true; tried[p2.root] = true;
    var distractors2 = [];
    var guard = 0;
    while (distractors2.length < 3 && guard++ < 30) {
      var n = spell2[Math.floor(Math.random() * 12)];
      if (!tried[n]) { tried[n] = true; distractors2.push(n); }
    }
    var opts2 = chordShuffle([p2.target].concat(distractors2)).map(chordDN);
    return {
      typeIdx:1, typeLabel:'Find the note',
      prompt: 'A ' + p2.iv.name.toLowerCase() + ' above ' + chordDN(p2.root),
      sub: 'Pick the target note',
      options: opts2,
      correct: chordDN(p2.target)
    };
  }
  /* Semitone count */
  var iv3 = CHORD_INTERVALS[Math.floor(Math.random() * CHORD_INTERVALS.length)];
  var allS = CHORD_INTERVALS.map(function(x) { return x.semitones; });
  var distS = allS.filter(function(s) { return s !== iv3.semitones; });
  var extras = [iv3.semitones - 1, iv3.semitones + 1, iv3.semitones + 2];
  for (var e = 0; e < extras.length && distS.length < 6; e++) {
    if (extras[e] > 0 && extras[e] < 12 && distS.indexOf(extras[e]) === -1) distS.push(extras[e]);
  }
  return {
    typeIdx:2, typeLabel:'Semitone count',
    prompt: 'How many semitones is a ' + iv3.name.toLowerCase() + '?',
    sub: 'Pick the count',
    options: chordShuffle([iv3.semitones].concat(chordSample(distS, 3))).map(String),
    correct: String(iv3.semitones)
  };
}

/* ══════════════════════════════════════════════════
   STAGES 2-6 — Shared generators
══════════════════════════════════════════════════ */
function chordGenNotesInChord(root, typeId) {
  var type = chordTypeById(typeId);
  var correctNotes = chordNotes(root, type.formula);
  var correctStr = chordDisplayNotes(correctNotes);
  var noteCount = type.formula.length;
  /* Same-root, same note count — forces the student to identify the exact notes */
  var sameCountTypes = chordShuffle(CHORD_TYPES.filter(function(t) {
    return t.id !== typeId && t.formula.length === noteCount;
  }));
  var tried = {}; tried[correctStr] = true;
  var distractors = [];
  for (var i = 0; i < sameCountTypes.length && distractors.length < 3; i++) {
    var d = chordDisplayNotes(chordNotes(root, sameCountTypes[i].formula));
    if (!tried[d]) { tried[d] = true; distractors.push(d); }
  }
  /* Fill remaining slots with different roots, same type (same note count guaranteed) */
  var otherRoots = chordShuffle(CHORD_ALL_ROOTS.filter(function(r) { return r !== root; }));
  for (var j = 0; j < otherRoots.length && distractors.length < 3; j++) {
    var d2 = chordDisplayNotes(chordNotes(otherRoots[j], type.formula));
    if (!tried[d2]) { tried[d2] = true; distractors.push(d2); }
  }
  return {
    typeIdx:0, typeLabel:'Notes in chord',
    prompt: 'What notes are in ' + chordSymbol(root, typeId) + '?',
    sub: type.name + ' chord',
    options: chordShuffle([correctStr].concat(distractors.slice(0,3))),
    correct: correctStr,
    chordKey: root + ':' + typeId,
    longOptions: true
  };
}

function chordGenNameChord(root, typeId) {
  var type = chordTypeById(typeId);
  var correctNotes = chordNotes(root, type.formula);
  var correct = chordSymbol(root, typeId);
  /* Always use all 5 types so all options share the same root */
  var otherTypes = chordShuffle(CHORD_TYPES.filter(function(t) { return t.id !== typeId; }));
  var tried = {}; tried[correct] = true;
  var distractors = [];
  for (var i = 0; i < otherTypes.length && distractors.length < 3; i++) {
    var d = chordSymbol(root, otherTypes[i].id);
    if (!tried[d]) { tried[d] = true; distractors.push(d); }
  }
  return {
    typeIdx:1, typeLabel:'Name the chord',
    prompt: chordDisplayNotes(correctNotes),
    sub: 'What chord is this?',
    options: chordShuffle([correct].concat(distractors.slice(0,3))),
    correct: correct,
    chordKey: root + ':' + typeId
  };
}

function chordGenFormulaRecall(typeId) {
  var type = chordTypeById(typeId);
  var correct = type.degreeLabels.join('-');
  var distTypes = chordShuffle(CHORD_TYPES.filter(function(t) { return t.id !== typeId; })).slice(0,3);
  var distractors = distTypes.map(function(t) { return t.degreeLabels.join('-'); });
  return {
    typeIdx:2, typeLabel:'Formula recall',
    prompt: 'What is the formula for a ' + type.name.toLowerCase() + ' chord?',
    sub: 'Pick the degree labels',
    options: chordShuffle([correct].concat(distractors)),
    correct: correct
  };
}

function chordMakeQuestion(stageId, forcedType) {
  var cfg = CHORD_STAGE_CONFIG[stageId];
  var t = chordPickActiveType(forcedType);
  var typeId = chordPickTypeForStage(cfg);
  var root = chordPickUnmasteredRoot(typeId);
  if (t === 0) return chordGenNotesInChord(root, typeId);
  if (t === 1) return chordGenNameChord(root, typeId);
  return chordGenFormulaRecall(typeId);
}

function chordGenerateStage2Question(f) { return chordMakeQuestion(2, f); }
function chordGenerateStage3Question(f) { return chordMakeQuestion(3, f); }
function chordGenerateStage4Question(f) { return chordMakeQuestion(4, f); }
function chordGenerateStage5Question(f) { return chordMakeQuestion(5, f); }
function chordGenerateStage6Question(f) { return chordMakeQuestion(6, f); }
