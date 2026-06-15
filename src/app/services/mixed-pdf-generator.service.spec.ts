import { TestBed } from '@angular/core/testing';
import { MixedPdfGeneratorService } from './mixed-pdf-generator.service';
import { DocumentItem } from '../models/document-item.model';

describe('MixedPdfGeneratorService', () => {
  let service: MixedPdfGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MixedPdfGeneratorService],
    });
    service = TestBed.inject(MixedPdfGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should throw error for empty items', async () => {
    await expect(service.generateMixedPdf([])).rejects.toThrow(
      'No items to generate PDF from'
    );
  });

  it('should estimate page count', () => {
    const items: DocumentItem[] = [
      { id: '1', type: 'image', name: 'img.jpg', order: 0 },
      { id: '2', type: 'image', name: 'img2.jpg', order: 1 },
    ];
    expect(service.estimatePageCount(items)).toBe(2);
  });

  it('should generate a PDF blob from image items', async () => {
    // Create a minimal valid PNG data URL
    const pngDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/Qual7wAAAABJRU5ErkJggg==';

    const items: DocumentItem[] = [
      {
        id: '1',
        type: 'image',
        name: 'test.png',
        order: 0,
        url: pngDataUrl,
        mimeType: 'image/png',
      },
    ];

    const blob = await service.generateMixedPdf(items);
    expect(blob).toBeTruthy();
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should throw on image item without URL', async () => {
    const items: DocumentItem[] = [
      {
        id: '1',
        type: 'image',
        name: 'test.png',
        order: 0,
        url: undefined,
        mimeType: 'image/png',
      },
    ];

    await expect(service.generateMixedPdf(items)).rejects.toThrow(
      'Image data unavailable for: test.png'
    );
  });

  it('should throw on pdf-page item without URL or file', async () => {
    const items: DocumentItem[] = [
      {
        id: '1',
        type: 'pdf-page',
        name: 'doc.pdf - Page 1',
        order: 0,
        pdfPageIndex: 0,
        url: undefined,
        pdfFile: undefined,
      },
    ];

    await expect(service.generateMixedPdf(items)).rejects.toThrow(
      'PDF data unavailable for: doc.pdf - Page 1'
    );
  });

  it('should throw on invalid data URL format', async () => {
    const items: DocumentItem[] = [
      {
        id: '1',
        type: 'image',
        name: 'test.jpg',
        order: 0,
    url: 'data:invalid-no-base64',
        mimeType: 'image/jpeg',
      },
    ];

    await expect(service.generateMixedPdf(items)).rejects.toThrow(
      'Invalid data URL format'
    );
  });
});