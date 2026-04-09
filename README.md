# ep-gconf.ai (Next.js)

Next.js App Router rewrite of the original static `gconf.ai` landing page. The canvas grid, animated rings, typewriter tagline, sound toggle, and glitch line all work the same way. The newsletter form now submits to the platform API (`api.gconf.ai`).

## Setup

```bash
cp .env.example .env.local
# Fill in GCONF_API_URL and GCONF_API_KEY
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Name | Where | Description |
|---|---|---|
| `GCONF_API_URL` | server | Base URL of the ep-api instance (e.g. `https://api.gconf.ai`) |
| `GCONF_API_KEY` | server | Tenant API key. Get it from ep-dashboard → Platform → Tenants → view tenant → API Key card. |

Both live on the server (not `NEXT_PUBLIC_*`). The browser posts to `/api/newsletter/subscribe`, which runs server-side, attaches the Bearer token, and forwards to `${GCONF_API_URL}/newsletter/subscribe`.

## Structure

```
src/
├── app/
│   ├── layout.tsx            # loads JetBrains Mono + Inter via next/font
│   ├── page.tsx              # composes the landing
│   ├── globals.css           # ported styles from the original
│   └── api/newsletter/subscribe/route.ts   # server forwarder
└── components/
    ├── CanvasGrid.tsx        # canvas animation (ignite / burst / shimmer / mouse glow)
    ├── Typewriter.tsx        # tagline typewriter
    ├── SoundToggle.tsx       # mute/unmute button
    ├── GlitchLine.tsx        # horizontal glitch line
    ├── NewsletterForm.tsx    # the email form
    └── soundBus.ts           # shared AudioContext + enabled flag
```
