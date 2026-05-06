# Product Requirements Document
## Tag — A Social Graffiti Layer for the Web

**Version:** 0.1 (Draft)
**Date:** 2026-05-06
**Status:** Discovery

---

## 1. Problem Statement

The web is a read-only experience for most users. People consume content on millions of websites with no native way to react to, annotate, or converse around the specific content they're looking at — without leaving the page and going to a separate platform. Forums, Discord servers, and subreddits all require context-switching. There is no persistent, shared social layer that lives *on top of* the web itself.

**Tag** puts that layer there.

---

## 2. Vision

A browser extension that overlays a collaborative, Reddit-style social canvas on any webpage. Users can draw, write, stamp, and leave voice messages directly on top of any site. Others visiting the same URL see those annotations and can upvote, downvote, and reply. The entire web becomes a wall to write on.

---

## 3. Target Users

**Primary:** Youth and youthful-minded internet users — 4channers, redditors, message board regulars, pranksters, free speech advocates, meme culture participants. People who want to have fun, react loudly, and leave their mark.

**Secondary:** Content annotators, critics, journalists, educators who want to comment *in context* on specific web content.

**User profile:**
- Values anonymity and low friction
- Accustomed to upvote/downvote culture
- Enjoys irreverent, playful humor
- Motivated by reach, reactions, and viral moments
- Resistant to paywalls and intrusive ads

---

## 4. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Users annotate pages after installing | % of installs that create at least 1 annotation within 7 days |
| Annotations generate engagement | Average replies + votes per annotation |
| Users return to tagged pages | DAU/MAU ratio; return visit rate |
| Organic viral growth | Extension installs from share links / referrals |
| Community health | Ratio of reported-to-removed content |

---

## 5. Core Features (MVP)

These are the minimum features required for a useful first release.

### 5.1 Browser Extension
- Chrome extension (first); Firefox and Edge later
- Injected overlay canvas that sits on top of any webpage
- Non-destructive — never modifies the actual site, only the user's local view
- Toggle on/off with a hotkey or toolbar button

### 5.2 Page Tagging Notification
- When a user navigates to a URL that has existing annotations, a badge or toast notification appears: *"This page has been tagged — X annotations"*
- User can click to reveal the annotation layer

### 5.3 Drawing Tools
- Freehand draw (brush tool with size + color controls)
- Text tool — type anywhere on the page
- Eraser
- Basic shapes (arrow, circle, rectangle)
- Default color palette + opacity slider

### 5.4 Annotation Anchoring
- Text block annotations anchor to specific DOM elements (a headline, image, paragraph) rather than raw pixel coordinates — so annotations survive minor page reflows
- Drawing annotations anchor to a best-effort coordinate region with a fallback to page-relative position

### 5.5 Social Layer
- **Upvote / downvote** on any annotation
- **Threaded replies** on text annotations (inline discussion)
- **Downvote-to-collapse** — annotations below a vote threshold are hidden by default (community self-moderation)
- Annotations sorted by: Top, New, Controversial

### 5.6 Identity
- **Anonymous by default** — no account required to view or create annotations
- **Optional accounts** — username + persistent identity (no real name required)
- Verified accounts get a badge and boosted default reach in sort ranking
- Persistent anonymous sessions via local token (no forced login)

---

## 6. Full Feature Set (Post-MVP)

### 6.1 Rich Annotation Types
- Voice messages (recorded audio, playback inline)
- Stickers / stamps (pre-made reaction images, meme templates, speech bubbles)
- Image uploads pinned to the page
- Highlight + annotate — select text on a page and attach a comment to it

### 6.2 Sticker Pack Marketplace
- Creators publish sticker packs (meme faces, custom art, reaction sets)
- Users browse and apply packs
- Creators earn a revenue share on paid packs

### 6.3 Discovery & Feeds
- **Trending pages** — a feed of the most annotated/active URLs right now
- **Hot annotations** — top-voted individual annotations across the web
- **Following** — follow users or specific URLs to see new activity
- **Collections** — curate annotated pages into shareable lists

### 6.4 Real-Time Collaboration
- See other users' cursors and drawing strokes live on the same page
- Presence indicators ("3 people annotating this page now")

### 6.5 Layers & Filters
- Toggle specific annotation types on/off (drawings only, text only, voice only)
- Filter by: time range, vote threshold, user type (anonymous / verified)
- NSFW layer — off by default, opt-in toggle, age-gated

### 6.6 Page Snapshots
- When an annotation is created, snapshot the surrounding DOM context
- If the page changes significantly, show a "this page has changed since this annotation was created" warning rather than losing the annotation entirely

### 6.7 Per-Page Communities
- Heavily-annotated pages can have appointed moderators (like subreddit mods)
- Moderators can pin annotations, hide content, and set page-level rules
- Page "owners" (first person to tag a page) get founding moderator status

### 6.8 User Profiles & Karma
- Karma score based on upvotes received
- Profile shows annotation history (public or private, user's choice)
- Badges for milestones (first tag, 100 upvotes, etc.)

---

## 7. Monetization Strategy

The target audience is ad-resistant and anonymity-first. Aggressive monetization will kill adoption. The strategy is cosmetics + creator economy + B2B.

### 7.1 Cosmetic Upgrades (Primary)
Free users get a basic brush set and color palette. Premium users unlock:
- Special brush effects (neon glow, glitter spray, fire, chalk texture)
- Extended font library for text annotations
- Custom color palettes beyond the default set
- Profile flair and badge customization

This is the Discord Nitro model — sell expression, not access.

### 7.2 Spray Can Credits (Microtransactions)
A soft currency ("cans") that can be spent on:
- Boosting an annotation's visibility in sort ranking
- Pinning an annotation for a time period
- Unlocking one-time special effects (confetti drop, animated sticker)
- Gifting cans to other users (awards, like Reddit coins)

Cans purchased with real money. No subscription required.

### 7.3 Sticker Pack Marketplace
- User-created sticker packs listed for free or paid
- Platform takes 30% of paid pack revenue
- Meme artists, illustrators, and communities can build audiences through packs

### 7.4 Site Owner API (B2B)
- Businesses and publishers pay to embed a managed, branded version of Tag on their own domain
- Use case: a news site uses Tag as their comment/annotation system
- They get moderation controls, custom branding, and white-label pricing
- This is a separate revenue stream that doesn't touch the core free product

### 7.5 Anonymized Trend Data
- Sell aggregated, anonymized data about annotation activity to media companies and researchers
- Example product: "These are the 50 most annotated news articles this week"
- No PII, no individual tracking — cultural signal data only
- Media orgs, PR firms, and researchers would pay for this

### What to Avoid
- Traditional display advertising — this audience uses ad blockers and will lose trust immediately
- Mandatory subscriptions — kills anonymous use and frictionless onboarding
- Selling user data — catastrophic for trust with this audience

---

## 8. Content Moderation

This is the product's highest legal and reputational risk. The audience will stress-test every boundary from day one. The strategy must be honest, scalable, and legally defensible.

### 8.1 Core Legal Defense
Tag's extension never modifies the actual website. It is a visual overlay rendered in the user's browser only — the underlying site is untouched. This is the same legal basis that protects ad blockers. Document this clearly in the Terms of Service. It significantly reduces liability from site owners.

### 8.2 Community-First Moderation (Primary Layer)
- **Downvote-to-collapse:** Annotations below a configurable vote threshold are hidden by default. The community does the first pass.
- **Report button:** Any annotation can be reported. High report-to-view ratios trigger review queue.
- **Per-page moderators:** Trusted, karma-verified users can manage content on specific pages they moderate.

### 8.3 Default Safe Mode
- NSFW content is hidden by default behind an opt-in toggle
- First-time visitors to a heavily-flagged page see a warning before the annotation layer loads
- Age-gated NSFW toggle (honor system initially, expandable later)

### 8.4 Non-Negotiable Legal Requirements
- **CSAM pipeline:** Any content flagged as child sexual abuse material must be reported to NCMEC. This is a federal legal requirement. Build this into the reporting flow from day one.
- **Doxxing policy:** Annotations containing personally identifiable information of private individuals are removable on report. Fast-track review.
- **DMCA compliance:** If annotation content (stickers, images) violates copyright, process takedowns.

### 8.5 Site Opt-Out Registry
- Website owners can request their domain be excluded from Tag
- A simple form submission adds the domain to a blocklist; the extension won't activate on opted-out domains
- This is a goodwill measure that reduces legal threat surface significantly
- Consider making this a public registry for transparency

### 8.6 Shadowbanning
- Repeat bad actors are shadowbanned — their annotations appear to them but are invisible to others
- Reduces whack-a-mole with ban-evaders
- Combined with IP/fingerprint rate limiting for anonymous users

### 8.7 What Not to Do
- Don't promise full moderation of all content — you can't and the audience won't trust it anyway
- Don't build AI image classification as the primary defense — too expensive, too slow, too error-prone at launch
- Be honest in the ToS: this is a user-generated, community-moderated platform

---

## 9. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Performance** | Annotation layer must load and render within 500ms of page load completion; must not noticeably slow down page rendering |
| **Scale** | Popular pages (Reddit, Twitter, Google) may accumulate thousands of annotations; pagination and lazy loading required |
| **URL normalization** | `https://`, `http://`, `www.`, trailing slashes, and common query params must resolve to canonical URLs to avoid fragmented annotation sets |
| **Storage** | Vector format (SVG) preferred for drawings — smaller, scalable, resolution-independent |
| **Audio** | Voice messages stored on CDN; max 60 seconds per clip |
| **Privacy** | Anonymous user sessions via local token only; no cross-site tracking; GDPR/CCPA consideration for account holders |
| **Browser support** | Chrome (MVP); Firefox, Edge, Safari (post-MVP) |

---

## 10. Out of Scope (v1)

- Mobile app (extension is desktop-first)
- Native integrations with specific websites
- AI-generated annotations or auto-moderation
- Real-time collaborative drawing (post-MVP)
- Cryptocurrency / token-based economy
- Full content moderation team (community moderation only at launch)

---

## 11. Constraints & Assumptions

- **Tech stack:** TBD — browser extension (JavaScript/WebExtensions API), backend API, WebSocket for real-time, CDN for media assets
- **Legal:** Extension overlay model provides core legal defense; site opt-out registry reduces dispute risk
- **Launch browser:** Chrome first due to market share; Manifest V3 compliance required
- **Team:** Assumed small founding team; scope is deliberately constrained for MVP
- **Anonymity:** Platform must function without any account — this is a product promise to the core audience

---

## 12. Open Questions

- [ ] What is the canonical name? (Leading candidate: **Tag**)
- [ ] How are annotations stored when a page's URL includes dynamic query parameters?
- [ ] What is the policy for pages behind authentication (private pages, paywalled content)?
- [ ] How does the vote-to-collapse threshold get set — global default or per-page-moderator-controlled?
- [ ] Voice messages: push-to-talk or record-and-upload flow?
- [ ] At what annotation volume per page does pagination kick in?
- [ ] Should anonymous users be able to buy Spray Can credits without an account?
- [ ] What is the minimum viable moderation team size at launch?
- [ ] How is the "founding moderator" of a page verified or disputed?

---

## 13. Suggested Next Steps

1. Validate the name — check trademark availability for **Tag** (likely contested) and top alternatives
2. Spike the browser extension — confirm the overlay + DOM anchoring approach is technically sound
3. Define the data model — annotation schema, URL normalization rules, threading model
4. Draft the Terms of Service with the legal defense framing from Section 8.1
5. Identify 3–5 beta testers from the target audience for early feedback
