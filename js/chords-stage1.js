/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

function chordsStage1Study() {
  var rows = CHORD_INTERVALS.map(function(iv) {
    return '<tr>' +
      '<td style="padding:8px 10px 8px 0;font-weight:700;color:var(--text);">' + iv.name + '</td>' +
      '<td style="padding:8px 6px;font-weight:800;color:var(--teal-txt);background:var(--teal-lt);border-radius:4px;text-align:center;font-size:13px;">' + iv.abbr + '</td>' +
      '<td style="padding:8px 0 8px 10px;color:var(--text2);text-align:right;">' + iv.semitones + ' semitones</td>' +
    '</tr>';
  }).join('');

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 1 · Intervals</div>' +
      '<div class="fund-title">Five distances. Every chord is built from these.</div>' +
      '<div class="fund-body">A chord is just notes stacked at specific distances from the root. Those distances are called <strong>intervals</strong>. Learn to hear and name these five and you can build any chord from scratch.</div>' +
      '<div class="fund-body" style="margin-top:8px;">On guitar, 1 semitone = 1 fret. So every interval is a fixed number of frets: the same distance anywhere on the neck, regardless of starting note.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">The five intervals used in this module</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
        '<thead><tr>' +
          '<th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text3);padding:0 10px 8px 0;font-weight:600;border-bottom:1px solid var(--border);">Name</th>' +
          '<th style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text3);padding:0 6px 8px;font-weight:600;border-bottom:1px solid var(--border);">Abbr</th>' +
          '<th style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text3);padding:0 0 8px 10px;text-align:right;font-weight:600;border-bottom:1px solid var(--border);">Distance</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>' +



    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Calculating intervals on one string</div>' +
      '<div class="fund-body">Pick any note on any string. Count up that many frets (<em>on the same string</em>) and you\'ve found the interval note. The string doesn\'t matter. The starting fret doesn\'t matter. Only the count matters.</div>' +
      '<div style="margin:14px 0;">' +
        chordsIntervalFretDiagram() +
      '</div>' +
      '<div class="fund-body" style="margin-top:4px;">Two landmarks worth memorising: <strong>M3 is 4 frets</strong> (the gap between open E and open G strings), and <strong>P5 is 7 frets</strong> (half an octave). Those two are the backbone of every chord in this module.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Worked example: starting from A (5th fret, low E)</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;margin:8px 0;">' +
        chordsWorkedExample('A', [
          { label:'+ 3 frets (m3)', result:'C',  note:'8th fret' },
          { label:'+ 4 frets (M3)', result:'C♯', note:'9th fret' },
          { label:'+ 7 frets (P5)', result:'E',  note:'12th fret' }
        ]) +
      '</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-top:8px;">A-C-E = A minor. A-C♯-E = A major. The only difference is one fret on the middle note, and that\'s coming in Stage 3.</div>' +
    '</div>' +

    '<button class="fund-cta-btn" onclick="chordsStartPractice(1)">Start Practice →</button>'
  );
}

function chordsIntervalFretDiagram() {
  var frets = 12;
  var markers = { 3:'m3', 4:'M3', 7:'P5', 10:'m7', 11:'M7' };
  var cells = '';
  for (var f = 0; f <= frets; f++) {
    var isRoot   = f === 0;
    var abbr     = markers[f];
    var bg       = isRoot ? 'var(--teal)' : abbr ? 'var(--teal-lt)' : 'var(--bg2)';
    var color    = isRoot ? '#fff' : abbr ? 'var(--teal-txt)' : 'var(--text3)';
    var fw       = (isRoot || abbr) ? '800' : '400';
    var label    = isRoot ? 'R' : abbr ? abbr : '';
    var fLabel   = abbr || isRoot ? String(f) : '';
    cells +=
      '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">' +
        '<div style="font-size:9px;color:var(--text3);font-weight:' + (abbr||isRoot?'700':'400') + ';height:14px;line-height:14px;">' + fLabel + '</div>' +
        '<div style="width:' + (isRoot?'32px':'26px') + ';height:' + (isRoot?'32px':'26px') + ';border-radius:50%;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:' + fw + ';color:' + color + ';border:' + (abbr?'2px solid var(--teal)':'1px solid var(--border)') + ';">' + label + '</div>' +
      '</div>';
  }
  return '<div style="overflow-x:auto;padding:4px 0;">' +
    '<div style="display:flex;gap:3px;align-items:flex-end;min-width:max-content;padding:0 2px;">' + cells + '</div>' +
    '<div style="display:flex;gap:3px;margin-top:4px;min-width:max-content;padding:0 2px;">' +
      '<div style="height:4px;background:var(--border);border-radius:2px;flex:1;margin-top:6px;"></div>' +
    '</div>' +
  '</div>';
}

function chordsWorkedExample(root, steps) {
  return steps.map(function(s) {
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg2);border-radius:8px;">' +
      '<div style="font-size:20px;font-weight:800;color:var(--teal);min-width:24px;text-align:center;">' + root + '</div>' +
      '<div style="color:var(--text3);font-size:12px;flex:1;">' + s.label + '</div>' +
      '<div style="font-size:20px;font-weight:800;color:var(--text);min-width:24px;text-align:center;">' + s.result + '</div>' +
      '<div style="font-size:11px;color:var(--text3);min-width:54px;text-align:right;">' + s.note + '</div>' +
    '</div>';
  }).join('');
}
