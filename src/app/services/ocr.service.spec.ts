import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OcrCancelledError, OcrService } from './ocr.service';
import { PdfToImageService } from './pdf-to-image.service';

const tesseractMock = vi.hoisted(() => ({
  createWorker: vi.fn()
}));

vi.mock('tesseract.js', () => tesseractMock);

describe('OcrService', () => {
  let service: OcrService;
  let mockPdfToImageService: Partial<PdfToImageService>;
  let mockWorker: {
    recognize: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
    setParameters: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    mockWorker = {
      recognize: vi.fn().mockResolvedValue({
        data: { text: 'Hello World', confidence: 95 }
      }),
      terminate: vi.fn().mockResolvedValue(undefined),
      setParameters: vi.fn().mockResolvedValue(undefined)
    };
    tesseractMock.createWorker.mockResolvedValue(mockWorker);

    mockPdfToImageService = {
      convertToImages: vi.fn().mockResolvedValue([
        {
          name: 'page_1.png',
          type: 'image/png',
          size: 1024,
          url: 'data:image/png;base64,abc',
          blob: new Blob([''], { type: 'image/png' }),
          dataUrl: 'data:image/png;base64,abc',
          pageNumber: 1,
          width: 100,
          height: 100
        }
      ]),
      cancelExport: vi.fn()
    };

    vi.stubGlobal('Worker', undefined);
    service = new OcrService(mockPdfToImageService as PdfToImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expose progress and support helpers', () => {
    expect(typeof service.getProgress).toBe('function');
    expect(typeof service.recognize).toBe('function');
    expect(typeof service.cancel).toBe('function');
    expect(typeof service.isSupported()).toBe('boolean');
  });

  it('should recognize image files with the main-thread fallback when Worker is unavailable', async () => {
    const result = await service.recognize({
      name: 'test.png',
      url: 'data:image/png;base64,abc',
      size: 1024,
      type: 'image/png'
    });

    expect(tesseractMock.createWorker).toHaveBeenCalledWith('eng', {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: expect.any(Function)
    });
    expect(mockWorker.recognize).toHaveBeenCalledWith('data:image/png;base64,abc');
    expect(mockWorker.terminate).toHaveBeenCalled();
    expect(result.pages).toEqual([{ pageNumber: 1, text: 'Hello World', confidence: 95 }]);
    expect(result.totalPages).toBe(1);
  });

  it('should convert PDF pages before OCR in the main-thread fallback', async () => {
    await service.recognize({
      name: 'scan.pdf',
      url: 'data:application/pdf;base64,abc',
      size: 2048,
      type: 'application/pdf'
    });

    expect(mockPdfToImageService.convertToImages).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'scan.pdf', type: 'application/pdf' }),
      expect.objectContaining({ format: 'png', scale: 2, outputMode: 'individual' })
    );
    expect(mockWorker.recognize).toHaveBeenCalledWith('data:image/png;base64,abc');
  });

  it('should emit progress and reset it after completion', async () => {
    const progressValues: unknown[] = [];
    service.getProgress().subscribe((progress) => progressValues.push(progress));

    await service.recognize({
      name: 'test.png',
      url: 'data:image/png;base64,abc',
      size: 1024,
      type: 'image/png'
    });

    expect(progressValues).toContainEqual({
      current: 0,
      total: 1,
      status: 'Preparing OCR...'
    });
    expect(progressValues.at(-1)).toBeNull();
  });

  it('should surface OCR errors instead of returning empty text', async () => {
    mockWorker.recognize.mockRejectedValue(new Error('OCR failed'));

    await expect(service.recognize({
      name: 'test.png',
      url: 'data:image/png;base64,abc',
      size: 1024,
      type: 'image/png'
    })).rejects.toThrow('OCR failed');
  });

  it('should cancel fallback recognition and reject with OcrCancelledError', async () => {
    const pending = new Promise(() => undefined);
    mockWorker.recognize.mockReturnValue(pending);

    const recognition = service.recognize({
      name: 'test.png',
      url: 'data:image/png;base64,abc',
      size: 1024,
      type: 'image/png'
    });
    await vi.waitFor(() => expect(mockWorker.recognize).toHaveBeenCalled());

    service.cancel();

    await expect(recognition).rejects.toBeInstanceOf(OcrCancelledError);
    expect(mockPdfToImageService.cancelExport).toHaveBeenCalled();
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should use the OCR web worker when Worker is available', async () => {
    tesseractMock.createWorker.mockClear();

    class FakeWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      terminate = vi.fn();
      postMessage = vi.fn((message: any) => {
        if (message.type === 'start') {
          expect(message.images).toEqual([
            expect.objectContaining({ name: 'test.png', type: 'image/png', url: 'data:image/png;base64,abc' })
          ]);
        }
        this.onmessage?.({ data: { type: 'progress', current: 0, total: 1, status: 'Starting OCR...' } } as MessageEvent);
        this.onmessage?.({
          data: {
            type: 'complete',
            pages: [{ pageNumber: 1, text: 'Worker text', confidence: 90 }],
            totalPages: 1,
            durationMs: 12
          }
        } as MessageEvent);
      });
    }
    vi.stubGlobal('Worker', FakeWorker as any);
    service = new OcrService(mockPdfToImageService as PdfToImageService);

    const result = await service.recognize({
      name: 'test.png',
      url: 'data:image/png;base64,abc',
      size: 1024,
      type: 'image/png'
    });

    expect(result.pages[0].text).toBe('Worker text');
    expect(tesseractMock.createWorker).not.toHaveBeenCalled();
  });
});
