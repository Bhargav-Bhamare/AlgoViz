// Renders one step snapshot. Pure view code.
window.Viz = (function () {
  const GLYPH = { compare: '≟', pivot: '★', swap: '⇄', sorted: '✓', active: '▸' };
  const card = (v, cls) => `<span class="cell ${cls}">${v}</span>`;
  function auxRow(name, list, p, cmp) {
    return `<div class="aux"><b>${name}</b>` + list.map((v, k) =>
      card(v, k < p ? 'taken' : k === p ? (cmp ? 'cur cmp' : 'cur') : '')).join('') + '</div>';
  }
  function render(el, s) {
    const { arr, mark, range, aux } = s.snap, max = Math.max(...arr, 1);
    el.innerHTML = '<div class="bars">' + arr.map((v, i) => {
      const m = mark[i] || '', dim = range && (i < range[0] || i > range[1]);
      return `<div class="col${dim ? ' dim' : ''}"><span class="v">${v}</span>` +
        `<div class="b" data-s="${m}" style="height:${Math.max(4, (v / max) * 100)}%"></div>` +
        `<span class="g" aria-hidden="true">${GLYPH[m] || ''}</span><span class="ix">${i}</span></div>`;
    }).join('') + '</div>' + (aux ? auxRow('L', aux.L, aux.i, aux.cmp) + auxRow('R', aux.R, aux.j, aux.cmp) : '');
  }
  return { render };
})();
