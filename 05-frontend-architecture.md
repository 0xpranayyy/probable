# Frontend Architecture

## Framework
We build on top of **Next.js App Router** with typescript, located in `apps/web`.

## Styling
All styling is written in pure **Vanilla CSS** inside `/app/globals.css`. We use custom typography, animation keyframes, and CSS-based hover variables to build a rich, premium user experience.

## Components
* `components/Navbar.tsx` - Floating responsive navigation bar.
* `components/Ticker.tsx` - Seamless infinite-scrolling marquee showing current market states.

## Routing
* `/` - The landing page featuring market embeds and platform values.
* `/product` - Showcase of the three platform primitives (Rails, Embeds, Shield).
* `/docs` - Complete interactive documentation for API keys and market creation.
