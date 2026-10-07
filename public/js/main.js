(function () {
  const $ = s => document.querySelector(s);
  const engine = window.DAA[window.ALGO.slug];
  let seed = Date.now() % 100000;

  function rng(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // Array-based sorting engines don't declare their own inputs, so they get these defaults.
  const sortArr = a => ({ input: a.join(', ') });
  const sorting = {
    fields: [{ id: 'input', label: 'Array (integers 0–999, 2–20 values)', def: '38, 27, 43, 3, 9, 82, 10' }],
    parseInput(v) {
      const parts = v.input.split(/[\s,]+/).filter(Boolean), nums = parts.map(Number);
      if (parts.length < 2 || parts.length > 20) throw new Error('Enter between 2 and 20 numbers, separated by commas.');
      if (nums.some(n => !Number.isInteger(n) || n < 0 || n > 999)) throw new Error('Use whole numbers from 0 to 999 only.');
      return nums;
    },
    random: r => sortArr(Array.from({ length: 8 }, () => Math.floor(r() * 90) + 10)),
    presets: {
      'Already sorted': () => sortArr([3, 8, 12, 19, 25, 31, 47, 60]), 'Reverse sorted': () => sortArr([60, 47, 31, 25, 19, 12, 8, 3]),
      'Duplicates': () => sortArr([5, 2, 8, 2, 5, 8, 2, 5]), 'All equal': () => sortArr([7, 7, 7, 7, 7, 7])
    }
  };
  const E = Object.assign({}, engine.fields ? {} : sorting, engine);
  const attr = s => String(s).replace(/"/g, '&quot;');

  $('#fields').innerHTML = E.fields.map(f => `<label>${f.label}<input type="text" id="f-${f.id}" value="${attr(f.def)}"></label>`).join('');
  $('#opts').innerHTML = E.options.map(o => `<label>${o.label}<select id="opt-${o.id}">` + o.values.map(([v, l]) => `<option value="${v}">${l}</option>`).join('') + '</select></label>').join('');
  const presetNames = Object.keys(E.presets || {});
  $('#preset').innerHTML = '<option value="">Custom</option>' + presetNames.map(p => `<option>${p}</option>`).join('');
  $('#preset-wrap').hidden = !presetNames.length;
  $('#code').innerHTML = E.pseudocode.map((t, i) => `<li data-line="${i + 1}"><pre>${t.replace(/</g, '&lt;')}</pre></li>`).join('');
  if (engine.render) $('.legend').hidden = true;

  const setValues = o => Object.entries(o).forEach(([k, v]) => { $('#f-' + k).value = v; });
  const getValues = () => Object.fromEntries(E.fields.map(f => [f.id, $('#f-' + f.id).value]));

  const player = Player(
    (s, i, total) => {
      if (engine.render) $('#viz').innerHTML = engine.render(s.snap); else Viz.render($('#viz'), s);
      $('#msg').textContent = `Step ${i + 1} of ${total}: ${s.message}`;
      $('#stats').innerHTML = Object.entries(E.statLabels).map(([k, l]) => `<div><dt>${l}</dt><dd>${s.stats[k]}</dd></div>`).join('');
      document.querySelectorAll('#code li').forEach(li => li.classList.toggle('on', +li.dataset.line === s.codeLine));
      $('#timeline').max = total - 1; $('#timeline').value = i;
      const cur = $('#viz .cur'); if (cur && cur.closest('.tree')) cur.scrollIntoView({ block: 'nearest' });
    },
    playing => { $('#b-play').textContent = playing ? '❚❚ Pause' : '▶ Play'; }
  );

  function generate() {
    try {
      $('#err').textContent = '';
      const opts = { seed };
      E.options.forEach(o => (opts[o.id] = $('#opt-' + o.id).value));
      player.load(E.generate(E.parseInput(getValues()), opts));
    } catch (e) { $('#err').textContent = e.message; }
  }

  $('#btn-gen').onclick = generate;
  $('#btn-random').onclick = () => { setValues(E.random(rng(seed++))); $('#preset').value = ''; generate(); };
  $('#preset').onchange = e => { if (E.presets[e.target.value]) { setValues(E.presets[e.target.value]()); generate(); } };
  $('#fields').addEventListener('keydown', e => { if (e.key === 'Enter') generate(); });
  $('#opts').addEventListener('change', generate);
  $('#b-first').onclick = () => player.reset();
  $('#b-prev').onclick = () => { player.pause(); player.prev(); };
  $('#b-next').onclick = () => { player.pause(); player.next(); };
  $('#b-play').onclick = () => player.toggle();
  $('#speed').onchange = e => player.setSpeed(+e.target.value);
  $('#timeline').oninput = e => { player.pause(); player.goto(+e.target.value); };
  document.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { player.pause(); player.next(); }
    else if (e.key === 'ArrowLeft') { player.pause(); player.prev(); }
    else if (e.key === ' ') { e.preventDefault(); player.toggle(); }
  });
  generate();
})();
