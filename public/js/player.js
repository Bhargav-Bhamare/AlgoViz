// Generic step controller: knows nothing about any algorithm.
window.Player = function (onRender, onPlayState) {
  let steps = [], idx = 0, timer = null, speed = 1;
  const BASE_MS = 700;
  const draw = () => steps.length && onRender(steps[idx], idx, steps.length);
  const api = {
    load(s) { api.pause(); steps = s; idx = 0; draw(); },
    get length() { return steps.length; },
    next() { if (idx < steps.length - 1) { idx++; draw(); } else api.pause(); },
    prev() { if (idx > 0) { idx--; draw(); } },
    goto(i) { idx = Math.max(0, Math.min(steps.length - 1, i)); draw(); },
    reset() { api.pause(); api.goto(0); },
    play() {
      if (!steps.length) return;
      if (idx >= steps.length - 1) idx = 0;
      api.pause(); onPlayState(true);
      timer = setInterval(api.next, BASE_MS / speed);
    },
    pause() { clearInterval(timer); timer = null; onPlayState(false); },
    toggle() { timer ? api.pause() : api.play(); },
    setSpeed(x) { speed = x; if (timer) api.play(); }
  };
  return api;
};
