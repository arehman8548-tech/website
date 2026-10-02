/**
 * Scroll-stage runtime shared by every page scene.
 *
 * Markup contract (see ScrollStage.astro):
 *   [data-stage="<scene>"]           root; data-mode="pin" (default) | "track"
 *     [data-stage-canvas]            the WebGL canvas
 *     [data-chap][data-a][data-b]    chapter overlays, active while a <= p < b
 *     [data-stage-bar]               progress bar (scaleX = p)
 *     [data-hud="key"]               values the scene reports via hud(p)
 *     [data-track]                   (track mode) blocks whose scroll position drives p
 *
 * The page is complete without this: content is server-rendered HTML and the
 * static layout (realistic stills + text) is the fallback for reduced motion,
 * no WebGL, or a failed load. Three.js and each scene load lazily, only when
 * the stage approaches the viewport, and render only while it is visible.
 */
import type { Ctx } from '../three/kit';

export interface StageCtx extends Ctx { root: HTMLElement; lite: boolean }
export interface StageScene {
  /** Draw the frame for progress p. Return true to keep animating while p is still (ambient motion). */
  render(p: number, dt: number, now: number): boolean | void;
  resize(w: number, h: number): void;
  hud?(p: number): Record<string, string>;
  dispose(): void;
}
export type Factory = (canvas: HTMLCanvasElement, ctx: StageCtx) => Promise<StageScene>;

const registry: Record<string, () => Promise<{ create: Factory }>> = {
  machine: () => import('../scenes/machine'),
  projects: () => import('../scenes/projects'),
  kumaon: () => import('../scenes/kumaon'),
  yard: () => import('../scenes/yard'),
  journey: () => import('../scenes/journey'),
  knowledge: () => import('../scenes/knowledge'),
};

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const q = new URLSearchParams(location.search);
const forced = q.has('stagep') ? Number(q.get('stagep')) : null; // debug / still capture
const instant = q.has('instant') || forced !== null;
const capture = q.has('capture');
if (q.has('capture')) document.documentElement.classList.add('capture');

export function initStages() {
  const stages = [...document.querySelectorAll<HTMLElement>('[data-stage]')];
  if (!stages.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = !reduced && hasWebGL();
  for (const el of stages) initStage(el, gl, reduced);
}

function initStage(el: HTMLElement, gl: boolean, reduced: boolean) {
  const key = el.dataset.stage!;
  const mode = el.dataset.mode ?? 'pin';
  const canvas = el.querySelector<HTMLCanvasElement>('[data-stage-canvas]');
  const minWidth = Number(el.dataset.minWidth ?? 0);
  const goStatic = () => { el.classList.add('is-static'); el.classList.remove('is-live'); };
  if (!gl || !canvas || !registry[key] || innerWidth < minWidth) { goStatic(); return; }

  const mobile = matchMedia('(max-width: 860px)').matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lite = mobile || (navigator.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  const chaps = [...el.querySelectorAll<HTMLElement>('[data-chap]')].map((c) => ({ el: c, a: Number(c.dataset.a), b: Number(c.dataset.b) }));
  const bar = el.querySelector<HTMLElement>('[data-stage-bar]');
  const huds = [...el.querySelectorAll<HTMLElement>('[data-hud]')];
  const tracks = [...el.querySelectorAll<HTMLElement>('[data-track]')];

  const progress = () => {
    if (forced !== null) return forced;
    if (mode === 'track') {
      const mid = innerHeight * (mobile && el.dataset.midMobile ? Number(el.dataset.midMobile) : 0.5);
      const n = tracks.length;
      for (let i = 0; i < n; i++) {
        const r = tracks[i].getBoundingClientRect();
        if (mid < r.top) return i / n;
        if (mid < r.bottom) return (i + (mid - r.top) / r.height) / n;
      }
      return 1;
    }
    const r = el.getBoundingClientRect();
    const span = el.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };

  let active = -1;
  chaps.forEach((c) => c.el.classList.remove('is-on'));
  const setChapter = (p: number) => {
    const i = chaps.findIndex((c) => p >= c.a && p < c.b);
    const next = i < 0 ? (p >= 1 && chaps.length ? chaps.length - 1 : active) : i;
    if (next === active || next < 0) return;
    chaps[active]?.el.classList.remove('is-on');
    chaps[next]?.el.classList.add('is-on');
    active = next;
    el.dataset.chapter = String(next);
  };

  // Keyboard users: focusing a link inside a chapter scrolls the story to it.
  if (mode === 'pin') {
    chaps.forEach((c) => c.el.addEventListener('focusin', () => {
      if (c.el.classList.contains('is-on')) return;
      const span = el.offsetHeight - innerHeight;
      const top = el.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + span * ((c.a + c.b) / 2), behavior: 'instant' as ScrollBehavior });
    }));
  }

  let scene: StageScene | null = null;
  let target = progress(), current = target, last = performance.now(), raf = 0, visible = false, ambient = true, lastHud = 0;

  const onScroll = () => {
    target = progress();
    setChapter(target);
    if (bar) bar.style.transform = `scaleX(${target})`;
    el.dispatchEvent(new CustomEvent('stageprogress', { detail: target }));
    kick();
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function frame(now: number) {
    raf = 0;
    if (!scene || !visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const prev = current;
    current += (target - current) * (instant ? 1 : 1 - Math.exp(-dt * 5));
    if (Math.abs(target - current) < 1e-5) current = target;
    const moving = current !== prev;
    if (moving || ambient) ambient = scene.render(current, dt, now) === true;
    if (huds.length && scene.hud && now - lastHud > 80) {
      lastHud = now;
      const v = scene.hud(current);
      for (const h of huds) { const t = v[h.dataset.hud!]; if (t !== undefined && h.textContent !== t) h.textContent = t; }
    }
    if (moving || ambient) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && scene && visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  const ro = new ResizeObserver(() => { if (scene && canvas) { scene.resize(canvas.clientWidth, canvas.clientHeight); ambient = true; kick(); } });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; ambient = true; kick(); }).observe(el);
  document.addEventListener('visibilitychange', () => { ambient = true; kick(); });

  const load = async () => {
    try {
      const mod = await registry[key]();
      scene = await mod.create(canvas, { mobile, reduced, instant, lite, capture, root: el });
    } catch (err) {
      console.warn('[stage]', key, err);
      goStatic();
      return;
    }
    scene.resize(canvas.clientWidth, canvas.clientHeight);
    ro.observe(canvas);
    current = target = progress();
    scene.render(current, 0, performance.now());
    requestAnimationFrame(() => el.classList.add('is-live'));
    ambient = true;
    kick();
  };
  // Load when the stage comes within a viewport of the screen, in idle time.
  const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 120));
  const near = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    near.disconnect();
    if (document.readyState === 'complete') idle(load);
    else addEventListener('load', () => idle(load), { once: true });
  }, { rootMargin: '100% 0px' });
  near.observe(el);
}
