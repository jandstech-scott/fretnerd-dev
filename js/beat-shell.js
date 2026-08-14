/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ═══════════════════════════════════════════════════
   MODULE 6: BEAT & TIMING — Shell
   launchBeat()/exitBeat(), stage bar, Study/Practice tabs,
   settings panel, first-launch tour, and generic tap-input binding.
═══════════════════════════════════════════════════ */

function launchBeat() {
  currentModule = 'beat';
  beatLoadSettings();
  beatStage = 1;
  beatMode  = 'study';
  beatCompletedStages = [];

  el('app').classList.add('simple-module');
  hideHome();
  el('mode-tabs').style.display        = 'none';
  el('study-content').style.display    = 'none';
  el('practice-content').style.display = 'none';
  el('stats-row').style.display        = 'none';
  el('pause-btn').style.display        = 'none';
  el('stage-bar').style.display        = 'flex';
  el('fundamentals-content').style.display = 'flex';
  setText('topbar-module-name', 'Beat & Timing');

  beatRenderStageBar();
  beatRenderContent();

  if (storage.getItem(BEAT_TOUR_KEY) !== '1') {
    setTimeout(function() { showBeatTour(); }, 350);
  }
}

function exitBeat() {
  beatTeardownStage();
  el('stage-bar').style.display = 'none';
  el('fundamentals-content').style.display = 'none';
  el('mode-tabs').style.display = '';
  el('stats-row').style.display = '';
  el('app').classList.remove('simple-module');
  currentModule = null;
}

/* ── Stage bar ──────────────────────────────────── */

function beatRenderStageBar() {
  var bar = el('stage-bar');
  if (!bar) return;
  var html = '';
  for (var i = 0; i < BEAT_STAGES.length; i++) {
    var s = BEAT_STAGES[i];
    var isDone   = beatCompletedStages.indexOf(s.id) !== -1;
    var isActive = s.id === beatStage;
    var cls    = isDone ? 'done' : isActive ? 'active' : 'locked';
    var symbol = isDone ? '✓' : s.id;
    html += '<button class="stage-dot-item ' + cls + '" onclick="beatGoStage(' + s.id + ')">'
      + '<div class="stage-dot ' + cls + '">' + symbol + '</div>'
      + '<div class="stage-label">' + s.label + '</div>'
      + '</button>';
  }
  bar.innerHTML = html;
}

function beatGoStage(id) {
  beatStage = id;
  beatMode  = 'study';
  beatResetSession();
  beatRenderStageBar();
  beatRenderContent();
}

/* ── Study | Practice tabs ──────────────────────── */

function beatModeTabs() {
  var sAct = beatMode === 'study'    ? ' active' : '';
  var pAct = beatMode === 'practice' ? ' active' : '';
  return '<div style="display:flex;gap:6px;padding:2px 0 6px;align-items:center;">' +
    '<button class="fund-sig-tab-btn' + sAct + '" onclick="beatShowMode(\'study\')" style="flex:1;font-size:14px;padding:9px 6px;">Study</button>' +
    '<button class="fund-sig-tab-btn' + pAct + '" onclick="beatShowMode(\'practice\')" style="flex:1;font-size:14px;padding:9px 6px;">Practice</button>' +
    '<button class="icon-btn" onclick="beatShowSettings()" aria-label="Settings" style="flex-shrink:0;border:1px solid var(--border);border-radius:8px;">' +
      '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
        '<circle cx="10" cy="10" r="2.6"/><path d="M10 2.5v2.4M10 15.1v2.4M17.5 10h-2.4M4.9 10H2.5M15.4 4.6l-1.7 1.7M6.3 13.7l-1.7 1.7M15.4 15.4l-1.7-1.7M6.3 6.3L4.6 4.6"/>' +
      '</svg>' +
    '</button>' +
  '</div>';
}

function beatShowMode(mode) {
  beatMode = mode;
  beatResetSession();
  beatRenderContent();
}

function beatRenderContent() {
  beatTeardownStage();
  var c = el('fundamentals-content');
  if (!c) return;
  var fnName = 'beatStage' + beatStage + (beatMode === 'study' ? 'Study' : 'Practice');
  var fn = window[fnName];
  c.innerHTML = beatModeTabs() + (fn ? fn() :
    '<div style="padding:24px;text-align:center;color:var(--text2);">Stage ' + beatStage + ' content not yet ported.</div>');
  var bindName = 'beatStage' + beatStage + 'Bind';
  var bindFn = window[bindName];
  if (bindFn) bindFn(beatMode);
}

function beatTeardownStage() {
  BeatClock.stop(); /* also clears all BeatClock subscribers */
  beatUnbindVisuals();
  beatUnbindAudioClick();
  beatUnbindMissChecking();
  beatUnbindInput();
  beatStopTapTracking();
  /* if a tempo popup was mid-display when the stage/mode changed (or the
     module was exited), hide it and drop its callback rather than letting
     it fire later against a torn-down view */
  var tempoOverlay = document.getElementById('beat-tempo-overlay');
  if (tempoOverlay) tempoOverlay.style.display = 'none';
  _beatTempoPopupDismiss = null;
}

/* ── Generic tap-input binding (spacebar + click/touch zones) ──
   Every stage/mode switch calls beatUnbindInput() via beatTeardownStage()
   before binding new listeners, so handlers never accumulate. */

var _beatInputKeydownFn    = null;
var _beatInputZoneHandlers = [];

function _beatAddZoneListener(zoneEl, fn) {
  var clickFn = function() { fn(); };
  var touchFn = function(e) { e.preventDefault(); fn(); };
  zoneEl.addEventListener('click', clickFn);
  zoneEl.addEventListener('touchstart', touchFn, { passive: false });
  _beatInputZoneHandlers.push({ el: zoneEl, type: 'click',      fn: clickFn });
  _beatInputZoneHandlers.push({ el: zoneEl, type: 'touchstart', fn: touchFn });
}

function beatFlashZone(zoneId) {
  var z = document.getElementById(zoneId);
  if (!z) return;
  z.classList.add('beat-tap-zone--flash');
  setTimeout(function() { z.classList.remove('beat-tap-zone--flash'); }, 100);
}

function beatBindTapInput(zoneId, onTap) {
  _beatInputKeydownFn = function(e) {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      onTap();
      beatFlashZone(zoneId);
    }
  };
  document.addEventListener('keydown', _beatInputKeydownFn);
  var zone = document.getElementById(zoneId);
  if (zone) _beatAddZoneListener(zone, function() { onTap(); beatFlashZone(zoneId); });
}

function beatBindDirectionalInput(downZoneId, upZoneId, onDown, onUp) {
  _beatInputKeydownFn = function(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); onDown(); beatFlashZone(downZoneId); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); onUp(); beatFlashZone(upZoneId); }
  };
  document.addEventListener('keydown', _beatInputKeydownFn);
  var downZone = document.getElementById(downZoneId);
  var upZone   = document.getElementById(upZoneId);
  if (downZone) _beatAddZoneListener(downZone, function() { onDown(); beatFlashZone(downZoneId); });
  if (upZone)   _beatAddZoneListener(upZone,   function() { onUp();   beatFlashZone(upZoneId); });
}

function beatUnbindInput() {
  if (_beatInputKeydownFn) {
    document.removeEventListener('keydown', _beatInputKeydownFn);
    _beatInputKeydownFn = null;
  }
  _beatInputZoneHandlers.forEach(function(h) { h.el.removeEventListener(h.type, h.fn); });
  _beatInputZoneHandlers = [];
}

/* ── Tempo-up popup: explains the mechanic rather than a silent jump ── */

var _beatTempoPopupDismiss = null;

function beatShowTempoPopup(newBpm, onDismiss) {
  var overlay = document.getElementById('beat-tempo-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'beat-tempo-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:250;background:rgba(0,0,0,0.6);align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(overlay);
  }
  function dismiss() {
    overlay.style.display = 'none';
    _beatTempoPopupDismiss = null;
    if (onDismiss) onDismiss();
  }
  overlay.onclick = function(e) { if (e.target === overlay) dismiss(); };
  overlay.innerHTML =
    '<div style="background:var(--surface);border-radius:16px;max-width:360px;width:100%;padding:26px 22px 22px;text-align:center;">' +
      '<div style="font-size:40px;margin-bottom:8px;">\u{1F3AF}</div>' +
      '<div style="font-size:19px;font-weight:800;color:var(--text);margin-bottom:8px;">Tempo up!</div>' +
      '<div style="font-size:14px;color:var(--text2);line-height:1.55;margin-bottom:20px;">' +
        'You’re holding the beat steady — nice work. Moving up to <b style="color:var(--text);">' + newBpm + ' BPM</b>. ' +
        'It’ll keep getting a little faster each time you lock in a tempo, all the way up to 120 BPM.' +
      '</div>' +
      '<button class="fund-cta-btn" style="margin:0;" onclick="beatDismissTempoPopup()">Let’s go →</button>' +
    '</div>';
  overlay.style.display = 'flex';
  _beatTempoPopupDismiss = dismiss;
}

function beatDismissTempoPopup() {
  if (_beatTempoPopupDismiss) _beatTempoPopupDismiss();
}

/* ── Settings panel (module-owned, not the shared Fretboard-Notes overlay) ── */

/* only these settings actually change what's being practiced/scored —
   toggling something unrelated (audio click) shouldn't wipe progress */
var _beatPracticeAffectingKeys = ['bpm', 'timeSig', 'subdivision', 'strumPattern', 'expLevel'];
var _beatSettingsSnapshot = null;

function beatShowSettings() {
  var overlay = document.getElementById('beat-settings-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'beat-settings-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;padding:16px;';
    overlay.onclick = function(e) { if (e.target === overlay) beatCloseSettings(); };
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  _beatSettingsSnapshot = {};
  _beatPracticeAffectingKeys.forEach(function(k) { _beatSettingsSnapshot[k] = beatSettings[k]; });
  beatDrawSettings();
}

function beatCloseSettings() {
  var overlay = document.getElementById('beat-settings-overlay');
  if (overlay) overlay.style.display = 'none';
  beatSaveSettings();
  var changed = _beatSettingsSnapshot && _beatPracticeAffectingKeys.some(function(k) {
    return _beatSettingsSnapshot[k] !== beatSettings[k];
  });
  _beatSettingsSnapshot = null;
  /* only reset the rolling-accuracy window and restart the count-in if
     something that actually affects practice changed — otherwise leave
     the player's in-progress tempo/streak alone */
  if (changed) {
    beatResetSession();
    beatRenderContent();
  }
}

function beatDrawSettings() {
  var overlay = document.getElementById('beat-settings-overlay');
  if (!overlay) return;

  function chip(label, active, onclick) {
    return '<button onclick="' + onclick + '" style="' +
      'padding:7px 13px;border-radius:20px;border:1px solid ' + (active ? 'var(--teal)' : 'var(--border)') + ';' +
      'background:' + (active ? 'var(--teal)' : 'var(--bg)') + ';color:' + (active ? '#fff' : 'var(--text2)') + ';' +
      'font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);-webkit-appearance:none;' +
      '-webkit-tap-highlight-color:transparent;">' + label + '</button>';
  }
  function section(title, inner) {
    return '<div style="margin-bottom:16px;">' +
      '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:8px;">' + title + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + inner + '</div>' +
    '</div>';
  }

  var bpmRow =
    '<div style="display:flex;align-items:center;gap:10px;width:100%;">' +
      '<input type="range" min="40" max="160" step="1" value="' + beatSettings.bpm + '" oninput="beatSetPendingBpm(this.value)" style="flex:1;">' +
      '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:18px;min-width:48px;text-align:right;color:var(--text);" id="beat-set-bpm-val">' + beatSettings.bpm + '</span>' +
    '</div>';
  var sigChips = ['4/4','3/4','6/8'].map(function(sig) {
    return chip(sig, beatSettings.timeSig === sig, 'beatSetPendingTimeSig(\'' + sig + '\')');
  }).join('');
  var subChips = ['quarter','eighth','sixteenth'].map(function(sub) {
    return chip(BEAT_SUBDIVISIONS[sub].label, beatSettings.subdivision === sub, 'beatSetPendingSubdivision(\'' + sub + '\')');
  }).join('');
  var patternChips = BEAT_STRUM_PATTERNS.map(function(p) {
    return chip(p.label, beatSettings.strumPattern === p.id, 'beatSetPendingPattern(\'' + p.id + '\')');
  }).join('');
  var expChips = ['beginner','intermediate','expert'].map(function(lvl) {
    return chip(lvl.charAt(0).toUpperCase() + lvl.slice(1), beatSettings.expLevel === lvl, 'beatSetPendingExp(\'' + lvl + '\')');
  }).join('');
  var clickChip = chip(beatSettings.audioClick ? 'On' : 'Off', beatSettings.audioClick, 'beatTogglePendingClick()');

  overlay.innerHTML =
    '<div style="background:var(--surface);border-radius:16px;width:100%;max-width:400px;max-height:84vh;overflow-y:auto;padding:20px 16px 24px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">' +
        '<div style="font-size:16px;font-weight:800;color:var(--text);">Beat &amp; Timing Settings</div>' +
        '<button class="icon-btn" onclick="beatCloseSettings()" aria-label="Close">' +
          '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>' +
        '</button>' +
      '</div>' +
      section('Tempo (BPM)', bpmRow) +
      section('Time Signature', sigChips) +
      (beatStage >= 2 && beatStage <= 3 ? section('Subdivision', subChips) : '') +
      (beatStage === 4 ? section('Strum Pattern', patternChips) : '') +
      section('Audio Click', clickChip) +
      section('Experience Level', expChips) +
      '<button class="fund-cta-btn" style="margin:4px 0 0;" onclick="beatCloseSettings()">Done</button>' +
    '</div>';
}

function beatSetPendingBpm(v) {
  beatSettings.bpm = parseInt(v, 10);
  var lbl = document.getElementById('beat-set-bpm-val');
  if (lbl) lbl.textContent = beatSettings.bpm;
}
function beatSetPendingTimeSig(sig)   { beatSettings.timeSig = sig; beatDrawSettings(); }
function beatSetPendingSubdivision(s) { beatSettings.subdivision = s; beatDrawSettings(); }
function beatSetPendingPattern(id)    { beatSettings.strumPattern = id; beatDrawSettings(); }
function beatSetPendingExp(lvl)       { beatSettings.expLevel = lvl; beatDrawSettings(); }
function beatTogglePendingClick()     { beatSettings.audioClick = !beatSettings.audioClick; beatDrawSettings(); }

/* ── First-launch tour (forked overlay, isolated from Fretboard Notes' tour) ── */

var beatTourStep = 0;

function showBeatTour() {
  beatTourStep = 0;
  renderBeatTourSlide();
  el('beat-tour-overlay').classList.add('open');
}

function renderBeatTourSlide() {
  var slide = BEAT_TOUR_SLIDES[beatTourStep];
  var total = BEAT_TOUR_SLIDES.length;
  setText('beat-tour-icon',  slide.icon);
  setText('beat-tour-title', slide.title);
  el('beat-tour-body').innerHTML = slide.body;
  var dots = '';
  for (var i = 0; i < total; i++) {
    dots += '<div class="tour-dot' + (i === beatTourStep ? ' active' : '') + '"></div>';
  }
  el('beat-tour-dots').innerHTML = dots;
  var nextBtn = el('beat-tour-next-btn');
  var skipBtn = el('beat-tour-skip-btn');
  if (beatTourStep === total - 1) {
    if (nextBtn) nextBtn.textContent = 'Got it \u{1F918}';
    if (skipBtn) skipBtn.style.display = 'none';
  } else {
    if (nextBtn) nextBtn.textContent = 'Next →';
    if (skipBtn) skipBtn.style.display = '';
  }
}

function beatTourNext() {
  if (beatTourStep < BEAT_TOUR_SLIDES.length - 1) {
    beatTourStep++;
    renderBeatTourSlide();
  } else {
    endBeatTour();
  }
}

function endBeatTour() {
  el('beat-tour-overlay').classList.remove('open');
  try { storage.setItem(BEAT_TOUR_KEY, '1'); } catch(e) {}
}
