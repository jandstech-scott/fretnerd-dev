/************************************************************
 * FretNerd
 * Copyright (c) 2026 Scott Farris / Tilted Iron
 * Proprietary and confidential. Unauthorized use prohibited.
 ************************************************************/

/* ── Stage 5: The Circle of Fifths — Study content ── */
var fundStage5SelectedRoot = 'C';

function fundStage5Study() {
  var key = fundKeyByRoot(fundStage5SelectedRoot);
  var n = FUND_CIRCLE_KEYS.length;
  var idx = FUND_CIRCLE_KEYS.indexOf(fundStage5SelectedRoot);
  var cwKey = fundKeyByRoot(FUND_CIRCLE_KEYS[(idx + 1) % n]);
  var ccwKey = fundKeyByRoot(FUND_CIRCLE_KEYS[(idx - 1 + n) % n]);

  return (
    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Stage 5 \u00B7 The Circle of Fifths</div>' +
      '<div class="fund-title">One map. Every key.</div>' +
      '<div class="fund-body">You\u2019ve already built this circle in Stage 4: sharps clockwise, flats counter-clockwise. Going clockwise is called going <strong>above</strong> on the circle; counter-clockwise is going <strong>below</strong>. The circle also shows each key\u2019s <strong>relative minor</strong> and how far apart any two keys really are.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Tap any key</div>' +
      '<div id="fundCircleWrap" style="display:flex;justify-content:center;padding:8px 0;">' +
        fundBuildCircleSVG({ showMinors: true, selectedRoot: fundStage5SelectedRoot, interactive: true, onTapHandler: 'fundSelectCircleKey' }) +
      '</div>' +
      '<div id="fundCircleSelectedInfo">' + fundRenderCircleSelectedInfo(key, cwKey, ccwKey) + '</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Relative Minors</div>' +
      '<div class="fund-body">Every major key has a relative minor: same key signature, same notes, different home note. It\u2019s always scale degree 6 of the major scale.</div>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;justify-content:center;margin:10px 0;">' +
        key.scale.map(function(n, i) {
          var isMinorRoot = (i === 5);
          return '<div style="min-width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;' +
            (isMinorRoot
              ? 'background:var(--teal);color:#fff;border:2px solid var(--teal);'
              : 'background:var(--surface);color:var(--text);border:1px solid var(--border);') +
            '">' + n.replace('b','\u266d').replace('#','\u266f') + '</div>';
        }).join('<div style="font-size:11px;color:var(--text3);">-</div>') +
      '</div>' +
      '<div class="fund-body">' + key.displayKey + ' major\u2019s 6th note is <strong style="color:var(--teal-txt);">' + key.displayRelativeMinor + '</strong>, so ' + key.displayRelativeMinor + ' minor shares the exact same key signature as ' + key.displayKey + ' major.</div>' +
    '</div>' +

    '<div class="fund-lesson-card">' +
      '<div class="fund-eyebrow">Distance on the Circle</div>' +
      '<div class="fund-body">Neighboring keys on the circle differ by exactly one sharp or flat, they\u2019re close relatives. Keys directly across from each other share almost nothing.</div>' +
      '<div style="margin:10px 0;display:flex;flex-direction:column;gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--surface);border:1px solid var(--border);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--teal-txt);white-space:nowrap;">C \u2192 G</div>' +
          '<div style="font-size:13px;color:var(--text2);">G is one fifth <strong>above</strong> C, 1 step clockwise. They differ by just one note (F\u266f).</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--surface);border:1px solid var(--border);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--text);white-space:nowrap;">C \u2192 F\u266f</div>' +
          '<div style="font-size:13px;color:var(--text2);">F\u266f is 6 steps <strong>above</strong> C, opposite sides of the circle. Only 1 note in common.</div>' +
        '</div>' +
      '</div>' +
      '<div class="fund-body">Counting steps between any two keys tells you exactly how many accidentals separate them.</div>' +
    '</div>' +

    '<button class="fund-cta-btn" onclick="fundStartPractice(5)">Start Practice \u2192</button>'
  );
}

function fundRenderCircleSelectedInfo(key, cwKey, ccwKey) {
  return (
    '<div style="text-align:center;margin-bottom:10px;">' +
      '<div style="font-size:18px;font-weight:800;color:var(--text);">' + key.displayKey + ' major</div>' +
      '<div style="font-size:12px;color:var(--text2);margin-top:2px;">relative minor: <strong style="color:var(--teal-txt);">' + key.displayRelativeMinor + ' minor</strong></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;font-weight:700;color:var(--text2);border-top:1px solid var(--border);padding-top:8px;">' +
      '<div>\u2190 ' + ccwKey.displayKey + '<span style="display:block;font-size:12px;font-weight:600;color:var(--teal-txt);">one fifth below</span><span style="display:block;font-size:11px;font-weight:400;color:var(--text2);">counter-clockwise \u00b7 one more flat</span></div>' +
      '<div style="text-align:right;">' + cwKey.displayKey + ' \u2192<span style="display:block;font-size:12px;font-weight:600;color:var(--teal-txt);">one fifth above</span><span style="display:block;font-size:11px;font-weight:400;color:var(--text2);">clockwise \u00b7 one more sharp</span></div>' +
    '</div>'
  );
}

function fundSelectCircleKey(root) {
  fundStage5SelectedRoot = root;
  var key = fundKeyByRoot(root);
  var n = FUND_CIRCLE_KEYS.length;
  var idx = FUND_CIRCLE_KEYS.indexOf(root);
  var cwKey = fundKeyByRoot(FUND_CIRCLE_KEYS[(idx + 1) % n]);
  var ccwKey = fundKeyByRoot(FUND_CIRCLE_KEYS[(idx - 1 + n) % n]);

  el('fundCircleWrap').innerHTML = fundBuildCircleSVG({ showMinors: true, selectedRoot: root, interactive: true, onTapHandler: 'fundSelectCircleKey' });
  el('fundCircleSelectedInfo').innerHTML = fundRenderCircleSelectedInfo(key, cwKey, ccwKey);
}
