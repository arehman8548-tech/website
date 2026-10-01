/**
 * Hero bootstrap. The page is fully usable before (and without) this runs:
 * headline, copy and CTAs are server-rendered HTML. Three.js is loaded lazily,
 * after first paint, and only when WebGL is available.
 */
const CHAPTERS: [number, number][] = [
  [-1, 0.12], // hero copy
  [0.15, 0.34],
  [0.4, 0.6],
  [0.66, 0.86],
  [0.9, 2],
];

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function initHero() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const canvas = hero.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const chaps = [...hero.querySelectorAll<HTMLElement>('[data-chap]')];
  const bar = hero.querySelector<HTMLElement>('[data-bar]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 860px)').matches;
  const gl = hasWebGL();
  const root = document.documentElement;

  if (reduced || !gl) root.classList.add('hero-static');

  const progress = () => {
    const r = hero.getBoundingClientRect();
    const span = hero.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };

  let active = 0;
  const setChapter = (p: number) => {
    let next = 0;
    CHAPTERS.forEach(([a, b], i) => {
      if (p >= a && p < b) next = i;
    });
    if (p >= CHAPTERS[CHAPTERS.length - 1][0]) next = CHAPTERS.length - 1;
    // keep the previous chapter during gaps so text never flickers
    const inGap = !CHAPTERS.some(([a, b]) => p >= a && p < b);
    if (inGap) return;
    if (next !== active) {
      chaps[active]?.classList.remove('is-on');
      chaps[next]?.classList.add('is-on');
      active = next;
    }
  };

  let scene: import('./backhoe/scene').HeroScene | null = null;
  const onScroll = () => {
    if (root.classList.contains('hero-static')) return;
    const p = progress();
    setChapter(p);
    if (bar) bar.style.transform = `scaleX(${p})`;
    scene?.setProgress(p);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!gl) return;

  const load = async () => {
    try {
      const { createScene } = await import('./backhoe/scene');
      scene = await createScene(canvas, { mobile, reduced });
    } catch {
      // WebGL context could not be created after all: fall back to the static layout.
      root.classList.add('hero-static');
      return;
    }
    const hud = {
      x: hero.querySelector('[data-r="x"]'),
      boom: hero.querySelector('[data-r="boom"]'),
      dipper: hero.querySelector('[data-r="dipper"]'),
      stab: hero.querySelector('[data-r="stab"]'),
    };
    let lastHud = 0;
    if (!mobile) {
      scene.onFrame = (_p, pose) => {
        const now = performance.now();
        if (now - lastHud < 90) return;
        lastHud = now;
        const deg = (r: number) => `${((r * 180) / Math.PI).toFixed(1)}°`;
        if (hud.x) hud.x.textContent = `${pose.x.toFixed(1)} m`;
        if (hud.boom) hud.boom.textContent = deg(pose.boom);
        if (hud.dipper) hud.dipper.textContent = deg(pose.dipper);
        if (hud.stab) hud.stab.textContent = pose.stab < 0.02 ? 'Stowed' : pose.stab > 0.98 ? 'Deployed' : 'Lowering';
      };
    }
    scene.setProgress(reduced ? 0 : progress());
    addEventListener('resize', () => scene?.resize(), { passive: true });

    // Only render while the hero is on screen and the tab is visible.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? scene?.start() : scene?.stop()));
    io.observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? scene?.stop() : scene?.start()));
    requestAnimationFrame(() => root.classList.add('hero-ready'));
  };

  const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 1200 }) : setTimeout(cb, 200));
  if (document.readyState === 'complete') idle(load);
  else addEventListener('load', () => idle(load), { once: true });
}
