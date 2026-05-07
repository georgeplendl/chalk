# Chalk — Roadmap

## Status: v0 MVP complete

The core loop works: install → draw on a page → someone else installs → visits the same URL → sees the drawing.

---

## Up Next

### Notification badge
Show annotation count when visiting a page that's already been chalked.
- Badge on toolbar icon on page load
- In-page toast: *"This page has been chalked — X annotations"*
- Count is already tracked in the extension, just needs wiring

### Report button
Flag an annotation for review. Backend schema and helper already exist, just needs a UI.

### Chrome Web Store submission
Move off manual zip sharing into real distribution. Biggest unlock for scale.

### Eraser tool
Remove strokes from the canvas. Low-effort addition to the toolbar.

---

## Post-MVP

### Social layer
- Upvote / downvote on any annotation
- Threaded replies on text annotations
- Downvote-to-collapse (community self-moderation)
- Sort by: Top, New, Controversial

### Additional drawing tools
- Basic shapes (arrow, circle, rectangle)
- Opacity slider

### DOM-anchored annotations
Text annotations that anchor to specific DOM elements rather than raw pixel coordinates — survives minor page reflows.

### Identity & accounts
- Optional username + persistent identity, no real name required
- Karma score and annotation history
- Verified account badge with boosted sort ranking
- Badges for milestones

### Rich annotation types
- Stickers / stamps (meme templates, speech bubbles, reaction images)
- Voice messages (recorded audio, max 60s, CDN-hosted)
- Image uploads pinned to the page
- Highlight + annotate — select text on a page and attach a comment

### Discovery & feeds
- Trending pages — most annotated URLs right now
- Hot annotations — top-voted individual annotations across the web
- Following — follow users or specific URLs
- Collections — curate annotated pages into shareable lists

### Real-time collaboration
- See other users' cursors and drawing strokes live on the same page
- Presence indicators ("3 people annotating this page now")

### Layers & filters
- Toggle annotation types on/off (drawings only, text only, voice only)
- Filter by time range, vote threshold, user type
- NSFW layer — off by default, opt-in toggle, age-gated

### Per-page communities
- Appointed moderators for heavily-annotated pages
- Page "founders" (first to chalk a page) get founding moderator status

### Advanced moderation
- Shadowbanning — bad actors see their own annotations, others don't
- Site opt-out registry for domain owners who want to be excluded

### Distribution resilience
Full four-channel strategy once store risk becomes real:

| Channel | Censor resistance |
|---|---|
| Chrome Web Store | Low |
| Firefox Add-ons | Low |
| Direct sideload (.crx) | Medium |
| Userscript (Tampermonkey / Greasy Fork) | High |

The userscript is the censorship fallback — if stores pull the extension, users install the userscript and the product keeps running.

### Sticker pack marketplace
- Creators publish free or paid sticker packs
- Platform takes 30% of paid pack revenue

### Site owner API (B2B)
Businesses pay to embed a managed, branded version of Chalk on their own domain.

---

## Monetization (post-traction)

- **Cosmetic upgrades** — special brush effects, extended fonts, custom palettes (Discord Nitro model)
- **Spray Can credits** — soft currency for boosting annotations, pinning, gifting
- **Sticker pack marketplace** — 30% platform cut on paid packs
- **Site owner API** — white-label B2B licensing
- **Anonymized trend data** — aggregated annotation activity sold to media/researchers
