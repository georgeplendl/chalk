![Chalk — Draw on any webpage. See what others left behind.](Assets/chalk-graphic.png)

# Chalk

Chalk is a Chrome extension that layers a shared drawing canvas over any website. Leave freehand strokes, text, and color on top of any page — and see what others have left behind on the same URL.

## How it works

1. Install Chalk and visit any webpage
2. Click the Chalk icon in your toolbar to activate the overlay
3. Pick a color and brush size, then draw directly on the page
4. Close Chalk — your marks are saved
5. Anyone else with Chalk installed will see what you drew when they visit the same URL

## Features

**Drawing**
- Freehand brush with three sizes (Small, Medium, Large)
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
- Everything saved by canonical URL — collaborative across all users
- Anonymous by default, no account required

**UX**
- Toolbar animates in from the bottom on open; fades out on close
- Annotations stagger fade-in on load; fade out smoothly on close
- Escape deactivates your tool without closing the overlay so you can scroll freely

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
