# Active Context

## Current Focus
The project is in **maintenance / enhancement phase**. All 10 PDF tools are implemented and functional. Recent work has focused on:
1. Bug fixes and stability improvements
2. SEO optimization (meta tags, OG/Twitter cards)
3. UI polish (CSS refinements, theme consistency)
4. Build optimization and deployment configuration

## Recent Changes (from git log — latest to oldest)
1. Bug fixes (HEAD, `6d9eb35`)
2. SEO URL update (`fb47c22`)
3. Build optimization (`56b2fc3`)
4. CSS updates (`74ef02f`)
5. Icon updates (`90a779a`)
6. SEO implementation updates (`f845037`, `54462ec`)
7. Image modal UI fix (`863b25e`)

## Active Development Branches
- `main` — Primary development branch
- `copilot/vscode-mppl41lh-326a` — Feature experiment branch
- `remotes/origin/cloudflare/workers-autoconfig` — Cloudflare deployment configuration

## Known Issues & Limitations
1. **File size limits** — Large files (~50MB+) may cause memory pressure; images are converted to data URLs which are ~1.37x the original binary size
2. **OCR language data** — Downloaded from CDN; requires internet connection on first use per language
3. **PDF protection** — Uses qpdf-run which requires additional vendor files
4. **Test coverage** — Not all components have full test coverage (some `*.spec.ts` files exist but may be incomplete)
5. **Cross-browser testing** — Targeted at modern browsers (Chromium-based, Firefox, Safari); older browsers may have limited support

## Upcoming / Planned Work
- [ ] Improve test coverage for remaining components and services
- [ ] Enhance mobile UX (touch interactions, responsive refinements)
- [ ] Add more comprehensive error handling for edge cases
- [ ] Performance profiling for large file scenarios
- [ ] Accessibility audit (a11y improvements)
- [ ] Documentation (README and inline comments)

## Key Decision Points
- **Angular 21 Standalone Components** — Chosen for modern Angular patterns, reduced boilerplate, and smaller bundles
- **Signals over RxJS** — Used for synchronous state to reduce complexity; RxJS retained for async streams
- **jsPDF + pdf-lib dual library approach** — Each optimized for different PDF operations
- **Cloudflare Pages** — Deployed for global CDN, free tier, and Wrangler CLI integration
- **SSR for SEO** — Essential for discoverability of individual tool pages

## Active Patterns to Follow
- All new services should follow the `providedIn: 'root'` singleton pattern
- Heavy computations must use Web Workers (never block main thread)
- Use Signals for component-local state; RxJS for cross-component async streams
- Pure utility functions should have zero Angular dependencies for testability
- Lazy-load tool components; eagerly load shared components
