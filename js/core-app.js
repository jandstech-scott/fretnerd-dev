/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════════════════
   SECTION 1: CONSTANTS & MUSIC THEORY
═══════════════════════════════════════════════════════════════ */
var NOTES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var NOTES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
var NATURAL_IDX    = [0,2,4,5,7,9,11];   // C D E F G A B
var ACCIDENTAL_IDX = [1,3,6,8,10];        // the 5 sharp/flat positions
var INSTRUMENTS = {
  guitar: {
    label:       'Guitar',
    strings:     6,
    stringOpen:  [4,11,7,2,9,4],       // e B G D A E (high to low)
    stringNames: ['e (1st)','B (2nd)','G (3rd)','D (4th)','A (5th)','E (6th)']
  },
  bass: {
    label:       'Bass',
    strings:     4,
    stringOpen:  [7,2,9,4],            // G D A E (high to low)
    stringNames: ['G (1st)','D (2nd)','A (3rd)','E (4th)']
  }
};

var instrument    = 'guitar';          // 'guitar' | 'bass'
function inst()   { return INSTRUMENTS[instrument]; }
var STRING_OPEN   = inst().stringOpen;
var STRING_NAMES  = inst().stringNames;
var NUM_STRINGS   = inst().strings;
var MAX_FRET      = 21;
var NECK_ASPECT   = 6.5;

/* experience level config */
var EXP = {
  beginner:     { label:'Beginner',     tFast:10000, tSlow:20000, mastery:3 },
  intermediate: { label:'Intermediate', tFast:5000,  tSlow:12000, mastery:4 },
  expert:       { label:'Expert',       tFast:3000,  tSlow:6000,  mastery:5 }
};

/* accidental toggle config — each toggle has a key letter that is
   added/removed from the accidentalMode string: 'N', 'S', 'F', 'NS', 'NSF', etc. */
var ACC_TOGGLES = [
  { key:'N', label:'Naturals' },
  { key:'S', label:'Sharps'   },
  { key:'F', label:'Flats'    }
];

/* ═══════════════════════════════════════════════════════════════
   SECTION 2: UTILITIES
═══════════════════════════════════════════════════════════════ */
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function isDark() { return window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches; }
function el(id)   { return document.getElementById(id); }
function setText(id, v) { var e = el(id); if (e) e.textContent = v; }
function setHtml(id, v) { var e = el(id); if (e) e.innerHTML = v; }
function setStyle(id, prop, v) { var e = el(id); if (e) e.style[prop] = v; }
function chromIdx(s, f) { return (STRING_OPEN[s] + f) % 12; }

/* per-instrument state snapshots — settings + progress saved separately per instrument */
var instState = {
  guitar: {
    quizMode: 'study', expLevel: 'beginner', accidentalMode: 'NSF',
    practiceStrings: [0,1,2,3,4,5], practiceFretMin: 0, practiceFretMax: MAX_FRET,
    knowledge: null, totalAsked: 0, totalCorrect: 0, totalTime: 0, currentStreak: 0
  },
  bass: {
    quizMode: 'study', expLevel: 'beginner', accidentalMode: 'NSF',
    practiceStrings: [0,1,2,3], practiceFretMin: 0, practiceFretMax: MAX_FRET,
    knowledge: null, totalAsked: 0, totalCorrect: 0, totalTime: 0, currentStreak: 0
  }
};

function snapshotCurrentInstrument() {
  instState[instrument] = {
    quizMode:        quizMode,
    expLevel:        expLevel,
    accidentalMode:  accidentalMode,
    practiceStrings: [...practiceStrings],
    practiceFretMin: practiceFretMin,
    practiceFretMax: practiceFretMax,
    knowledge:       knowledge,
    totalAsked:      totalAsked,
    totalCorrect:    totalCorrect,
    totalTime:       totalTime,
    currentStreak:   currentStreak
  };
}

function restoreInstrumentState(id) {
  var s = instState[id];
  quizMode        = s.quizMode;
  expLevel        = s.expLevel;
  accidentalMode  = s.accidentalMode;
  practiceStrings = new Set(s.practiceStrings);
  practiceFretMin = s.practiceFretMin;
  practiceFretMax = s.practiceFretMax;
  knowledge       = s.knowledge || makeKnowledge();
  totalAsked      = s.totalAsked;
  totalCorrect    = s.totalCorrect;
  totalTime       = s.totalTime;
  currentStreak   = s.currentStreak;
}

function applyInstrument(id) {
  instrument   = id;
  STRING_OPEN  = inst().stringOpen;
  STRING_NAMES = inst().stringNames;
  NUM_STRINGS  = inst().strings;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3: STORAGE (safe localStorage wrapper)
═══════════════════════════════════════════════════════════════ */
var SAVE_KEY = 'gtr_v11';
var storage = (function() {
  try {
    localStorage.setItem('__t','1');
    localStorage.removeItem('__t');
    return localStorage;
  } catch(e) {
    var mem = {};
    return {
      getItem:    function(k) { return mem[k] || null; },
      setItem:    function(k, v) { mem[k] = String(v); },
      removeItem: function(k) { delete mem[k]; }
    };
  }
})();

function saveState() {
  try {
    snapshotCurrentInstrument();
    storage.setItem(SAVE_KEY, JSON.stringify({
      instrument: instrument,
      instState:  instState
    }));
  } catch(e) {}
}

function loadState() {
  try {
    var raw = storage.getItem(SAVE_KEY);
    if (!raw) return;
    var d = JSON.parse(raw);
    /* restore per-instrument snapshots */
    if (d.instState) {
      ['guitar','bass'].forEach(function(id) {
        if (!d.instState[id]) return;
        var ds = d.instState[id];
        instState[id].quizMode        = ds.quizMode        || instState[id].quizMode;
        instState[id].expLevel        = ds.expLevel        || instState[id].expLevel;
        instState[id].accidentalMode  = ds.accidentalMode  || instState[id].accidentalMode;
        instState[id].practiceStrings = ds.practiceStrings || instState[id].practiceStrings;
        instState[id].practiceFretMin = ds.practiceFretMin != null ? ds.practiceFretMin : instState[id].practiceFretMin;
        instState[id].practiceFretMax = ds.practiceFretMax != null ? ds.practiceFretMax : instState[id].practiceFretMax;
        instState[id].totalAsked      = ds.totalAsked      || 0;
        instState[id].totalCorrect    = ds.totalCorrect    || 0;
        instState[id].totalTime       = ds.totalTime       || 0;
        instState[id].currentStreak   = ds.currentStreak   || 0;
        if (ds.knowledge) {
          instState[id].knowledge = ds.knowledge;
          Object.values(ds.knowledge).forEach(function(k) {
            if (k.avgTime  === undefined) k.avgTime  = 0;
            if (k.attempts === undefined) k.attempts = 0;
          });
        }
      });
    }
    /* restore active instrument */
    var id = d.instrument || 'guitar';
    applyInstrument(id);
    restoreInstrumentState(id);
  } catch(e) {}
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 4: APP STATE
═══════════════════════════════════════════════════════════════ */
/* -- settings -- */
var quizMode        = 'study';
var expLevel        = 'beginner';
var accidentalMode  = 'NSF';
var practiceStrings = new Set([0,1,2,3,4,5]); /* trimmed by applyInstrument */
var practiceFretMin = 0;
var practiceFretMax = MAX_FRET;

/* -- pending (used while settings panel is open) -- */
var pendingQuizMode     = 'study';
var pendingExp          = 'beginner';
var pendingAccidental   = 'NSF';
var pendingStrings      = [0,1,2,3,4,5];
var pendingFretMin      = 0;
var pendingFretMax      = MAX_FRET;

/* -- session -- */
var knowledge     = makeKnowledge();
var totalAsked    = 0;
var totalCorrect  = 0;
var totalTime     = 0;
var currentStreak = 0;

/* -- quiz interaction -- */
var answered          = false;
var currentKey        = null;
var lastRevealNote    = null;
var lastRevealWrong   = false;
var timerInterval     = null;
var questionStart     = 0;
var pausedAt          = 0;
var paused            = false;
var autoAdvanceTimer  = null;
var perQuestionSpelling = 'sharp';

function makeKnowledge() {
  var k = {};
  for (var s = 0; s < NUM_STRINGS; s++) {
    for (var f = 0; f <= MAX_FRET; f++) {
      k[s+'-'+f] = { s:s, f:f, correct:0, wrong:0, streak:0, due:0, seen:false, score:f<=5?1:0, avgTime:0, attempts:0 };
    }
  }
  return k;
}

/* shortcuts to current config */
function T_FAST()  { return EXP[expLevel].tFast; }
function T_SLOW()  { return EXP[expLevel].tSlow; }
function MASTERY() { return EXP[expLevel].mastery; }
function zDot(avgT, wrongs, total) {
  if (avgT > T_SLOW() || wrongs > total * 0.4) return '#E24B4A';
  if (avgT > T_FAST() || wrongs > total * 0.15) return '#BA7517';
  return '#1D9E75';
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 5: ACCIDENTAL / NOTE LOGIC
═══════════════════════════════════════════════════════════════ */
function accHasNaturals(m) { return m.indexOf('N') >= 0; }
function accHasSharps(m)   { return m.indexOf('S') >= 0; }
function accHasFlats(m)    { return m.indexOf('F') >= 0; }

function idxAllowed(idx) {
  var isNat = NATURAL_IDX.indexOf(idx) >= 0;
  if (isNat) return accHasNaturals(accidentalMode);
  return accHasSharps(accidentalMode) || accHasFlats(accidentalMode);
}

function spellNote(idx) {
  if (NATURAL_IDX.indexOf(idx) >= 0) return NOTES_SHARP[idx];
  if (accHasSharps(accidentalMode) && !accHasFlats(accidentalMode)) return NOTES_SHARP[idx];
  if (accHasFlats(accidentalMode)  && !accHasSharps(accidentalMode)) return NOTES_FLAT[idx];
  return perQuestionSpelling === 'flat' ? NOTES_FLAT[idx] : NOTES_SHARP[idx];
}

function notePool() {
  var pool = [];
  for (var i = 0; i < 12; i++) {
    var isNat = NATURAL_IDX.indexOf(i) >= 0;
    if (isNat) {
      pool.push(NOTES_SHARP[i]);
    } else {
      if (accHasSharps(accidentalMode) && !accHasFlats(accidentalMode)) pool.push(NOTES_SHARP[i]);
      else if (accHasFlats(accidentalMode) && !accHasSharps(accidentalMode)) pool.push(NOTES_FLAT[i]);
      else pool.push(perQuestionSpelling === 'flat' ? NOTES_FLAT[i] : NOTES_SHARP[i]);
    }
  }
  return pool;
}

function getChoices(correctIdx) {
  var pool = notePool();
  var correctName = pool[correctIdx];
  var wrong = [];
  for (var i = 0; i < 12; i++) {
    if (i !== correctIdx && idxAllowed(i)) wrong.push(pool[i]);
  }
  shuffle(wrong);
  return shuffle([correctName].concat(wrong.slice(0, 3)));
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 6: SRS ENGINE
═══════════════════════════════════════════════════════════════ */
function activeKeys() {
  return Object.keys(knowledge).filter(function(k) {
    var kn = knowledge[k];
    if (!practiceStrings.has(kn.s)) return false;
    if (kn.f < practiceFretMin || kn.f > practiceFretMax) return false;
    return idxAllowed(chromIdx(kn.s, kn.f));
  });
}

function weight(k) {
  var kn = knowledge[k];
  if (kn.score >= MASTERY()) return 0.05;
  var base    = 1 + kn.wrong * 2 - kn.correct * 0.4;
  var slow    = kn.attempts > 0 ? (kn.avgTime / 1000) * 0.3 : 0;
  var urgency = Date.now() >= kn.due ? 1.6 : 0.5;
  return Math.max(0.05, (base + slow) * urgency);
}

function pickQuestion() {
  var keys = activeKeys();
  if (!keys.length) return Object.keys(knowledge)[0];
  var w   = keys.map(weight);
  var tot = w.reduce(function(a, b) { return a + b; }, 0);
  var r   = Math.random() * tot;
  for (var i = 0; i < keys.length; i++) { r -= w[i]; if (r <= 0) return keys[i]; }
  return keys[keys.length - 1];
}

function masteredCount() {
  return activeKeys().filter(function(k) { return knowledge[k].score >= MASTERY(); }).length;
}
function activeTotal() { return activeKeys().length; }

/* ═══════════════════════════════════════════════════════════════
   SECTION 7: CANVAS RENDERING
═══════════════════════════════════════════════════════════════ */
function drawFretboard(containerId, canvasId, targetS, targetF, revealNote, isWrong) {
  var outer  = el(containerId);
  var canvas = el(canvasId);
  if (!outer || !canvas) return;

  /* on portrait phone, show only the zone containing the target fret */
  var fretLo = 0, fretHi = MAX_FRET;
  if (containerId === 'fb-outer' && isPhonePortrait()) {
    var bounds = phoneZoneBounds(targetF);
    fretLo = bounds.lo; fretHi = bounds.hi;
  }
  var FRETS = fretHi - fretLo;

  var aW = outer.clientWidth - 8;
  if (aW <= 10) aW = window.innerWidth - 8;

  var cW, cH;
  if (isPhonePortrait() && containerId === 'fb-outer' && FRETS < MAX_FRET) {
    /* fill width, taller aspect since fewer frets shown — scale factor tuned for readability */
    var zoneAspect = NECK_ASPECT * (FRETS / MAX_FRET) * 1.6;
    cW = Math.max(200, Math.floor(aW));
    cH = Math.max(80,  Math.floor(cW / zoneAspect));
  } else {
    cW = Math.max(200, Math.floor(aW));
    cH = Math.max(40,  Math.floor(cW / NECK_ASPECT));
  }
  var dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(cW * dpr);
  canvas.height = Math.round(cH * dpr);
  canvas.style.width  = cW + 'px';
  canvas.style.height = cH + 'px';
  var ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cW, cH);
  var dark = isDark();

  var PL = Math.round(cW * 0.042), PR = Math.round(cW * 0.012);
  var PT = Math.round(cH * 0.12),  PB = Math.round(cH * 0.22);
  var fw = (cW - PL - PR) / FRETS;
  var sh = (cH - PT - PB) / (NUM_STRINGS - 1);

  /* board background */
  /* when showing a zone (fretLo > 0), add a small left margin so the
     first fret line doesn't sit flush against the board edge (looks like a nut) */
  var zoneMargin = (fretLo > 0) ? Math.round(fw * 0.4) : 0;
  ctx.fillStyle = dark ? '#1e1400' : '#f9f4e8';
  ctx.fillRect(PL, PT, zoneMargin + FRETS * fw, (NUM_STRINGS-1) * sh);

  /* fret lines — offset by fretLo; nut only when fretLo === 0 */
  for (var f = 0; f <= FRETS; f++) {
    var x = PL + zoneMargin + f * fw;
    var isNut = (fretLo === 0 && f === 0);
    ctx.strokeStyle = isNut ? (dark ? '#bbb' : '#333') : (dark ? '#3a3a3a' : '#ddd');
    ctx.lineWidth   = isNut ? Math.max(3, fw * 0.12) : 1;
    ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + (NUM_STRINGS-1) * sh); ctx.stroke();
  }

  /* strings — extend from left edge through all frets */
  for (var s = 0; s < NUM_STRINGS; s++) {
    var y = PT + s * sh;
    ctx.strokeStyle = dark ? '#4a4a4a' : '#c8c8c8';
    ctx.lineWidth   = Math.max(0.5, 0.5 + s * 0.35);
    ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(PL + zoneMargin + FRETS * fw, y); ctx.stroke();
  }

  /* position dots — offset by fretLo and zoneMargin */
  var dr = Math.max(3, Math.min(sh * 0.22, fw * 0.18));
  [3,5,7,9,12,15,17,19].forEach(function(fd) {
    var fi = fd - fretLo;
    if (fi <= 0 || fi > FRETS) return;
    var x = PL + zoneMargin + (fi - 0.5) * fw;
    ctx.fillStyle = dark ? '#3a3a3a' : '#e0e0e0';
    if (fd === 12) {
      ctx.beginPath(); ctx.arc(x, PT + (NUM_STRINGS-1)*sh*0.3, dr, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, PT + (NUM_STRINGS-1)*sh*0.7, dr, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(x, PT + (NUM_STRINGS-1)*sh*0.5, dr, 0, Math.PI * 2); ctx.fill();
    }
  });

  /* fret number labels for phone portrait zone */
  if (isPhonePortrait() && containerId === 'fb-outer') {
    ctx.font = Math.max(9, Math.min(12, fw * 0.4)) + 'px -apple-system,sans-serif';
    ctx.fillStyle = dark ? '#ccc' : '#444';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (var fn = fretLo; fn <= fretHi; fn++) {
      var fi2 = fn - fretLo;
      var fx = PL + zoneMargin + (fi2 === 0 ? 0 : (fi2 - 0.5) * fw);
      if (fn === fretLo) fx = PL + zoneMargin * 0.5; /* center in the margin area */
      ctx.fillText(fn, fx, PT + (NUM_STRINGS - 1) * sh + PB * 0.45);
    }
  }

  /* string number labels */
  var lc = dark ? '#555' : '#bbb';
  ctx.font = Math.max(9, Math.min(12, sh * 0.55)) + 'px -apple-system,sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (var s2 = 0; s2 < NUM_STRINGS; s2++) {
    ctx.fillStyle = lc;
    ctx.fillText(s2 + 1, PL - 5, PT + s2 * sh);
  }

  /* note dot — offset by fretLo and zoneMargin */
  var hx = (targetF === 0 && fretLo === 0)
    ? PL
    : PL + zoneMargin + (targetF - fretLo - 0.5) * fw;
  var hy = PT + targetS * sh;
  var hr = Math.max(7, Math.min(sh * 0.44, fw * 0.36));
  ctx.fillStyle = revealNote ? (isWrong ? '#E24B4A' : '#1D9E75') : '#1D9E75';
  ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '600 ' + Math.max(9, hr * 0.9) + 'px -apple-system,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(revealNote || '?', hx, hy);
  ctx.textBaseline = 'alphabetic';
}

/* study fretboard: shows note labels on selected positions, full neck visible */
function drawStudyFretboard(activeStrings, fMin, fMax) {
  var outer  = el('study-fb-outer');
  var canvas = el('study-canvas');
  if (!outer || !canvas) return;

  var aW = outer.clientWidth - 8;
  if (aW <= 10) aW = window.innerWidth - 8;

  var cW = Math.max(200, Math.floor(aW));
  var cH = Math.max(40,  Math.floor(cW / NECK_ASPECT));
  var dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(cW * dpr);
  canvas.height = Math.round(cH * dpr);
  canvas.style.width  = cW + 'px';
  canvas.style.height = cH + 'px';
  var ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cW, cH);
  var dark = isDark();

  var PL = Math.round(cW * 0.042), PR = Math.round(cW * 0.012);
  var PT = Math.round(cH * 0.12),  PB = Math.round(cH * 0.22);
  var fw = (cW - PL - PR) / MAX_FRET;
  var sh = (cH - PT - PB) / (NUM_STRINGS - 1);

  /* board background */
  ctx.fillStyle = dark ? '#1e1400' : '#f9f4e8';
  ctx.fillRect(PL, PT, MAX_FRET * fw, (NUM_STRINGS - 1) * sh);

  /* fret lines */
  for (var f = 0; f <= MAX_FRET; f++) {
    var x = PL + f * fw;
    ctx.strokeStyle = (f === 0) ? (dark ? '#bbb' : '#333') : (dark ? '#3a3a3a' : '#ddd');
    ctx.lineWidth   = (f === 0) ? Math.max(3, fw * 0.12) : 1;
    ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + (NUM_STRINGS - 1) * sh); ctx.stroke();
  }

  /* strings */
  for (var s = 0; s < NUM_STRINGS; s++) {
    var y = PT + s * sh;
    ctx.strokeStyle = dark ? '#4a4a4a' : '#c8c8c8';
    ctx.lineWidth   = Math.max(0.5, 0.5 + s * 0.35);
    ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(PL + MAX_FRET * fw, y); ctx.stroke();
  }

  /* position marker dots */
  var dr = Math.max(3, Math.min(sh * 0.22, fw * 0.18));
  [3,5,7,9,12,15,17,19].forEach(function(fd) {
    if (fd > MAX_FRET) return;
    var mx = PL + (fd - 0.5) * fw;
    ctx.fillStyle = dark ? '#3a3a3a' : '#e0e0e0';
    if (fd === 12) {
      ctx.beginPath(); ctx.arc(mx, PT + (NUM_STRINGS-1)*sh*0.3, dr, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx, PT + (NUM_STRINGS-1)*sh*0.7, dr, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(mx, PT + (NUM_STRINGS-1)*sh*0.5, dr, 0, Math.PI * 2); ctx.fill();
    }
  });

  /* string number labels */
  ctx.font = Math.max(9, Math.min(12, sh * 0.55)) + 'px -apple-system,sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillStyle = dark ? '#555' : '#bbb';
  for (var s2 = 0; s2 < NUM_STRINGS; s2++) {
    ctx.fillText(s2 + 1, PL - 5, PT + s2 * sh);
  }

  /* fret number labels (odd frets) */
  ctx.font = Math.max(8, Math.min(11, fw * 0.38)) + 'px -apple-system,sans-serif';
  ctx.fillStyle = dark ? '#888' : '#999';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (var fn = 1; fn <= MAX_FRET; fn++) {
    if (fn % 2 === 1) {
      ctx.fillText(fn, PL + (fn - 0.5) * fw, PT + (NUM_STRINGS - 1) * sh + PB * 0.55);
    }
  }

  /* note dots for in-range positions */
  var hr = Math.max(7, Math.min(sh * 0.44, fw * 0.36));
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (var si = 0; si < NUM_STRINGS; si++) {
    if (activeStrings.indexOf(si) < 0) continue;
    for (var fi = 0; fi <= MAX_FRET; fi++) {
      if (fi < fMin || fi > fMax) continue;
      var idx = chromIdx(si, fi);
      if (!idxAllowed(idx)) continue;
      var isAcc = ACCIDENTAL_IDX.indexOf(idx) >= 0;
      var nx = (fi === 0) ? PL : PL + (fi - 0.5) * fw;
      var ny = PT + si * sh;
      ctx.fillStyle = isAcc ? '#6C5CE7' : '#1D9E75';
      ctx.beginPath(); ctx.arc(nx, ny, hr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '600 ' + Math.max(7, Math.round(hr * 0.85)) + 'px -apple-system,sans-serif';
      ctx.fillText(spellNote(idx), nx, ny);
    }
  }

  var accSpan = (accHasSharps(accidentalMode) || accHasFlats(accidentalMode))
    ? '<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#6C5CE7;margin-right:5px;vertical-align:middle;"></span>Accidental</span>'
    : '';
  var HINT_SVG = '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin:0 1px"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><circle cx="7" cy="5" r="2" fill="var(--surface)"/><circle cx="13" cy="10" r="2" fill="var(--surface)"/><circle cx="7" cy="15" r="2" fill="var(--surface)"/></svg>';
  var summarySpan = '<span style="margin-left:auto;text-align:right;line-height:1.5;">'
    + buildSettingsSummary()
    + '<br><span style="font-size:14px;">Tap ' + HINT_SVG + ' to change</span>'
    + '</span>';
  el('study-legend').innerHTML =
    '<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1D9E75;margin-right:5px;vertical-align:middle;"></span>Natural</span> '
    + accSpan + summarySpan;
}

function drawHeatmap(canvasId) {
  var canvas = el(canvasId);
  if (!canvas) return;
  var W  = canvas.parentElement.clientWidth || 600;
  var H  = canvas.height;
  canvas.width = W;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  var dark = isDark();
  var GAP = 1, LEFT = 28, TOP = 3;
  var CW  = Math.floor((W - LEFT - 8) / (MAX_FRET + 1)) - GAP;
  var CH  = Math.max(7, Math.floor((H - TOP - 14) / NUM_STRINGS) - GAP);
  var lc  = dark ? '#999' : '#888';

  for (var s = 0; s < NUM_STRINGS; s++) {
    ctx.fillStyle = lc;
    ctx.font = '11px -apple-system,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(s + 1, LEFT - 4, TOP + s * (CH + GAP) + CH - 1);
    for (var f = 0; f <= MAX_FRET; f++) {
      var kn = knowledge[s + '-' + f];
      var c;
      if      (!kn.seen)                            c = dark ? '#2a2a2a' : '#e8e8e8';
      else if (kn.score >= MASTERY())                c = '#1D9E75';
      else if (kn.wrong > kn.correct)               c = '#E24B4A';
      else if (kn.attempts > 0 && kn.avgTime > T_SLOW()) c = '#BA7517';
      else                                           c = '#FAC775';
      ctx.fillStyle = c;
      ctx.fillRect(LEFT + f * (CW + GAP), TOP + s * (CH + GAP), CW, CH);
    }
  }
  ctx.fillStyle = lc;
  ctx.font = '9px -apple-system,sans-serif';
  ctx.textAlign = 'center';
  for (var f2 = 0; f2 <= MAX_FRET; f2 += 4) {
    ctx.fillText(f2, LEFT + f2 * (CW + GAP) + CW / 2, TOP + NUM_STRINGS * (CH + GAP) + 10);
  }
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8: LAYOUT & DEVICE DETECTION
═══════════════════════════════════════════════════════════════ */

/* ── three layout tiers based on available width ── */
function deviceTier() {
  var w = window.innerWidth;
  var h = window.innerHeight;
  var portrait = h > w;
  if (portrait && w <= 500)  return 'phone-portrait';
  if (!portrait && h <= 500) return 'phone-landscape';
  if (w <= 900)              return 'tablet-small';   /* small tablet / large phone landscape */
  return 'desktop';                                   /* iPad, desktop */
}
function isPhonePortrait()  { return deviceTier() === 'phone-portrait';  }
function isPhoneLandscape() { return deviceTier() === 'phone-landscape'; }
function isPhone()          { var t = deviceTier(); return t === 'phone-portrait' || t === 'phone-landscape'; }

/* for portrait phone: zone-based partial neck */
var PHONE_ZONE_SIZE = 4;
function phoneZoneBounds(f) {
  if (f <= 1) return { lo: 0, hi: PHONE_ZONE_SIZE - 1 };
  var lo = f - 1;
  var hi = lo + PHONE_ZONE_SIZE - 1;
  if (hi > MAX_FRET) { hi = MAX_FRET; lo = Math.max(0, hi - PHONE_ZONE_SIZE + 1); }
  return { lo: lo, hi: hi };
}

function layoutApp() {
  var tier = deviceTier();
  var portrait  = tier === 'phone-portrait';
  var landscape = tier === 'phone-landscape';
  var phone     = portrait || landscape;

  var app = el('app');
  if (!app) return;

  app.style.padding = phone ? '6px 8px' : '10px 14px';
  app.style.gap     = phone ? '5px' : '8px';

  /* ── stats row: hide some pills on landscape ── */
  var mastEl = el('mastered-pill'), expEl = el('exp-pill');
  if (mastEl) mastEl.style.display = landscape ? 'none' : '';
  if (expEl)  expEl.style.display  = landscape ? 'none' : '';

  /* ── prompt row ── */
  var promptText = el('prompt-text'), timerVal = el('timer-val');
  var promptSub  = el('prompt-sub');
  if (promptText) promptText.style.fontSize = landscape ? '17px' : portrait ? '18px' : '';
  if (timerVal)   timerVal.style.fontSize   = landscape ? '17px' : portrait ? '18px' : '';
  if (promptSub)  promptSub.style.display   = landscape ? 'none' : '';

  /* ── answer grid ── */
  var ansRow = el('answer-row');
  if (ansRow) {
    ansRow.style.gridTemplateColumns = portrait ? 'repeat(2,1fr)' : 'repeat(4,1fr)';
    ansRow.style.gap = phone ? '6px' : '';
  }
  var ansBtns = document.querySelectorAll('.ans-btn');
  for (var i = 0; i < ansBtns.length; i++) {
    if      (portrait)  { ansBtns[i].style.padding = '16px 4px'; ansBtns[i].style.fontSize = '20px'; }
    else if (landscape) { ansBtns[i].style.padding = '8px 4px';  ansBtns[i].style.fontSize = '16px'; }
    else                { ansBtns[i].style.padding = '';          ansBtns[i].style.fontSize = ''; }
  }

  /* ── heatmap ── */
  var hmCanvas = el('hm-canvas');
  if (hmCanvas) hmCanvas.style.height = landscape ? '36px' : '';
  var speedLegend = el('speed-legend');
  if (speedLegend) speedLegend.style.display = phone ? 'none' : '';

  /* ── fretboard: flex:1 in CSS handles height ── */
  var fbo = el('fb-outer');
  if (fbo) fbo.style.height = '';
}

var rsTimer;
window.addEventListener('resize', function() {
  clearTimeout(rsTimer);
  rsTimer = setTimeout(function() {
    layoutApp();
    setTimeout(function() {
      var sc = el('study-content');
      if (sc && sc.style.display === 'flex') {
        var activeStr = [...practiceStrings].sort(function(a,b){return a-b;});
        drawStudyFretboard(activeStr, practiceFretMin, practiceFretMax);
      } else if (currentKey) {
        var kn = knowledge[currentKey];
        drawFretboard('fb-outer','fb-canvas', kn.s, kn.f, lastRevealNote, lastRevealWrong);
      }
      drawHeatmap('hm-canvas');
    }, 50);
  }, 100);
});
window.addEventListener('orientationchange', function() {
  setTimeout(function() { layoutApp(); }, 200);
});

/* ═══════════════════════════════════════════════════════════════
   SECTION 9: QUIZ ENGINE
═══════════════════════════════════════════════════════════════ */
function renderQuestion() {
  if (paused) togglePause();
  clearTimeout(autoAdvanceTimer);
  answered = false; lastRevealNote = null; lastRevealWrong = false;

  /* reset pause UI */
  var pb = el('pause-btn');
  if (pb) pb.innerHTML = ICONS.pause;
  var pc = el('pause-cover');
  if (pc) pc.classList.remove('show');
  var ar = el('answer-row');
  if (ar) { ar.style.pointerEvents = ''; ar.style.opacity = ''; }

  /* pick spelling */
  if      (accHasSharps(accidentalMode) && accHasFlats(accidentalMode)) perQuestionSpelling = Math.random() < 0.5 ? 'sharp' : 'flat';
  else if (accHasFlats(accidentalMode))  perQuestionSpelling = 'flat';
  else                                   perQuestionSpelling = 'sharp';

  currentKey = pickQuestion();
  var kn      = knowledge[currentKey];
  kn.seen     = true;
  var idx     = chromIdx(kn.s, kn.f);
  var correct = notePool()[idx];
  var choices = getChoices(idx);

  setText('prompt-text', 'String ' + (kn.s + 1) + '  ·  Fret ' + kn.f);
  var subTxt = kn.f === 0 ? 'open string' : '(' + STRING_NAMES[kn.s] + ')';
  if (isPhonePortrait()) {
    var zb = phoneZoneBounds(kn.f);
    subTxt += '  ·  zone ' + zb.lo + '–' + zb.hi;
  }
  setText('prompt-sub', subTxt);

  /* difficulty badge */
  var db = el('diff-badge');
  if (db) {
    if      (kn.score >= MASTERY())                          { db.textContent='mastered';   db.style.background='var(--teal-lt)';   db.style.color='var(--teal-txt)'; }
    else if (kn.correct + kn.wrong === 0)                    { db.textContent='new';        db.style.background='var(--blue-lt)';   db.style.color='var(--blue-txt)'; }
    else if (kn.wrong > kn.correct)                          { db.textContent='struggling'; db.style.background='var(--red-lt)';    db.style.color='var(--red-txt)';  }
    else if (kn.attempts > 0 && kn.avgTime > T_SLOW())       { db.textContent='slow';       db.style.background='var(--amber-lt)';  db.style.color='var(--amber-txt)';}
    else                                                     { db.textContent='learning';   db.style.background='var(--amber-lt)';  db.style.color='var(--amber-txt)';}
  }

  var fb = el('feedback');
  if (fb) { fb.textContent = ''; fb.style.color = ''; }

  /* build answer buttons */
  var row = el('answer-row');
  if (row) {
    row.innerHTML = '';
    choices.forEach(function(name) {
      var btn = document.createElement('button');
      btn.className   = 'ans-btn';
      btn.textContent = name;
      btn.addEventListener('click', function() { handleAnswer(name, correct, idx, kn); });
      row.appendChild(btn);
    });
  }

  drawFretboard('fb-outer', 'fb-canvas', kn.s, kn.f, null, false);
  drawHeatmap('hm-canvas');
  updateTopBar();

  /* timer */
  clearInterval(timerInterval);
  questionStart = performance.now();
  var tv = el('timer-val');
  if (tv) { tv.textContent = '0.0'; tv.className = ''; }
  timerInterval = setInterval(function() {
    var e = (performance.now() - questionStart) / 1000;
    if (tv) {
      tv.textContent = e.toFixed(1);
      tv.className   = e >= T_SLOW() / 1000 ? 'hesitant' : e >= T_FAST() / 1000 ? 'slow' : '';
    }
  }, 100);
}

function handleAnswer(chosen, correct, correctIdx, kn) {
  if (answered || paused) return;
  answered = true;

  /* immediate tap feedback */
  var btns = document.querySelectorAll('.ans-btn');
  for (var i = 0; i < btns.length; i++) {
    if (btns[i].textContent === chosen) btns[i].classList.add('tapped');
    btns[i].disabled = true;
  }

  clearInterval(timerInterval);
  var elapsed = performance.now() - questionStart;
  var ok      = chosen === correct;

  kn.attempts++;
  kn.avgTime = kn.avgTime + (elapsed - kn.avgTime) / kn.attempts;

  /* color answer buttons */
  for (var j = 0; j < btns.length; j++) {
    if (btns[j].textContent === correct && !ok) {
      btns[j].style.background   = '#9FE1CB';
      btns[j].style.borderColor  = '#1D9E75';
      btns[j].style.color        = '#085041';
    }
    if (btns[j].textContent === chosen) {
      btns[j].style.background   = ok ? '#9FE1CB' : '#F5C4B3';
      btns[j].style.borderColor  = ok ? '#1D9E75' : '#D85A30';
      btns[j].style.color        = ok ? '#085041' : '#4A1B0C';
    }
  }

  totalAsked++;
  if (ok) totalCorrect++;
  totalTime += elapsed;

  var eSec = (elapsed / 1000).toFixed(1);
  var fb   = el('feedback');

  if (ok) {
    currentStreak++;
    kn.correct++; kn.streak++;
    var delta = elapsed <= T_FAST() ? 1 : elapsed <= T_SLOW() ? 0.5 : 0;
    kn.score  = Math.min(kn.score + delta, MASTERY() + 2);
    var due;
    if      (elapsed <= T_FAST()) { due = Date.now() + (kn.score >= MASTERY() ? 900000 : 20000 * Math.pow(2, kn.score)); if (fb) { fb.style.color = '#0F6E56'; fb.textContent = currentStreak >= 3 ? '✓ Correct! (' + eSec + 's)  ' + currentStreak + ' in a row' : '✓ Correct! (' + eSec + 's)'; } }
    else if (elapsed <= T_SLOW()) { due = Date.now() + 15000; if (fb) { fb.style.color = '#854F0B'; fb.textContent = '✓ Correct, but slow (' + eSec + 's)'; } }
    else                          { due = Date.now() + 5000;  if (fb) { fb.style.color = '#993C1D'; fb.textContent = '✓ Correct, but too slow (' + eSec + 's)'; } }
    kn.due = due;
    lastRevealNote = correct; lastRevealWrong = false;
  } else {
    currentStreak = 0; kn.wrong++; kn.streak = 0;
    kn.score = Math.max(0, kn.score - 1);
    kn.due   = Date.now() + 8000;
    if (fb) { fb.style.color = '#993C1D'; fb.textContent = '✗ It\'s ' + correct + ' (' + eSec + 's) — string ' + (kn.s + 1) + ', fret ' + kn.f; }
    lastRevealNote = correct; lastRevealWrong = true;
    drawFretboard('fb-outer', 'fb-canvas', kn.s, kn.f, correct, true);
  }

  var tv = el('timer-val');
  if (tv) { tv.textContent = eSec; tv.className = !ok || elapsed > T_SLOW() ? 'hesitant' : elapsed > T_FAST() ? 'slow' : ''; }

  drawHeatmap('hm-canvas');
  updateTopBar();
  saveState();

  autoAdvanceTimer = setTimeout(function() {
    if (masteredCount() >= activeTotal()) showCompletion();
    else renderQuestion();
  }, 2000);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 10: TOP BAR & SPEED LEGEND
═══════════════════════════════════════════════════════════════ */
function updateTopBar() {
  try {
    var m   = masteredCount();
    var tot = activeTotal();
    var e   = el('mastered-pill');
    setText('s-asked',   totalAsked);
    setText('s-acc',     totalAsked > 0 ? Math.round(totalCorrect / totalAsked * 100) + '%' : '—');
    setText('s-streak',  currentStreak);
    if (e) e.innerHTML  = '<b>' + m + '</b>/' + tot;
    setStyle('prog-fill','width', Math.round(m / Math.max(1, tot) * 100) + '%');
    setText('exp-pill',  EXP[expLevel].label);
  } catch(err) {}
}

function updateSpeedLegend() {
  try {
    var f  = T_FAST() / 1000;
    var sl = T_SLOW() / 1000;
    setText('leg-fast',     'fast (<' + f + 's)');
    setText('leg-slow',     'slow (' + f + '–' + sl + 's)');
    setText('leg-hesitant', 'wrong/hesitant (>' + sl + 's)');
  } catch(err) {}
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 11: PAUSE
═══════════════════════════════════════════════════════════════ */
function togglePause() {
  if (answered) return;
  paused = !paused;
  var btn   = el('pause-btn');
  var cover = el('pause-cover');
  var row   = el('answer-row');
  if (paused) {
    clearInterval(timerInterval);
    pausedAt = performance.now() - questionStart;
    if (btn) btn.innerHTML = ICONS.play;
    if (cover) cover.classList.add('show');
    if (row)   { row.style.pointerEvents = 'none'; row.style.opacity = '0.3'; }
    var tv = el('timer-val'); if (tv) tv.className = 'paused';
  } else {
    questionStart = performance.now() - pausedAt;
    if (cover) cover.classList.remove('show');
    if (row)   { row.style.pointerEvents = ''; row.style.opacity = ''; }
    if (btn) btn.innerHTML = ICONS.pause;
    var tv2 = el('timer-val');
    timerInterval = setInterval(function() {
      var e = (performance.now() - questionStart) / 1000;
      if (tv2) { tv2.textContent = e.toFixed(1); tv2.className = e >= T_SLOW() / 1000 ? 'hesitant' : e >= T_FAST() / 1000 ? 'slow' : ''; }
    }, 100);
  }
}

function toggleTopbarMenu() {
  var menu = el('topbar-menu');
  var btn = el('topbar-overflow-btn');
  var isOpen = menu.classList.contains('open');
  if (isOpen) { closeTopbarMenu(); }
  else {
    menu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}
function closeTopbarMenu() {
  el('topbar-menu').classList.remove('open');
  el('topbar-overflow-btn').setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', function(e) {
  var menu = el('topbar-menu');
  var btn = el('topbar-overflow-btn');
  if (!menu || !menu.classList.contains('open')) return;
  if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
    closeTopbarMenu();
  }
});

/* ═══════════════════════════════════════════════════════════════
   SECTION 12: SETTINGS
═══════════════════════════════════════════════════════════════ */
var ON_STY  = 'padding:9px 6px;font-size:13px;font-weight:600;border-radius:8px;cursor:pointer;border:2px solid #0F6E56;background:#1D9E75;color:#fff;text-align:center;-webkit-appearance:none;font-family:-apple-system,sans-serif;';
var OFF_STY = 'padding:9px 6px;font-size:13px;font-weight:600;border-radius:8px;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text2);text-align:center;-webkit-appearance:none;font-family:-apple-system,sans-serif;';

function showSettings() {
  clearInterval(timerInterval); clearTimeout(autoAdvanceTimer);
  if (currentKey && !paused && quizMode === 'practice') togglePause();
  pendingExp        = expLevel;
  pendingAccidental = accidentalMode;
  pendingStrings    = [...practiceStrings];
  pendingFretMin    = practiceFretMin;
  pendingFretMax    = practiceFretMax;
  refreshSettingsUI();
  el('settings-overlay').classList.add('open');
}

function hideSettings() {
  el('settings-overlay').classList.remove('open');
  /* if on study tab, redraw with any updated settings */
  if (quizMode === 'study') {
    practiceStrings = new Set(pendingStrings);
    practiceFretMin = pendingFretMin;
    practiceFretMax = pendingFretMax;
    accidentalMode  = pendingAccidental;
    var activeStr = [...practiceStrings].sort(function(a,b){return a-b;});
    drawStudyFretboard(activeStr, practiceFretMin, practiceFretMax);
  }
  /* resume if mid-session practice was paused by opening settings */
  if (quizMode === 'practice' && currentKey && paused) togglePause();
}

function cancelSettings() {
  el('settings-overlay').classList.remove('open');
  /* if no session started and on practice tab, go home */
  if (!currentKey && quizMode === 'practice') showHome();
  /* if on study tab, just close */
}

function refreshSettingsUI() {
  var isStudy = quizMode === 'study';
  el('practice-filters').style.display = 'block';

  var startBtn = el('settings-start-btn');
  if (startBtn) startBtn.style.display = '';

  /* dim experience cards in study mode */
  ['beginner','intermediate','expert'].forEach(function(e2) {
    var card = el('mc-' + e2);
    if (!card) return;
    card.classList.toggle('selected', !isStudy && e2 === pendingExp);
    card.style.opacity       = isStudy ? '0.35' : '1';
    card.style.pointerEvents = isStudy ? 'none'  : '';
  });

  buildStringButtons();
  buildAccidentalButtons();
  el('fret-min-sl').value = pendingFretMin;
  el('fret-max-sl').value = pendingFretMax;
  updateFretDisplay();
}

function selectQuizMode(m) { refreshSettingsUI(); }
function selectExp(e2) {
  if (quizMode === 'study') return;
  pendingExp = e2;
  ['beginner','intermediate','expert'].forEach(function(k) {
    var card = el('mc-' + k);
    if (card) card.classList.toggle('selected', k === e2);
  });
}

function buildStringButtons() {
  var wrap = el('string-btns');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (var s = 0; s < NUM_STRINGS; s++) {
    (function(s) {
      var on  = pendingStrings.indexOf(s) >= 0;
      var btn = document.createElement('button');
      btn.textContent = 'String ' + (s + 1);
      btn.setAttribute('style', on ? ON_STY : OFF_STY);
      btn.addEventListener('click', function() {
        var idx = pendingStrings.indexOf(s);
        if (idx >= 0) {
          if (pendingStrings.length > 1) { pendingStrings.splice(idx, 1); btn.setAttribute('style', OFF_STY); }
        } else {
          pendingStrings.push(s); btn.setAttribute('style', ON_STY);
        }
      });
      wrap.appendChild(btn);
    })(s);
  }
}

function buildAccidentalButtons() {
  var wrap = el('acc-btns');
  if (!wrap) return;
  wrap.innerHTML = '';
  ACC_TOGGLES.forEach(function(t) {
    var on  = pendingAccidental.indexOf(t.key) >= 0;
    var btn = document.createElement('button');
    btn.textContent = t.label;
    btn.setAttribute('style', on ? ON_STY : OFF_STY);
    btn.addEventListener('click', function() {
      if (pendingAccidental.indexOf(t.key) >= 0) {
        var next = pendingAccidental.replace(t.key, '');
        if (next.length === 0) return;
        pendingAccidental = next;
        btn.setAttribute('style', OFF_STY);
      } else {
        pendingAccidental += t.key;
        btn.setAttribute('style', ON_STY);
      }
    });
    wrap.appendChild(btn);
  });
}

function onFretMin(el2) {
  pendingFretMin = Math.min(parseInt(el2.value), pendingFretMax);
  el2.value = pendingFretMin;
  updateFretDisplay();
}
function onFretMax(el2) {
  pendingFretMax = Math.max(parseInt(el2.value), pendingFretMin);
  el2.value = pendingFretMax;
  updateFretDisplay();
}
function updateFretDisplay() {
  setText('fret-range-lbl', pendingFretMin + ' – ' + pendingFretMax);
  setText('fret-min-num',   pendingFretMin);
  setText('fret-max-num',   pendingFretMax);
}

function applySettings() {
  expLevel        = pendingExp;
  accidentalMode  = pendingAccidental;
  var changed = JSON.stringify([...practiceStrings].sort()) !== JSON.stringify([...pendingStrings].sort())
    || pendingFretMin !== practiceFretMin || pendingFretMax !== practiceFretMax;
  practiceStrings = new Set(pendingStrings);
  practiceFretMin = pendingFretMin;
  practiceFretMax = pendingFretMax;

  el('settings-overlay').classList.remove('open');
  if (changed) { knowledge = makeKnowledge(); totalAsked = 0; totalCorrect = 0; totalTime = 0; currentStreak = 0; }
  updateSpeedLegend();
  updateTopBar();
  saveState();

  /* refresh whichever tab is currently visible */
  var sc = el('study-content');
  if (sc && sc.style.display === 'flex') {
    var activeStr = [...practiceStrings].sort(function(a,b){return a-b;});
    drawStudyFretboard(activeStr, practiceFretMin, practiceFretMax);
  } else {
    showPracticeIdle();
  }
}

function startPracticeSession() {
  hidePracticeIdle();
  updateSpeedLegend();
  updateTopBar();
  saveState();
  startCountdown();
}

function buildSettingsSummary() {
  var parts = [];
  var allStr = [...practiceStrings].sort(function(a,b){return a-b;});
  if (allStr.length === NUM_STRINGS) {
    parts.push('All strings');
  } else {
    parts.push('Strings ' + allStr.map(function(s){return s+1;}).join(', '));
  }
  if (practiceFretMin === 0 && practiceFretMax === MAX_FRET) {
    parts.push('Full neck');
  } else {
    parts.push('Frets ' + practiceFretMin + '–' + practiceFretMax);
  }
  var hasN = accHasNaturals(accidentalMode), hasS = accHasSharps(accidentalMode), hasF = accHasFlats(accidentalMode);
  if (hasN && hasS && hasF)        parts.push('All notes');
  else if (hasN && !hasS && !hasF) parts.push('Naturals only');
  else if (hasN && hasS)           parts.push('Naturals + sharps');
  else if (hasN && hasF)           parts.push('Naturals + flats');
  else                             parts.push('Accidentals only');
  return parts.join(' · ');
}

function showPracticeIdle() {
  /* shown when Practice tab is active but no session has started */
  setText('prompt-text', 'Ready to drill?');
  var HINT_SVG = '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin:0 1px"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><circle cx="7" cy="5" r="2" fill="var(--surface)"/><circle cx="13" cy="10" r="2" fill="var(--surface)"/><circle cx="7" cy="15" r="2" fill="var(--surface)"/></svg>';
  setHtml('prompt-sub', buildSettingsSummary()
    + '<br><span style="font-size:14px;">Tap ' + HINT_SVG + ' to change settings</span>');
  var db = el('diff-badge'); if (db) { db.textContent = ''; db.className = 'badge'; }
  var tv = el('timer-val'); if (tv) { tv.textContent = '—'; tv.className = ''; }
  var ar = el('answer-row'); if (ar) ar.innerHTML = '';
  var fb = el('feedback');   if (fb) fb.textContent = '';
  /* show a Start button inside the practice content */
  var existingBtn = el('practice-idle-btn');
  if (!existingBtn) {
    var btn = document.createElement('button');
    btn.id = 'practice-idle-btn';
    btn.textContent = 'Start Practice →';
    btn.onclick = startPracticeSession;
    btn.style.cssText = 'padding:14px;font-size:15px;font-weight:700;background:var(--teal);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-family:var(--font);-webkit-appearance:none;flex-shrink:0;';
    var pc = el('practice-content');
    if (pc) pc.appendChild(btn);
  }
}

function hidePracticeIdle() {
  var btn = el('practice-idle-btn');
  if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
}
function startCountdown() {
  var overlay = el('countdown-overlay');
  var num     = el('countdown-num');
  overlay.classList.add('open');
  num.textContent = '3';
  setTimeout(function() { num.textContent = '2'; }, 1000);
  setTimeout(function() { num.textContent = '1'; }, 2000);
  setTimeout(function() {
    overlay.classList.remove('open');
    setTimeout(function() { layoutApp(); renderQuestion(); }, 150);
  }, 3000);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 14: STUDY MODE
═══════════════════════════════════════════════════════════════ */
function showStudy() { switchTab('study'); }
function hideStudy() { switchTab('practice'); }

/* ═══════════════════════════════════════════════════════════════
   SECTION 15: STATS
═══════════════════════════════════════════════════════════════ */
function showStats() {
  var m   = masteredCount();
  var tot = activeTotal();
  var pool = notePool();
  setText('stats-title',   'Stats');
  setText('sv-asked',      totalAsked);
  setText('sv-acc',        totalAsked > 0 ? Math.round(totalCorrect / totalAsked * 100) + '%' : '—');
  setText('sv-mastered',   m + '/' + tot);
  setText('sv-avg',        totalAsked > 0 ? (totalTime / totalAsked / 1000).toFixed(1) + 's' : '—');

  var weak = Object.values(knowledge)
    .filter(function(k){ return k.seen && (k.wrong > 0 || (k.attempts > 0 && k.avgTime > T_FAST())); })
    .sort(function(a,b){ return (b.wrong*3+(b.attempts>0?b.avgTime/1000:0)-b.correct)-(a.wrong*3+(a.attempts>0?a.avgTime/1000:0)-a.correct); })
    .slice(0, 10);

  setHtml('weak-list', weak.length ? weak.map(function(k) {
    var sc = k.avgTime > T_SLOW() ? '#E24B4A' : k.avgTime > T_FAST() ? '#BA7517' : '#1D9E75';
    return '<div class="weak-item"><span>String '+(k.s+1)+' · Fret '+k.f+' <span style="color:var(--text3);font-size:11px;">('+STRING_NAMES[k.s]+')</span></span>'
      +'<span style="font-size:12px;display:flex;gap:8px;">'
      +'<span style="color:'+sc+';font-weight:600;">'+(k.attempts>0?(k.avgTime/1000).toFixed(1)+'s':'')+'</span>'
      +'<span><span style="color:#1D9E75;">'+k.correct+'✓</span> <span style="color:#E24B4A;">'+k.wrong+'✗</span></span>'
      +'<span style="color:var(--text3);">'+pool[chromIdx(k.s,k.f)]+'</span></span></div>';
  }).join('') : '<div style="font-size:13px;color:var(--text3);padding:6px 0;">Nothing to worry about yet!</div>');

  var strIdxs=[]; for(var si=0;si<NUM_STRINGS;si++) strIdxs.push(si);
  var strRows = strIdxs.map(function(i) {
    var nodes = Object.values(knowledge).filter(function(k){ return k.s===i && k.attempts>0; });
    if (!nodes.length) return null;
    return { s:i, avgT: nodes.reduce(function(a,k){return a+k.avgTime;},0)/nodes.length,
      wrongs: nodes.reduce(function(a,k){return a+k.wrong;},0),
      mastered: nodes.filter(function(k){return k.score>=MASTERY();}).length, total:nodes.length };
  }).filter(Boolean).sort(function(a,b){ return b.avgT-a.avgT; });
  setHtml('string-bars', '<table class="sum-table"><thead><tr><th>String</th><th>Avg</th><th>Wrong</th><th>Mastered</th><th></th></tr></thead><tbody>'
    + strRows.map(function(r){ var d=zDot(r.avgT,r.wrongs,r.total);
      return '<tr><td>String '+(r.s+1)+' <span style="color:var(--text3);font-size:11px;">'+STRING_NAMES[r.s]+'</span></td>'
        +'<td>'+(r.avgT/1000).toFixed(1)+'s</td><td style="color:#E24B4A;">'+r.wrongs+'</td>'
        +'<td>'+r.mastered+'/'+r.total+'</td><td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+d+'"></span></td></tr>';
    }).join('') + '</tbody></table>');

  var zoneRows = [[0,4,'Open-4'],[5,9,'5-9'],[10,14,'10-14'],[15,20,'15-20']].map(function(z) {
    var nodes = Object.values(knowledge).filter(function(k){ return k.attempts>0 && k.f>=z[0] && k.f<=z[1]; });
    if (!nodes.length) return null;
    return { label:z[2], avgT: nodes.reduce(function(a,k){return a+k.avgTime;},0)/nodes.length,
      wrongs: nodes.reduce(function(a,k){return a+k.wrong;},0), count:nodes.length };
  }).filter(Boolean).sort(function(a,b){ return b.avgT-a.avgT; });
  setHtml('zone-table', '<table class="sum-table"><thead><tr><th>Zone</th><th>Avg</th><th>Wrong</th><th></th></tr></thead><tbody>'
    + zoneRows.map(function(z){ var d=zDot(z.avgT,z.wrongs,z.count);
      return '<tr><td>Frets '+z.label+'</td><td>'+(z.avgT/1000).toFixed(1)+'s</td>'
        +'<td style="color:#E24B4A;">'+z.wrongs+'</td><td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+d+'"></span></td></tr>';
    }).join('') + '</tbody></table>');

  el('stats-overlay').classList.add('open');
  setTimeout(function(){ drawHeatmap('hm2-canvas'); }, 50);
}
function hideStats() { el('stats-overlay').classList.remove('open'); }

function resetProgress() {
  if (!confirm('Reset all progress?')) return;
  knowledge = makeKnowledge();
  totalAsked = 0; totalCorrect = 0; totalTime = 0; currentStreak = 0;
  saveState(); hideStats(); showSettings();
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 17: COMPLETION
═══════════════════════════════════════════════════════════════ */
function showCompletion() {
  var m   = masteredCount();
  var tot = activeTotal();
  var expOrder = ['beginner','intermediate','expert'];
  var expIdx   = expOrder.indexOf(expLevel);

  setText('co-asked', totalAsked);
  setText('co-acc',   totalAsked > 0 ? Math.round(totalCorrect / totalAsked * 100) + '%' : '—');
  setText('co-avg',   totalAsked > 0 ? (totalTime / totalAsked / 1000).toFixed(1) + 's' : '—');
  setText('complete-title', 'Practice set complete!');
  setText('complete-sub',   'All ' + tot + ' positions mastered at ' + EXP[expLevel].label + ' level.');

  var actions = el('complete-actions');
  actions.innerHTML = '';
  function mbtn(label, color, fn) {
    var b = document.createElement('button');
    b.textContent = label; b.style.background = color;
    b.addEventListener('click', fn); actions.appendChild(b);
  }
  mbtn('Try again', '#1D9E75', function() {
    el('complete-overlay').classList.remove('open');
    knowledge = makeKnowledge(); totalAsked = 0; totalCorrect = 0; totalTime = 0; currentStreak = 0;
    updateTopBar(); saveState(); startCountdown();
  });
  mbtn('View stats', '#534AB7', function() { el('complete-overlay').classList.remove('open'); showStats(); });
  mbtn('Expand scope', '#534AB7', function() { el('complete-overlay').classList.remove('open'); showSettings(); });
  if (expIdx < expOrder.length - 1) {
    var next = expOrder[expIdx + 1];
    mbtn('Level up to ' + EXP[next].label, '#0F6E56', function() {
      el('complete-overlay').classList.remove('open');
      expLevel = next; knowledge = makeKnowledge(); totalAsked = 0; totalCorrect = 0; totalTime = 0; currentStreak = 0;
      updateSpeedLegend(); updateTopBar(); saveState(); startCountdown();
    });
  }
  mbtn('Keep going', '#555', function() { el('complete-overlay').classList.remove('open'); renderQuestion(); });
  el('complete-overlay').classList.add('open');
}

/* ═══════════════════════════════════════════════════════════════
   SVG ICONS  — inline, currentColor, 20×20 viewBox
═══════════════════════════════════════════════════════════════ */
var ICONS = {
  home: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L10 3l7 6.5"/><path d="M5 8.5V17h4v-4h2v4h4V8.5"/></svg>',
  settings: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><circle cx="7" cy="5" r="2" fill="var(--surface)"/><circle cx="13" cy="10" r="2" fill="var(--surface)"/><circle cx="7" cy="15" r="2" fill="var(--surface)"/></svg>',
  stats: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="12" width="4" height="6" rx="1"/><rect x="8" y="7" width="4" height="11" rx="1"/><rect x="14" y="3" width="4" height="15" rx="1"/></svg>',
  pause: '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><rect x="4" y="3" width="4.5" height="14" rx="1.5"/><rect x="11.5" y="3" width="4.5" height="14" rx="1.5"/></svg>',
  play:  '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3.5l12 6.5-12 6.5z"/></svg>'
};

function switchTab(tab) {
  quizMode = tab;
  /* update tab buttons */
  var ts = el('tab-study'), tp = el('tab-practice');
  if (ts) ts.className = 'mode-tab' + (tab === 'study'    ? ' active-study'    : '');
  if (tp) tp.className = 'mode-tab' + (tab === 'practice' ? ' active-practice' : '');
  /* show/hide content areas */
  var sc = el('study-content'), pc = el('practice-content');
  if (sc) sc.style.display = tab === 'study'    ? 'flex' : 'none';
  if (pc) pc.style.display = tab === 'practice' ? 'flex' : 'none';
  /* pause button only relevant during active practice */
  var pb = el('pause-btn');
  if (pb) pb.style.display = tab === 'practice' ? '' : 'none';
  var spp = el('stats-practice-pills');
  if (spp) spp.classList.toggle('show', tab === 'practice');
  if (tab === 'study') {
    /* pause any running quiz when switching to study */
    if (!answered && currentKey && !paused) togglePause();
    var activeStr = [...practiceStrings].sort(function(a,b){return a-b;});
    setTimeout(function(){ drawStudyFretboard(activeStr, practiceFretMin, practiceFretMax); }, 30);
  }

  if (tab === 'practice') {
    if (!currentKey) {
      /* no active session — show idle state */
      showPracticeIdle();
    } else {
      hidePracticeIdle();
      /* resume if was paused by tab switch */
      if (paused) togglePause();
    }
  }
}
function selectInstrument(id) {
  if (id === instrument) return;
  snapshotCurrentInstrument();
  applyInstrument(id);
  restoreInstrumentState(id);
  saveState();
  updateInstrumentToggle();
  updateTopBar();
}

function updateInstrumentToggle() {
  var gi = el('inst-guitar'), bi = el('inst-bass');
  if (gi) gi.className = 'inst-btn' + (instrument === 'guitar' ? ' active' : '');
  if (bi) bi.className = 'inst-btn' + (instrument === 'bass'   ? ' active' : '');
}

function showHome() {
  updateInstrumentToggle();
  if (currentModule === 'fundamentals') exitFundamentals();
  if (currentModule === 'chords') exitChords();
  if (currentModule === 'triads') exitTriads();
  if (currentModule === 'beat') exitBeat();
  el('home-screen').classList.add('show');
  el('app').style.display = 'none';
  ['settings-overlay','stats-overlay','complete-overlay','countdown-overlay']
    .forEach(function(id){ el(id).classList.remove('open'); });
  clearInterval(timerInterval);
  clearTimeout(autoAdvanceTimer);
  currentKey = null; /* reset so practice shows idle state on re-entry */
  paused = false;
}

function hideHome() {
  el('home-screen').classList.remove('show');
  el('app').style.display = 'flex';
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 0.5: FIRST-LAUNCH TOUR
═══════════════════════════════════════════════════════════════ */
var TOUR_KEY = 'fretnerd_tour_done';

var TOUR_SLIDES = [
  {
    icon: '🤓',
    title: 'Welcome to Fretboard Notes',
    body: 'You\'re looking at <b>Study mode</b> — the full fretboard with every note in your current range. Use <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin:0 1px"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><circle cx="7" cy="5" r="2" fill="var(--surface)"/><circle cx="13" cy="10" r="2" fill="var(--surface)"/><circle cx="7" cy="15" r="2" fill="var(--surface)"/></svg> to filter by string and fret. Here\'s how the module works.'
  },
  {
    icon: '📖',
    title: 'Start with Study Mode',
    body: 'Tap <b>Study</b> to see all the notes laid out on the neck. Use <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin:0 1px"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><circle cx="7" cy="5" r="2" fill="var(--surface)"/><circle cx="13" cy="10" r="2" fill="var(--surface)"/><circle cx="7" cy="15" r="2" fill="var(--surface)"/></svg> to filter by string and fret range. Focus on a small area first — don\'t try to memorize the whole neck at once.'
  },
  {
    icon: '⚡',
    title: 'Practice Mode & Smart Repetition',
    body: 'Tap <b>Practice</b> to start drilling with spaced repetition — notes you struggle with come back sooner. <b>Speed matters:</b> fast answers build mastery faster. Wrong answers come back immediately.'
  },
  {
    icon: '🎯',
    title: 'The Heatmap & Experience Levels',
    body: '<b>Green</b> = mastered · <b>Yellow</b> = learning · <b>Red</b> = struggling. Start on <b>Beginner</b> (10s to answer), level up to Intermediate then Expert as you get faster.'
  }
];

var tourStep = 0;

function hasDoneTour() {
  try { return storage.getItem(TOUR_KEY) === '1'; } catch(e) { return false; }
}
function markTourDone() {
  try { storage.setItem(TOUR_KEY, '1'); } catch(e) {}
}

function showTour() {
  /* pause any active practice session */
  if (currentKey && !paused && quizMode === 'practice') togglePause();
  tourStep = 0;
  renderTourSlide();
  el('tour-overlay').classList.add('open');
}

function renderTourSlide() {
  var slide = TOUR_SLIDES[tourStep];
  var total = TOUR_SLIDES.length;
  setText('tour-icon',  slide.icon);
  setText('tour-title', slide.title);
  el('tour-body').innerHTML = slide.body;
  var dots = '';
  for (var i = 0; i < total; i++) {
    dots += '<div class="tour-dot' + (i === tourStep ? ' active' : '') + '"></div>';
  }
  el('tour-dots').innerHTML = dots;
  var nextBtn = el('tour-next-btn');
  var skipBtn = el('tour-skip-btn');
  if (tourStep === total - 1) {
    if (nextBtn) nextBtn.textContent = 'Got it 🤘';
    if (skipBtn) skipBtn.style.display = 'none';
  } else {
    if (nextBtn) nextBtn.textContent = 'Next →';
    if (skipBtn) skipBtn.style.display = '';
  }
}

function tourNext() {
  if (tourStep < TOUR_SLIDES.length - 1) {
    tourStep++;
    renderTourSlide();
  } else {
    endTour();
  }
}

function endTour() {
  el('tour-overlay').classList.remove('open');
  markTourDone();
}

function launchModule(id) {
  if (id === 'notes') {
    currentModule = 'notes';
    el('app').classList.remove('simple-module');
    setText('topbar-module-name', 'Fretboard Notes');
    hideHome();
    pendingExp        = expLevel;
    pendingAccidental = accidentalMode;
    pendingStrings    = [...practiceStrings];
    pendingFretMin    = practiceFretMin;
    pendingFretMax    = practiceFretMax;
    updateTopBar();
    layoutApp();
    /* go to study tab by default — user sees fretboard immediately */
    switchTab('study');
    /* show tour after study fretboard has had time to draw */
    if (!hasDoneTour()) {
      setTimeout(function() { showTour(); }, 350);
    }
  } else if (id === 'chords') {
    launchChords();
  } else if (id === 'triads') {
    launchTriads();
  } else if (id === 'beat') {
    launchBeat();
  } else if (id === 'fundamentals') {
    currentModule = 'fundamentals';
    el('app').classList.add('simple-module');
    hideHome();
    /* hide the Fretboard-Notes-specific shell pieces; this module owns its own region */
    el('mode-tabs').style.display = 'none';
    el('study-content').style.display = 'none';
    el('practice-content').style.display = 'none';
    el('stats-row').style.display = 'none';
    el('pause-btn').style.display = 'none';
    el('stage-bar').style.display = 'flex';
    el('fundamentals-content').style.display = 'flex';
    setText('topbar-module-name', 'Music Fundamentals');
    renderStageBar();
    renderFundStage();
  }
}


/* ── debug: show dimensions ── */
function showDebug() {
  var fbo = el('fb-outer');
  var app = el('app');
  var msg = 'win: ' + window.innerWidth + 'x' + window.innerHeight + '\n'
    + 'app h: ' + (app ? app.offsetHeight : '?') + '\n'
    + 'fb-outer h: ' + (fbo ? fbo.offsetHeight : '?') + '\n'
    + 'tier: ' + deviceTier() + '\n'
    + 'fb flex: ' + (fbo ? window.getComputedStyle(fbo).flex : '?');
  alert(msg);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 18: INIT
═══════════════════════════════════════════════════════════════ */
loadState();
updateSpeedLegend();
updateTopBar();
layoutApp();

setTimeout(function() {
  showHome();
}, 100);
