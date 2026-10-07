// Quick Sort (Lomuto partition) execution engine.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.DAA = root.DAA || {})['quick-sort'] = factory();
})(this, function () {
  const pseudocode = [
    'QUICK_SORT(A, low, high)',
    '  if low < high',
    '    p = PARTITION(A, low, high)',
    '    QUICK_SORT(A, low, p - 1)',
    '    QUICK_SORT(A, p + 1, high)',
    'PARTITION(A, low, high)',
    '  pivot = A[high]; i = low - 1   // other pivot choices are swapped into A[high] first',
    '  for j = low to high - 1',
    '    if A[j] <= pivot',
    '      i++; swap A[i], A[j]',
    '  swap A[i + 1], A[high]',
    '  return i + 1'
  ];
  const statLabels = { comparisons: 'Comparisons', swaps: 'Swaps', calls: 'Recursive calls', maxDepth: 'Max depth' };
  const options = [{ id: 'pivot', label: 'Pivot', values: [['last', 'Last element'], ['first', 'First element'], ['random', 'Random']] }];

  function rng(seed) { // mulberry32: reproducible "random" pivots
    return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  function generate(input, opts = {}) {
    const a = input.slice(), steps = [], done = new Set();
    const strategy = opts.pivot || 'last', rand = rng(opts.seed || 1);
    const st = { comparisons: 0, swaps: 0, calls: 0, maxDepth: 0 };
    const push = (type, message, codeLine, mark = {}, range = null) => {
      const all = {}; done.forEach(i => (all[i] = 'sorted'));
      steps.push({ step: steps.length, type, message, codeLine,
        snap: { arr: a.slice(), mark: { ...all, ...mark }, range, aux: null }, stats: { ...st } });
    };
    const swap = (x, y) => { [a[x], a[y]] = [a[y], a[x]]; st.swaps++; };

    function sort(lo, hi, depth) {
      st.calls++; st.maxDepth = Math.max(st.maxDepth, depth);
      if (lo >= hi) {
        if (lo === hi) done.add(lo); // a lone element is in its final place
        push('base', lo === hi ? `Single element A[${lo}]: nothing to partition` : 'Empty range: nothing to do', 2, {}, lo === hi ? [lo, hi] : null);
        return;
      }
      push('call', `QUICK_SORT(low = ${lo}, high = ${hi})`, 1, {}, [lo, hi]);
      const p = strategy === 'first' ? lo : strategy === 'random' ? lo + Math.floor(rand() * (hi - lo + 1)) : hi;
      if (p !== hi) {
        push('pivot', `Pivot ${a[p]} chosen (${strategy}); move it to A[${hi}]`, 7, { [p]: 'pivot' }, [lo, hi]);
        swap(p, hi);
        push('swap', `Swap A[${p}] and A[${hi}] so the pivot sits at high`, 7, { [p]: 'swap', [hi]: 'swap' }, [lo, hi]);
      } else push('pivot', `Pivot = A[${hi}] = ${a[hi]}`, 7, { [hi]: 'pivot' }, [lo, hi]);

      const pv = a[hi]; let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        st.comparisons++;
        push('compare', `Is A[${j}] = ${a[j]} <= pivot ${pv}?  (i = ${i})`, 9, { [hi]: 'pivot', [j]: 'compare' }, [lo, hi]);
        if (a[j] <= pv) {
          i++;
          if (i !== j) { swap(i, j); push('swap', `Yes: i = ${i}, swap A[${i}] and A[${j}]`, 10, { [i]: 'swap', [j]: 'swap', [hi]: 'pivot' }, [lo, hi]); }
          else push('keep', `Yes: i = ${i} equals j, element already in the left part`, 10, { [j]: 'active', [hi]: 'pivot' }, [lo, hi]);
        }
      }
      if (i + 1 !== hi) swap(i + 1, hi);
      done.add(i + 1);
      push('place', `Pivot ${pv} lands at index ${i + 1}: its final position`, 11, { [i + 1]: 'sorted' }, [lo, hi]);
      sort(lo, i, depth + 1);
      sort(i + 2, hi, depth + 1);
    }

    push('start', 'Initial array', 1);
    sort(0, a.length - 1, 0);
    const mark = {}; a.forEach((_, i) => (mark[i] = 'sorted'));
    push('done', 'Array is sorted', 1, mark);
    return steps;
  }
  return { generate, pseudocode, statLabels, options };
});
