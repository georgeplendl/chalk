# Chalk

Draw on any webpage. See what others left behind.

Chalk is a Chrome extension that lets you annotate the web with freehand drawings and text. Annotations are shared — anyone with Chalk installed sees what you draw on the same URL.

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
npm run zip            # outputs to .output/chalk-extension-x.x.x-chrome.zip
```

Copy the zip to `extension/releases/` and bump the version in `package.json` and `wxt.config.ts` before each release.

## Status

Early alpha — shared with a small group of testers.
