# Image2PDF Project Rules

## Project Context
This is an Angular 21 application that converts images into PDF documents.

Core technologies:
- Angular 21 (Standalone Components)
- TypeScript (strict mode)
- Angular Signals
- Web Workers for PDF generation
- Vitest for testing
- Cloudflare Pages deployment

## Development Principles

### Performance First
- Prioritize client-side performance.
- Avoid unnecessary Angular change detection.
- Prefer Signals over RxJS when state is local.
- Heavy image processing must run inside Web Workers.
- Never block the main UI thread during PDF generation.

### Code Changes
Before modifying any feature:
1. Identify affected services, components, workers, and tests.
2. Search for existing implementations before creating new code.
3. Reuse existing utility functions whenever possible.
4. Preserve backward compatibility with saved PDF settings.

### TypeScript Standards
- Use strict typing.
- Avoid `any`.
- Prefer interfaces for data contracts.
- Use readonly properties when values should not change.
- Use descriptive variable and method names.

Good:
```ts
interface PdfGenerationOptions {
  dpi: number;
  quality: PdfQuality;
}