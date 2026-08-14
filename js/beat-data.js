/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   MODULE 6: BEAT & TIMING — Data & Config
   Session-only stage/progress state (matches the no-persistence
   precedent set by Fundamentals/Chords/Triads), plus persisted
   user preferences (bpm/time-sig/etc.) under their own storage key.
═══════════════════════════════════════════════════ */

var beatStage = 1;
var beatMode  = 'study'; /* 'study' | 'practice' */
var beatCompletedStages = [];

var BEAT_STAGES = [
  { id: 1, key: 'pulse',     label: 'Find the Pulse' },
  { id: 2, key: 'subdivide', label: 'Subdivide' },
  { id: 3, key: 'rhythm',    label: 'Read Rhythm' },
  { id: 4, key: 'strum',     label: 'Strum in Time' }
];

var BEAT_SETTINGS_KEY = 'beat_settings_v1';
var BEAT_TOUR_KEY     = 'beat_tour_done';

var beatSettings = {
  bpm:          60,
  timeSig:      '4/4',
  audioClick:   false,
  subdivision:  'quarter',    /* 'quarter' | 'eighth' | 'sixteenth' — stages 1-3 */
  strumPattern: 'all-downs',  /* stage 4 */
  expLevel:     'beginner'
};

function beatSaveSettings() {
  try { storage.setItem(BEAT_SETTINGS_KEY, JSON.stringify(beatSettings)); } catch(e) {}
}

function beatLoadSettings() {
  try {
    var raw = storage.getItem(BEAT_SETTINGS_KEY);
    if (!raw) return;
    var d = JSON.parse(raw);
    beatSettings.bpm          = d.bpm          || beatSettings.bpm;
    beatSettings.timeSig      = d.timeSig      || beatSettings.timeSig;
    beatSettings.audioClick   = !!d.audioClick;
    beatSettings.subdivision  = d.subdivision  || beatSettings.subdivision;
    beatSettings.strumPattern = d.strumPattern || beatSettings.strumPattern;
    beatSettings.expLevel     = d.expLevel     || beatSettings.expLevel;
  } catch(e) {}
}

var BEAT_TIME_SIGS = {
  '4/4': { beatsPerMeasure: 4, beatUnit: 'quarter note' },
  '3/4': { beatsPerMeasure: 3, beatUnit: 'quarter note' },
  '6/8': { beatsPerMeasure: 6, beatUnit: 'eighth note'  }
};

var BEAT_SUBDIVISIONS = {
  quarter:   { perBeat: 1, label: 'Quarter' },
  eighth:    { perBeat: 2, label: 'Eighth' },
  sixteenth: { perBeat: 4, label: 'Sixteenth' }
};

/* Stage 1 & 2 auto tempo ladder — advances only after sustained accuracy */
var BEAT_TEMPO_PROGRESSION = [60, 80, 100, 120];

/* ms tolerance windows, keyed by experience level (motor-skill tolerance,
   not knowledge difficulty — see module spec section 6) */
var BEAT_TOLERANCE = {
  beginner:     { onTime: 80, wide: 160 },
  intermediate: { onTime: 50, wide: 110 },
  expert:       { onTime: 30, wide: 70  }
};

function beatTolerance() {
  return BEAT_TOLERANCE[beatSettings.expLevel] || BEAT_TOLERANCE.beginner;
}

/* Strum pattern presets — 8-slot eighth-note grid per measure of 4/4 */
var BEAT_STRUM_PATTERNS = [
  { id: 'all-downs',   label: 'All Downs',   slots: ['D',null,'D',null,'D',null,'D',null] },
  { id: 'down-up-all', label: 'All Down-Up', slots: ['D','U','D','U','D','U','D','U'] },
  { id: 'd-du-udu',    label: 'D-DU-UDU',    slots: ['D',null,'D','U',null,'U','D','U'] }
];

function beatCurrentStrumPattern() {
  for (var i = 0; i < BEAT_STRUM_PATTERNS.length; i++) {
    if (BEAT_STRUM_PATTERNS[i].id === beatSettings.strumPattern) return BEAT_STRUM_PATTERNS[i];
  }
  return BEAT_STRUM_PATTERNS[0];
}

/* Rolling-window tap-timing scoring state — session-only, never persisted.
   tap result enum: 'onTime' | 'early' | 'late' | 'missed' | 'wrongDir' | 'extra' */
var beatSession = {
  taps: [],
  rollingWindowSize: 20,
  bpmIndex: 0
};

function beatResetSession() {
  beatSession.taps = [];
  var idx = BEAT_TEMPO_PROGRESSION.indexOf(beatSettings.bpm);
  beatSession.bpmIndex = idx === -1 ? 0 : idx;
}

var BEAT_TOUR_SLIDES = [
  {
    icon: '🥁',
    title: 'Why timing matters',
    body: 'Most beginners who "can’t keep time" have never had the beat made visible and physical. This module shows you the pulse — then puts it in your hands.'
  },
  {
    icon: '\u{1F45F}',
    title: 'The foot-tap',
    body: 'This is your pulse, made visible. <b>Copper</b> on the beat, <b>silver</b> on the off-beat. Try tapping along right now — spacebar, click, or tap the screen.'
  },
  {
    icon: '➕',
    title: 'Subdivision',
    body: 'Every beat can split into smaller pieces — two eighth notes, four sixteenths. You’ll learn to feel and count those splits, not just the main beat.'
  },
  {
    icon: '\u{1F3B8}',
    title: 'From beat to strum',
    body: 'Once the pulse and its subdivisions feel automatic, you’ll apply them directly to real strumming patterns — down and up strokes, right in time.'
  }
];
