---
name: pdf-feature-development
description: Use when implementing or modifying PDF generation, image processing, export functionality, quality settings, DPI controls, page layouts, or worker-based processing.
---

# PDF Feature Development Skill

You are working on the Image2PDF Angular application.

## Project Overview

Tech Stack:
- Angular 21
- TypeScript Strict Mode
- Angular Signals
- Vitest
- Web Workers
- jsPDF
- Cloudflare Pages

## Architecture

### UI Layer
Components:
- PDF Settings Panel
- Image Upload
- Image Preview
- Export Controls

### Service Layer
Services:
- PDFService
- ExportService
- ImageOptimizerService
- PDFSettingsStorageService

### Worker Layer
Workers:
- pdf-generation.worker.ts

Heavy operations MUST remain inside workers.

## Implementation Process

### Step 1: Understand Existing Flow

Before coding:

Search for:

- PDFSettings
- generatePDF
- createPDFBlob
- optimizeImage
- worker messages
- quality presets

Document:

- affected components
- affected services
- affected workers
- affected tests

### Step 2: Design Change

Determine:

- UI changes
- settings model changes
- worker changes
- persistence changes
- test changes

### Step 3: Implement

If new setting:

1. Add to settings interface
2. Add default value
3. Add local storage persistence
4. Add UI control
5. Pass value to PDF generation pipeline
6. Update worker contract
7. Update tests

### Step 4: Verify

Run:

npm run lint

npm run test

npx vitest run

npm run build

Fix all failures before completion.

## Performance Rules

Always:

✓ Use worker thread for image processing

✓ Use worker thread for PDF generation

✓ Reuse existing services

✓ Preserve backward compatibility

Never:

✗ Block UI thread

✗ Duplicate existing logic

✗ Use any type

✗ Disable tests

## DPI Features

When working with DPI:

- DPI affects image rasterization
- DPI is independent from compression quality
- Supported range: 72-600
- Default: 300

Preserve existing quality presets:

- Fast
- Medium
- Slow

## Output Requirements

For every implementation provide:

1. Files modified
2. Reason for each change
3. Test updates
4. Build validation results