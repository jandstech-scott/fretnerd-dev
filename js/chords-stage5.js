/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

function chordsStage5Study() {
  _chordsSelectedRoot = 'C';
  var initDisplay = chordsBuildNoteRow('C', ['dom7','maj7','min7']);
  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 5 · Major 7 & Minor 7</div>' +
      '<div class="fund-title">Three 7th chords. One note makes all the difference.</div>' +
      '<div class="fund-body">You know the dominant 7th (flatted 7th on a major chord). Now add two more: the <strong>Major 7th</strong> (natural 7th on a major chord) and the <strong>Minor 7th</strong> (flatted 7th on a minor chord). The top note is everything.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">The three 7th chords compared</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin:10px 0;">' +
        chordsCompareRow('dom7',  'var(--amber-lt)',  'var(--amber-txt)', 'Dominant 7',  'Pulls, wants to resolve. Blues and jazz.') +
        chordsCompareRow('maj7',  'var(--teal-lt)',   'var(--teal-txt)',  'Major 7',     'Floats, dreamy. Jazz, bossa nova.') +
        chordsCompareRow('min7',  'var(--purple-lt)', 'var(--purple-txt)','Minor 7',     'Broods, smooth. Soul, funk, jazz.') +
      '</div>' +
      '<div class="fund-callout"><strong>The key distinction:</strong> Dom7 vs Maj7 differ by just one semitone: m7 (10) vs M7 (11). Don\'t confuse them.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Tap a root to compare all three 7th types</div>' +
      chordsRootSelector(5) +
      '<div id="chords-note-display">' + initDisplay + '</div>' +
    '</div>' +

    '<button class="fund-cta-btn" onclick="chordsStartPractice(5)">Start Practice →</button>'
  );
}

function chordsCompareRow(typeId, bgColor, textColor, label, desc) {
  var type   = chordTypeById(typeId);
  var formula = type.degreeLabels.join('-');
  return '<div style="display:flex;align-items:center;gap:10px;background:' + bgColor + ';border-radius:8px;padding:10px 12px;">' +
    '<div style="flex:1;">' +
      '<div style="font-size:13px;font-weight:700;color:' + textColor + ';">' + label + ' &nbsp;<span style="font-size:11px;font-weight:600;opacity:0.8;">' + formula + '</span></div>' +
      '<div style="font-size:11px;color:var(--text2);margin-top:2px;">' + desc + '</div>' +
    '</div>' +
    '<div style="font-size:18px;font-weight:800;color:' + textColor + ';opacity:0.4;">' + type.symbol + '</div>' +
  '</div>';
}
