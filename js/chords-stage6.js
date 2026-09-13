/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

function chordsStage6Study() {
  var rows = CHORD_TYPES.map(function(t) {
    return '<tr>' +
      '<td style="padding:8px 0;font-weight:800;font-size:14px;color:var(--text);">' + t.name + '</td>' +
      '<td style="padding:8px 6px;font-weight:700;color:var(--teal-txt);font-size:13px;">' + (t.symbol || '(none)') + '</td>' +
      '<td style="padding:8px 0 8px 6px;font-size:12px;color:var(--text2);">' + t.degreeLabels.join('-') + '</td>' +
    '</tr>';
  }).join('');

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 6 · All Types</div>' +
      '<div class="fund-title">Five chords. Any root. No hesitation.</div>' +
      '<div class="fund-body">This stage mixes all five chord types until recognition is truly automatic. The goal isn\'t just accuracy: it\'s speed. If you have to think about it, keep drilling.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Reference: all five types</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
        '<thead><tr>' +
          '<th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text3);padding:0 0 8px;border-bottom:1px solid var(--border);">Chord</th>' +
          '<th style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text3);padding:0 6px 8px;border-bottom:1px solid var(--border);">Symbol</th>' +
          '<th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text3);padding:0 0 8px 6px;border-bottom:1px solid var(--border);">Degrees</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>' +

    '<div class="fund-callout" style="margin-bottom:0;">Mastery = 80% coverage across all 5 types and all 12 roots, answered at speed. Take your time on the study cards if you need a refresher before diving in.</div>' +

    '<button class="fund-cta-btn" onclick="chordsStartPractice(6)">Start Practice →</button>'
  );
}
