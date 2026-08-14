/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   MODULE 6: BEAT & TIMING — BeatClock
   Single shared rAF-driven clock. Every visual (foot-tap,
   subdivision ticks, strum arrows) and the tap-scoring engine
   reads its phase from here each frame, so nothing can drift
   out of sync with anything else, even as BPM changes mid-session.
═══════════════════════════════════════════════════ */

var BeatClock = {
  bpm:             60,
  timeSig:         '4/4',
  subdivision:     'quarter',
  running:         false,
  anchorTime:      0,   /* performance.now() at anchorBeatIndex */
  anchorBeatIndex: 0,   /* absolute beat count at anchorTime */
  listeners:       [],
  _rafId:          null,

  start: function(bpm, timeSig, subdivision) {
    this.bpm         = bpm || this.bpm;
    this.timeSig     = timeSig || this.timeSig;
    this.subdivision = subdivision || this.subdivision;
    this.anchorTime      = performance.now();
    this.anchorBeatIndex = 0;
    this.running = true;
    this._loop();
  },

  stop: function() {
    this.running = false;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    /* single point of truth for teardown — every stage/mode switch tears
       down via this, so subscribers never accumulate across switches */
    this.listeners = [];
  },

  setBpm: function(bpm) {
    /* re-anchor at the current phase so tempo changes never jump the beat */
    var now = performance.now();
    this.anchorBeatIndex = this._beatIndexAt(now);
    this.anchorTime      = now;
    this.bpm = bpm;
  },

  setTimeSig:     function(sig) { this.timeSig = sig; },
  setSubdivision: function(sub) { this.subdivision = sub; },

  getBeatIntervalMs: function() { return 60000 / this.bpm; },

  _beatIndexAt: function(now) {
    var elapsed = now - this.anchorTime;
    return this.anchorBeatIndex + elapsed / this.getBeatIntervalMs();
  },

  getExpectedTimeForBeat: function(beatIndex) {
    return this.anchorTime + (beatIndex - this.anchorBeatIndex) * this.getBeatIntervalMs();
  },

  getCurrentPhase: function(now) {
    now = now || performance.now();
    var sigCfg = BEAT_TIME_SIGS[this.timeSig];
    var subCfg = BEAT_SUBDIVISIONS[this.subdivision];
    var beatFloat  = this._beatIndexAt(now);
    var beatIndex  = Math.floor(beatFloat);
    var phaseFraction = beatFloat - beatIndex; /* 0..1 within the current beat */
    var bpm2 = ((beatIndex % sigCfg.beatsPerMeasure) + sigCfg.beatsPerMeasure) % sigCfg.beatsPerMeasure;
    var measureIndex = Math.floor(beatIndex / sigCfg.beatsPerMeasure);
    var subFloat = beatFloat * subCfg.perBeat;
    return {
      now:              now,
      beatFloat:        beatFloat,
      beatIndex:        beatIndex,
      phaseFraction:    phaseFraction,
      beatInMeasure:    bpm2,
      measureIndex:     measureIndex,
      subdivisionIndex: Math.floor(subFloat),
      isBeatDown:       phaseFraction < 0.5
    };
  },

  subscribe:   function(fn) { this.listeners.push(fn); },
  unsubscribe: function(fn) {
    var i = this.listeners.indexOf(fn);
    if (i !== -1) this.listeners.splice(i, 1);
  },

  _loop: function() {
    if (!this.running) return;
    var phase = this.getCurrentPhase();
    for (var i = 0; i < this.listeners.length; i++) this.listeners[i](phase);
    var self = this;
    this._rafId = requestAnimationFrame(function() { self._loop(); });
  }
};
