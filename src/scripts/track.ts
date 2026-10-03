/**
 * Lightweight, first-party measurement (no third-party script).
 *
 * - Every phone, WhatsApp, email and enquiry-CTA click becomes a named event.
 * - Events go to window.dataLayer (ready for GTM / GA4 if one is ever added) and to
 *   /api/event on this site's own Worker, which writes them to Workers Logs.
 * - Attribution (landing page, referrer host, UTM source/medium/campaign) is kept in
 *   the browser only and attached to events and to the enquiry form.
 *
 * Never put customer details (name, phone, email, message) into an event.
 */
import { site } from '../data/site';

type Params = Record<string, string | undefined>;
declare global { interface Window { dataLayer?: unknown[]; rbeTrack?: (event: string, p?: Params) => void; rbeAttribution?: () => Params } }

const FIRST = 'rbe_first_touch';
const SESSION = 'rbe_session_touch';
const LAST_PAGE = 'rbe_last_page';
const digits = (s: string) => s.replace(/\D/g, '');
const SALES = digits(site.phoneE164);
const SITE_COORD = digits(site.phone2E164);

const store = (s: Storage | undefined, k: string, v?: string) => {
  try { if (!s) return null; if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch { /* storage blocked */ }
  return null;
};
const ls = (() => { try { return window.localStorage; } catch { return undefined; } })();
const ss = (() => { try { return window.sessionStorage; } catch { return undefined; } })();

function touch(): Params {
  const q = new URLSearchParams(location.search);
  let ref = '';
  try { if (document.referrer) { const r = new URL(document.referrer); if (r.host !== location.host) ref = r.host; } } catch { /* ignore */ }
  return {
    landing_page: location.pathname,
    referrer: ref || '(direct)',
    utm_source: q.get('utm_source')?.slice(0, 100) || undefined,
    utm_medium: q.get('utm_medium')?.slice(0, 100) || undefined,
    utm_campaign: q.get('utm_campaign')?.slice(0, 150) || undefined,
  };
}

// First touch (kept 90 days) and this visit's touch. A new UTM-tagged arrival starts a new visit touch.
const now = touch();
const hasUtm = !!now.utm_source;
let session: Params | null = null;
try { session = JSON.parse(store(ss, SESSION) || 'null'); } catch { session = null; }
if (!session || hasUtm) { session = now; store(ss, SESSION, JSON.stringify(session)); }
let first: (Params & { t?: string }) | null = null;
try { first = JSON.parse(store(ls, FIRST) || 'null'); } catch { first = null; }
if (!first || Date.now() - Number(first.t || 0) > 90 * 864e5) {
  first = { ...now, t: String(Date.now()) };
  store(ls, FIRST, JSON.stringify(first));
}

const fromPath = store(ss, LAST_PAGE) || undefined;
store(ss, LAST_PAGE, location.pathname);

const body = document.body.dataset;
export function attribution(): Params {
  return {
    page_path: location.pathname,
    from_path: fromPath,
    landing_page: session?.landing_page,
    first_landing_page: first?.landing_page,
    referrer: session?.referrer,
    utm_source: session?.utm_source,
    utm_medium: session?.utm_medium,
    utm_campaign: session?.utm_campaign,
    intent: body.intent || undefined,
    location_ctx: body.loc || undefined,
    equipment_ctx: body.equipment || undefined,
  };
}

export function track(event: string, p: Params = {}) {
  const payload: Params = { ...attribution(), ...p };
  for (const k of Object.keys(payload)) if (!payload[k]) delete payload[k];
  try { (window.dataLayer = window.dataLayer || []).push({ event, ...payload }); } catch { /* ignore */ }
  try {
    const data = JSON.stringify({ event, ...payload });
    if (!navigator.sendBeacon?.('/api/event', new Blob([data], { type: 'application/json' }))) {
      fetch('/api/event', { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch { /* measurement must never break the page */ }
}

/** Where on the page a link sits: an explicit data-place, else the nearest landmark/section. */
function placement(el: Element): string {
  const tagged = el.closest<HTMLElement>('[data-place]');
  if (tagged) return tagged.dataset.place!;
  const sel = 'header, footer, nav, form, section, article, aside';
  const land = el.closest(sel);
  if (!land) return 'page';
  // Prefer the nearest landmark that has an id (e.g. "procurement", "town-rudrapur"), else the nearest one's name.
  for (let n: Element | null = land; n; n = n.parentElement?.closest(sel) ?? null) if (n.id) return n.id.slice(0, 60);
  return (land.getAttribute('aria-label') || land.className.toString().split(' ')[0] || land.tagName.toLowerCase()).slice(0, 60);
}
const label = (a: HTMLElement) => (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);

document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute('href') || '';
  const p = { placement: placement(a), label: label(a) };
  if (href.startsWith('tel:')) {
    const d = digits(href);
    track(d.endsWith(SITE_COORD) ? 'phone_click_site_coordination' : 'phone_click_sales', { ...p, target: d.endsWith(SALES) || d.endsWith(SITE_COORD) ? undefined : 'other_number' });
  } else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) {
    track('whatsapp_click', p);
  } else if (href.startsWith('mailto:')) {
    if (!a.hasAttribute('data-mail')) track('email_click', p);
  } else if (/^\/contact\/(\?|#|$)/.test(href)) {
    track('cta_click', { ...p, target: href });
  }
}, { capture: true });

window.rbeTrack = track;
window.rbeAttribution = attribution;
