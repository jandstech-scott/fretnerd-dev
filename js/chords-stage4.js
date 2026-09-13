/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

function chordsStage4Study() {
  _chordsSelectedRoot = 'G';
  var initDisplay = chordsBuildNoteRow('G', ['major','dom7']);
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 4 · Dominant 7th</div>' +
      '<div class="fund-title">Major chord + a flatted 7th on top.</div>' +
      '<div class="fund-body">Take a major chord and add one more note: a <strong>Minor 7th</strong> (10 semitones above the root). That\'s a dominant 7th chord. The flatted 7th creates tension: it wants to resolve. Blues, jazz, and most popular music are built on this sound.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Formula</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:12px 0;flex-wrap:wrap;">' +
        '<div style="text-align:center;">' +
          '<div style="font-size:20px;font-weight:800;color:var(--teal);">R</div>' +
          '<div style="font-size:9px;color:var(--text3);margin-top:1px;">Root</div>' +
        '</div>' +
        '<div style="color:var(--text3);font-size:11px;font-weight:700;">─M3─</div>' +
        '<div style="text-align:center;">' +
          '<div style="font-size:20px;font-weight:800;color:var(--text);">3</div>' +
          '<div style="font-size:9px;color:var(--text3);margin-top:1px;">Maj 3rd</div>' +
        '</div>' +
        '<div style="color:var(--text3);font-size:11px;font-weight:700;">─P5─</div>' +
        '<div style="text-align:center;">' +
          '<div style="font-size:20px;font-weight:800;color:var(--text);">5</div>' +
          '<div style="font-size:9px;color:var(--text3);margin-top:1px;">Perf 5th</div>' +
        '</div>' +
        '<div style="color:var(--text3);font-size:11px;font-weight:700;">─m7─</div>' +
        '<div style="text-align:center;">' +
          '<div style="font-size:20px;font-weight:800;color:var(--amber-txt);">♭7</div>' +
          '<div style="font-size:9px;color:var(--text3);margin-top:1px;">Min 7th</div>' +
        '</div>' +
      '</div>' +
      '<div class="fund-callout">G7 = G-B-D-F. The F is 10 semitones above G. It\'s one semitone <em>below</em> the natural 7th (F♯).</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Tap a root to compare major vs. dom7</div>' +
      chordsRootSelector(4) +
      '<div id="chords-note-display">' + initDisplay + '</div>' +
    '</div>' +

    '<button class="fund-cta-btn" onclick="chordsStartPractice(4)">Start Practice →</button>'
  );
}
