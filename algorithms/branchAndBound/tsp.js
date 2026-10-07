// TSP by Branch and Bound (depth-first, children visited in order of lower bound).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.DAA = root.DAA || {})['tsp-branch-bound'] = factory();
})(this, function () {
  const pseudocode = [
    'TSP_BB(node)                     // best = ∞ initially',
    '  for each unvisited city c: create child, compute its lower bound',
    '  sort children by bound',
    '  for each child:',
    '    if bound >= best: prune it',
    '    else if child is a complete tour: best = its cost',
    '    else TSP_BB(child)',
    '',
    'bound = cost so far + cheapest edge out of the last city',
    '        + cheapest edge out of every unvisited city'
  ];
  const statLabels = { generated: 'Nodes generated', explored: 'Nodes explored', pruned: 'Nodes pruned', best: 'Best cost' };
  const fields = [{ id: 'matrix', label: 'Distance matrix (rows split by ;)', def: '0 10 15 20; 10 0 35 25; 15 35 0 30; 20 25 30 0' }];
  function parseInput(v) {
    const d = v.matrix.split(';').map(r => r.trim().split(/[\s,]+/).filter(Boolean).map(Number)).filter(r => r.length);
    const n = d.length;
    if (n < 3 || n > 6) throw new Error('Use between 3 and 6 cities (larger inputs generate too many states).');
    if (d.some(r => r.length !== n)) throw new Error('The matrix must be square (same number of columns as rows).');
    if (d.some((r, i) => r.some((x, j) => !Number.isInteger(x) || x < 0 || (i !== j && x < 1)))) throw new Error('Distances must be positive whole numbers (diagonal can be 0).');
    return d;
  }
  function random(r) {
    const n = 4 + Math.floor(r() * 2), d = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) d[i][j] = d[j][i] = 5 + Math.floor(r() * 36);
    return { matrix: d.map(r2 => r2.join(' ')).join('; ') };
  }

  function generate(d) {
    const n = d.length, steps = [], all = [...Array(n).keys()];
    const st = { generated: 1, explored: 0, pruned: 0, best: '∞' };
    let best = Infinity, bestId = null;
    function bound(path, cost) {
      const last = path[path.length - 1], rest = all.filter(x => !path.includes(x));
      if (!rest.length) return cost + d[last][0];
      const targets = rest.concat([0]);
      let b = cost + Math.min(...rest.map(u => d[last][u]));
      for (const u of rest) b += Math.min(...targets.filter(v => v !== u).map(v => d[u][v]));
      return b;
    }
    const nodes = [{ id: 0, parent: null, path: [0], cost: 0, bound: bound([0], 0), status: 'gen' }];
    const push = (type, message, codeLine, cur) => {
      const bp = bestId === null ? null : nodes[bestId].path;
      steps.push({ step: steps.length, type, message, codeLine, snap: { n, d, nodes: nodes.map(x => ({ ...x })), cur, bestPath: bp }, stats: { ...st } });
    };
    function expand(node) {
      node.status = 'explored'; st.explored++;
      const kids = [], last = node.path[node.path.length - 1];
      for (const c of all.filter(x => !node.path.includes(x))) {
        const path = [...node.path, c], cost = node.cost + d[last][c];
        const kid = { id: nodes.length, parent: node.id, path, cost, bound: bound(path, cost), status: 'gen' };
        nodes.push(kid); kids.push(kid); st.generated++;
        push('generate', `Branch ${path.join('→')}: cost so far ${cost}, lower bound ${kid.bound}`, 2, kid.id);
      }
      kids.sort((a, b) => a.bound - b.bound);
      for (const k of kids) {
        if (k.bound >= best) { k.status = 'pruned'; st.pruned++; push('prune', `Bound ${k.bound} ≥ best ${best}: prune ${k.path.join('→')}`, 5, k.id); continue; }
        if (k.path.length === n) {
          if (bestId !== null) nodes[bestId].status = 'explored';
          best = k.bound; bestId = k.id; k.status = 'best'; st.explored++; st.best = best;
          push('best', `Complete tour ${k.path.join('→')}→0 costs ${best}: new best solution`, 6, k.id);
        } else {
          push('explore', `Promising: bound ${k.bound} < best ${best === Infinity ? '∞' : best}. Explore ${k.path.join('→')}`, 7, k.id);
          expand(k);
        }
      }
    }
    push('start', `Root: start at city 0, lower bound ${nodes[0].bound}`, 1, 0);
    expand(nodes[0]);
    push('done', `Search finished: best tour ${nodes[bestId].path.join('→')}→0 with cost ${best}`, 1, bestId);
    return steps;
  }

  const GLYPH = { gen: '◇', explored: '●', pruned: '✗', best: '★' };
  function render(s) {
    const { n, d, nodes, cur, bestPath } = s, R = 85, C = 100, kids = {};
    nodes.forEach(x => { if (x.parent !== null) (kids[x.parent] = kids[x.parent] || []).push(x); });
    const tree = id => {
      const x = nodes[id];
      return `<li><span class="tn ${x.status}${id === cur ? ' cur' : ''}">${GLYPH[x.status]} ${x.path.join('→')} · cost ${x.cost} · bound ${x.bound}</span>` +
        (kids[id] ? '<ul>' + kids[id].map(k => tree(k.id)).join('') + '</ul>' : '') + '</li>';
    };
    const pos = all => all.map(a => [C + R * Math.cos(2 * Math.PI * a / n - Math.PI / 2), C + R * Math.sin(2 * Math.PI * a / n - Math.PI / 2)]);
    const P = pos([...Array(n).keys()]);
    const path = (p, cls) => p ? p.slice(1).map((v, i) => `<line class="${cls}" x1="${P[p[i]][0]}" y1="${P[p[i]][1]}" x2="${P[v][0]}" y2="${P[v][1]}"/>`).join('') : '';
    let svg = '<svg viewBox="0 0 200 200" class="graph" role="img" aria-label="Cities">' + path(bestPath && bestPath.concat([0]), 'bestl') + path(nodes[cur].path, 'via');
    P.forEach(([x, y], a) => { svg += `<circle class="nd${nodes[cur].path.includes(a) ? ' ni' : ''}" cx="${x}" cy="${y}" r="13"/><text class="nt" x="${x}" y="${y + 4}">${a}</text>`; });
    svg += '</svg>';
    return `<div class="split">${svg}<div class="tree"><ul>${tree(0)}</ul></div></div>` +
      '<p class="note">◇ promising (not yet processed) · ● explored · ✗ pruned · ★ best solution. Map: dashed = current path, solid green = best tour so far.</p>';
  }
  return { generate, pseudocode, statLabels, options: [], fields, parseInput, random, render };
});
