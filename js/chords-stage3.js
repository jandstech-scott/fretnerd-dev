/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

function chordsStage3Study() {
  _chordsSelectedRoot = 'A';
  var initDisplay = chordsBuildNoteRow('A', ['major','minor']);
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 3 · Minor Chords</div>' +
      '<div class="fund-title">Flatten the 3rd. That\'s it.</div>' +
      '<div class="fund-body">A minor chord has the same formula as major, except the middle note drops by one half step. <strong>Minor 3rd</strong> instead of Major 3rd. Root and 5th stay exactly the same. One note changes. Completely different sound.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Major vs. Minor, side by side</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">' +
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center;">' +
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text2);margin-bottom:6px;">Major</div>' +
          '<div style="font-size:13px;font-weight:800;color:var(--teal);">R-M3-P5</div>' +
          '<div style="font-size:11px;color:var(--text3);margin-top:4px;">e.g. A-C♯-E</div>' +
        '</div>' +
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center;">' +
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text2);margin-bottom:6px;">Minor</div>' +
          '<div style="font-size:13px;font-weight:800;color:var(--teal);">R-<span style="color:var(--red);">m3</span>-P5</div>' +
          '<div style="font-size:11px;color:var(--text3);margin-top:4px;">e.g. A-C-E</div>' +
        '</div>' +
      '</div>' +
      '<div class="fund-callout">A to C♯ is 4 semitones (Major 3rd). A to C is 3 semitones (Minor 3rd). That one semitone is the entire difference between major and minor.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Tap any root to compare major and minor</div>' +
      chordsRootSelector(3) +
      '<div id="chords-note-display">' + initDisplay + '</div>' +
    '</div>' +

    '<button class="fund-cta-btn" onclick="chordsStartPractice(3)">Start Practice →</button>'
  );
}
