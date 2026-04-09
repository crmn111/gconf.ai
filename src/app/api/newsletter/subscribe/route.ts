import { NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/newsletter/subscribe
 *
 * Matches the convention used by other projects that connect to api.gconf.ai
 * (chm-website, ep-deaisummit2026): a single form with the slug `newsletter`.
 * The server fetches the form schema at runtime and auto-maps the email into
 * whichever field is flagged as the email field, so the route keeps working
 * even if the form is reshaped in the CMS.
 */

const FORM_SLUG = 'newsletter';

// Tiny in-memory cache: avoid an extra round-trip per submit.
interface CachedForm { fieldName: string; cachedAt: number; }
const formCache = new Map<string, CachedForm>();
const FORM_CACHE_TTL_MS = 60_000;

interface FormField {
  name?: string;
  field_name?: string;
  type?: string;
  field_type?: string;
  label?: string;
  field_label?: string;
}

function pickEmailField(fields: FormField[]): string | null {
  if (!Array.isArray(fields) || fields.length === 0) return null;
  const getName = (f: FormField) => f.name || f.field_name || '';
  const getType = (f: FormField) => (f.type || f.field_type || '').toLowerCase();
  const getLabel = (f: FormField) => (f.label || f.field_label || '').toLowerCase();

  const byType = fields.find(f => getType(f) === 'email');
  if (byType && getName(byType)) return getName(byType);

  const byName = fields.find(f => /email/i.test(getName(f)));
  if (byName) return getName(byName);

  const byLabel = fields.find(f => /email/.test(getLabel(f)));
  if (byLabel && getName(byLabel)) return getName(byLabel);

  // Last resort: first field (matches chm-website's hardcoded `field_1`)
  const first = fields[0];
  return first ? getName(first) || null : null;
}

async function resolveEmailFieldName(apiUrl: string, apiKey: string): Promise<string | null> {
  const now = Date.now();
  const cached = formCache.get(FORM_SLUG);
  if (cached && now - cached.cachedAt < FORM_CACHE_TTL_MS) return cached.fieldName;

  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/forms/${FORM_SLUG}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('[newsletter] form schema fetch failed', res.status);
    return null;
  }
  const json = await res.json().catch(() => ({}));
  const form = json?.data || json?.form || json;
  const fields = form?.form_fields || form?.fields || [];
  const fieldName = pickEmailField(fields);
  if (fieldName) formCache.set(FORM_SLUG, { fieldName, cachedAt: now });
  return fieldName;
}

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const email = String(body.email || '').trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_GCONF_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_GCONF_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error('[newsletter] NEXT_PUBLIC_GCONF_API_URL or NEXT_PUBLIC_GCONF_API_KEY not set');
    return NextResponse.json(
      { success: false, error: 'Server not configured' },
      { status: 500 },
    );
  }

  let fieldName: string | null;
  try {
    fieldName = await resolveEmailFieldName(apiUrl, apiKey);
  } catch (err) {
    console.error('[newsletter] form schema lookup failed:', err);
    fieldName = null;
  }
  // Fallback: the CMS default first-field name, matching other projects.
  if (!fieldName) fieldName = 'field_1';

  try {
    const upstream = await fetch(
      `${apiUrl.replace(/\/$/, '')}/forms/${FORM_SLUG}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          submission_data: { [fieldName]: email },
        }),
        cache: 'no-store',
      },
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error('[newsletter] upstream error', upstream.status, data);
      return NextResponse.json(
        {
          success: false,
          error: data?.error || data?.message || `Upstream error (${upstream.status})`,
        },
        { status: upstream.status },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[newsletter] upstream failed:', err);
    return NextResponse.json(
      { success: false, error: 'Upstream request failed' },
      { status: 502 },
    );
  }
}
