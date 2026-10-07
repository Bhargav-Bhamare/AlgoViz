// Strassen vs standard matrix multiplication (n = 2 or 4).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.DAA = root.DAA || {})['strassen'] = factory();
})(this, function () {
  const pseudocode = [
    'STRASSEN(A, B)',
    '  if n == 1: return A * B',
    '  split A and B into quadrants A11..A22, B11..B22',
    '  M1..M7 = seven recursive products (M1 = (A11+A22)(B11+B22), ...)',
    '  C11 = M1 + M4 - M5 + M7 ;  C12 = M3 + M5',
    '  C21 = M2 + M4 ;            C22 = M1 - M2 + M3 + M6',
    '  combine C11, C12, C21, C22 into C',
    'STANDARD(A, B): for each i, j',
    '  C[i][j] = sum over k of A[i][k] * B[k][j]',
    '  (n multiplications and n-1 additions per cell)'
  ];
  const statLabels = { mults: 'Multiplications', adds: 'Additions/subtractions', total: 'Estimated operations' };
  const fields = [
    { id: 'A', label: 'Matrix A (rows split by ;)', def: '1 2; 3 4' },
    { id: 'B', label: 'Matrix B', def: '5 6; 7 8' }
  ];
  const options = [{ id: 'mode', label: 'Algorithm', values: [['strassen', 'Strassen'], ['standard', 'Standard']] }];
  const mat = t => t.split(';').map(r => r.trim().split(/[\s,]+/).filter(Boolean).map(Number)).filter(r => r.length);
  function parseInput(v) {
    const A = mat(v.A), B = mat(v.B), n = A.length;
    if (![2, 4].includes(n)) throw new Error('Matrices must be 2×2 or 4×4 (Strassen needs a power of two).');
    if ([A, B].some(M => M.length !== n || M.some(r => r.length !== n || r.some(x => !Number.isInteger(x) || Math.abs(x) > 99)))) throw new Error(`A and B must both be ${n}×${n} with whole numbers from -99 to 99.`);
    return { A, B };
  }
  function random(r) {
    const n = r() < 0.5 ? 2 : 4, m = () => Array.from({ length: n }, () => Array.from({ length: n }, () => Math.floor(r() * 10)).join(' ')).join('; ');
    return { A: m(), B: m() };
  }

  const add = (X, Y, s = 1) => X.map((r, i) => r.map((v, j) => v + s * Y[i][j]));
  const sub = (X, Y) => add(X, Y, -1);
  const quad = (X, qi, qj) => { const h = X.length / 2; return X.slice(qi * h, qi * h + h).map(r => r.slice(qj * h, qj * h + h)); };
  const join = (a, b, c, d) => [...a.map((r, i) => [...r, ...b[i]]), ...c.map((r, i) => [...r, ...d[i]])];
  const std = (X, Y) => X.map(r => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)));
  function strassen(X, Y, c) {
    const n = X.length;
    if (n === 1) { c.m++; return [[X[0][0] * Y[0][0]]]; }
    const h = n / 2, [A11, A12, A21, A22] = [quad(X, 0, 0), quad(X, 0, 1), quad(X, 1, 0), quad(X, 1, 1)];
    const [B11, B12, B21, B22] = [quad(Y, 0, 0), quad(Y, 0, 1), quad(Y, 1, 0), quad(Y, 1, 1)];
    const M1 = strassen(add(A11, A22), add(B11, B22), c), M2 = strassen(add(A21, A22), B11, c), M3 = strassen(A11, sub(B12, B22), c),
      M4 = strassen(A22, sub(B21, B11), c), M5 = strassen(add(A11, A12), B22, c), M6 = strassen(sub(A21, A11), add(B11, B12), c), M7 = strassen(sub(A12, A22), add(B21, B22), c);
    c.a += 18 * h * h;
    return join(add(sub(add(M1, M4), M5), M7), add(M3, M5), add(M2, M4), add(add(sub(M1, M2), M3), M6));
  }
  const count = n => { if (n === 1) return { m: 1, a: 0 }; const s = count(n / 2); return { m: 7 * s.m, a: 7 * s.a + 18 * (n / 2) ** 2 }; };

  function generate({ A, B }, opts = {}) {
    const n = A.length, h = n / 2, mode = opts.mode || 'strassen', steps = [], c = { m: 0, a: 0 };
    const C = Array.from({ length: n }, () => Array(n).fill(null)), Ms = [];
    const push = (type, message, codeLine, extra = {}) => steps.push({ step: steps.length, type, message, codeLine,
      snap: { A, B, C: C.map(r => r.slice()), Ms: Ms.slice(), n, mode, ...extra }, stats: { mults: c.m, adds: c.a, total: c.m + c.a } });
    push('start', `Multiply two ${n}×${n} matrices using ${mode === 'strassen' ? 'Strassen' : 'the standard method'}`, mode === 'strassen' ? 1 : 8);
    if (mode === 'standard') {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        C[i][j] = A[i].reduce((s, v, k) => s + v * B[k][j], 0); c.m += n; c.a += n - 1;
        push('cell', `C[${i}][${j}] = row ${i} of A · column ${j} of B = ${C[i][j]} (${n} multiplications, ${n - 1} additions)`, 9, { cur: [i, j] });
      }
      push('done', 'Product complete', 10);
      return steps;
    }
    push('divide', `Split each matrix into four ${h}×${h} quadrants`, 3, { quads: true });
    const Q = (X, a, b) => quad(X, a, b), [A11, A12, A21, A22] = [Q(A, 0, 0), Q(A, 0, 1), Q(A, 1, 0), Q(A, 1, 1)], [B11, B12, B21, B22] = [Q(B, 0, 0), Q(B, 0, 1), Q(B, 1, 0), Q(B, 1, 1)];
    const defs = [['M1', '(A11 + A22)(B11 + B22)', add(A11, A22), add(B11, B22), 2], ['M2', '(A21 + A22) B11', add(A21, A22), B11, 1],
      ['M3', 'A11 (B12 - B22)', A11, sub(B12, B22), 1], ['M4', 'A22 (B21 - B11)', A22, sub(B21, B11), 1], ['M5', '(A11 + A12) B22', add(A11, A12), B22, 1],
      ['M6', '(A21 - A11)(B11 + B12)', sub(A21, A11), add(B11, B12), 2], ['M7', '(A12 - A22)(B21 + B22)', sub(A12, A22), add(B21, B22), 2]];
    for (const [name, f, X, Y, ops] of defs) {
      c.a += ops * h * h;
      const m = strassen(X, Y, c); Ms.push({ name, f, m });
      push('product', `${name} = ${f}  (1 of 7 products; one multiplication of ${h}×${h} matrices instead of 8)`, 4);
    }
    const [M1, M2, M3, M4, M5, M6, M7] = Ms.map(x => x.m);
    const put = (qi, qj, X, label, f, line, adds) => {
      X.forEach((r, i) => r.forEach((v, j) => { C[qi * h + i][qj * h + j] = v; }));
      c.a += adds * h * h; push('combine', `${label} = ${f}`, line);
    };
    put(0, 0, add(sub(add(M1, M4), M5), M7), 'C11', 'M1 + M4 - M5 + M7', 5, 3);
    put(0, 1, add(M3, M5), 'C12', 'M3 + M5', 5, 1);
    put(1, 0, add(M2, M4), 'C21', 'M2 + M4', 6, 1);
    put(1, 1, add(add(sub(M1, M2), M3), M6), 'C22', 'M1 - M2 + M3 + M6', 6, 3);
    const ok = JSON.stringify(C) === JSON.stringify(std(A, B));
    push('done', `Quadrants combined into C. Matches the standard product: ${ok ? 'yes' : 'NO (bug)'}`, 7);
    return steps;
  }

  const table = (M, hl) => '<table class="dp mx">' + M.map((r, i) => '<tr>' + r.map((v, j) => `<td class="${hl && hl[0] === i && hl[1] === j ? 'cur' : ''}">${v === null ? '·' : v}</td>`).join('') + '</tr>').join('') + '</table>';
  function render(s) {
    const { A, B, C, Ms, n, mode, cur, quads } = s, mark = quads ? ' quads' : '';
    let h = `<div class="mrow"><div class="m${mark}">A${table(A)}</div><span>×</span><div class="m${mark}">B${table(B)}</div><span>=</span><div class="m">C${table(C, cur)}</div></div>`;
    if (Ms.length) h += '<div class="mrow">' + Ms.map(x => `<div class="m">${x.name}<small>${x.f}</small>${table(x.m)}</div>`).join('') + '</div>';
    const sizes = [2, 4, 8, 16, 32, 64], rows = sizes.map(k => ({ k, s: count(k).m, t: k ** 3 })), mx = Math.max(...rows.map(r => r.t));
    h += '<div class="cmp"><b>Multiplications needed (theory)</b>' + rows.map(r => `<div class="cr${r.k === n ? ' on' : ''}"><span>n=${r.k}</span><i style="width:${r.t / mx * 100}%" class="std"></i><em>${r.t}</em><i style="width:${r.s / mx * 100}%" class="str"></i><em>${r.s}</em></div>`).join('') + '<small>Grey bar = standard n³. Blue bar = Strassen 7^log₂n. Constant factors and the extra additions mean Strassen only wins for large n.</small></div>';
    return h;
  }
  return { generate, pseudocode, statLabels, options, fields, parseInput, random, render };
});
