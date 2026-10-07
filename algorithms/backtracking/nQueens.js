// N-Queens backtracking. Stops at the first solution.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.DAA = root.DAA || {})['n-queens'] = factory();
})(this, function () {
  const pseudocode = [
    'SOLVE(row)',
    '  if row == N: solution found, return true',
    '  for col = 0 to N-1',
    '    if IS_SAFE(row, col)          // no queen in same column or diagonal above',
    '      place queen at (row, col)',
    '      if SOLVE(row + 1): return true',
    '      remove queen                 // backtrack',
    '  return false'
  ];
  const statLabels = { attempts: 'Placements attempted', backtracks: 'Backtracks', solutions: 'Solutions found' };
  const fields = [{ id: 'n', label: 'N (1–8)', def: '4' }];
  const presets = { 'N = 1': () => ({ n: '1' }), 'N = 2 (no solution)': () => ({ n: '2' }), 'N = 3 (no solution)': () => ({ n: '3' }), 'N = 6': () => ({ n: '6' }), 'N = 8': () => ({ n: '8' }) };
  function parseInput(v) {
    const n = Number(v.n);
    if (!Number.isInteger(n) || n < 1 || n > 8) throw new Error('N must be a whole number from 1 to 8 (larger boards can freeze the browser).');
    return n;
  }
  const random = r => ({ n: String(4 + Math.floor(r() * 5)) });

  function generate(n) {
    const q = Array(n).fill(-1), steps = [], st = { attempts: 0, backtracks: 0, solutions: 0 };
    const push = (type, message, codeLine, extra = {}) => steps.push({ step: steps.length, type, message, codeLine, snap: { n, q: q.slice(), ...extra }, stats: { ...st } });
    const clash = (r, c) => {
      for (let p = 0; p < r; p++) {
        if (q[p] === c) return `column ${c} already has a queen (row ${p})`;
        if (Math.abs(q[p] - c) === r - p) return `diagonal clash with the queen at row ${p}, col ${q[p]}`;
      }
      return null;
    };
    function solve(r) {
      if (r === n) { st.solutions++; push('solution', `All ${n} queens placed: solution found`, 2, { solved: true }); return true; }
      for (let c = 0; c < n; c++) {
        st.attempts++;
        const why = clash(r, c);
        if (why) { push('unsafe', `Row ${r}, col ${c}: unsafe, ${why}`, 4, { row: r, col: c, mode: 'bad' }); continue; }
        q[r] = c; push('place', `Row ${r}, col ${c} is safe: place a queen`, 5, { row: r, col: c, mode: 'ok' });
        if (solve(r + 1)) return true;
        q[r] = -1; st.backtracks++;
        push('backtrack', `Row ${r + 1} has no safe column: remove the queen from row ${r}, col ${c} and try the next column`, 7, { row: r, col: c, mode: 'back' });
      }
      return false;
    }
    push('start', `Empty ${n}×${n} board`, 1);
    if (!solve(0)) push('none', `Every option fails: no solution exists for N = ${n}`, 8, {});
    return steps;
  }

  function render(s) {
    const { n, q, row, col, mode, solved } = s;
    let h = '<table class="board">';
    for (let r = 0; r < n; r++) {
      h += '<tr>';
      for (let c = 0; c < n; c++) {
        const isQ = q[r] === c, here = r === row && c === col;
        let cls = (r + c) % 2 ? 'dk' : 'lt', g = '';
        if (isQ) { cls += solved ? ' sol' : ' qn'; g = '♛'; }
        if (here && mode === 'bad') { cls += ' bad'; g = '✗'; }
        if (here && mode === 'back') { cls += ' back'; g = '↩'; }
        h += `<td class="${cls}">${g}</td>`;
      }
      h += '</tr>';
    }
    return h + '</table><p class="note">♛ queen · ✗ unsafe cell being tested · ↩ queen removed (backtrack)</p>';
  }
  return { generate, pseudocode, statLabels, options: [], fields, parseInput, random, presets, render };
});
