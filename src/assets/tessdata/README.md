# Tessdata Assets

This directory is reserved for local Tesseract traineddata files.

## Current Approach

Due to file size constraints (>50MB per language), traineddata files are fetched from the remote CDN:
- Primary: `https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_fast`
- Fallback: `https://tessdata.projectnaptha.com/4.0.0`

## If Adding Local Assets Later

Download from https://github.com/tesseract-ocr/tessdata_fast and place `.traineddata.gz` files here.

Required for Hindi/Bengali OCR:
- `hin.traineddata.gz`
- `ben.traineddata.gz`