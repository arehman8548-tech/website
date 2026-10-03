/**
 * RBE Capital Equip. — Cloudflare Worker.
 *
 * The site is static (Astro → dist/), served by Workers static assets. This Worker
 * only runs for /api/* (see `run_worker_first` in wrangler.jsonc); every other
 * request goes straight to the assets, exactly as before.
 *
 *   POST /api/enquiry  website enquiry form → Resend → sales@rbecapitalgroup.in
 *                      (Cloudflare Email Routing then forwards sales@ as configured).
 *   POST /api/event    first-party, PII-free analytics events → Workers Logs.
 *
 * Secrets: RESEND_API_KEY is a Worker secret (`wrangler secret put RESEND_API_KEY`
 * or the dashboard). It is never logged, returned or sent anywhere except Resend.
 */

const ENQUIRY_TO = 'sales@rbecapitalgroup.in';
const DEFAULT_FROM = 'RBE Capital Equip. Website <website@rbecapitalgroup.in>';
const MAX_BODY = 16 * 1024;

// Form fields accepted from the browser, with a length cap each. Anything else is ignored.
const FIELDS = {
  name: 120, company: 160, phone: 20, email: 160, location: 240, type: 120, equipment: 120,
  duration: 80, start: 20, gst: 60, role: 80, details: 3000,
};
const FIELD_LABELS = {
  name: 'Name', company: 'Company', phone: 'Phone / WhatsApp', email: 'Email', location: 'Project location',
  type: 'Project type', equipment: 'Equipment', duration: 'Rental duration', start: 'Expected start',
  gst: 'GST invoice', role: 'Role', details: 'Additional details',
};
// Non-sensitive attribution sent with the form (no PII).
const ATTR = {
  page_path: 200, from_path: 200, landing_page: 200, first_landing_page: 200, referrer: 120,
  utm_source: 100, utm_medium: 100, utm_campaign: 150, intent: 60, location_ctx: 60, equipment_ctx: 60,
};

const EVENTS = new Set([
  'phone_click_sales', 'phone_click_site_coordination', 'whatsapp_click', 'email_click', 'cta_click',
  'form_start', 'form_submit', 'form_success', 'form_error', 'form_validation_error',
  'form_whatsapp_followup', 'form_whatsapp_fallback', 'form_email_fallback', 'page_view',
]);
const EVENT_PARAMS = { ...ATTR, placement: 60, label: 80, enquiry_ref: 24, reason: 40, target: 200 };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/enquiry' || url.pathname === '/api/enquiry/') return enquiry(request, env, url);
    if (url.pathname === '/api/event' || url.pathname === '/api/event/') return event(request, url);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

/** Same-origin check: the form and the beacon are only ever sent from this site. */
function sameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  if (origin) return origin === url.origin;
  const site = request.headers.get('Sec-Fetch-Site');
  return !site || site === 'same-origin';
}

async function readBody(request) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  const type = request.headers.get('Content-Type') || '';
  if (type.includes('application/json') || text.startsWith('{')) {
    try { const o = JSON.parse(text); return o && typeof o === 'object' ? o : null; } catch { return null; }
  }
  return Object.fromEntries(new URLSearchParams(text));
}

function clean(v, max) {
  return String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}
function pick(obj, spec) {
  const out = {};
  for (const [k, max] of Object.entries(spec)) {
    const v = clean(obj[k], max);
    if (v) out[k] = v;
  }
  return out;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function reference() {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return `RBE-${ymd}-${[...bytes].map((b) => alphabet[b % alphabet.length]).join('')}`;
}

async function enquiry(request, env, url) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'forbidden' }, 403);

  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'invalid_request' }, 400);

  // Honeypot: real visitors never see or fill this field. Pretend success so bots learn nothing.
  if (clean(body.website, 200)) return json({ ok: true, ref: reference() });

  const f = pick(body, FIELDS);
  const attr = pick(body, ATTR);
  const phoneDigits = (f.phone || '').replace(/\D/g, '');
  const invalid = [];
  if (!f.name) invalid.push('name');
  if (phoneDigits.length < 10 || phoneDigits.length > 13) invalid.push('phone');
  if (!f.location) invalid.push('location');
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) invalid.push('email');
  if (invalid.length) return json({ ok: false, error: 'validation', fields: invalid }, 422);

  const ref = reference();
  if (!env.RESEND_API_KEY) {
    console.log(JSON.stringify({ kind: 'enquiry', ref, status: 'not_configured' }));
    return json({ ok: false, error: 'unavailable' }, 503);
  }

  const subject = `Website enquiry ${ref} — ${f.type || 'Backhoe loader rental'} — ${f.location}`.slice(0, 200);
  const rows = Object.entries(FIELD_LABELS).filter(([k]) => f[k]).map(([k, label]) => [label, f[k]]);
  const attrRows = [
    ['Enquiry sent from', attr.page_path], ['Previous page', attr.from_path], ['Landing page (this visit)', attr.landing_page],
    ['First landing page', attr.first_landing_page], ['Referrer', attr.referrer], ['UTM source', attr.utm_source],
    ['UTM medium', attr.utm_medium], ['UTM campaign', attr.utm_campaign], ['Page intent', attr.intent],
    ['Page location', attr.location_ctx], ['Page equipment', attr.equipment_ctx],
  ].filter(([, v]) => v);

  const text = [
    `Website enquiry — reference ${ref}`, '',
    ...rows.map(([k, v]) => `${k}: ${v}`), '',
    'Attribution', ...attrRows.map(([k, v]) => `${k}: ${v}`), '',
    `Reply to the customer on the phone number above${f.email ? ' or by email' : ''}.`,
  ].join('\n');
  const tr = ([k, v]) => `<tr><th align="left" style="padding:6px 16px 6px 0;vertical-align:top;font-weight:600;white-space:nowrap">${esc(k)}</th><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#14171a">
<p style="font-size:16px;margin:0 0 12px"><strong>Website enquiry — ${esc(ref)}</strong></p>
<table cellspacing="0" cellpadding="0">${rows.map(tr).join('')}</table>
<p style="margin:20px 0 6px;color:#545b62;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Attribution</p>
<table cellspacing="0" cellpadding="0" style="color:#545b62;font-size:13px">${attrRows.map(tr).join('')}</table>
</div>`;

  const payload = {
    from: env.ENQUIRY_FROM || DEFAULT_FROM,
    to: [env.ENQUIRY_TO || ENQUIRY_TO],
    subject,
    text,
    html,
    ...(f.email ? { reply_to: f.email } : {}),
    tags: [{ name: 'source', value: 'website_enquiry' }],
  };

  let status = 0;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': ref },
      body: JSON.stringify(payload),
    });
    status = r.status;
    if (!r.ok) throw new Error('resend');
  } catch {
    // Log only the reference and HTTP status — never the key, the payload or customer details.
    console.log(JSON.stringify({ kind: 'enquiry', ref, status: 'send_failed', http: status }));
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  console.log(JSON.stringify({ kind: 'enquiry', ref, status: 'sent', page: attr.page_path || '', landing: attr.landing_page || '', utm_source: attr.utm_source || '', intent: attr.intent || '' }));
  return json({ ok: true, ref });
}

async function event(request, url) {
  if (request.method !== 'POST') return json({ ok: false }, 405);
  if (!sameOrigin(request, url)) return new Response(null, { status: 204 });
  const body = await readBody(request);
  const name = body && clean(body.event, 40);
  if (name && EVENTS.has(name)) {
    console.log(JSON.stringify({ kind: 'event', event: name, ...pick(body, EVENT_PARAMS) }));
  }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
