# Probable — Logo & Icon System

## The mark

A single rising stroke that curls upward into a bright marker — the shape of
a probability curve arriving at a live price. It's built specifically for
Probable: not a generic monogram, not a checkmark. Two elements only, so it
holds up from a 1024px app icon down to a 16px browser tab.

- **The curve** — deep violet (`#B87CFF` on dark, `#8200FF` on light),
  14pt-equivalent stroke, fully rounded caps.
- **The marker** — solid `#FF5C23` dot at the top of the curve. This is the
  "live" signal — the same role the pulse-dot plays elsewhere in the product
  (ticker, LIVE badges).

One shape, reused at every size — never redrawn or simplified further for
favicons. Consistency at small sizes comes from the bold stroke weight
already baked into the source file.

## Files in this package

```
svg/
  probable-icon.svg                  primary mark, dark rounded tile      → app icons, socials
  probable-icon-transparent.svg      mark only, no tile, purple stroke    → placing on your own bg
  probable-icon-mono-white.svg       solid white, transparent bg          → dark or colored backgrounds
  probable-icon-mono-black.svg       solid ink (#120F24), transparent bg  → light backgrounds
  probable-lockup-horizontal.svg     icon + wordmark, for light surfaces
  probable-lockup-horizontal-dark.svg  icon + wordmark, for dark surfaces
  probable-lockup-stacked.svg        icon above wordmark, centered

png/                                 rasterized exports of everything above
  probable-icon-{16,32,48,64,128,180,192,256,512,1024}.png
  probable-icon-transparent-{128,256,512,1024}.png
  probable-icon-mono-{white,black}-{128,512}.png
  probable-lockup-horizontal@2x.png / @3x.png
  probable-lockup-horizontal-dark@2x.png
  probable-lockup-stacked@2x.png

favicon/
  favicon.ico                        16/32/48 bundled — drop in your site root
  favicon.svg                        modern browsers, scales natively
  apple-touch-icon.png               180×180, for iOS home-screen / Safari
```

## Color values

| Token | Hex | Use |
|---|---|---|
| Ink (tile / dark text) | `#120F24` | icon tile background, wordmark on light |
| Primary violet (large sizes) | `#B87CFF` | curve stroke on the dark tile |
| Primary violet (on white) | `#8200FF` | curve stroke, transparent variant, CTAs |
| Accent orange | `#FF5C23` | the marker dot only — never use it for anything else in the mark |
| Surface | `#F8F8FA` | page background the wordmark sits on |

## Clearspace & minimum size

- Keep clearspace around the mark equal to the radius of the marker dot
  (roughly 10% of the tile's width) on every side — don't crop the tile
  corners or crowd it against other UI.
- Don't go below **20px** for the tile icon or **16px** for the favicon —
  both are already tuned for their size; if you need something smaller than
  16px, use a solid color swatch instead of the mark.
- The wordmark lockups have a fixed icon-to-text ratio and gap — don't
  stretch one without the other.

## Don't

- Don't recolor the curve to anything outside the violet family, or the dot
  to anything but the orange — the two-color pairing *is* the brand
  recognition; a single-color version only exists as the dedicated mono
  variants above, not as a tint of this one.
- Don't add a drop shadow, bevel, or outline to the mark — flat only.
- Don't place the light lockup on a background lighter than `#F8F8FA` — the
  ink wordmark loses contrast. Use the dark lockup below that.
- Don't rotate or mirror the mark — the curve's direction (rising left to
  right) is intentional.

## Quick usage

```html
<!-- favicon -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

```jsx
// React, inline (matches how it's wired into apps/web/components/Navbar.tsx)
import Logo from "./Logo"; // wraps svg/probable-icon-transparent.svg
<Logo size={30} />
```
