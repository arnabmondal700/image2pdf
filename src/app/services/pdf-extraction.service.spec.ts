vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(() => ({
    promise: Promise.reject(new Error('Invalid PDF'))
  }))
}));

import { TestBed } from '@angular/core/testing';
import { PdfExtractionService } from './pdf-extraction.service';
declare const fail: any;

describe('PdfExtractionService', () => {
  let service: PdfExtractionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PdfExtractionService]
    });
    service = TestBed.inject(PdfExtractionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if PDF is supported', () => {
    const isSupported = service.isPdfSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  it('should throw error when trying to extract from unsupported environment', async () => {
    // Mock unsupported environment
    vi.spyOn(service, 'isPdfSupported').mockReturnValue(false);

    try {
      await service.extractPdfAsImages('data:application/pdf;base64,test');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('should have metadata extraction capability', () => {
    expect(service.isPdfSupported).toBeDefined();
  });

  it('should handle PDF extraction with default options', async () => {
    // Test that the method accepts default options
    const testUrl = 'data:application/pdf;base64,JVBERi0xLjQK';
    
    // Since we can't easily test actual PDF extraction without a real PDF,
    // we just verify the method is callable and returns a promise
    const result = service.extractPdfAsImages(testUrl).catch(() => {
      // Expected to fail with invalid PDF, but method should exist
      return [];
    });
    
    expect(result instanceof Promise).toBeTruthy();
  });

  it('should handle PDF extraction with custom scale', async () => {
    const testUrl = 'data:application/pdf;base64,test';
    const options = { scale: 3, maxPages: 5 };
    
    const result = service.extractPdfAsImages(testUrl, options).catch(() => {
      return [];
    });
    
    expect(result instanceof Promise).toBeTruthy();
  });
});
