/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   MODULE 4: TRIAD POSITIONS — Data & Shape Math
═══════════════════════════════════════════════════ */

/* Module state */
var triadsStage           = 1;
var triadsCompletedStages = [];
var TRIAD_STUDY_ROOT      = 0;      /* C */
var TRIAD_STUDY_QUALITY   = 'major';
var TRIAD_STUDY_INVERSION = 0;      /* 0=root, 1=first, 2=second */
var TRIAD_STUDY_SET       = 0;      /* string set index */

/* Practice filter state — fully independent of study */
var TRIAD_PRACTICE_FILTERS = {
  sets:       null,              /* null = all; or array of set indices */
  inversions: [0, 1, 2],        /* which inversions to test */
  qualities:  ['major', 'minor']
};

/* Build-the-shape exercise state */
var TRIAD_BUILD = { placed: [], validated: false }; /* placed: [{stringIdx, fret}] */

/* ── Instrument-specific tables ─────────────────── */

var TRIAD_STRING_SETS_GUITAR = [
  { id: 0, label: 'Strings 1-2-3', strings: [0,1,2], names: 'e · B · G' },
  { id: 1, label: 'Strings 2-3-4', strings: [1,2,3], names: 'B · G · D' },
  { id: 2, label: 'Strings 3-4-5', strings: [2,3,4], names: 'G · D · A' },
  { id: 3, label: 'Strings 4-5-6', strings: [3,4,5], names: 'D · A · E' }
];

var TRIAD_STRING_SETS_BASS = [
  { id: 0, label: 'Strings 1-2-3', strings: [0,1,2], names: 'G · D · A' },
  { id: 1, label: 'Strings 2-3-4', strings: [1,2,3], names: 'D · A · E' }
];

var TRIAD_STAGES_GUITAR = [
  { id: 1, label: 'Treble' }, { id: 2, label: 'Mid-Hi' },
  { id: 3, label: 'Mid-Lo' }, { id: 4, label: 'Bass'   }
];

var TRIAD_STAGES_BASS = [
  { id: 1, label: 'Hi Set' }, { id: 2, label: 'Lo Set' }
];

var TRIAD_STAGE_SET_GUITAR = { 1: 0, 2: 1, 3: 2, 4: 3 };
var TRIAD_STAGE_SET_BASS   = { 1: 0, 2: 1 };

/* Runtime accessors — always call these instead of the raw tables */
function triadsStringSets() { return instrument === 'bass' ? TRIAD_STRING_SETS_BASS  : TRIAD_STRING_SETS_GUITAR; }
function triadsStageList()  { return instrument === 'bass' ? TRIAD_STAGES_BASS       : TRIAD_STAGES_GUITAR;      }
function triadsStageSetMap(){ return instrument === 'bass' ? TRIAD_STAGE_SET_BASS    : TRIAD_STAGE_SET_GUITAR;   }
function triadsOpenNotes()  { return inst().stringOpen; }
function triadsNumStrings() { return inst().strings; }

/* Convenience shims used by legacy/unchanged call sites */
var TRIAD_INV_SHORT = ['Root', '1st', '2nd'];
var TRIAD_INV_FULL  = ['Root position', '1st inversion', '2nd inversion'];
var TRIAD_INV_BASS  = ['Root is lowest', '3rd is lowest', '5th is lowest'];

var TRIAD_ROOT_NAMES = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];

/* Role colors: 0=root (teal), 1=third (purple), 2=fifth (amber) */
var TRIAD_COLOR_ROOT  = '#1D9E75';
var TRIAD_COLOR_THIRD = '#6C5CE7';
var TRIAD_COLOR_FIFTH = '#BA7517';
var TRIAD_ROLE_COLORS = [TRIAD_COLOR_ROOT, TRIAD_COLOR_THIRD, TRIAD_COLOR_FIFTH];
var TRIAD_ROLE_LABELS = ['1', '3', '5'];
var TRIAD_ROLE_NAMES  = ['root', 'third', 'fifth']; /* fretboard-renderer.js highlight state/role names */

/* ── Shape computation ──────────────────────────────── */

function triadsIntervals(quality) {
  return quality === 'major' ? [0, 4, 7] : [0, 3, 7];
}

/* Never returns fret 0 — maps open-string pitch to fret 12 so all
   shapes are closed (movable) voicings that stay on the canvas. */
function triadsClosestFret(openNote, targetNote, nearFret) {
  var base = (targetNote - openNote + 12) % 12;
  if (base === 0) base = 12;
  var best = base;
  for (var add = 12; add <= 24; add += 12) {
    if (Math.abs(base + add - nearFret) < Math.abs(best - nearFret)) best = base + add;
  }
  return best;
}

/* Returns the three fret positions for a triad on a string set.
   Uses the active instrument's open notes automatically.
   If the initial shape spans > 4 frets (can happen when a note aligns
   with an open string and gets pushed to fret 12), tries re-rooting the
   lo string one octave higher to find a more compact voicing. */
function triadsGetShape(rootNote, quality, inversion, stringSetIdx) {
  var SS   = triadsStringSets()[stringSetIdx];
  var ivs  = triadsIntervals(quality);
  var open = triadsOpenNotes();

  var loRole = inversion % 3;
  var miRole = (inversion + 1) % 3;
  var hiRole = (inversion + 2) % 3;

  var loNote = (rootNote + ivs[loRole]) % 12;
  var miNote = (rootNote + ivs[miRole]) % 12;
  var hiNote = (rootNote + ivs[hiRole]) % 12;

  function computeFrets(loF) {
    var miF = triadsClosestFret(open[SS.strings[1]], miNote, loF);
    var hiF = triadsClosestFret(open[SS.strings[0]], hiNote, miF);
    return [hiF, miF, loF];
  }

  var loFret = (loNote - open[SS.strings[2]] + 12) % 12;
  if (loFret === 0) loFret = 12;

  var frets = computeFrets(loFret);
  var spread = Math.max.apply(null, frets) - Math.min.apply(null, frets);

  /* If the shape is awkwardly wide, try starting one octave higher */
  if (spread > 4) {
    var frets2  = computeFrets(loFret + 12);
    var spread2 = Math.max.apply(null, frets2) - Math.min.apply(null, frets2);
    if (spread2 < spread) frets = frets2;
  }

  return {
    strings:   SS.strings,
    frets:     frets,
    roles:     [hiRole, miRole, loRole],
    notes:     [hiNote, miNote, loNote],
    inversion: inversion,
    quality:   quality,
    root:      rootNote
  };
}
