# Chalk — Ideas

A holding area for ideas that aren't ready for the roadmap yet. Prune regularly — promote good ones to ROADMAP.md, kill the rest.

---

## Shareable chalk link

A web-based viewer so anyone can see a chalk annotation without installing the extension. User hits Share in the toolbar, gets a link like `chalk.gg/view?url=...&session=abc123`. Recipient opens it in any browser and sees the chalk rendered on top of a representation of the original page.

**Why it's interesting:** Strong viral loop — every share is an install prompt. Zero friction for the recipient.

**Open questions:**
- How do we show the underlying page? iframe (blocked by most sites), screenshot (costs infra), or plain background + URL context (ships fastest, always works)?
- Do we need a `shares` table, or can the URL + session token be passed as query params with no new DB?
- Where does the viewer live — separate domain (`chalk.gg`), GitHub Pages, Vercel?

---

## Live "watch me chalk" sessions

Real-time share where a recipient follows a link and sees your strokes appear as you draw them. Like a Figma multiplayer cursor but chaotic.

**Why it's interesting:** Extremely shareable moment — "come watch me draw on this Wikipedia page right now." Twitch-clip energy.

**Open questions:**
- Requires WebSockets or SSE — Supabase Realtime could handle this without new infra
- Does the viewer need the extension, or is a web viewer enough for watching?
- Async share (above) should probably ship first as a stepping stone
