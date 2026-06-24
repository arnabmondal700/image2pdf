# Developer-Ready OCR Implementation Plan for `image2pdf`

> Status: Draft — ready for implementation
>
> Last audit: 2026-06-24

---

## 1. Objective

Add browser-based OCR to the Angular `image2pdf` app so users can:
- Upload images and extract text
- Convert scanned/image PDFs to searchable PDFs (image PDF + text layer)
- Export extracted text as `.txt`
- Keep everything client-side (no backend)

This follows the same patterns established by:
- `PdfWorkerService` (worker-backed processing)
- `PdfToImageService` (image ↔ PDF conversions)
- `PdfProtectionService` (tool-specific service)
- Existing tool component structure

---

## 2. Scope (Phased)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 0 | scaffolding + model types + empty routes | pending |
| 1 | worker-backed OCR text extraction service | pending |
| 2 | `Image to Searchable PDF` tool UI + flow | pending |
| 3 | `OCR Text Export` tool UI + flow | pending |
| 4 | tests + build + polish | pending |

Non-goals for first pass:
- Multi-language OCR beyond English (architecture should allow adding later)
- OpenCV preprocessing
- Batch-queue uploads
- Certificate/DRM PDF restrictions

---

## 3. Files to Create / Modify

### New files to create

```
src/app/workers/ocr.worker.ts
src/app/services/ocr.service.ts
src/app/services/ocr.service.spec.ts
src/app/tools/image-to-searchable-pdf/
  image-to-searchable-pdf.component.ts
  image-to-searchable-pdf.component.html
  image-to-searchable-pdf.component.scss
  image-to-searchable-pdf.component.spec.ts
src/app/tools/ocr-text-export/
  ocr-text-export.component.ts
  ocr-text-export.component.html
  ocr-text-export.component.scss
  ocr-text-export.component.spec.ts
```

### Files to modify

```
src/app/app.routes.ts
src/app/tools/tool-registry.service.ts
src/app/app.config.ts (or manual import of tesseract worker if needed)
package.json (add tesseract.js + types)
```

---

## 4. Dependencies

| package | purpose | notes |
|---|---|---|
| `tesseract.js` | OCR engine (wasm + traineddata fetch) | v5 preferred; uses worker internally; exposes `createWorker` |
| `@types/tesseract.js` | TS types | if needed by version chosen |

Add via:

```bash
npm.cmd install tesseract.js
npm.cmd install -D @types/tesseract.js
```

---

## 5. Service Design (`OcrService`)

Location: `src/app/services/ocr.service.ts`

Responsibilities:
- Accept image/PDF input
- Render each page to canvas (reuse `PdfToImageService` for PDF inputs)
- Run `Tesseract.recognize` on each page image (prefer in dedicated app worker to avoid UI jank)
- Return structured text results per page with confidence metadata

Public API (sketch):

```ts
export interface OcrResult {
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number; // 0..100
  }>;
  totalPages: number;
  durationMs: number;
}

export interface OcrOptions {
  language?: string; // default 'eng'
  preserveLayout?: boolean;
}

export class OcrService {
  recognize(file: File, options?: OcrOptions): Observable<OcrResult>;
  cancel(): void;
  isSupported(): boolean;
}
```

Implementation constraints:
- Must support cancelation (same pattern as `PdfCompressionWorkerService`)
- Must fall back to main thread if Web Worker unavailable
- Must clean up any `Tesseract` worker on completion/cancel

---

## 6. Worker Design (`OcrWorker`)

Location: `src/app/workers/ocr.worker.ts`

Purpose:
- isolate `tesseract.js` heavy wasm work from main thread
- provide same message shape as existing workers:
  - `OcrStartMessage` -> progress updates -> `OcrCompleteMessage`
  - `OcrCancelMessage`

Why dedicated wrapper:
- `tesseract.js` already uses an internal worker; our wrapper prevents main-thread wasm init jank

---

## 7. Component Design

### Tool 1: `ImageToSearchablePdfComponent`

Route: `/ocr-to-searchable-pdf`
Tool id: `ocr-to-searchable-pdf`
Category: `ocr`

UI flow:
1. Upload images or PDF
2. OCR options: language, preserve layout toggle
3. “Create Searchable PDF” button
4. Progress bar + cancel (reuse worker pattern)
5. Result: download `.pdf` with invisible text layer

Why searchable PDF:
- Uses `pdf-lib` to embed invisible text on each page at matching coordinates (best-effort simplified placement)
- Fallback: append raw text as metadata/attached file if layout too complex

### Tool 2: `OcrTextExportComponent`

Route: `/ocr-text-export`
Tool id: `ocr-text-export`
Category: `extract`

UI flow:
1. Upload image/PDF
2. OCR options
3. “Extract Text” button
4. Progress + cancel
5. Result: `.txt` download + copy-to-clipboard button

---

## 8. Routing + Registry

- Lazy-loaded routes in `app.routes.ts`
- `ToolRegistryService.register()` entries (default `enabled: false` until UX review — same as Mixed Builder)

---

## 9. Testing

- Unit: `OcrService` success, error, cancel paths
- Component: upload, progress, download buttons
- Integration smoke: build +Vitest only (wasm assets don’t run in jsdom)

---

## 10. Build / Memory constraints

- wasm + traineddata assets must not bloat initial bundle; lazy import
- worker size budget review (`angular.json` test/prod budgets)

---

## 11. Rollout Plan

1. Scaffold files + types + empty components
2. Add `tesseract.js` + baseline service with main-thread fallback
3. Add worker wrapper + progress/cancel
4. Implement tool 1 (searchable PDF)
5. Implement tool 2 (text export)
6. Register tools (disabled by default)
7. Tests + build
8. Enable in registry after UX review

---

## 12. Risks / Open Questions

- Wasm download size + CORS for traineddata (tesseract.js cdn)
- Coordinate-based text embedding in PDF is approximate
- Memory on long PDFs; consider page-by-page streaming