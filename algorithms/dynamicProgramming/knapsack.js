// 0/1 Knapsack: one step per DP cell, then a backtrack to find the chosen items.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.DAA = root.DAA || {})['knapsack'] = factory();
})(this, function () {
  const pseudocode = [
    'for i = 0..n: dp[i][0] = 0 ; dp[0][w] = 0',
    'for i = 1 to n',
    '  for w = 0 to W',
    '    if wt[i] > w: dp[i][w] = dp[i-1][w]            // item does not fit',
    '    else dp[i][w] = max(dp[i-1][w],                  // exclude',
    '                        val[i] + dp[i-1][w-wt[i]])   // include',
    'answer = dp[n][W]; walk back from (n, W):',
    '  if dp[i][w] != dp[i-1][w]: take item i, w -= wt[i]'
  ];
  const statLabels = { states: 'DP states evaluated', best: 'Best value so far', selected: 'Items selected' };
  const fields = [
    { id: 'weights', label: 'Weights', def: '1, 3, 4, 5' },
    { id: 'values', label: 'Values', def: '1, 4, 5, 7' },
    { id: 'cap', label: 'Capacity (1–15)', def: '7' }
  ];
  const nums = t => t.split(/[\s,]+/).filter(Boolean).map(Number);

  function parseInput(v) {
    const w = nums(v.weights), val = nums(v.values), W = Number(v.cap);
    if (!w.length || w.length > 8) throw new Error('Use between 1 and 8 items.');
    if (w.length !== val.length) throw new Error('Weights and values must have the same number of entries.');
    if ([...w, ...val].some(x => !Number.isInteger(x) || x < 1)) throw new Error('Weights and values must be positive whole numbers.');
    if (!Number.isInteger(W) || W < 1 || W > 15) throw new Error('Capacity must be a whole number from 1 to 15.');
    return { w, val, W };
  }
  function random(r) {
    const n = 4 + Math.floor(r() * 3), pick = (lo, hi) => Array.from({ length: n }, () => lo + Math.floor(r() * (hi - lo + 1)));
    return { weights: pick(1, 8).join(', '), values: pick(2, 20).join(', '), cap: String(8 + Math.floor(r() * 6)) };
  }

  function generate({ w, val, W }) {
    const n = w.length, steps = [], st = { states: 0, best: 0, selected: 0 };
    const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(null));
    for (let c = 0; c <= W; c++) dp[0][c] = 0;
    const push = (type, message, codeLine, extra = {}) =>
      steps.push({ step: steps.length, type, message, codeLine, snap: { w, val, W, dp: dp.map(r => r.slice()), ...extra }, stats: { ...st } });

    push('start', 'Row 0 is the base case: with no items the value is 0', 1);
    for (let i = 1; i <= n; i++) for (let c = 0; c <= W; c++) {
      st.states++;
      const wi = w[i - 1], vi = val[i - 1], ex = dp[i - 1][c];
      let msg, line, src;
      if (wi > c) { dp[i][c] = ex; line = 4; src = [[i - 1, c]];
        msg = `Item ${i} (w=${wi}) does not fit in capacity ${c}: dp[${i}][${c}] = dp[${i - 1}][${c}] = ${ex}`; }
      else { const inc = vi + dp[i - 1][c - wi]; dp[i][c] = Math.max(ex, inc); line = 5; src = [[i - 1, c], [i - 1, c - wi]];
        msg = `Exclude item ${i}: ${ex}. Include: ${vi} + dp[${i - 1}][${c - wi}] = ${inc}. Take ${inc > ex ? 'include' : 'exclude'}, dp[${i}][${c}] = ${dp[i][c]}`; }
      st.best = Math.max(st.best, dp[i][c]);
      push('cell', msg, line, { cur: [i, c], src });
    }
    push('done', `Table complete: optimal value = dp[${n}][${W}] = ${dp[n][W]}. Now walk back to find the items`, 7, { cur: [n, W] });
    let c = W; const sel = [], path = [];
    for (let i = n; i >= 1; i--) {
      if (dp[i][c] !== dp[i - 1][c]) {
        sel.push(i); path.push([i, c]); st.selected++;
        push('pick', `dp[${i}][${c}] differs from dp[${i - 1}][${c}]: item ${i} is selected, capacity ${c} → ${c - w[i - 1]}`, 8, { cur: [i, c], sel: [...sel], path: [...path] });
        c -= w[i - 1];
      } else push('skip', `dp[${i}][${c}] equals dp[${i - 1}][${c}]: item ${i} is not used`, 8, { cur: [i, c], sel: [...sel], path: [...path] });
    }
    const tw = sel.reduce((s, i) => s + w[i - 1], 0);
    push('final', `Selected items: ${sel.slice().reverse().join(', ') || 'none'} (weight ${tw}, value ${dp[n][W]})`, 7, { sel: [...sel], path: [...path] });
    return steps;
  }

  function render(s) {
    const { w, val, W, dp, cur, src = [], sel = [], path = [] } = s;
    const has = (list, i, c) => list.some(p => p[0] === i && p[1] === c);
    const items = w.map((x, k) => `<span class="cell${sel.includes(k + 1) ? ' pth' : ''}">${sel.includes(k + 1) ? '✓ ' : ''}#${k + 1} w=${x} v=${val[k]}</span>`).join('');
    let t = '<tr><th>i \\ w</th>' + dp[0].map((_, c) => `<th>${c}</th>`).join('') + '</tr>';
    dp.forEach((row, i) => {
      t += `<tr><th>${i}</th>` + row.map((v, c) => {
        const k = cur && cur[0] === i && cur[1] === c ? 'cur' : has(path, i, c) ? 'pth' : has(src, i, c) ? 'src' : '';
        const g = k === 'cur' ? '▸ ' : k === 'pth' ? '✓ ' : k === 'src' ? '← ' : '';
        return `<td class="${k}">${g}${v === null ? '·' : v}</td>`;
      }).join('') + '</tr>';
    });
    return `<div class="items">${items}</div><div class="scroll"><table class="dp">${t}</table></div>` +
      '<p class="note">▸ cell being computed · ← cells it reads from · ✓ chosen path. Capacity ' + W + '.</p>';
  }
  return { generate, pseudocode, statLabels, options: [], fields, parseInput, random, render };
});
