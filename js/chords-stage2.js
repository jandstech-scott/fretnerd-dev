/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

function chordsStage2Study() {
  _chordsSelectedRoot = 'C';
  var initDisplay = chordsBuildNoteRow('C', ['major']);
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 2 · Major Chords</div>' +
      '<div class="fund-title">Root, Major 3rd, Perfect 5th.</div>' +
      '<div class="fund-body">Every major chord is built the same way: start on the root, go up a <strong>Major 3rd</strong> (4 semitones), then up a <strong>Perfect 5th</strong> (7 semitones) from the root. Three notes. Same formula, 12 different starting points.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Formula</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:12px 0;">' +
        '<div style="text-align:center;">' +
          '<div style="font-size:22px;font-weight:800;color:var(--teal);">R</div>' +
          '<div style="font-size:10px;color:var(--text3);margin-top:2px;">Root</div>' +
        '</div>' +
        '<div style="color:var(--text3);font-size:11px;font-weight:700;">─ M3 ─</div>' +
        '<div style="text-align:center;">' +
          '<div style="font-size:22px;font-weight:800;color:var(--text);">3</div>' +
          '<div style="font-size:10px;color:var(--text3);margin-top:2px;">Major 3rd</div>' +
        '</div>' +
        '<div style="color:var(--text3);font-size:11px;font-weight:700;">─ P5 ─</div>' +
        '<div style="text-align:center;">' +
          '<div style="font-size:22px;font-weight:800;color:var(--text);">5</div>' +
          '<div style="font-size:10px;color:var(--text3);margin-top:2px;">Perfect 5th</div>' +
        '</div>' +
      '</div>' +
      '<div class="fund-callout">C major = C (root) + E (4 semitones up) + G (7 semitones up)</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Tap any root to see the notes</div>' +
      chordsRootSelector(2) +
      '<div id="chords-note-display">' + initDisplay + '</div>' +
    '</div>' +

    '<button class="fund-cta-btn" onclick="chordsStartPractice(2)">Start Practice →</button>'
  );
}
