// Floyd-Warshall: one step per (k, i, j) relaxation check.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.DAA = root.DAA || {})['floyd-warshall'] = factory();
})(this, function () {
  const INF = Infinity;
  const pseudocode = [
    'for k = 0 to n-1            // intermediate vertex',
    '  for i = 0 to n-1          // source',
    '    for j = 0 to n-1        // destination',
    '      if dist[i][k] + dist[k][j] < dist[i][j]',
    '        dist[i][j] = dist[i][k] + dist[k][j]'
  ];
  const statLabels = { checked: 'Relaxations checked', updates: 'Updates' };
  const fields = [
    { id: 'n', label: 'Vertices (2–6)', def: '4' },
    { id: 'edges', label: 'Directed edges u-v:weight', def: '0-1:5, 0-3:10, 1-2:3, 2-3:1' }
  ];
  const presets = {
    'Sparse graph': () => ({ n: '5', edges: '0-1:4, 1-2:3, 2-3:2, 3-4:6' }),
    'Dense graph': () => ({ n: '4', edges: '0-1:3, 0-2:8, 0-3:7, 1-0:2, 1-2:1, 2-3:4, 3-1:5, 3-2:2, 2-0:6, 1-3:9' }),
    'Disconnected graph': () => ({ n: '5', edges: '0-1:2, 1-0:3, 2-3:1, 3-4:2' })
  };
  function parseInput(v) {
    const n = Number(v.n);
    if (!Number.isInteger(n) || n < 2 || n > 6) throw new Error('Vertices must be a whole number from 2 to 6.');
    const edges = [];
    for (const part of v.edges.split(',').map(s => s.trim()).filter(Boolean)) {
      const m = part.match(/^(\d+)\s*-\s*(\d+)\s*:\s*(\d+)$/);
      if (!m) throw new Error(`Cannot read "${part}". Use the form 0-1:5 (from-to:weight).`);
      const [u, w, c] = [+m[1], +m[2], +m[3]];
      if (u >= n || w >= n) throw new Error(`Vertex numbers must be between 0 and ${n - 1}.`);
      if (u === w || c < 1 || c > 99) throw new Error('No self-loops, and weights must be 1–99.');
      edges.push([u, w, c]);
    }
    return { n, edges };
  }
  function random(r) {
    const n = 4 + Math.floor(r() * 2), e = [];
    for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) if (u !== w && r() < 0.4) e.push(`${u}-${w}:${1 + Math.floor(r() * 12)}`);
    return { n: String(n), edges: e.join(', ') };
  }

  function generate({ n, edges }) {
    const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)));
    edges.forEach(([u, v, w]) => { dist[u][v] = Math.min(dist[u][v], w); });
    const steps = [], st = { checked: 0, updates: 0 };
    const push = (type, message, codeLine, extra = {}) => steps.push({ step: steps.length, type, message, codeLine, snap: { n, edges, dist: dist.map(r => r.slice()), ...extra }, stats: { ...st } });
    const f = x => (x === INF ? '∞' : x);
    push('start', 'Distance matrix initialised from the edges: 0 on the diagonal, ∞ where there is no direct edge', 1);
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      st.checked++;
      const prev = dist[i][j], via = dist[i][k] + dist[k][j], upd = via < prev;
      if (upd) { dist[i][j] = via; st.updates++; }
      push(upd ? 'update' : 'check',
        `k=${k}: dist[${i}][${j}] = ${f(prev)}; via ${k}: ${f(dist[i][k])} + ${f(dist[k][j])} = ${f(via)}. ${upd ? `Shorter, update to ${via}` : 'No improvement'}`,
        upd ? 5 : 4, { k, i, j, prev, via, upd });
    }
    push('done', 'All-pairs shortest paths found (∞ = unreachable)', 1);
    return steps;
  }

  function render(s) {
    const { n, edges, dist, k, i, j, upd } = s, R = 105, C = 130;
    const pos = Array.from({ length: n }, (_, a) => [C + R * Math.cos(2 * Math.PI * a / n - Math.PI / 2), C + R * Math.sin(2 * Math.PI * a / n - Math.PI / 2)]);
    const line = (u, v, off, cls, label) => {
      const [x1, y1] = pos[u], [x2, y2] = pos[v], dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), nx = -dy / d * off, ny = dx / d * off, r = 17;
      const a = [x1 + dx / d * r + nx, y1 + dy / d * r + ny], b = [x2 - dx / d * (r + 4) + nx, y2 - dy / d * (r + 4) + ny];
      return `<line class="${cls}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" marker-end="url(#ar)"/>` +
        (label ? `<text class="ew" x="${(a[0] + b[0]) / 2 + nx}" y="${(a[1] + b[1]) / 2 + ny}">${label}</text>` : '');
    };
    let svg = '<svg viewBox="0 0 260 260" class="graph" role="img" aria-label="Graph"><defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" fill="#8b949e"/></marker></defs>';
    edges.forEach(([u, v, w]) => { svg += line(u, v, 7, 'e', w); });
    if (k !== undefined) { svg += line(i, k, -7, 'via', ''); svg += line(k, j, -7, 'via', ''); }
    pos.forEach(([x, y], a) => {
      const role = k === undefined ? '' : a === k ? ' nk' : a === i ? ' ni' : a === j ? ' nj' : '';
      const tag = a === k ? 'k' : a === i ? 'i' : a === j ? 'j' : '';
      svg += `<circle class="nd${role}" cx="${x}" cy="${y}" r="16"/><text class="nt" x="${x}" y="${y + 4}">${a}</text>` + (tag ? `<text class="tg" x="${x + 15}" y="${y - 14}">${tag}</text>` : '');
    });
    svg += '</svg>';
    let t = '<tr><th></th>' + dist.map((_, c) => `<th>${c}</th>`).join('') + '</tr>';
    dist.forEach((row, r) => {
      t += `<tr><th>${r}</th>` + row.map((v, c) => {
        let cls = '', g = '';
        if (k !== undefined) {
          if (r === i && c === j) { cls = upd ? 'upd' : 'cur'; g = upd ? '✓ ' : '▸ '; }
          else if ((r === i && c === k) || (r === k && c === j)) { cls = 'src'; g = '← '; }
        }
        return `<td class="${cls}">${g}${v === INF ? '∞' : v}</td>`;
      }).join('') + '</tr>';
    });
    return `<div class="split">${svg}<div class="scroll"><table class="dp">${t}</table></div></div>` +
      '<p class="note">Node tags: k = intermediate, i = source, j = destination. Dashed lines show the path i→k→j being tested. Table: ▸ checked cell, ✓ updated, ← the two distances added.</p>';
  }
  return { generate, pseudocode, statLabels, options: [], fields, parseInput, random, presets, render };
});
