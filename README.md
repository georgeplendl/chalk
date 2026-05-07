# Chalk

Draw on any webpage. See what others left behind.

Chalk is a Chrome extension that layers a shared drawing canvas over any website. Freehand strokes, text annotations, and color — all stored by URL and visible to anyone else running Chalk.

## Features

**Drawing**
- Freehand brush with three brush sizes (Small, Medium, Large)
- 6-color palette — black, red, green, blue, orange, white
- Text tool — click anywhere on the page to place and type

**Keyboard shortcuts**
| Key | Action |
|-----|--------|
| `P` | Paintbrush |
| `T` | Text tool |
| `Esc` | Deactivate current tool (restores page scroll) |
| `1` – `6` | Select color swatch |

**Shared annotations**
- Everything saved to Supabase by canonical URL
- Anyone with Chalk installed sees what you draw on the same page
- Anonymous by default — no account required

**UX**
- Toolbar animates in from the bottom on open; fades out on close
- Annotations stagger fade-in on load; fade out smoothly on close
- Re-opening Chalk fades annotations back in
- Escape deactivates your tool without closing the overlay, so you can scroll freely then re-enable drawing

## Install (for testers)

See [INSTRUCTIONS.md](INSTRUCTIONS.md) for the full step-by-step guide.

The latest build is in [`extension/releases/`](extension/releases/).

## Stack

- [WXT](https://wxt.dev) — Chrome extension framework (Manifest V3)
- [Fabric.js](http://fabricjs.com) — Canvas drawing
- [Supabase](https://supabase.com) — Shared annotation storage

## Dev setup

```bash
cd extension
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev            # hot-reloads in Chrome
```

Load the extension in Chrome: `chrome://extensions` → Enable Developer mode → Load unpacked → select `.output/chrome-mv3/`.

## Release

```bash
# 1. Bump version in extension/package.json and extension/wxt.config.ts
# 2. Build and zip
npm run zip
# 3. Copy to releases/
cp .output/chalk-extension-x.x.x-chrome.zip releases/
```

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Status

Early alpha — v0.1.22, shared with a small group of testers.
