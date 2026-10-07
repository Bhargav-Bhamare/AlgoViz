// Merge Sort execution engine. Produces a list of steps; knows nothing about the DOM.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.DAA = root.DAA || {})['merge-sort'] = factory();
})(this, function () {
  const pseudocode = [
    'MERGE_SORT(A, lo, hi)',
    '  if lo < hi',
    '    mid = floor((lo + hi) / 2)',
    '    MERGE_SORT(A, lo, mid)',
    '    MERGE_SORT(A, mid + 1, hi)',
    '    MERGE(A, lo, mid, hi)',
    'MERGE(A, lo, mid, hi)',
    '  L = A[lo..mid]; R = A[mid+1..hi]; i = j = 0; k = lo',
    '  while i < |L| and j < |R|',
    '    compare L[i] with R[j]',
    '    copy the smaller one into A[k]; k++',
    '  copy the remaining elements of L or R into A'
  ];
  const statLabels = { comparisons: 'Comparisons', writes: 'Array writes', calls: 'Recursive calls', maxDepth: 'Max depth' };

  function generate(input) {
    const a = input.slice(), steps = [];
    const st = { comparisons: 0, writes: 0, calls: 0, maxDepth: 0 };
    const push = (type, message, codeLine, mark = {}, range = null, aux = null) =>
      steps.push({ step: steps.length, type, message, codeLine,
        snap: { arr: a.slice(), mark, range, aux: aux && JSON.parse(JSON.stringify(aux)) }, stats: { ...st } });

    function sort(lo, hi, depth) {
      st.calls++; st.maxDepth = Math.max(st.maxDepth, depth);
      if (lo >= hi) { push('base', `A[${lo}] is a single element: already sorted`, 2, { [lo]: 'active' }, [lo, hi]); return; }
      const mid = (lo + hi) >> 1;
      push('divide', `Split A[${lo}..${hi}] at mid = ${mid} (depth ${depth})`, 3, {}, [lo, hi]);
      sort(lo, mid, depth + 1);
      sort(mid + 1, hi, depth + 1);
      merge(lo, mid, hi);
    }

    function merge(lo, mid, hi) {
      const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      const aux = () => ({ L, R, i, j, cmp: false });
      push('merge', `Merge sorted halves [${L}] and [${R}]`, 8, {}, [lo, hi], aux());
      while (i < L.length && j < R.length) {
        st.comparisons++;
        push('compare', `Compare L[${i}] = ${L[i]} with R[${j}] = ${R[j]}`, 10, {}, [lo, hi], { ...aux(), cmp: true });
        const takeLeft = L[i] <= R[j]; // <= keeps the sort stable
        a[k] = takeLeft ? L[i++] : R[j++]; st.writes++;
        push('write', `${a[k]} is smaller${takeLeft ? ' or equal' : ''}: write it to A[${k}]`, 11, { [k]: 'active' }, [lo, hi], aux());
        k++;
      }
      while (i < L.length || j < R.length) {
        a[k] = i < L.length ? L[i++] : R[j++]; st.writes++;
        push('copy', `Copy leftover ${a[k]} to A[${k}]`, 12, { [k]: 'active' }, [lo, hi], aux());
        k++;
      }
    }

    push('start', 'Initial array', 1);
    sort(0, a.length - 1, 0);
    const mark = {}; a.forEach((_, i) => (mark[i] = 'sorted'));
    push('done', 'Array is sorted', 1, mark);
    return steps;
  }
  return { generate, pseudocode, statLabels, options: [] };
});
